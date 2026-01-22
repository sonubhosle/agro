const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/User');

// Common validation rules
exports.validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  };
};

// Auth validation rules
exports.authValidation = {
  register: [
    body('fullName')
      .trim()
      .notEmpty().withMessage('Full name is required')
      .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail()
      .custom(async (email) => {
        const user = await User.findOne({ email });
        if (user) {
          throw new Error('Email already exists');
        }
        return true;
      }),
    
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number')
      .custom(async (phone) => {
        const user = await User.findOne({ phone });
        if (user) {
          throw new Error('Phone number already exists');
        }
        return true;
      }),
    
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('confirmPassword')
      .notEmpty().withMessage('Please confirm your password')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
    
    body('role')
      .optional()
      .isIn(['farmer', 'buyer']).withMessage('Role must be either farmer or buyer'),
    
    body('district')
      .trim()
      .notEmpty().withMessage('District is required'),
    
    body('state')
      .trim()
      .notEmpty().withMessage('State is required')
  ],
  
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),
    
    body('password')
      .notEmpty().withMessage('Password is required')
  ],
  
  forgotPassword: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
  ],
  
  resetPassword: [
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('confirmPassword')
      .notEmpty().withMessage('Please confirm your password')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
  ]
};

// Crop validation rules
exports.cropValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Crop name is required')
      .isIn(['wheat', 'rice', 'tomato', 'potato', 'onion', 'cotton', 'sugarcane', 'maize', 'pulses', 'vegetables', 'fruits'])
      .withMessage('Invalid crop name'),
    
    body('variety')
      .trim()
      .notEmpty().withMessage('Crop variety is required'),
    
    body('quantity')
      .notEmpty().withMessage('Quantity is required')
      .isFloat({ min: 0.1 }).withMessage('Quantity must be greater than 0'),
    
    body('unit')
      .notEmpty().withMessage('Unit is required')
      .isIn(['kg', 'quintal', 'ton']).withMessage('Invalid unit'),
    
    body('pricePerUnit')
      .notEmpty().withMessage('Price per unit is required')
      .isFloat({ min: 0 }).withMessage('Price cannot be negative'),
    
    body('qualityGrade')
      .optional()
      .isIn(['A', 'B', 'C', 'Organic', 'Premium']).withMessage('Invalid quality grade'),
    
    body('harvestDate')
      .notEmpty().withMessage('Harvest date is required')
      .isISO8601().withMessage('Invalid date format'),
    
    body('district')
      .trim()
      .notEmpty().withMessage('District is required'),
    
    body('state')
      .trim()
      .notEmpty().withMessage('State is required'),
    
    body('description')
      .optional()
      .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    
    body('moistureContent')
      .optional()
      .isFloat({ min: 0, max: 100 }).withMessage('Moisture content must be between 0 and 100'),
    
    body('expiryDate')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    
    body('shelfLife')
      .optional()
      .isInt({ min: 1 }).withMessage('Shelf life must be at least 1 day'),
    
   body('tags')
  .optional()
  .custom((value) => {
    if (!value) return true; // No tags is okay
    if (Array.isArray(value)) return true; // Array is okay
    if (typeof value === 'string') return true; // String is okay
    throw new Error('Tags must be a string or array');
  })
  ],
  
  update: [
    param('id')
      .notEmpty().withMessage('Crop ID is required')
      .isMongoId().withMessage('Invalid crop ID'),
    
    body('quantity')
      .optional()
      .isFloat({ min: 0.1 }).withMessage('Quantity must be greater than 0'),
    
    body('pricePerUnit')
      .optional()
      .isFloat({ min: 0 }).withMessage('Price cannot be negative'),
    
    body('qualityGrade')
      .optional()
      .isIn(['A', 'B', 'C', 'Organic', 'Premium']).withMessage('Invalid quality grade'),
    
    body('status')
      .optional()
      .isIn(['available', 'reserved', 'sold', 'out_of_stock', 'hidden'])
      .withMessage('Invalid status')
  ]
};

