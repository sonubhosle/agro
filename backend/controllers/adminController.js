const User = require('../models/User');
const Crop = require('../models/Crop');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const CropPrice = require('../models/CropPrice');
const Notification = require('../models/Notification');
const Wallet = require('../models/Wallet');
const { catchAsync } = require('../middleware/error');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const [
    totalUsers,
    totalFarmers,
    totalBuyers,
    totalCrops,
    activeCrops,
    totalOrders,
    pendingOrders,
    totalRevenue,
    newUsersToday,
    newOrdersToday
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'farmer' }),
    User.countDocuments({ role: 'buyer' }),
    Crop.countDocuments(),
    Crop.countDocuments({ status: 'available' }),
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.aggregate([
      { $match: { status: 'delivered', paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    User.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    }),
    Order.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    })
  ]);

  // Weekly revenue trend
  const weeklyRevenue = await Order.aggregate([
    {
      $match: {
        status: 'delivered',
        paymentStatus: 'paid',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Top farmers by revenue
  const topFarmers = await Order.aggregate([
    {
      $match: {
        status: 'delivered',
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: '$farmer',
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'farmer'
      }
    },
    { $unwind: '$farmer' },
    {
      $project: {
        'farmer.fullName': 1,
        'farmer.email': 1,
        'farmer.phone': 1,
        revenue: 1,
        orders: 1
      }
    }
  ]);

  // Top crops by sales
  const topCrops = await Order.aggregate([
    {
      $match: {
        status: 'delivered',
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: '$cropName',
        revenue: { $sum: '$totalAmount' },
        quantity: { $sum: '$quantity' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalFarmers,
        totalBuyers,
        totalCrops,
        activeCrops,
        totalOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        newUsersToday,
        newOrdersToday
      },
      weeklyRevenue,
      topFarmers,
      topCrops
    }
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, role, status, verified, search } = req.query;
  const skip = (page - 1) * limit;

  const query = {};

  if (role) query.role = role;
  if (status) query.isActive = status === 'active';
  if (verified !== undefined) query.isVerified = verified === 'true';
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: users
  });
});

// @desc    Get user details
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
exports.getUserDetails = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires')
    .populate({
      path: 'crops',
      select: 'name variety quantity pricePerUnit status createdAt'
    })
    .populate({
      path: 'orders',
      select: 'orderId totalAmount status createdAt'
    });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get wallet balance if exists
  const wallet = await Wallet.findOne({ user: user._id });
  const walletBalance = wallet ? wallet.availableBalance : 0;

  // Get user statistics
  const orderStats = await Order.aggregate([
    {
      $match: user.role === 'farmer' 
        ? { farmer: user._id }
        : { buyer: user._id }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', 0] }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      user,
      walletBalance,
      statistics: orderStats[0] || {
        totalOrders: 0,
        completedOrders: 0,
        totalRevenue: 0
      }
    }
  });
});

