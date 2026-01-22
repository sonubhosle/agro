const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const razorpay = require('../config/razorpay');
const { catchAsync } = require('../middleware/error');


exports.createPaymentLink = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (order.buyer.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to pay for this order'
    });
  }

  if (order.paymentStatus === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Order already paid'
    });
  }

  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      accept_partial: false,
      description: `Payment for order ${order.orderId}`,
      customer: {
        name: req.user.fullName || 'Customer',
        email: req.user.email,
        contact: req.user.phone || '+919999999999'
      },
      notify: {
        sms: false,
        email: false
      },
      reminder_enable: false,
      notes: {
        order_id: order.orderId,
        buyer_id: req.user.id,
        farmer_id: order.farmer.toString()
      },
      callback_url: 'http://localhost:5173/payment/success',
      callback_method: 'get'
    });

    // Save payment link ID to order
    order.paymentLinkId = paymentLink.id;
    order.paymentId = paymentLink.id;
    order.paymentMethod = 'razorpay_link';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment link created successfully',
      data: {
        paymentLink: {
          id: paymentLink.id,
          short_url: paymentLink.short_url,
          amount: order.totalAmount,
          currency: 'INR',
          status: paymentLink.status
        }
      }
    });

  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment link',
      error: error.message
    });
  }
});

exports.paymentCallback = catchAsync(async (req, res, next) => {
  const { razorpay_payment_id, razorpay_payment_link_id, razorpay_signature } = req.query;

  console.log('Payment callback received:', {
    razorpay_payment_id,
    razorpay_payment_link_id,
    razorpay_signature
  });

  // Redirect to frontend success page
  res.redirect('http://localhost:5173/payment/success');
});


