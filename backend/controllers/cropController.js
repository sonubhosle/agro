const Crop = require('../models/Crop');
const CropPrice = require('../models/CropPrice');
const Notification = require('../models/Notification');
const { catchAsync } = require('../middleware/error');
const { deleteFile } = require('../middleware/upload');


exports.getAllCrops = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    fields,
    cropName,
    district,
    state,
    minPrice,
    maxPrice,
    qualityGrade,
    farmerId,
    status
  } = req.query;

  // Build query
  const query = {};

  // Filter by crop name
  if (cropName) {
    query.name = cropName;
  }

  // Filter by location
  if (district) query['location.district'] = district;
  if (state) query['location.state'] = state;

  // Filter by price range
  if (minPrice || maxPrice) {
    query.pricePerUnit = {};
    if (minPrice) query.pricePerUnit.$gte = parseFloat(minPrice);
    if (maxPrice) query.pricePerUnit.$lte = parseFloat(maxPrice);
  }

  // Filter by quality grade
  if (qualityGrade) {
    query.qualityGrade = qualityGrade;
  }

  // Filter by farmer
  if (farmerId) {
    query.farmer = farmerId;
  }

  // Filter by status
  if (status) {
    query.status = status;
  } else {
    query.status = 'available';
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;

  let queryBuilder = Crop.find(query)
    .populate('farmer', 'fullName farmName rating profileImage')
    .skip(skip)
    .limit(parseInt(limit))
    .sort(sort);

  // Select specific fields
  if (fields) {
    const fieldsList = fields.split(',').join(' ');
    queryBuilder = queryBuilder.select(fieldsList);
  }

  const crops = await queryBuilder;

  // Get total count for pagination
  const total = await Crop.countDocuments(query);

  // Get price statistics for each crop
  const cropsWithPrices = await Promise.all(
    crops.map(async (crop) => {
      const priceStats = await CropPrice.findOne({
        cropName: crop.name,
        district: crop.location.district,
        state: crop.location.state
      }).select('currentPrice priceChange');

      const cropObj = crop.toObject();
      cropObj.marketPrice = priceStats?.currentPrice || crop.pricePerUnit;
      cropObj.priceDifference = priceStats
        ? crop.pricePerUnit - priceStats.currentPrice
        : 0;

      return cropObj;
    })
  );

  res.status(200).json({
    success: true,
    count: crops.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: cropsWithPrices
  });
});

exports.getNearbyCrops = catchAsync(async (req, res, next) => {
  const { lat, lng, radius = 50, ...otherFilters } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }

  const query = {
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    },
    status: 'available'
  };

  // Add other filters
  if (otherFilters.cropName) query.name = otherFilters.cropName;
  if (otherFilters.qualityGrade) query.qualityGrade = otherFilters.qualityGrade;
  if (otherFilters.minPrice || otherFilters.maxPrice) {
    query.pricePerUnit = {};
    if (otherFilters.minPrice) query.pricePerUnit.$gte = parseFloat(otherFilters.minPrice);
    if (otherFilters.maxPrice) query.pricePerUnit.$lte = parseFloat(otherFilters.maxPrice);
  }

  const crops = await Crop.find(query)
    .populate('farmer', 'fullName farmName rating profileImage')
    .limit(50)
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: crops.length,
    data: crops
  });
});