// @desc    Verify user
// @route   PUT /api/admin/users/:id/verify
// @access  Private (Admin)
exports.verifyUser = catchAsync(async (req, res, next) => {
  const { status, notes } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.verificationStatus = status;
  user.verificationNotes = notes;
  
  if (status === 'approved') {
    user.isVerified = true;
  }

  await user.save();

  // Create notification for user
  await Notification.create({
    user: user._id,
    title: 'Verification Status Updated',
    message: `Your verification status has been ${status}`,
    type: 'verification',
    data: {
      status,
      notes,
      actionUrl: '/profile'
    }
  });

  res.status(200).json({
    success: true,
    message: `User verification ${status} successfully`,
    data: { user }
  });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
exports.updateUserStatus = catchAsync(async (req, res, next) => {
  const { isActive, reason } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Create notification for user
  await Notification.create({
    user: user._id,
    title: isActive ? 'Account Reactivated' : 'Account Suspended',
    message: isActive 
      ? 'Your account has been reactivated' 
      : `Your account has been suspended: ${reason || 'Violation of terms'}`,
    type: 'security',
    priority: 'high',
    data: {
      actionUrl: '/support'
    }
  });

  res.status(200).json({
    success: true,
    message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
    data: { user }
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user has active orders or crops
  const activeOrders = await Order.findOne({
    $or: [
      { buyer: user._id, status: { $nin: ['delivered', 'cancelled'] } },
      { farmer: user._id, status: { $nin: ['delivered', 'cancelled'] } }
    ]
  });

  if (activeOrders) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete user with active orders'
    });
  }

  // Soft delete (mark as inactive)
  user.isActive = false;
  user.email = `deleted_${Date.now()}_${user.email}`;
  user.phone = `deleted_${Date.now()}_${user.phone}`;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Get all crops
// @route   GET /api/admin/crops
// @access  Private (Admin)
exports.getAllCrops = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, status, cropName, farmerId, minPrice, maxPrice } = req.query;
  const skip = (page - 1) * limit;

  const query = {};

  if (status) query.status = status;
  if (cropName) query.name = cropName;
  if (farmerId) query.farmer = farmerId;
  if (minPrice || maxPrice) {
    query.pricePerUnit = {};
    if (minPrice) query.pricePerUnit.$gte = parseFloat(minPrice);
    if (maxPrice) query.pricePerUnit.$lte = parseFloat(maxPrice);
  }

  const crops = await Crop.find(query)
    .populate('farmer', 'fullName email phone farmName')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Crop.countDocuments(query);

  res.status(200).json({
    success: true,
    count: crops.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: crops
  });
});

// @desc    Update crop status
// @route   PUT /api/admin/crops/:id/status
// @access  Private (Admin)
exports.updateCropStatus = catchAsync(async (req, res, next) => {
  const { status, reason } = req.body;

  const crop = await Crop.findById(req.params.id);
  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }

  crop.status = status;
  await crop.save();

  // Create notification for farmer
  await Notification.create({
    user: crop.farmer,
    title: 'Crop Status Updated',
    message: `Your crop listing (${crop.name} - ${crop.variety}) has been ${status}`,
    type: 'system',
    data: {
      cropId: crop._id,
      status,
      reason,
      actionUrl: `/crops/${crop._id}`
    }
  });

  res.status(200).json({
    success: true,
    message: 'Crop status updated successfully',
    data: { crop }
  });
});

// @desc    Delete crop
// @route   DELETE /api/admin/crops/:id
// @access  Private (Admin)
exports.deleteCrop = catchAsync(async (req, res, next) => {
  const crop = await Crop.findById(req.params.id);
  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }

  // Check if crop has active orders
  if (crop.reservedQuantity > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete crop with active orders'
    });
  }

  await crop.deleteOne();

  // Create notification for farmer
  await Notification.create({
    user: crop.farmer,
    title: 'Crop Listing Removed',
    message: `Your crop listing (${crop.name} - ${crop.variety}) has been removed by admin`,
    type: 'system',
    priority: 'high',
    data: {
      cropName: crop.name,
      actionUrl: '/dashboard/farmer/crops'
    }
  });

  res.status(200).json({
    success: true,
    message: 'Crop deleted successfully'
  });
});

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private (Admin)
exports.getAllOrders = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, status, paymentStatus, startDate, endDate } = req.query;
  const skip = (page - 1) * limit;

  const query = {};

  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const orders = await Order.find(query)
    .populate('buyer', 'fullName email phone')
    .populate('farmer', 'fullName email phone farmName')
    .populate('crop', 'name variety')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(query);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: orders
  });
});

