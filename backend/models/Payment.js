const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Payment Information
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  
  // User Information
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Amount Information
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  
  // Payment Details
  paymentMethod: {
    type: String,
    required: true,
    enum: ['upi', 'card', 'netbanking', 'wallet', 'cash_on_delivery']
  },
  
  paymentGateway: {
    type: String,
    enum: ['razorpay', 'stripe', 'paypal', 'cashfree', 'none'],
    default: 'razorpay'
  },
  
  gatewayPaymentId: {
    type: String,
    index: true
  },
  
  gatewayOrderId: {
    type: String,
    index: true
  },
  
  // Status Information
  status: {
    type: String,
    required: true,
    enum: [
      'created',
      'authorized',
      'captured',
      'failed',
      'refunded',
      'partially_refunded',
      'cancelled',
      'pending',
      'processing'
    ],
    default: 'created'
  },
  
  // Refund Information
  refunds: [{
    refundId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending'
    },
    processedAt: Date,
    gatewayRefundId: String,
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  totalRefunded: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Fee Information
  platformFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  gatewayFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  taxOnFees: {
    type: Number,
    default: 0,
    min: 0
  },
  
  netAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Payment Timeline
  timeline: [{
    status: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Error Information
  error: {
    code: String,
    description: String,
    source: String,
    step: String,
    gatewayErrorCode: String,
    gatewayErrorMessage: String
  },
  
  // Payment Attempts
  attemptCount: {
    type: Number,
    default: 1,
    min: 1
  },
  
  lastAttemptAt: {
    type: Date,
    default: Date.now
  },
  
  // Security Information
  ipAddress: String,
  userAgent: String,
  deviceId: String,
  
  // Metadata
  notes: String,
  
  metadata: mongoose.Schema.Types.Mixed,
  
  // Audit Fields
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Settlement Information
  settled: {
    type: Boolean,
    default: false
  },
  
  settlementId: String,
  
  settledAt: Date,
  
  // Version for optimistic concurrency
  version: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
paymentSchema.index({ payer: 1, createdAt: -1 });
paymentSchema.index({ receiver: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ paymentMethod: 1, createdAt: -1 });

// Virtual for payment success
paymentSchema.virtual('isSuccessful').get(function() {
  return ['captured', 'authorized'].includes(this.status);
});

// Virtual for payment failure
paymentSchema.virtual('isFailed').get(function() {
  return ['failed', 'cancelled'].includes(this.status);
});

// Virtual for refundable amount
paymentSchema.virtual('refundableAmount').get(function() {
  return this.amount - this.totalRefunded;
});

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.version += 1;
  
  // Calculate net amount
  if (this.isModified('amount') || this.isModified('platformFee') || 
      this.isModified('gatewayFee') || this.isModified('taxOnFees')) {
    this.netAmount = this.amount - this.platformFee - this.gatewayFee - this.taxOnFees;
  }
  
  next();
});

// Method to update payment status
paymentSchema.methods.updateStatus = async function(newStatus, description, metadata = {}) {
  this.status = newStatus;
  
  this.timeline.push({
    status: newStatus,
    description: description || `Payment status updated to ${newStatus}`,
    timestamp: new Date(),
    metadata
  });
  
  return this.save();
};

// Method to add refund
paymentSchema.methods.addRefund = async function(refundData) {
  const refundId = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const refund = {
    refundId,
    ...refundData,
    createdAt: new Date()
  };
  
  this.refunds.push(refund);
  this.totalRefunded += refundData.amount;
  
  // Update status based on refund amount
  if (this.totalRefunded >= this.amount) {
    this.status = 'refunded';
  } else if (this.totalRefunded > 0) {
    this.status = 'partially_refunded';
  }
  
  this.timeline.push({
    status: 'refund_initiated',
    description: `Refund of ${refundData.amount} initiated`,
    timestamp: new Date(),
    metadata: { refundId }
  });
  
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = async function(refundId, gatewayRefundId, status = 'processed') {
  const refund = this.refunds.find(r => r.refundId === refundId);
  
  if (!refund) {
    throw new Error('Refund not found');
  }
  
  refund.status = status;
  refund.gatewayRefundId = gatewayRefundId;
  refund.processedAt = new Date();
  
  this.timeline.push({
    status: 'refund_processed',
    description: `Refund ${refundId} processed`,
    timestamp: new Date(),
    metadata: { refundId, gatewayRefundId }
  });
  
  return this.save();
};

// Static method to create payment from order
paymentSchema.statics.createFromOrder = async function(order) {
  const paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Calculate platform fee (1% of order amount, min ₹10, max ₹100)
  const platformFee = Math.max(10, Math.min(100, order.totalAmount * 0.01));
  
  // Calculate gateway fee (2% of order amount for card payments)
  const gatewayFee = order.paymentMethod === 'card' ? order.totalAmount * 0.02 : 0;
  
  // Calculate tax on fees (18% GST)
  const taxOnFees = (platformFee + gatewayFee) * 0.18;
  
  const payment = new this({
    paymentId,
    orderId: order._id,
    payer: order.buyer,
    receiver: order.farmer,
    amount: order.totalAmount,
    currency: 'INR',
    paymentMethod: order.paymentMethod,
    platformFee,
    gatewayFee,
    taxOnFees,
    netAmount: order.totalAmount - platformFee - gatewayFee - taxOnFees,
    status: 'created',
    timeline: [{
      status: 'created',
      description: 'Payment created from order',
      timestamp: new Date()
    }]
  });
  
  return payment.save();
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStatistics = async function(userId, role, period = 'month') {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'day':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }
  
  const matchCriteria = {
    createdAt: { $gte: startDate }
  };
  
  if (role === 'farmer') {
    matchCriteria.receiver = userId;
  } else if (role === 'buyer') {
    matchCriteria.payer = userId;
  }
  
  const stats = await this.aggregate([
    { $match: matchCriteria },
    {
      $facet: {
        totalPayments: [{ $count: 'count' }],
        successfulPayments: [
          { $match: { status: 'captured' } },
          { $count: 'count' }
        ],
        totalAmount: [
          { $match: { status: 'captured' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ],
        netAmount: [
          { $match: { status: 'captured' } },
          { $group: { _id: null, total: { $sum: '$netAmount' } } }
        ],
        byMethod: [
          {
            $group: {
              _id: '$paymentMethod',
              count: { $sum: 1 },
              amount: { $sum: '$amount' }
            }
          }
        ],
        dailyStats: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              amount: { $sum: '$amount' }
            }
          },
          { $sort: { _id: 1 } }
        ]
      }
    }
  ]);
  
  return stats[0];
};

// Static method to find failed payments for retry
paymentSchema.statics.findFailedPayments = async function(hours = 24) {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.find({
    status: { $in: ['failed', 'pending'] },
    attemptCount: { $lt: 3 },
    lastAttemptAt: { $lt: cutoffTime }
  }).limit(50);
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;