const Order = require('../models/Order');
const Crop = require('../models/Crop');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Wallet = require('../models/Wallet');
const { catchAsync } = require('../middleware/error');
const { sendBuyerConfirmationEmail,sendFarmerNotificationEmail } = require('../templates/Order_Email/orderHelper');

exports.createOrder = catchAsync(async (req, res, next) => {

  const { cropId, quantity, deliveryType, deliveryAddress, specialInstructions } = req.body;

  if (!cropId || !quantity) {
    return res.status(400).json({
      success: false,
      message: 'Crop ID and quantity are required'
    });
  }

  const crop = await Crop.findById(cropId);
  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }

  // Check availability
  if (crop.availableQuantity < quantity) {
    return res.status(400).json({
      success: false,
      message: `Insufficient stock. Only ${crop.availableQuantity} ${crop.unit} available`
    });
  }

  // Check if buyer is trying to buy their own crop
  if (crop.farmer.toString() === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot buy your own crop'
    });
  }

  // Get buyer and farmer details for email
  const buyer = await User.findById(req.user.id).select('fullName email phone');
  const farmer = await User.findById(crop.farmer).select('fullName email farmName phone');
  
  if (!buyer || !farmer) {
    return res.status(404).json({
      success: false,
      message: 'Buyer or farmer not found'
    });
  }

 
  // Calculate prices
  const subtotal = quantity * crop.pricePerUnit;
  const discount = (subtotal * crop.discount) / 100;
  const discountedAmount = subtotal - discount;
  const gstAmount = (discountedAmount * crop.gstPercentage) / 100;
  const platformFee = Math.max(10, discountedAmount * 0.01); // 1% or ₹10, whichever is higher
  const shippingCost = deliveryType === 'delivery' ? 50 : 0;
  const totalAmount = discountedAmount + gstAmount + platformFee + shippingCost;


  // ✅ FIX: Clean up delivery address to avoid geospatial errors
  let cleanDeliveryAddress = null;
  if (deliveryAddress) {
    // Create a clean copy without problematic coordinates
    cleanDeliveryAddress = {
      street: deliveryAddress.street,
      city: deliveryAddress.city,
      district: deliveryAddress.district,
      state: deliveryAddress.state,
      pincode: deliveryAddress.pincode
    };
    
    // Only include coordinates if they're valid
    if (deliveryAddress.coordinates && 
        deliveryAddress.coordinates.coordinates && 
        deliveryAddress.coordinates.coordinates.length === 2) {
      cleanDeliveryAddress.coordinates = deliveryAddress.coordinates;
    }
  } else if (req.user.address) {
    cleanDeliveryAddress = req.user.address;
  }


  // Create order
  const order = await Order.create({
    buyer: req.user.id,
    farmer: crop.farmer,
    crop: crop._id,
    cropName: crop.name,
    variety: crop.variety,
    quantity,
    unit: crop.unit,
    pricePerUnit: crop.pricePerUnit,
    subtotal,
    discount,
    gstPercentage: crop.gstPercentage,
    gstAmount,
    shippingCost,
    platformFee,
    totalAmount,
    amountDue: totalAmount,
    deliveryType,
    deliveryAddress: cleanDeliveryAddress,
    pickupAddress: `${crop.location.district || 'Unknown'}, ${crop.location.state || 'Unknown'}`,
    specialInstructions: specialInstructions || '',
    status: 'pending'
  });


  // Update crop quantity
  crop.reservedQuantity += quantity;
  crop.availableQuantity -= quantity;
  await crop.save();


  // ✅ SEND EMAILS TO BOTH BUYER AND FARMER
  try {
        await sendBuyerConfirmationEmail(order, buyer, farmer, crop);
        await sendFarmerNotificationEmail(order, buyer, farmer, crop);

  } catch (emailError) {
    console.error('⚠️ Email sending failed (but order was created):', emailError.message);
   
  }

  // Create notifications in database
  await Notification.createOrderNotification(req.user.id, order, 'pending');
  await Notification.createOrderNotification(crop.farmer, order, 'pending');


  // Emit real-time update (if you have Socket.IO)
  try {
    const io = require('../server').io;
    if (io) {
      io.to(`user-${crop.farmer}`).emit('new-order', {
        orderId: order._id,
        orderNumber: order.orderId,
        cropName: crop.name,
        quantity,
        totalAmount,
        buyerName: buyer.fullName
      });
      console.log('✅ Real-time notification sent');
    }
  } catch (socketError) {
    console.error('Socket.IO error:', socketError.message);
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { 
      order: {
        _id: order._id,
        orderId: order.orderId,
        cropName: order.cropName,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      }
    }
  });
});