// @desc    Get order details
// @route   GET /api/admin/orders/:id
// @access  Private (Admin)
exports.getOrderDetails = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('buyer', 'fullName email phone address')
    .populate('farmer', 'fullName email phone farmName address')
    .populate('crop', 'name variety images qualityGrade')
    .populate('messages');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin)
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status, description } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  await order.updateStatus(status, description, req.user.id);

  // Create notifications
  const notifications = [
    Notification.createOrderNotification(order.buyer, order, status),
    Notification.createOrderNotification(order.farmer, order, status)
  ];
  await Promise.all(notifications);

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: order
  });
});

// @desc    Resolve dispute
// @route   PUT /api/admin/orders/:id/resolve-dispute
// @access  Private (Admin)
exports.resolveDispute = catchAsync(async (req, res, next) => {
  const { resolution, refundAmount, refundToBuyer } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (!order.disputeRaised) {
    return res.status(400).json({
      success: false,
      message: 'No dispute raised for this order'
    });
  }

  // Update dispute resolution
  order.disputeDetails.status = 'resolved';
  order.disputeDetails.resolution = resolution;
  order.disputeDetails.resolvedBy = req.user.id;
  order.disputeDetails.resolvedAt = new Date();

  if (refundToBuyer && refundAmount > 0) {
    // Process refund
    const PaymentService = require('../services/paymentService');
    await PaymentService.processRefund(order, refundAmount);
  }

  order.timeline.push({
    status: 'dispute_resolved',
    description: `Dispute resolved: ${resolution}`,
    timestamp: new Date(),
    updatedBy: req.user.id
  });

  await order.save();

  // Create notifications
  const notifications = [
    Notification.create({
      user: order.buyer,
      title: 'Dispute Resolved',
      message: `Your dispute for order ${order.orderId} has been resolved`,
      type: 'order_update',
      data: {
        orderId: order._id,
        resolution,
        actionUrl: `/orders/${order._id}`
      }
    }),
    Notification.create({
      user: order.farmer,
      title: 'Dispute Resolved',
      message: `Dispute for order ${order.orderId} has been resolved`,
      type: 'order_update',
      data: {
        orderId: order._id,
        resolution,
        actionUrl: `/orders/${order._id}`
      }
    })
  ];

  await Promise.all(notifications);

  res.status(200).json({
    success: true,
    message: 'Dispute resolved successfully',
    data: order
  });
});

// @desc    Get all prices
// @route   GET /api/admin/prices
// @access  Private (Admin)
exports.getAllPrices = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, cropName, district, state } = req.query;
  const skip = (page - 1) * limit;

  const query = {};

  if (cropName) query.cropName = cropName;
  if (district) query.district = district;
  if (state) query.state = state;

  const prices = await CropPrice.find(query)
    .sort('-lastUpdated')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await CropPrice.countDocuments(query);

  res.status(200).json({
    success: true,
    count: prices.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: prices
  });
});

// @desc    Create price
// @route   POST /api/admin/prices
// @access  Private (Admin)
exports.createPrice = catchAsync(async (req, res, next) => {
  const price = await CropPrice.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Price created successfully',
    data: price
  });
});

// @desc    Update price
// @route   PUT /api/admin/prices/:id
// @access  Private (Admin)
exports.updatePrice = catchAsync(async (req, res, next) => {
  const price = await CropPrice.findById(req.params.id);
  if (!price) {
    return res.status(404).json({
      success: false,
      message: 'Price not found'
    });
  }

  Object.assign(price, req.body);
  await price.save();

  // Emit price update
  const io = require('../server').io;
  io.emit('price-updated', {
    cropName: price.cropName,
    district: price.district,
    state: price.state,
    newPrice: price.currentPrice,
    change: price.priceChange,
    timestamp: new Date()
  });

  res.status(200).json({
    success: true,
    message: 'Price updated successfully',
    data: price
  });
});

// @desc    Delete price
// @route   DELETE /api/admin/prices/:id
// @access  Private (Admin)
exports.deletePrice = catchAsync(async (req, res, next) => {
  const price = await CropPrice.findById(req.params.id);
  if (!price) {
    return res.status(404).json({
      success: false,
      message: 'Price not found'
    });
  }

  await price.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Price deleted successfully'
  });
});