// Order validation rules
exports.orderValidation = {
  create: [
    body('cropId')
      .notEmpty().withMessage('Crop ID is required')
      .isMongoId().withMessage('Invalid crop ID'),
    
    body('quantity')
      .notEmpty().withMessage('Quantity is required')
      .isFloat({ min: 0.1 }).withMessage('Quantity must be greater than 0'),
    
    body('deliveryType')
      .optional()
      .isIn(['pickup', 'delivery', 'third_party']).withMessage('Invalid delivery type'),
    
    body('deliveryAddress')
      .optional()
      .isObject().withMessage('Delivery address must be an object'),
    
    body('specialInstructions')
      .optional()
      .isLength({ max: 500 }).withMessage('Special instructions cannot exceed 500 characters')
  ],
  
  updateStatus: [
    param('id')
      .notEmpty().withMessage('Order ID is required')
      .isMongoId().withMessage('Invalid order ID'),
    
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn([
        'pending',
        'confirmed',
        'processing',
        'ready_for_delivery',
        'shipped',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'cancelled'
      ]).withMessage('Invalid status'),
    
    body('description')
      .optional()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
  ]
};

// Price validation rules
exports.priceValidation = {
  create: [
    body('cropName')
      .trim()
      .notEmpty().withMessage('Crop name is required')
      .isIn(['wheat', 'rice', 'tomato', 'potato', 'onion', 'cotton', 'sugarcane', 'maize', 'pulses', 'vegetables', 'fruits'])
      .withMessage('Invalid crop name'),
    
    body('variety')
      .trim()
      .notEmpty().withMessage('Crop variety is required'),
    
    body('currentPrice')
      .notEmpty().withMessage('Current price is required')
      .isFloat({ min: 0 }).withMessage('Price cannot be negative'),
    
    body('district')
      .trim()
      .notEmpty().withMessage('District is required'),
    
    body('state')
      .trim()
      .notEmpty().withMessage('State is required'),
    
    body('unit')
      .optional()
      .isIn(['kg', 'quintal', 'ton']).withMessage('Invalid unit')
  ],
  
  update: [
    param('id')
      .notEmpty().withMessage('Price ID is required')
      .isMongoId().withMessage('Invalid price ID'),
    
    body('currentPrice')
      .notEmpty().withMessage('Current price is required')
      .isFloat({ min: 0 }).withMessage('Price cannot be negative'),
    
    body('totalVolume')
      .optional()
      .isFloat({ min: 0 }).withMessage('Volume cannot be negative'),
    
    body('availableVolume')
      .optional()
      .isFloat({ min: 0 }).withMessage('Available volume cannot be negative'),
    
    body('demandScore')
      .optional()
      .isFloat({ min: 0, max: 100 }).withMessage('Demand score must be between 0 and 100'),
    
    body('supplyScore')
      .optional()
      .isFloat({ min: 0, max: 100 }).withMessage('Supply score must be between 0 and 100')
  ]
};

// Query validation rules
exports.queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
      .toInt(),
    
    query('sort')
      .optional()
      .isString().withMessage('Sort must be a string'),
    
    query('fields')
      .optional()
      .isString().withMessage('Fields must be a string')
  ],
  
  filter: [
    query('cropName')
      .optional()
      .isString().withMessage('Crop name must be a string'),
    
    query('district')
      .optional()
      .isString().withMessage('District must be a string'),
    
    query('state')
      .optional()
      .isString().withMessage('State must be a string'),
    
    query('minPrice')
      .optional()
      .isFloat({ min: 0 }).withMessage('Minimum price cannot be negative')
      .toFloat(),
    
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 }).withMessage('Maximum price cannot be negative')
      .toFloat(),
    
    query('qualityGrade')
      .optional()
      .isString().withMessage('Quality grade must be a string'),
    
    query('status')
      .optional()
      .isString().withMessage('Status must be a string'),
    
    query('farmerId')
      .optional()
      .isMongoId().withMessage('Invalid farmer ID'),
    
    query('buyerId')
      .optional()
      .isMongoId().withMessage('Invalid buyer ID'),
    
    query('startDate')
      .optional()
      .isISO8601().withMessage('Invalid start date format'),
    
    query('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date format')
  ]
};