exports.getMyOrders = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  const query = { buyer: req.user.id };
  if (status) query.status = status;

  const orders = await Order.find(query)
    .populate('farmer', 'fullName farmName phone profileImage')
    .populate('crop', 'name variety images')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(query);

  // Calculate order statistics
  const stats = await Order.getOrderStatistics(req.user.id, 'buyer');

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    stats,
    data: orders
  });
});

exports.getFarmerOrders = catchAsync(async (req, res, next) => {

  if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
    console.log('❌ Access denied: User is not a farmer');
    return res.status(403).json({
      success: false,
      message: 'Only farmers can access farmer orders'
    });
  }

  try {
    const orders = await Order.find({ farmer: req.user.id })
      .populate('buyer', 'fullName phone email profileImage')
      .populate('crop', 'name variety images pricePerUnit')
      .sort('-createdAt');

    console.log(`✅ Found ${orders.length} orders for farmer`);

    // ✅ Simple statistics calculate करें
    let stats = {
      totalOrders: orders.length,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      totalSpending: 0,
      averageOrderValue: 0
    };

    orders.forEach(order => {
      if (order.status === 'pending') stats.pendingOrders++;
      if (order.status === 'delivered') {
        stats.completedOrders++;
        stats.totalRevenue += order.totalAmount;
      }
      if (order.status === 'cancelled') stats.cancelledOrders++;
      
      stats.totalSpending += order.totalAmount;
    });

    if (stats.totalOrders > 0) {
      stats.averageOrderValue = stats.totalSpending / stats.totalOrders;
    }

    console.log('📊 Statistics:', stats);

    res.status(200).json({
      success: true,
      count: orders.length,
      stats,
      data: orders
    });

  } catch (error) {
    console.error('❌ Error fetching farmer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch farmer orders',
      error: error.message
    });
  }
});

exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('buyer', 'fullName phone email profileImage')
    .populate('farmer', 'fullName phone email farmName profileImage')
    .populate('crop', 'name variety images qualityGrade')
    .populate('messages');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if user has access to this order
  if (
    order.buyer._id.toString() !== req.user.id &&
    order.farmer._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this order'
    });
  }

  res.status(200).json({
    success: true,
    data: order
  });
});


exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status, description } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check authorization
  if (
    order.farmer.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this order'
    });
  }

  // Update order status
  await order.updateStatus(status, description, req.user.id);

  // If order is delivered, update crop sold quantity
  if (status === 'delivered') {
    const crop = await Crop.findById(order.crop);
    if (crop) {
      crop.reservedQuantity -= order.quantity;
      crop.soldQuantity += order.quantity;
      await crop.save();
    }

    // Release payment to farmer
    await releasePaymentToFarmer(order);
  }

  // Create notification for buyer
  await Notification.createOrderNotification(order.buyer, order, status);

  // Emit real-time update
  const io = require('../server').io;
  io.to(`user-${order.buyer}`).emit('order-status-updated', {
    orderId: order._id,
    status,
    message: description || `Order status updated to ${status}`
  });

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: order
  });
});

exports.cancelOrder = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
  if (
    order.buyer.toString() !== req.user.id &&
    order.farmer.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this order'
    });
  }

  // Check if order can be cancelled
  if (!['pending', 'confirmed'].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: `Order cannot be cancelled in ${order.status} status`
    });
  }

  // Update order
  order.status = 'cancelled';
  order.cancellationReason = reason;
  order.cancellationNotes = `Cancelled by ${req.user.role} on ${new Date().toISOString()}`;

  // Update timeline
  order.timeline.push({
    status: 'cancelled',
    description: `Order cancelled: ${reason}`,
    timestamp: new Date(),
    updatedBy: req.user.id
  });

  await order.save();

  // Update crop quantity
  const crop = await Crop.findById(order.crop);
  if (crop) {
    crop.reservedQuantity -= order.quantity;
    crop.availableQuantity += order.quantity;
    await crop.save();
  }

  // Refund payment if already paid
  if (order.paymentStatus === 'paid') {
    await processRefund(order);
  }

  // Create notifications
  const notifications = [
    Notification.createOrderNotification(order.buyer, order, 'cancelled'),
    Notification.createOrderNotification(order.farmer, order, 'cancelled')
  ];
  await Promise.all(notifications);

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
});


