const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Crop name is required'],
    trim: true,
    enum: ['wheat', 'rice', 'tomato', 'potato', 'onion', 'cotton', 'sugarcane', 'maize', 'pulses', 'vegetables', 'fruits']
  },
  
  variety: {
    type: String,
    required: [true, 'Crop variety is required'],
    trim: true
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Farmer Reference
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Quantity and Pricing
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  
  unit: {
    type: String,
    enum: ['kg', 'quintal', 'ton'],
    default: 'kg'
  },
  
  pricePerUnit: {
    type: Number,
    required: [true, 'Price per unit is required'],
    min: [0, 'Price cannot be negative']
  },
  
  totalPrice: {
    type: Number,
    required: true
  },
  
  // Quality Information
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'Organic', 'Premium'],
    default: 'B'
  },
  
  moistureContent: {
    type: Number,
    min: [0, 'Moisture content cannot be negative'],
    max: [100, 'Moisture content cannot exceed 100%']
  },
  
  // Location Information
  location: {
    district: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  
  // Images
  images: [{
    url: String,
    publicId: String,
    caption: String
  }],
  
  // Harvest Information
  harvestDate: {
    type: Date,
    required: true
  },
  
  expectedDeliveryDate: {
    type: Date
  },
  
  // Stock Information
  availableQuantity: {
    type: Number,
    required: true
  },
  
  reservedQuantity: {
    type: Number,
    default: 0
  },
  
  soldQuantity: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['available', 'reserved', 'sold', 'out_of_stock', 'hidden'],
    default: 'available'
  },
  
  // Pricing Information
  basePrice: {
    type: Number,
    required: true
  },
  
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  finalPrice: {
    type: Number,
    required: true
  },
  
  // Tax Information
  gstPercentage: {
    type: Number,
    default: 0
  },
  
  gstAmount: {
    type: Number,
    default: 0
  },
  
  // Ratings and Reviews
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  totalReviews: {
    type: Number,
    default: 0
  },
  
  // Views and Engagement
  views: {
    type: Number,
    default: 0
  },
  
  favoritesCount: {
    type: Number,
    default: 0
  },
  
  // Metadata
  tags: [String],
  
  certifications: [{
    name: String,
    issuer: String,
    validity: Date
  }],
  
  // Expiry Information
  expiryDate: Date,
  
  shelfLife: Number, // in days
  
  // Audit Fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  lastPriceUpdate: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
cropSchema.index({ farmer: 1 });
cropSchema.index({ name: 1 });
cropSchema.index({ district: 1 });
cropSchema.index({ state: 1 });
cropSchema.index({ status: 1 });
cropSchema.index({ pricePerUnit: 1 });
cropSchema.index({ 'location.coordinates': '2dsphere' });
cropSchema.index({ harvestDate: 1 });
cropSchema.index({ createdAt: -1 });

// Virtual fields
cropSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'crop',
  justOne: false
});

cropSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'crop',
  justOne: false
});

// Pre-save middleware to calculate total price
cropSchema.pre('save', function(next) {
  if (this.isModified('quantity') || this.isModified('pricePerUnit')) {
    this.totalPrice = this.quantity * this.pricePerUnit;
  }
  
  if (this.isModified('basePrice') || this.isModified('discount')) {
    const discountAmount = (this.basePrice * this.discount) / 100;
    this.finalPrice = this.basePrice - discountAmount;
  }
  
  if (this.isModified('finalPrice') || this.isModified('gstPercentage')) {
    this.gstAmount = (this.finalPrice * this.gstPercentage) / 100;
  }
  
  if (this.isModified('quantity') || this.isModified('soldQuantity')) {
    this.availableQuantity = this.quantity - this.soldQuantity - this.reservedQuantity;
    
    if (this.availableQuantity <= 0) {
      this.status = 'out_of_stock';
    }
  }
  
  this.updatedAt = Date.now();
  next();
});

// Static method to get crop statistics
cropSchema.statics.getStatistics = async function(farmerId) {
  const stats = await this.aggregate([
    {
      $match: { farmer: new mongoose.Types.ObjectId(farmerId) }

    },
    {
      $group: {
        _id: null,
        totalCrops: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalSold: { $sum: '$soldQuantity' },
        totalRevenue: { $sum: { $multiply: ['$soldQuantity', '$pricePerUnit'] } },
        averagePrice: { $avg: '$pricePerUnit' }
      }
    }
  ]);
  
  return stats[0] || {
    totalCrops: 0,
    totalQuantity: 0,
    totalSold: 0,
    totalRevenue: 0,
    averagePrice: 0
  };
};

const Crop = mongoose.model('Crop', cropSchema);

module.exports = Crop;