// @desc    Get all notifications
// @route   GET /api/admin/notifications
// @access  Private (Admin)
exports.getAllNotifications = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, type, status } = req.query;
  const skip = (page - 1) * limit;

  const query = {};

  if (type) query.type = type;
  if (status) query.status = status;

  const notifications = await Notification.find(query)
    .populate('user', 'fullName email role')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Notification.countDocuments(query);

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: notifications
  });
});

// @desc    Broadcast notification
// @route   POST /api/admin/notifications/broadcast
// @access  Private (Admin)
exports.broadcastNotification = catchAsync(async (req, res, next) => {
  const { title, message, type, targetUsers, channels } = req.body;

  let users;
  if (targetUsers === 'all') {
    users = await User.find({ isActive: true }).select('_id');
  } else if (targetUsers === 'farmers') {
    users = await User.find({ role: 'farmer', isActive: true }).select('_id');
  } else if (targetUsers === 'buyers') {
    users = await User.find({ role: 'buyer', isActive: true }).select('_id');
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid target users'
    });
  }

  // Create notifications
  const notificationPromises = users.map(user =>
    Notification.create({
      user: user._id,
      title,
      message,
      type: type || 'system',
      priority: 'high',
      data: {
        broadcast: true,
        actionUrl: '/notifications'
      }
    })
  );

  const notifications = await Promise.all(notificationPromises);

  // Send via selected channels
  const NotificationService = require('../utils/notificationService');
  const results = await NotificationService.sendBulkNotification(users, {
    title,
    message,
    type: type || 'system'
  });

  res.status(200).json({
    success: true,
    message: `Notification broadcast to ${users.length} users`,
    data: {
      notificationsSent: notifications.length,
      channelResults: results
    }
  });
});

// @desc    Get user analytics
// @route   GET /api/admin/analytics/users
// @access  Private (Admin)
exports.getUserAnalytics = catchAsync(async (req, res, next) => {
  const { period = 'month' } = req.query;

  let matchStage = {};
  const now = new Date();

  switch (period) {
    case 'day':
      matchStage.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
      break;
    case 'week':
      matchStage.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
      break;
    case 'month':
      matchStage.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
      break;
    case 'year':
      matchStage.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
      break;
  }

  const analytics = await User.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        totalUsers: { $sum: 1 },
        farmers: {
          $sum: { $cond: [{ $eq: ['$role', 'farmer'] }, 1, 0] }
        },
        buyers: {
          $sum: { $cond: [{ $eq: ['$role', 'buyer'] }, 1, 0] }
        },
        verifiedUsers: {
          $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get user demographics
  const demographics = await User.aggregate([
    {
      $group: {
        _id: '$address.state',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      analytics,
      demographics
    }
  });
});

// @desc    Get order analytics
// @route   GET /api/admin/analytics/orders
// @access  Private (Admin)
exports.getOrderAnalytics = catchAsync(async (req, res, next) => {
  const { period = 'month' } = req.query;

  let matchStage = {};
  const now = new Date();

  switch (period) {
    case 'day':
      matchStage.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
      break;
    case 'week':
      matchStage.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
      break;
    case 'month':
      matchStage.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
      break;
    case 'year':
      matchStage.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
      break;
  }

  const analytics = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        avgOrderValue: { $avg: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get order status distribution
  const statusDistribution = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get top crops by orders
  const topCrops = await Order.aggregate([
    {
      $group: {
        _id: '$cropName',
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
        quantity: { $sum: '$quantity' }
      }
    },
    { $sort: { orders: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      analytics,
      statusDistribution,
      topCrops
    }
  });
});

// @desc    Get revenue analytics
// @route   GET /api/admin/analytics/revenue
// @access  Private (Admin)
exports.getRevenueAnalytics = catchAsync(async (req, res, next) => {
  const { period = 'month' } = req.query;

  let matchStage = {
    status: 'delivered',
    paymentStatus: 'paid'
  };
  const now = new Date();

  switch (period) {
    case 'day':
      matchStage.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
      break;
    case 'week':
      matchStage.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
      break;
    case 'month':
      matchStage.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
      break;
    case 'year':
      matchStage.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
      break;
  }

  const revenueAnalytics = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
        platformFees: { $sum: '$platformFee' },
        avgOrderValue: { $avg: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get revenue by crop
  const revenueByCrop = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$cropName',
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
        marketShare: { $avg: 1 }
      }
    },
    {
      $addFields: {
        marketShare: {
          $multiply: [
            { $divide: ['$revenue', revenueAnalytics.reduce((sum, day) => sum + day.revenue, 0)] },
            100
          ]
        }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 }
  ]);

  // Get revenue by state
  const revenueByState = await Order.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'users',
        localField: 'farmer',
        foreignField: '_id',
        as: 'farmer'
      }
    },
    { $unwind: '$farmer' },
    {
      $group: {
        _id: '$farmer.address.state',
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      revenueAnalytics,
      revenueByCrop,
      revenueByState
    }
  });
});