exports.getCrop = catchAsync(async (req, res, next) => {
  // Check if ID is valid MongoDB ObjectId
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid crop ID format'
    });
  }

  // REMOVE .populate('reviews') - keep only farmer population
  const crop = await Crop.findById(req.params.id)
    .populate('farmer', 'fullName farmName rating totalReviews phone address profileImage');

  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }

  // Increment views
  crop.views += 1;
  await crop.save();

  // Get market price for comparison
  const marketPrice = await CropPrice.findOne({
    cropName: crop.name,
    district: crop.location.district,
    state: crop.location.state
  }).select('currentPrice priceChange');

  const cropData = crop.toObject();
  cropData.marketPrice = marketPrice?.currentPrice;
  cropData.priceComparison = marketPrice
    ? {
        difference: crop.pricePerUnit - marketPrice.currentPrice,
        percentage: ((crop.pricePerUnit - marketPrice.currentPrice) / marketPrice.currentPrice) * 100
      }
    : null;

  res.status(200).json({
    success: true,
    data: cropData
  });
});
exports.createCrop = catchAsync(async (req, res, next) => {
  // Add farmer to request body
  req.body.farmer = req.user.id;


  // FIX: Handle tags if sent as string
  if (req.body.tags && typeof req.body.tags === 'string') {
    req.body.tags = req.body.tags.split(',').map(tag => tag.trim());
  }

  // FIX: Handle location
  if (!req.body.location) {
    const user = req.user;
    req.body.location = {
      district: req.body.district || user.address.district || "Pune",
      state: req.body.state || user.address.state || "Maharashtra",
      coordinates: {
        type: "Point",
        coordinates: [73.8567, 18.5204]
      }
    };
  }

  // FIX: Handle images - THIS IS THE KEY PART
  req.body.images = []; // Start with empty array
  
  if (req.body.imagesString) {
    // If image path comes as a string field
    const imagePath = req.body.imagesString;
    req.body.images.push({
      url: imagePath,
      publicId: imagePath.split('/').pop().split('.')[0], // Extract filename without extension
      caption: 'Crop image'
    });
    delete req.body.imagesString; // Remove the temporary field
  }
  
  // Check if images were uploaded via multer
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      req.body.images.push({
        url: `/uploads/crops/${file.filename}`,
        publicId: file.filename.split('.')[0],
        caption: file.originalname || 'Crop image'
      });
    });
  }
  
  // Check if images came as string in body (from middleware)
  if (req.body.images && typeof req.body.images === 'string') {
    const imagePath = req.body.images;
    req.body.images = [{
      url: imagePath,
      publicId: imagePath.split('/').pop().split('.')[0],
      caption: 'Crop image'
    }];
  }


  // Calculate total price
  req.body.totalPrice = req.body.quantity * req.body.pricePerUnit;
  req.body.availableQuantity = req.body.quantity;

  // Set base price and final price
  req.body.basePrice = req.body.pricePerUnit;
  req.body.finalPrice = req.body.pricePerUnit;

  // Calculate GST if applicable
  if (req.body.gstPercentage && req.body.gstPercentage > 0) {
    req.body.gstAmount = (req.body.finalPrice * req.body.gstPercentage) / 100;
  }

  // Create crop
  const crop = await Crop.create(req.body);

  // Update crop price statistics
  await updateCropPriceStatistics(crop);

  res.status(201).json({
    success: true,
    message: 'Crop listed successfully',
    data: {
      crop
    }
  });
});
exports.updateCrop = catchAsync(async (req, res, next) => {
  let crop = await Crop.findById(req.params.id);

  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }

  // Check if user is the crop owner
  if (crop.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this crop'
    });
  }


  // Handle new image uploads
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map(file => ({
      url: `/uploads/crops/${file.filename}`,
      publicId: file.filename,
      caption: file.originalname || 'Crop image'
    }));
    
    // Add new images to existing images
    crop.images = [...crop.images, ...newImages];
  }

  // Handle image deletions
  if (req.body.imagesToDelete && Array.isArray(req.body.imagesToDelete)) {
    // Delete images from storage
    for (const publicId of req.body.imagesToDelete) {
      await deleteFile(publicId);
    }

    // Remove images from crop
    crop.images = crop.images.filter(
      img => !req.body.imagesToDelete.includes(img.publicId)
    );
  }

  // Handle tags parsing
  if (req.body.tags !== undefined) {
    if (typeof req.body.tags === 'string') {
      crop.tags = req.body.tags.split(',').map(tag => tag.trim());
    } else if (Array.isArray(req.body.tags)) {
      crop.tags = req.body.tags;
    }
  }

  // Update other fields
  const updateFields = [
    'name', 'variety', 'description', 'quantity', 'unit',
    'pricePerUnit', 'qualityGrade', 'moistureContent',
    'harvestDate', 'expiryDate', 'shelfLife', 'status',
    'discount', 'gstPercentage'
  ];

  updateFields.forEach(field => {
    if (req.body[field] !== undefined) {
      crop[field] = req.body[field];
    }
  });

  // Handle location updates
  if (req.body.district || req.body.state) {
    crop.location = {
      district: req.body.district || crop.location.district,
      state: req.body.state || crop.location.state,
      coordinates: crop.location.coordinates
    };
  }

  // Recalculate prices if quantity or price changed
  if (req.body.quantity !== undefined || req.body.pricePerUnit !== undefined) {
    crop.totalPrice = crop.quantity * crop.pricePerUnit;
    crop.availableQuantity = crop.quantity - crop.soldQuantity - crop.reservedQuantity;
  }

  // Recalculate discount and GST
  if (req.body.discount !== undefined || req.body.pricePerUnit !== undefined) {
    const discountAmount = (crop.pricePerUnit * (crop.discount || 0)) / 100;
    crop.finalPrice = crop.pricePerUnit - discountAmount;
  }

  if (req.body.gstPercentage !== undefined) {
    crop.gstAmount = (crop.finalPrice * crop.gstPercentage) / 100;
  }

  // Update status based on available quantity
  if (crop.availableQuantity <= 0) {
    crop.status = 'out_of_stock';
  } else if (crop.status === 'out_of_stock' && crop.availableQuantity > 0) {
    crop.status = 'available';
  }

  crop.updatedAt = Date.now();
  crop = await crop.save();

  // Update crop price statistics if price changed
  if (req.body.pricePerUnit !== undefined) {
    await updateCropPriceStatistics(crop);
  }

  res.status(200).json({
    success: true,
    message: 'Crop updated successfully',
    data: {
      crop
    }
  });
});
exports.deleteCrop = catchAsync(async (req, res, next) => {
  const crop = await Crop.findById(req.params.id);

  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }

  // Check if user is the crop owner
  if (crop.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this crop'
    });
  }

  // Check if crop has active orders
  if (crop.reservedQuantity > 0 || crop.soldQuantity > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete crop with active or completed orders'
    });
  }

  // Delete images from Cloudinary
  if (crop.images && crop.images.length > 0) {
    for (const image of crop.images) {
      if (image.publicId) {
        await deleteFile(image.publicId);
      }
    }
  }

  await crop.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Crop deleted successfully'
  });
});


