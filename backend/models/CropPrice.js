const mongoose = require('mongoose');

const cropPriceSchema = new mongoose.Schema({
  // Crop Information
  cropName: {
    type: String,
    required: true,
    enum: ['wheat', 'rice', 'tomato', 'potato', 'onion', 'cotton', 'sugarcane', 'maize', 'pulses', 'vegetables', 'fruits']
  },
  
  variety: {
    type: String,
    required: true
  },
  
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'Organic', 'Premium'],
    default: 'B'
  },
  
  // Price Information
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  
  previousPrice: {
    type: Number,
    min: 0
  },
  
  priceChange: {
    amount: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    direction: {
      type: String,
      enum: ['increase', 'decrease', 'no_change'],
      default: 'no_change'
    }
  },
  
  // Location Information
  district: {
    type: String,
    required: true,
    index: true
  },
  
  state: {
    type: String,
    required: true,
    index: true
  },
  
  // Market Information
  marketType: {
    type: String,
    enum: ['mandi', 'retail', 'wholesale', 'farm_gate'],
    default: 'farm_gate'
  },
  
  unit: {
    type: String,
    enum: ['kg', 'quintal', 'ton'],
    default: 'kg'
  },
  
  // Volume Information
  totalVolume: {
    type: Number,
    default: 0
  },
  
  availableVolume: {
    type: Number,
    default: 0
  },
  
  demandScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  
  supplyScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  
  // Historical Data
  dailyHigh: {
    type: Number,
    min: 0
  },
  
  dailyLow: {
    type: Number,
    min: 0
  },
  
  weeklyAverage: {
    type: Number,
    min: 0
  },
  
  monthlyAverage: {
    type: Number,
    min: 0
  },
  
  // Price Prediction (AI Generated)
  predictedPrice: {
    type: Number,
    min: 0
  },
  
  predictionConfidence: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Weather Impact
  weatherImpact: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  
  weatherScore: {
    type: Number,
    min: -100,
    max: 100,
    default: 0
  },
  
  // Government Mandi Integration
  mandiPrice: {
    type: Number,
    min: 0
  },
  
  mandiPriceDate: Date,
  
  // Price Alerts Threshold
  alertThresholds: {
    increase: {
      type: Number,
      default: 5 // percentage
    },
    decrease: {
      type: Number,
      default: 5 // percentage
    }
  },
  
  // Metadata
  source: {
    type: String,
    enum: ['system', 'manual', 'mandi_api', 'ai_prediction'],
    default: 'system'
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  nextUpdate: Date,
  
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

// Compound indexes for performance
cropPriceSchema.index({ cropName: 1, district: 1, state: 1 });
cropPriceSchema.index({ cropName: 1, state: 1 });
cropPriceSchema.index({ district: 1, state: 1 });
cropPriceSchema.index({ lastUpdated: -1 });

// Virtual for price trend (7 days)
cropPriceSchema.virtual('weeklyTrend', {
  ref: 'PriceHistory',
  localField: '_id',
  foreignField: 'priceId',
  justOne: false,
  options: { 
    sort: { date: -1 },
    limit: 7 
  }
});

// Pre-save middleware to calculate price changes
cropPriceSchema.pre('save', function(next) {
  if (this.isModified('currentPrice') && this.previousPrice) {
    const changeAmount = this.currentPrice - this.previousPrice;
    const changePercentage = (changeAmount / this.previousPrice) * 100;
    
    this.priceChange = {
      amount: changeAmount,
      percentage: changePercentage,
      direction: changeAmount > 0 ? 'increase' : changeAmount < 0 ? 'decrease' : 'no_change'
    };
  }
  
  this.updatedAt = Date.now();
  this.version += 1;
  next();
});

// Static method to update prices
cropPriceSchema.statics.updatePrices = async function() {
  try {
    const crops = await this.find({});
    const updatePromises = crops.map(async (cropPrice) => {
      // Simulate price change (in production, this would come from market data)
      const changePercentage = (Math.random() * 10) - 5; // -5% to +5%
      const newPrice = cropPrice.currentPrice * (1 + changePercentage / 100);
      
      cropPrice.previousPrice = cropPrice.currentPrice;
      cropPrice.currentPrice = parseFloat(newPrice.toFixed(2));
      cropPrice.lastUpdated = new Date();
      
      return cropPrice.save();
    });
    
    await Promise.all(updatePromises);
    
    // Emit socket event for price updates
    const io = require('../server').io;
    io.emit('price-updates', { timestamp: new Date(), count: crops.length });
    
    return { success: true, updated: crops.length };
  } catch (error) {
    console.error('Error updating prices:', error);
    throw error;
  }
};

// Static method to get price statistics
cropPriceSchema.statics.getPriceStatistics = async function(cropName, district, state) {
  const matchCriteria = {};
  if (cropName) matchCriteria.cropName = cropName;
  if (district) matchCriteria.district = district;
  if (state) matchCriteria.state = state;
  
  const stats = await this.aggregate([
    { $match: matchCriteria },
    {
      $group: {
        _id: {
          cropName: '$cropName',
          district: '$district',
          state: '$state'
        },
        averagePrice: { $avg: '$currentPrice' },
        minPrice: { $min: '$currentPrice' },
        maxPrice: { $max: '$currentPrice' },
        totalVolume: { $sum: '$totalVolume' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.state': 1, '_id.district': 1 } }
  ]);
  
  return stats;
};

const CropPrice = mongoose.model('CropPrice', cropPriceSchema);

module.exports = CropPrice;