exports.requestReturn = catchAsync(async (req, res, next) => {
  const { reason, description } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check authorization
  if (order.buyer.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to request return for this order'
    });
  }

  // Check if return can be requested
  if (order.status !== 'delivered') {
    return res.status(400).json({
      success: false,
      message: 'Return can only be requested for delivered orders'
    });
  }

  if (order.returnStatus === 'requested' || order.returnStatus === 'approved') {
    return res.status(400).json({
      success: false,
      message: 'Return already requested or approved'
    });
  }

  // Update order
  order.returnReason = reason;
  order.returnStatus = 'requested';
  
  order.timeline.push({
    status: 'return_requested',
    description: `Return requested: ${description || reason}`,
    timestamp: new Date(),
    updatedBy: req.user.id
  });

  await order.save();

  // Create notification for farmer
  await Notification.create({
    user: order.farmer,
    title: 'Return Requested',
    message: `Buyer has requested return for order ${order.orderId}`,
    type: 'order_update',
    data: {
      orderId: order._id,
      orderNumber: order.orderId,
      reason,
      actionUrl: `/orders/${order._id}`
    }
  });

  res.status(200).json({
    success: true,
    message: 'Return requested successfully',
    data: order
  });
});


exports.raiseDispute = catchAsync(async (req, res, next) => {
  const { reason, description } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check authorization
  if (
    order.buyer.toString() !== req.user.id &&
    order.farmer.toString() !== req.user.id
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to raise dispute for this order'
    });
  }

  // Check if dispute can be raised
  if (order.disputeRaised) {
    return res.status(400).json({
      success: false,
      message: 'Dispute already raised for this order'
    });
  }

  // Update order
  order.disputeRaised = true;
  order.disputeDetails = {
    reason,
    description,
    raisedBy: req.user.id,
    raisedAt: new Date(),
    status: 'open'
  };

  order.timeline.push({
    status: 'dispute_raised',
    description: `Dispute raised: ${reason}`,
    timestamp: new Date(),
    updatedBy: req.user.id
  });

  await order.save();

  // Create notification for admin
  const admin = await User.findOne({ role: 'admin' });
  if (admin) {
    await Notification.create({
      user: admin._id,
      title: 'New Dispute Raised',
      message: `A dispute has been raised for order ${order.orderId}`,
      type: 'system',
      priority: 'high',
      data: {
        orderId: order._id,
        orderNumber: order.orderId,
        raisedBy: req.user.id,
        reason,
        actionUrl: `/admin/orders/${order._id}`
      }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Dispute raised successfully',
    data: order
  });
});

exports.updateTracking = catchAsync(async (req, res, next) => {
  const { trackingNumber, carrier, trackingUrl } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check authorization
  if (
    order.farmer.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update tracking for this order'
    });
  }

  // Update tracking information
  order.trackingNumber = trackingNumber;
  order.carrier = carrier;
  order.trackingUrl = trackingUrl;

  if (order.status === 'confirmed' || order.status === 'processing') {
    order.status = 'shipped';
    order.timeline.push({
      status: 'shipped',
      description: 'Order shipped with tracking',
      timestamp: new Date(),
      updatedBy: req.user.id
    });
  }

  await order.save();

  // Create notification for buyer
  await Notification.createOrderNotification(order.buyer, order, 'shipped');

  res.status(200).json({
    success: true,
    message: 'Tracking information updated successfully',
    data: order
  });
});


