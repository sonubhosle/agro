const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Basic Information
  fullName: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  
  phone: {
    type: String,
    required: [true, 'Please provide your phone number'],
    unique: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: 'Please provide a valid 10-digit phone number'
    }
  },
  
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  
  // Role Information
  role: {
    type: String,
    enum: ['farmer', 'buyer', 'admin'],
    default: 'buyer'
  },
  
  // Location Information
  address: {
    street: String,
    city: String,
    district: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  
  // Farmer Specific Fields
  farmName: {
    type: String,
    required: function() {
      return this.role === 'farmer';
    }
  },
  
  farmSize: {
    type: Number,
    min: 0,
    required: function() {
      return this.role === 'farmer';
    }
  },
  
  farmType: {
    type: String,
    enum: ['organic', 'traditional', 'hydroponic', 'greenhouse'],
    required: function() {
      return this.role === 'farmer';
    }
  },
  
  cropsGrown: [{
    type: String,
    enum: ['wheat', 'rice', 'tomato', 'potato', 'onion', 'cotton', 'sugarcane', 'maize', 'pulses', 'vegetables', 'fruits']
  }],
  
  // Buyer Specific Fields
  businessName: {
    type: String,
    required: function() {
      return this.role === 'buyer';
    }
  },
  
  businessType: {
    type: String,
    enum: ['retailer', 'wholesaler', 'restaurant', 'processor', 'exporter'],
    required: function() {
      return this.role === 'buyer';
    }
  },
  
  // KYC Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verificationDocuments: {
    aadharCard: String,
    panCard: String,
    landDocuments: [String],
    businessLicense: String
  },
  
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  verificationNotes: String,
  
  // Profile Information
  profileImage: String,
  profileImagePublicId: String, // For Cloudinary
  
  // Rating and Reviews
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  totalReviews: {
    type: Number,
    default: 0
  },
  
  // Wallet
  walletBalance: {
    type: Number,
    default: 0
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLogin: Date,
  
  // Security
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  // Preferences
  notificationPreferences: {
    email: {
      priceAlerts: { type: Boolean, default: true },
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false }
    },
    sms: {
      priceAlerts: { type: Boolean, default: true },
      orderUpdates: { type: Boolean, default: true }
    },
    push: {
      priceAlerts: { type: Boolean, default: true },
      orderUpdates: { type: Boolean, default: true }
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
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
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'address.district': 1 });
userSchema.index({ 'address.state': 1 });
userSchema.index({ 'address.coordinates': '2dsphere' });

// Virtual populate
userSchema.virtual('crops', {
  ref: 'Crop',
  localField: '_id',
  foreignField: 'farmer',
  justOne: false
});

userSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'buyer',
  justOne: false
});

userSchema.virtual('soldOrders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'farmer',
  justOne: false
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update timestamp
userSchema.pre('save', function(next) {
  if (!this.isModified('password')) {
    this.updatedAt = Date.now();
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Method to create email verification token
// In models/User.js
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // CHANGE: Store the raw token directly (no hashing)
  this.emailVerificationToken = verificationToken;  // Store raw token
  
  return verificationToken; // Return same token
};

const User = mongoose.model('User', userSchema);

module.exports = User;