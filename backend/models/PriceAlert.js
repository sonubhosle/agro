const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema({
  // User who set the alert
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Crop information
  cropName: {
    type: String,
    required: true,
    enum: ['wheat', 'rice', 'tomato', 'potato', 'onion', 'cotton', 'sugarcane', 'maize', 'pulses', 'vegetables', 'fruits']
  },
  
  variety: {
    type: String,
    default: 'any'
  },
  
  // Location information
  district: {
    type: String,
    required: true
  },
  
  state: {
    type: String,
    required: true
  },
  
  // Alert conditions
  threshold: {
    type: Number,
    required: true,
    min: 0
  },
  
  direction: {
    type: String,
    enum: ['increase', 'decrease', 'both'],
    default: 'both'
  },
  
  comparisonType: {
    type: String,
    enum: ['percentage', 'absolute'],
    default: 'percentage'
  },
  
  // Alert settings
  isActive: {
    type: Boolean,
    default: true
  },
  
  frequency: {
    type: String,
    enum: ['once', 'daily', 'weekly'],
    default: 'once'
  },
  
  // Notification channels
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  
  // Trigger history
  triggers: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    previousPrice: Number,
    currentPrice: Number,
    changePercentage: Number,
    changeAmount: Number,
    notificationSent: Boolean
  }],
  
  lastTriggered: Date,
  
  triggerCount: {
    type: Number,
    default: 0
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  expiresAt: {
    type: Date,
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 30); // 30 days expiry
      return date;
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
priceAlertSchema.index({ user: 1, isActive: 1 });
priceAlertSchema.index({ cropName: 1, district: 1, state: 1 });
priceAlertSchema.index({ expiresAt: 1 });
priceAlertSchema.index({ lastTriggered: 1 });

// Pre-save middleware
priceAlertSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if price triggers alert
priceAlertSchema.methods.checkPrice = function(previousPrice, currentPrice) {
  if (!this.isActive) return null;
  
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.isActive = false;
    return null;
  }
  
  const changeAmount = currentPrice - previousPrice;
  const changePercentage = (changeAmount / previousPrice) * 100;
  
  let shouldTrigger = false;
  let changeType = null;
  
  if (this.comparisonType === 'percentage') {
    const change = Math.abs(changePercentage);
    if (change >= this.threshold) {
      shouldTrigger = true;
      changeType = changePercentage > 0 ? 'increase' : 'decrease';
    }
  } else {
    const change = Math.abs(changeAmount);
    if (change >= this.threshold) {
      shouldTrigger = true;
      changeType = changeAmount > 0 ? 'increase' : 'decrease';
    }
  }
  
  // Check direction
  if (shouldTrigger && this.direction !== 'both') {
    if (this.direction !== changeType) {
      shouldTrigger = false;
    }
  }
  
  if (shouldTrigger) {
    return {
      shouldTrigger: true,
      previousPrice,
      currentPrice,
      changeAmount,
      changePercentage,
      changeType
    };
  }
  
  return null;
};

// Method to trigger alert
priceAlertSchema.methods.triggerAlert = async function(priceData) {
  // Add to trigger history
  this.triggers.push({
    timestamp: new Date(),
    previousPrice: priceData.previousPrice,
    currentPrice: priceData.currentPrice,
    changePercentage: priceData.changePercentage,
    changeAmount: priceData.changeAmount,
    notificationSent: true
  });
  
  this.lastTriggered = new Date();
  this.triggerCount += 1;
  
  // If frequency is 'once', deactivate after trigger
  if (this.frequency === 'once') {
    this.isActive = false;
  }
  
  await this.save();
  
  // Create notification
  const Notification = require('./Notification');
  const notification = await Notification.createPriceAlert(
    this.user,
    {
      cropName: this.cropName,
      variety: this.variety,
      district: this.district,
      state: this.state,
      priceChange: {
        amount: priceData.changeAmount,
        percentage: priceData.changePercentage
      },
      previousPrice: priceData.previousPrice,
      currentPrice: priceData.currentPrice
    },
    priceData.changeType
  );
  
  // Send notification through selected channels
  const User = require('./User');
  const user = await User.findById(this.user);
  
  if (user) {
    const NotificationService = require('../utils/notificationService');
    await NotificationService.sendNotification(notification, user);
  }
  
  return notification;
};

// Static method to check all alerts for price change
priceAlertSchema.statics.checkAllAlerts = async function(cropPrice) {
  const alerts = await this.find({
    cropName: cropPrice.cropName,
    district: cropPrice.district,
    state: cropPrice.state,
    isActive: true
  });
  
  const triggeredAlerts = [];
  
  for (const alert of alerts) {
    const priceData = alert.checkPrice(cropPrice.previousPrice, cropPrice.currentPrice);
    
    if (priceData) {
      await alert.triggerAlert(priceData);
      triggeredAlerts.push({
        alertId: alert._id,
        userId: alert.user,
        ...priceData
      });
    }
  }
  
  return triggeredAlerts;
};

// Static method to get user's active alerts
priceAlertSchema.statics.getUserAlerts = async function(userId) {
  return this.find({
    user: userId,
    isActive: true
  }).sort('-createdAt');
};

// Static method to get alert statistics
priceAlertSchema.statics.getAlertStatistics = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: { user: mongoose.Types.ObjectId(userId) }
    },
    {
      $facet: {
        totalAlerts: [{ $count: 'count' }],
        activeAlerts: [
          { $match: { isActive: true } },
          { $count: 'count' }
        ],
        triggeredAlerts: [
          { $match: { triggerCount: { $gt: 0 } } },
          { $count: 'count' }
        ],
        byCrop: [
          {
            $group: {
              _id: '$cropName',
              count: { $sum: 1 },
              triggered: { $sum: '$triggerCount' }
            }
          }
        ],
        recentTriggers: [
          { $match: { triggerCount: { $gt: 0 } } },
          { $sort: { lastTriggered: -1 } },
          { $limit: 5 },
          {
            $project: {
              cropName: 1,
              lastTriggered: 1,
              triggerCount: 1
            }
          }
        ]
      }
    }
  ]);
  
  return stats[0];
};

const PriceAlert = mongoose.model('PriceAlert', priceAlertSchema);

module.exports = PriceAlert;