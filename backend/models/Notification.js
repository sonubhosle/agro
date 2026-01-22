const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Notification Content
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  message: {
    type: String,
    required: true,
    trim: true
  },
  
  // Notification Type
  type: {
    type: String,
    enum: [
      'price_alert',
      'order_update',
      'payment',
      'message',
      'system',
      'promotion',
      'security',
      'verification'
    ],
    required: true
  },
  
  // Priority Level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Associated Data
  data: {
    cropId: mongoose.Schema.Types.ObjectId,
    orderId: mongoose.Schema.Types.ObjectId,
    priceId: mongoose.Schema.Types.ObjectId,
    chatId: mongoose.Schema.Types.ObjectId,
    priceChange: Number,
    percentageChange: Number,
    actionUrl: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // Delivery Status
  channels: {
    inApp: {
      sent: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      readAt: Date
    },
    email: {
      sent: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      opened: { type: Boolean, default: false }
    },
    sms: {
      sent: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false }
    },
    push: {
      sent: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false }
    }
  },
  
  // Expiry
  expiresAt: {
    type: Date,
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 30); // 30 days expiry
      return date;
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Retry Information
  retryCount: {
    type: Number,
    default: 0
  },
  
  lastRetryAt: Date,
  
  // Error Information
  error: {
    code: String,
    message: String,
    stack: String
  },
  
  // Audit Fields
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ 'channels.inApp.read': 1 });
notificationSchema.index({ expiresAt: 1 });

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to create price alert notification
notificationSchema.statics.createPriceAlert = async function(userId, cropPrice, changeType) {
  const title = `Price ${changeType === 'increase' ? 'Increased' : 'Decreased'}`;
  const message = `Price of ${cropPrice.cropName} (${cropPrice.variety}) in ${cropPrice.district} has ${changeType === 'increase' ? 'increased' : 'decreased'} by ${Math.abs(cropPrice.priceChange.percentage).toFixed(2)}%`;
  
  const notification = new this({
    user: userId,
    title: title,
    message: message,
    type: 'price_alert',
    priority: 'high',
    data: {
      cropName: cropPrice.cropName,
      priceId: cropPrice._id,
      priceChange: cropPrice.priceChange.amount,
      percentageChange: cropPrice.priceChange.percentage,
      currentPrice: cropPrice.currentPrice,
      previousPrice: cropPrice.previousPrice,
      actionUrl: `/crops/${cropPrice.cropName}/prices`
    }
  });
  
  return notification.save();
};

// Static method to create order notification
notificationSchema.statics.createOrderNotification = async function(userId, order, status) {
  const statusMessages = {
    'pending': 'Your order has been placed successfully',
    'confirmed': 'Your order has been confirmed by the farmer',
    'processing': 'Your order is being processed',
    'shipped': 'Your order has been shipped',
    'delivered': 'Your order has been delivered',
    'cancelled': 'Your order has been cancelled'
  };
  
  const title = `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  const message = statusMessages[status] || `Your order status has been updated to ${status}`;
  
  const notification = new this({
    user: userId,
    title: title,
    message: message,
    type: 'order_update',
    priority: status === 'cancelled' ? 'high' : 'medium',
    data: {
      orderId: order._id,
      orderNumber: order.orderId,
      status: status,
      actionUrl: `/orders/${order._id}`
    }
  });
  
  return notification.save();
};

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.channels.inApp.read = true;
  this.channels.inApp.readAt = new Date();
  return this.save();
};

// Method to send notification
notificationSchema.methods.send = async function() {
  try {
    // Send via different channels based on user preferences
    const NotificationService = require('../utils/notificationService');
    
    // Get user notification preferences
    const User = require('./User');
    const user = await User.findById(this.user).select('notificationPreferences');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Send in-app notification
    const io = require('../server').io;
    io.to(`user-${this.user}`).emit('new-notification', {
      id: this._id,
      title: this.title,
      message: this.message,
      type: this.type,
      data: this.data,
      createdAt: this.createdAt
    });
    
    this.channels.inApp.sent = true;
    
    // Send email if enabled
    if (user.notificationPreferences.email[this.type]) {
      await NotificationService.sendEmail(this);
      this.channels.email.sent = true;
    }
    
    // Send SMS if enabled
    if (user.notificationPreferences.sms[this.type]) {
      await NotificationService.sendSMS(this);
      this.channels.sms.sent = true;
    }
    
    // Send push notification if enabled
    if (user.notificationPreferences.push[this.type]) {
      await NotificationService.sendPush(this);
      this.channels.push.sent = true;
    }
    
    this.status = 'sent';
    await this.save();
    
    return { success: true };
  } catch (error) {
    this.status = 'failed';
    this.error = {
      code: error.code,
      message: error.message,
      stack: error.stack
    };
    this.retryCount += 1;
    this.lastRetryAt = new Date();
    await this.save();
    
    throw error;
  }
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;