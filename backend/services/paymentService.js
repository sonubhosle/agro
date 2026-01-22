const razorpay = require('../config/razorpay');
const Wallet = require('../models/Wallet');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

class PaymentService {
  // Create Razorpay order
  async createRazorpayOrder(order, paymentMethod) {
    try {
      const options = {
        amount: Math.round(order.totalAmount * 100), // Convert to paise
        currency: 'INR',
        receipt: `order_${order.orderId}`,
        notes: {
          orderId: order.orderId,
          buyerId: order.buyer.toString(),
          farmerId: order.farmer.toString(),
          cropId: order.crop?.toString()
        },
        payment_capture: 1
      };

      const razorpayOrder = await razorpay.orders.create(options);

      // Create payment record
      const payment = await Payment.createFromOrder(order);
      payment.paymentMethod = paymentMethod;
      payment.gatewayOrderId = razorpayOrder.id;
      payment.status = 'created';
      await payment.save();

      return {
        success: true,
        order: razorpayOrder,
        paymentId: payment.paymentId,
        key: process.env.RAZORPAY_KEY_ID
      };
    } catch (error) {
      logger.error('Error creating Razorpay order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  // Verify Razorpay payment
  async verifyRazorpayPayment(paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature) {
    try {
      // Verify signature
      const crypto = require('crypto');
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        throw new Error('Payment verification failed: Invalid signature');
      }

      // Get payment details from Razorpay
      const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);

      // Update payment record
      const payment = await Payment.findOne({ paymentId });
      if (!payment) {
        throw new Error('Payment record not found');
      }

      payment.gatewayPaymentId = razorpayPaymentId;
      payment.status = razorpayPayment.status === 'captured' ? 'captured' : 'authorized';
      payment.timeline.push({
        status: payment.status,
        description: `Payment ${payment.status} via Razorpay`,
        timestamp: new Date(),
        metadata: { razorpayPaymentId }
      });

      await payment.save();

      // Update order payment status
      const order = await Order.findById(payment.orderId);
      if (order) {
        order.paymentStatus = 'paid';
        order.amountPaid = order.totalAmount;
        order.amountDue = 0;
        order.timeline.push({
          status: 'payment_received',
          description: 'Payment received successfully',
          timestamp: new Date()
        });
        await order.save();

        // Create notification for farmer
        await Notification.create({
          user: order.farmer,
          title: 'Payment Received',
          message: `Payment of ₹${order.totalAmount} received for order ${order.orderId}`,
          type: 'payment',
          data: {
            orderId: order._id,
            amount: order.totalAmount,
            actionUrl: `/orders/${order._id}`
          }
        });
      }

      return {
        success: true,
        payment,
        order
      };
    } catch (error) {
      logger.error('Error verifying Razorpay payment:', error);
      throw error;
    }
  }

  // Process wallet payment
  async processWalletPayment(order, userId) {
    try {
      // Get buyer's wallet
      const buyerWallet = await Wallet.findOne({ user: userId });
      if (!buyerWallet) {
        throw new Error('Wallet not found');
      }

      // Check if buyer has sufficient balance
      if (buyerWallet.availableBalance < order.totalAmount) {
        throw new Error('Insufficient wallet balance');
      }

      // Check daily limit
      if (!buyerWallet.checkDailyLimit(order.totalAmount)) {
        throw new Error('Daily transaction limit exceeded');
      }

      // Create payment record
      const payment = await Payment.createFromOrder(order);
      payment.paymentMethod = 'wallet';
      payment.status = 'processing';

      // Deduct amount from buyer's wallet
      await buyerWallet.addTransaction({
        type: 'debit',
        amount: order.totalAmount,
        description: `Payment for order ${order.orderId}`,
        reference: `ORDER-${order.orderId}`,
        orderId: order._id,
        status: 'completed'
      });

      // Update payment status
      payment.status = 'captured';
      payment.timeline.push({
        status: 'captured',
        description: 'Payment captured from wallet',
        timestamp: new Date()
      });
      await payment.save();

      // Update order
      order.paymentStatus = 'paid';
      order.amountPaid = order.totalAmount;
      order.amountDue = 0;
      order.timeline.push({
        status: 'payment_received',
        description: 'Payment received via wallet',
        timestamp: new Date()
      });
      await order.save();

      // Create notifications
      const notifications = [
        Notification.create({
          user: userId,
          title: 'Payment Successful',
          message: `₹${order.totalAmount} deducted from wallet for order ${order.orderId}`,
          type: 'payment',
          data: {
            orderId: order._id,
            amount: order.totalAmount,
            actionUrl: `/orders/${order._id}`
          }
        }),
        Notification.create({
          user: order.farmer,
          title: 'Payment Received',
          message: `Payment of ₹${order.totalAmount} received for order ${order.orderId}`,
          type: 'payment',
          data: {
            orderId: order._id,
            amount: order.totalAmount,
            actionUrl: `/orders/${order._id}`
          }
        })
      ];

      await Promise.all(notifications);

      return {
        success: true,
        payment,
        order
      };
    } catch (error) {
      logger.error('Error processing wallet payment:', error);
      throw error;
    }
  }

  // Process refund
  async processRefund(order, refundAmount = null) {
    try {
      const amountToRefund = refundAmount || order.amountPaid;
      
      // Find payment record
      const payment = await Payment.findOne({ orderId: order._id });
      if (!payment) {
        throw new Error('Payment record not found');
      }

      // Check if refund is possible
      if (payment.refundableAmount < amountToRefund) {
        throw new Error(`Maximum refundable amount is ${payment.refundableAmount}`);
      }

      // Process refund through Razorpay if it was a Razorpay payment
      let gatewayRefundId = null;
      if (payment.gatewayPaymentId) {
        try {
          const refund = await razorpay.payments.refund(payment.gatewayPaymentId, {
            amount: Math.round(amountToRefund * 100),
            speed: 'normal',
            notes: {
              orderId: order.orderId,
              reason: 'Order cancellation/return'
            }
          });
          gatewayRefundId = refund.id;
        } catch (razorpayError) {
          logger.error('Razorpay refund failed:', razorpayError);
          // Continue with manual refund to wallet
        }
      }

      // Add refund to payment record
      await payment.addRefund({
        amount: amountToRefund,
        reason: 'Order cancellation',
        status: gatewayRefundId ? 'processed' : 'pending',
        gatewayRefundId
      });

      // Refund to buyer's wallet
      const buyerWallet = await Wallet.findOne({ user: order.buyer });
      if (buyerWallet) {
        await buyerWallet.addTransaction({
          type: 'credit',
          amount: amountToRefund,
          description: `Refund for order ${order.orderId}`,
          reference: `REFUND-${order.orderId}`,
          orderId: order._id,
          status: 'completed'
        });
      }

      // Update payment status if fully refunded
      if (payment.totalRefunded >= payment.amount) {
        payment.status = 'refunded';
        await payment.save();
      }

      // Create notification for buyer
      await Notification.create({
        user: order.buyer,
        title: 'Refund Processed',
        message: `₹${amountToRefund} has been refunded for order ${order.orderId}`,
        type: 'payment',
        data: {
          orderId: order._id,
          amount: amountToRefund,
          actionUrl: `/orders/${order._id}`
        }
      });

      return {
        success: true,
        refundAmount: amountToRefund,
        gatewayRefundId,
        payment
      };
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  // Release payment to farmer
  async releasePaymentToFarmer(order) {
    try {
      // Find payment record
      const payment = await Payment.findOne({ orderId: order._id });
      if (!payment) {
        throw new Error('Payment record not found');
      }

      // Find farmer's wallet
      const farmerWallet = await Wallet.findOne({ user: order.farmer });
      if (!farmerWallet) {
        throw new Error('Farmer wallet not found');
      }

      // Release net amount to farmer
      await farmerWallet.addTransaction({
        type: 'credit',
        amount: payment.netAmount,
        description: `Payment release for order ${order.orderId}`,
        reference: `RELEASE-${order.orderId}`,
        orderId: order._id,
        status: 'completed'
      });

      // Mark payment as settled
      payment.settled = true;
      payment.settledAt = new Date();
      payment.timeline.push({
        status: 'settled',
        description: `Payment settled to farmer: ₹${payment.netAmount}`,
        timestamp: new Date()
      });
      await payment.save();

      // Create notification for farmer
      await Notification.create({
        user: order.farmer,
        title: 'Payment Released',
        message: `₹${payment.netAmount} has been released to your wallet for order ${order.orderId}`,
        type: 'payment',
        data: {
          orderId: order._id,
          amount: payment.netAmount,
          actionUrl: `/wallet`
        }
      });

      return {
        success: true,
        releasedAmount: payment.netAmount,
        farmerWallet: farmerWallet.availableBalance
      };
    } catch (error) {
      logger.error('Error releasing payment to farmer:', error);
      throw error;
    }
  }

  // Handle Razorpay webhook
  async handleRazorpayWebhook(event, signature) {
    try {
      // Verify webhook signature
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(event))
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }

      const eventType = event.event;
      const payload = event.payload;

      logger.info(`Processing Razorpay webhook: ${eventType}`);

      switch (eventType) {
        case 'payment.captured':
          await this.handlePaymentCaptured(payload.payment.entity);
          break;

        case 'payment.failed':
          await this.handlePaymentFailed(payload.payment.entity);
          break;

        case 'refund.processed':
          await this.handleRefundProcessed(payload.refund.entity);
          break;

        case 'order.paid':
          await this.handleOrderPaid(payload.order.entity);
          break;

        default:
          logger.info(`Unhandled webhook event: ${eventType}`);
      }

      return { success: true };
    } catch (error) {
      logger.error('Error handling Razorpay webhook:', error);
      throw error;
    }
  }

  async handlePaymentCaptured(payment) {
    try {
      const paymentRecord = await Payment.findOne({ gatewayPaymentId: payment.id });
      if (!paymentRecord) return;

      paymentRecord.status = 'captured';
      paymentRecord.timeline.push({
        status: 'captured',
        description: 'Payment captured via webhook',
        timestamp: new Date(),
        metadata: { razorpayPaymentId: payment.id }
      });
      await paymentRecord.save();

      // Update order
      const order = await Order.findById(paymentRecord.orderId);
      if (order) {
        order.paymentStatus = 'paid';
        order.amountPaid = order.totalAmount;
        order.amountDue = 0;
        await order.save();
      }
    } catch (error) {
      logger.error('Error handling payment captured:', error);
    }
  }

  async handlePaymentFailed(payment) {
    try {
      const paymentRecord = await Payment.findOne({ gatewayPaymentId: payment.id });
      if (!paymentRecord) return;

      paymentRecord.status = 'failed';
      paymentRecord.error = {
        code: payment.error_code,
        description: payment.error_description,
        source: 'razorpay',
        step: payment.error_step,
        gatewayErrorCode: payment.error_code,
        gatewayErrorMessage: payment.error_description
      };
      paymentRecord.timeline.push({
        status: 'failed',
        description: 'Payment failed via webhook',
        timestamp: new Date(),
        metadata: { razorpayPaymentId: payment.id }
      });
      await paymentRecord.save();
    } catch (error) {
      logger.error('Error handling payment failed:', error);
    }
  }

  async handleRefundProcessed(refund) {
    try {
      const payment = await Payment.findOne({ gatewayPaymentId: refund.payment_id });
      if (!payment) return;

      await payment.processRefund(refund.id, refund.id, 'processed');
    } catch (error) {
      logger.error('Error handling refund processed:', error);
    }
  }

  async handleOrderPaid(order) {
    try {
      // Handle order paid event if needed
      logger.info(`Order ${order.id} marked as paid`);
    } catch (error) {
      logger.error('Error handling order paid:', error);
    }
  }

  // Get payment statistics
  async getPaymentStatistics(userId, role, period = 'month') {
    try {
      const stats = await Payment.getPaymentStatistics(userId, role, period);
      return stats;
    } catch (error) {
      logger.error('Error getting payment statistics:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();