exports.getMyCrops = catchAsync(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { farmer: req.user.id };
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const crops = await Crop.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort('-createdAt');

  const total = await Crop.countDocuments(query);

  // Get crop statistics
  const stats = await Crop.getStatistics(req.user.id);

  res.status(200).json({
    success: true,
    count: crops.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    stats,
    data: crops
  });
});

exports.getCropStatistics = catchAsync(async (req, res, next) => {
  const { period = 'month' } = req.query; // day, week, month, year
  const mongoose = require('mongoose'); // ADD THIS LINE

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

  const statistics = await Crop.aggregate([
    {
      $match: {
        farmer: new mongoose.Types.ObjectId(req.user._id), // FIX THIS LINE
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        totalListings: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalSold: { $sum: '$soldQuantity' },
        totalRevenue: {
          $sum: { $multiply: ['$soldQuantity', '$pricePerUnit'] }
        },
        averagePrice: { $avg: '$pricePerUnit' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    period,
    data: statistics
  });
});

exports.searchCrops = catchAsync(async (req, res, next) => {
  const { q, ...filters } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const searchQuery = {
    $and: [
      {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { variety: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } }
        ]
      },
      { status: 'available' }
    ]
  };

  // Add other filters
  if (filters.district) searchQuery['location.district'] = filters.district;
  if (filters.state) searchQuery['location.state'] = filters.state;
  if (filters.minPrice || filters.maxPrice) {
    searchQuery.pricePerUnit = {};
    if (filters.minPrice) searchQuery.pricePerUnit.$gte = parseFloat(filters.minPrice);
    if (filters.maxPrice) searchQuery.pricePerUnit.$lte = parseFloat(filters.maxPrice);
  }
  if (filters.qualityGrade) searchQuery.qualityGrade = filters.qualityGrade;

  const crops = await Crop.find(searchQuery)
    .populate('farmer', 'fullName farmName rating profileImage')
    .limit(20)
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: crops.length,
    data: crops
  });
});

async function updateCropPriceStatistics(crop) {
  try {
    const existingPrice = await CropPrice.findOne({
      cropName: crop.name,
      district: crop.location.district,
      state: crop.location.state,
      qualityGrade: crop.qualityGrade
    });

    if (existingPrice) {
      // Update existing price record
      const totalVolume = existingPrice.totalVolume + crop.quantity;
      const weightedAverage = (
        (existingPrice.currentPrice * existingPrice.totalVolume) +
        (crop.pricePerUnit * crop.quantity)
      ) / totalVolume;

      existingPrice.previousPrice = existingPrice.currentPrice;
      existingPrice.currentPrice = weightedAverage;
      existingPrice.totalVolume = totalVolume;
      existingPrice.availableVolume += crop.quantity;
      existingPrice.lastUpdated = new Date();

      await existingPrice.save();

      // Check for price alerts
      await checkPriceAlerts(existingPrice);
    } else {
      // Create new price record
      await CropPrice.create({
        cropName: crop.name,
        variety: crop.variety,
        qualityGrade: crop.qualityGrade,
        basePrice: crop.pricePerUnit,
        currentPrice: crop.pricePerUnit,
        district: crop.location.district,
        state: crop.location.state,
        unit: crop.unit,
        totalVolume: crop.quantity,
        availableVolume: crop.quantity,
        lastUpdated: new Date()
      });
    }
  } catch (error) {
    console.error('Error updating crop price statistics:', error);
  }
}

async function checkPriceAlerts(cropPrice) {
  try {
    if (!cropPrice.previousPrice || cropPrice.priceChange.percentage === 0) {
      return;
    }

    const changeType = cropPrice.priceChange.direction;
    const changePercentage = Math.abs(cropPrice.priceChange.percentage);

    // Check if change exceeds alert thresholds
    const threshold = cropPrice.alertThresholds?.[changeType] || 5;

    if (changePercentage >= threshold) {
      // Get users who have subscribed to price alerts for this crop
      const User = require('../models/User');
      const users = await User.find({
        'notificationPreferences.email.priceAlerts': true,
        $or: [
          { 'address.district': cropPrice.district },
          { 'address.state': cropPrice.state }
        ]
      }).select('_id');

      // Create notifications for each user
      const notificationPromises = users.map(user =>
        Notification.createPriceAlert(user._id, cropPrice, changeType)
      );

      await Promise.all(notificationPromises);

      // Send real-time notifications via Socket.io
      const io = require('../server').io;
      users.forEach(user => {
        io.to(`user-${user._id}`).emit('price-alert', {
          cropName: cropPrice.cropName,
          district: cropPrice.district,
          changeType,
          changePercentage: changePercentage.toFixed(2),
          currentPrice: cropPrice.currentPrice,
          previousPrice: cropPrice.previousPrice
        });
      });
    }
  } catch (error) {
    console.error('Error checking price alerts:', error);
  }
}