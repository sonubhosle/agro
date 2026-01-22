const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  priceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CropPrice',
    required: true,
    index: true
  },
  
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  volume: {
    type: Number,
    default: 0,
    min: 0
  },
  
  date: {
    type: Date,
    required: true,
    index: true,
    default: Date.now
  },
  
  source: {
    type: String,
    enum: ['system', 'manual', 'mandi_api', 'farmer_input'],
    default: 'system'
  },
  
  metadata: mongoose.Schema.Types.Mixed,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
priceHistorySchema.index({ priceId: 1, date: -1 });

// Static method to get price history for a period
priceHistorySchema.statics.getHistoryForPeriod = async function(priceId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    priceId,
    date: { $gte: startDate }
  }).sort('date');
};

const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);

module.exports = PriceHistory;