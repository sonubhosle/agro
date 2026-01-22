const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Order Information
  orderId: {
    type: String,
    unique: true,
    index: true
  },
  
  // User References
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Crop Information
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: true
  },
  
  cropName: {
    type: String,
    required: true
  },
  
  variety: {
    type: String,
    required: true
  },
  
  // Order Details
  quantity: {
    type: Number,
    required: true,
    min: [0.1, 'Quantity must be at least 0.1']
  },
  
  unit: {
    type: String,
    enum: ['kg', 'quintal', 'ton'],
    required: true
  },
  
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Pricing Breakdown
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  gstPercentage: {
    type: Number,
    default: 0
  },
  
  gstAmount: {
    type: Number,
    default: 0
  },
  
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  
  platformFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  
  amountDue: {
    type: Number,
    default: 0
  },
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  

paymentMethod: {
  type: String,
  enum: ['upi', 'card', 'netbanking', 'wallet', 'cash_on_delivery', 'razorpay_link'], // ✅ ADD THIS
  default: 'upi'
},
  
  paymentId: String,
  
  // Order Status
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'ready_for_delivery',
      'shipped',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'returned',
      'disputed'
    ],
    default: 'pending'
  },
  
  // Delivery Information
  deliveryAddress: {
    street: String,
    city: String,
    district: String,
    state: String,
    pincode: String,
    coordinates: {
  type: {
    type: String,
    enum: ['Point'],
    default: undefined  
  },
  coordinates: {
    type: [Number],
    default: undefined  
  }
},
  },
  
  pickupAddress: {
    type: String,
    required: true
  },
  
  deliveryType: {
    type: String,
    enum: ['pickup', 'delivery', 'third_party'],
    default: 'pickup'
  },
  
  expectedDeliveryDate: Date,
  
  actualDeliveryDate: Date,
  
  // Tracking Information
  trackingNumber: String,
  
  trackingUrl: String,
  
  carrier: String,
  
  // Order Timeline
  timeline: [{
    status: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Communication
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  }],
  
  // Reviews
  buyerReview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },
  
  farmerReview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },
  
  // Cancellation/Return Information
  cancellationReason: String,
  
  cancellationNotes: String,
  
  returnReason: String,
  
  returnStatus: {
    type: String,
    enum: ['requested', 'approved', 'rejected', 'completed'],
    default: 'requested'
  },
  
  // Dispute Information
  disputeRaised: {
    type: Boolean,
    default: false
  },
  
  disputeDetails: {
    reason: String,
    description: String,
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    raisedAt: Date,
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open'
    },
    resolution: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  
  // Metadata
  notes: String,
  
  specialInstructions: String,
  
  // Audit Fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
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

// Indexes for performance
orderSchema.index({ orderId: 1 });
orderSchema.index({ buyer: 1 });
orderSchema.index({ farmer: 1 });
orderSchema.index({ crop: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'deliveryAddress.coordinates': '2dsphere' });

// Pre-save middleware to calculate amounts and generate orderId
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate unique order ID
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.orderId = `ORD-${timestamp}-${random}`;
    
    // Add initial timeline entry
    this.timeline.push({
      status: 'pending',
      description: 'Order created',
      timestamp: new Date()
    });
  }
  
  // Calculate amounts
  if (this.isModified('quantity') || this.isModified('pricePerUnit')) {
    this.subtotal = this.quantity * this.pricePerUnit;
  }
  
  if (this.isModified('subtotal') || this.isModified('discount') || 
      this.isModified('gstPercentage') || this.isModified('shippingCost') || 
      this.isModified('platformFee')) {
    
    const discountedAmount = this.subtotal - this.discount;
    this.gstAmount = (discountedAmount * this.gstPercentage) / 100;
    this.totalAmount = discountedAmount + this.gstAmount + this.shippingCost + this.platformFee;
    this.amountDue = this.totalAmount - this.amountPaid;
  }
  
  this.updatedAt = new Date();
  this.version += 1;
  next();
});

// Method to update order status
orderSchema.methods.updateStatus = async function(newStatus, description, updatedBy) {
  this.status = newStatus;
  
  this.timeline.push({
    status: newStatus,
    description: description || `Order status updated to ${newStatus}`,
    timestamp: new Date(),
    updatedBy: updatedBy
  });
  
  return this.save();
};

// In models/Order.js - update the getOrderStatistics method
orderSchema.statics.getOrderStatistics = async function(userId, role) {
  // Convert string userId to ObjectId if needed
  const mongoose = require('mongoose');
  const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
    ? new mongoose.Types.ObjectId(userId) 
    : userId;

  const matchCriteria = role === 'farmer' 
    ? { farmer: userObjectId } 
    : { buyer: userObjectId };

  const stats = await this.aggregate([
    { $match: matchCriteria },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', 0] }
        },
        totalSpending: {
          $sum: '$totalAmount'
        },
        averageOrderValue: { $avg: '$totalAmount' }
      }
    }
  ]);
  
  return stats[0] || {
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    totalSpending: 0,
    averageOrderValue: 0
  };
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;