// @desc    Get crop analytics
// @route   GET /api/admin/analytics/crops
// @access  Private (Admin)
exports.getCropAnalytics = catchAsync(async (req, res, next) => {
  const cropStats = await Crop.aggregate([
    {
      $group: {
        _id: '$name',
        totalListings: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalSold: { $sum: '$soldQuantity' },
        avgPrice: { $avg: '$pricePerUnit' },
        availableListings: {
          $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
        }
      }
    },
    { $sort: { totalListings: -1 } }
  ]);

  // Get price distribution by crop
  const priceDistribution = await Crop.aggregate([
    {
      $group: {
        _id: '$name',
        minPrice: { $min: '$pricePerUnit' },
        maxPrice: { $max: '$pricePerUnit' },
        avgPrice: { $avg: '$pricePerUnit' },
        stdDevPrice: { $stdDevPop: '$pricePerUnit' }
      }
    }
  ]);

  // Get crop popularity (views and favorites)
  const cropPopularity = await Crop.aggregate([
    {
      $group: {
        _id: '$name',
        totalViews: { $sum: '$views' },
        avgRating: { $avg: '$averageRating' },
        totalReviews: { $sum: '$totalReviews' }
      }
    },
    { $sort: { totalViews: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      cropStats,
      priceDistribution,
      cropPopularity
    }
  });
});

// @desc    Generate user report
// @route   GET /api/admin/reports/users
// @access  Private (Admin)
exports.generateUserReport = catchAsync(async (req, res, next) => {
  const { format = 'json', startDate, endDate } = req.query;

  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const users = await User.find(matchStage)
    .select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires')
    .populate({
      path: 'crops',
      select: 'name variety quantity pricePerUnit status'
    })
    .populate({
      path: 'orders',
      select: 'orderId totalAmount status'
    });

  if (format === 'csv') {
    // Convert to CSV
    const csvData = [
      ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Verified', 'Joined Date', 'Total Crops', 'Total Orders'],
      ...users.map(user => [
        user._id,
        user.fullName,
        user.email,
        user.phone,
        user.role,
        user.isActive ? 'Active' : 'Inactive',
        user.isVerified ? 'Yes' : 'No',
        user.createdAt.toISOString().split('T')[0],
        user.crops?.length || 0,
        user.orders?.length || 0
      ])
    ].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-report.csv');
    return res.send(csvData);
  }

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Generate order report
// @route   GET /api/admin/reports/orders
// @access  Private (Admin)
exports.generateOrderReport = catchAsync(async (req, res, next) => {
  const { format = 'json', startDate, endDate, status } = req.query;

  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  if (status) matchStage.status = status;

  const orders = await Order.find(matchStage)
    .populate('buyer', 'fullName email phone')
    .populate('farmer', 'fullName email phone farmName')
    .populate('crop', 'name variety')
    .sort('-createdAt');

  if (format === 'csv') {
    // Convert to CSV
    const csvData = [
      ['Order ID', 'Buyer', 'Farmer', 'Crop', 'Quantity', 'Total Amount', 'Status', 'Payment Status', 'Created Date'],
      ...orders.map(order => [
        order.orderId,
        order.buyer?.fullName || 'N/A',
        order.farmer?.fullName || 'N/A',
        `${order.crop?.name || 'N/A'} - ${order.crop?.variety || 'N/A'}`,
        `${order.quantity} ${order.unit}`,
        order.totalAmount,
        order.status,
        order.paymentStatus,
        order.createdAt.toISOString().split('T')[0]
      ])
    ].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders-report.csv');
    return res.send(csvData);
  }

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// @desc    Generate transaction report
// @route   GET /api/admin/reports/transactions
// @access  Private (Admin)
exports.generateTransactionReport = catchAsync(async (req, res, next) => {
  const { format = 'json', startDate, endDate } = req.query;

  const matchStage = {
    status: 'delivered',
    paymentStatus: 'paid'
  };

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const orders = await Order.find(matchStage)
    .populate('buyer', 'fullName email phone')
    .populate('farmer', 'fullName email phone farmName')
    .sort('-createdAt');

  // Get wallet transactions
  const wallets = await Wallet.find().populate('user', 'fullName email');
  const allTransactions = wallets.flatMap(wallet => 
    wallet.transactions.map(txn => ({
      ...txn.toObject(),
      user: wallet.user,
      walletId: wallet._id
    }))
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (format === 'csv') {
    // Convert to CSV - Orders
    const ordersCsv = [
      ['Order ID', 'Buyer', 'Farmer', 'Amount', 'Platform Fee', 'Farmer Receivable', 'Date'],
      ...orders.map(order => [
        order.orderId,
        order.buyer?.fullName || 'N/A',
        order.farmer?.fullName || 'N/A',
        order.totalAmount,
        order.platformFee,
        order.totalAmount - order.platformFee,
        order.createdAt.toISOString().split('T')[0]
      ])
    ].map(row => row.join(',')).join('\n');

    // Convert to CSV - Wallet Transactions
    const transactionsCsv = [
      ['Transaction ID', 'User', 'Type', 'Amount', 'Description', 'Status', 'Date'],
      ...allTransactions.map(txn => [
        txn.transactionId,
        txn.user?.fullName || 'N/A',
        txn.type,
        txn.amount,
        txn.description,
        txn.status,
        txn.createdAt.toISOString().split('T')[0]
      ])
    ].map(row => row.join(',')).join('\n');

    const combinedCsv = `ORDERS REPORT\n${ordersCsv}\n\nWALLET TRANSACTIONS REPORT\n${transactionsCsv}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions-report.csv');
    return res.send(combinedCsv);
  }

  res.status(200).json({
    success: true,
    data: {
      orders: {
        count: orders.length,
        totalAmount: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        totalPlatformFees: orders.reduce((sum, order) => sum + order.platformFee, 0),
        items: orders
      },
      transactions: {
        count: allTransactions.length,
        items: allTransactions
      }
    }
  });
});

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private (Admin)
exports.getSystemSettings = catchAsync(async (req, res, next) => {
  // In production, this would come from a database
  const settings = {
    platform: {
      name: 'Farmer Marketplace',
      commissionRate: 1, // 1%
      minCommission: 10, // ₹10
      maxCommission: 100, // ₹100
      currency: 'INR',
      timezone: 'Asia/Kolkata'
    },
    notifications: {
      priceUpdateInterval: 3600, // 1 hour in seconds
      maxPriceAlertsPerUser: 10,
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true
    },
    payments: {
      razorpayEnabled: true,
      walletEnabled: true,
      withdrawalEnabled: true,
      minWithdrawalAmount: 100, // ₹100
      maxWithdrawalAmount: 50000, // ₹50,000
      withdrawalProcessingDays: 2
    },
    security: {
      maxLoginAttempts: 5,
      lockoutDuration: 900, // 15 minutes in seconds
      sessionTimeout: 86400, // 24 hours in seconds
      require2FA: false
    }
  };

  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
exports.updateSystemSettings = catchAsync(async (req, res, next) => {
  const settings = req.body;

  // In production, this would save to a database
  // For now, we'll just return the updated settings

  res.status(200).json({
    success: true,
    message: 'System settings updated successfully',
    data: settings
  });
});

// @desc    Update batch prices
// @route   POST /api/admin/prices/update-batch
// @access  Private (Admin)
exports.updateBatchPrices = catchAsync(async (req, res, next) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Updates array is required'
    });
  }

  const results = await Promise.allSettled(
    updates.map(async (update) => {
      try {
        const price = await CropPrice.findOne({
          cropName: update.cropName,
          district: update.district,
          state: update.state
        });

        if (!price) {
          return {
            success: false,
            cropName: update.cropName,
            district: update.district,
            state: update.state,
            message: 'Price not found'
          };
        }

        // Save current price to history
        const PriceHistory = require('../models/PriceHistory');
        await PriceHistory.create({
          priceId: price._id,
          price: price.currentPrice,
          volume: price.totalVolume,
          date: new Date()
        });

        // Update price
        price.previousPrice = price.currentPrice;
        price.currentPrice = update.newPrice;
        price.lastUpdated = new Date();
        await price.save();

        return {
          success: true,
          cropName: update.cropName,
          district: update.district,
          state: update.state,
          oldPrice: price.previousPrice,
          newPrice: price.currentPrice
        };
      } catch (error) {
        return {
          success: false,
          cropName: update.cropName,
          district: update.district,
          state: update.state,
          message: error.message
        };
      }
    })
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
  const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);

  // Emit price updates
  const io = require('../server').io;
  successful.forEach(result => {
    if (result.value) {
      io.emit('price-updated', {
        cropName: result.value.cropName,
        district: result.value.district,
        state: result.value.state,
        newPrice: result.value.newPrice,
        oldPrice: result.value.oldPrice,
        timestamp: new Date()
      });
    }
  });

  res.status(200).json({
    success: true,
    message: `Updated ${successful.length} prices, ${failed.length} failed`,
    data: {
      successful,
      failed
    }
  });
});

// @desc    Get platform metrics
// @route   GET /api/admin/metrics
// @access  Private (Admin)
exports.getPlatformMetrics = catchAsync(async (req, res, next) => {
  const metrics = await Promise.all([
    // Total platform value
    Order.aggregate([
      { $match: { status: 'delivered', paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    
    // Active users this month
    User.countDocuments({
      isActive: true,
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }),
    
    // Conversion rate (orders per active user)
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: '$buyer', count: { $sum: 1 } } },
      { $group: { _id: null, avgOrders: { $avg: '$count' } } }
    ]),
    
    // Average transaction value
    Order.aggregate([
      { $match: { status: 'delivered', paymentStatus: 'paid' } },
      { $group: { _id: null, avgValue: { $avg: '$totalAmount' } } }
    ]),
    
    // Customer satisfaction (based on ratings)
    User.aggregate([
      { $match: { rating: { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalPlatformValue: metrics[0][0]?.total || 0,
      activeUsers: metrics[1],
      conversionRate: metrics[2][0]?.avgOrders || 0,
      avgTransactionValue: metrics[3][0]?.avgValue || 0,
      customerSatisfaction: metrics[4][0]?.avgRating || 0
    }
  });
});