exports.getAllOrders = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, ...filters } = req.query;
  const skip = (page - 1) * limit;

  const query = {};

  // Apply filters
  if (filters.status) query.status = filters.status;
  if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }
  if (filters.buyerId) query.buyer = filters.buyerId;
  if (filters.farmerId) query.farmer = filters.farmerId;
  if (filters.cropName) query.cropName = filters.cropName;
  if (filters.minAmount || filters.maxAmount) {
    query.totalAmount = {};
    if (filters.minAmount) query.totalAmount.$gte = parseFloat(filters.minAmount);
    if (filters.maxAmount) query.totalAmount.$lte = parseFloat(filters.maxAmount);
  }

  const orders = await Order.find(query)
    .populate('buyer', 'fullName email phone')
    .populate('farmer', 'fullName email phone farmName')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(query);

  // Calculate statistics
  const stats = await Order.aggregate([
    {
      $facet: {
        totalOrders: [{ $count: 'count' }],
        totalRevenue: [
          { $match: { status: 'delivered' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ],
        pendingOrders: [
          { $match: { status: 'pending' } },
          { $count: 'count' }
        ],
        disputeOrders: [
          { $match: { disputeRaised: true } },
          { $count: 'count' }
        ],
        dailyOrders: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              revenue: { $sum: '$totalAmount' }
            }
          },
          { $sort: { _id: -1 } },
          { $limit: 7 }
        ]
      }
    }
  ]);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    stats: stats[0],
    data: orders
  });
});

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
    await processRefund(order, refundAmount);
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


exports.getOrderStatistics = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const role = req.user.role;

  const stats = await Order.getOrderStatistics(userId, role);

  // Get additional statistics based on role
  if (role === 'farmer') {
    // Get top crops by revenue
    const topCrops = await Order.aggregate([
      { $match: { farmer: req.user._id, status: 'delivered' } },
      {
        $group: {
          _id: '$cropName',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    stats.topCrops = topCrops;
  } else if (role === 'buyer') {
    // Get spending by crop
    const spendingByCrop = await Order.aggregate([
      { $match: { buyer: req.user._id, status: 'delivered' } },
      {
        $group: {
          _id: '$cropName',
          totalSpent: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          avgPrice: { $avg: '$pricePerUnit' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 }
    ]);

    stats.spendingByCrop = spendingByCrop;
  }

  res.status(200).json({
    success: true,
    data: stats
  });
});

// Helper function to release payment to farmer
async function releasePaymentToFarmer(order) {
  try {
    // Find farmer's wallet
    const farmerWallet = await Wallet.findOne({ user: order.farmer });
    if (!farmerWallet) {
      console.error('Farmer wallet not found');
      return;
    }

    // Calculate amount to release (deduct platform fee)
    const platformFee = order.platformFee;
    const amountToRelease = order.totalAmount - platformFee;

    // Add transaction to farmer's wallet
    await farmerWallet.addTransaction({
      type: 'credit',
      amount: amountToRelease,
      description: `Payment for order ${order.orderId}`,
      reference: `ORDER-${order.orderId}`,
      orderId: order._id,
      status: 'completed'
    });

    // Create notification for farmer
    await Notification.create({
      user: order.farmer,
      title: 'Payment Released',
      message: `₹${amountToRelease} has been released to your wallet for order ${order.orderId}`,
      type: 'payment',
      data: {
        orderId: order._id,
        amount: amountToRelease,
        actionUrl: `/wallet`
      }
    });

    // Update order payment status
    order.paymentStatus = 'paid';
    order.amountPaid = order.totalAmount;
    order.amountDue = 0;
    await order.save();
  } catch (error) {
    console.error('Error releasing payment to farmer:', error);
  }
}

// Helper function to process refund
async function processRefund(order, refundAmount = null) {
  try {
    const amountToRefund = refundAmount || order.amountPaid;
    
    // Find buyer's wallet
    const buyerWallet = await Wallet.findOne({ user: order.buyer });
    if (!buyerWallet) {
      console.error('Buyer wallet not found');
      return;
    }

    // Add refund transaction to buyer's wallet
    await buyerWallet.addTransaction({
      type: 'credit',
      amount: amountToRefund,
      description: `Refund for order ${order.orderId}`,
      reference: `REFUND-${order.orderId}`,
      orderId: order._id,
      status: 'completed'
    });

    // Create notification for buyer
    await Notification.create({
      user: order.buyer,
      title: 'Refund Processed',
      message: `₹${amountToRefund} has been refunded to your wallet for order ${order.orderId}`,
      type: 'payment',
      data: {
        orderId: order._id,
        amount: amountToRefund,
        actionUrl: `/wallet`
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
  }
}