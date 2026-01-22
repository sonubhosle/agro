const Notification = require('../models/Notification');
const User = require('../models/User');
const PriceAlert = require('../models/PriceAlert');
const { catchAsync } = require('../middleware/error');

// Get all notifications (without pagination)
exports.getNotifications = catchAsync(async (req, res, next) => {
  const { unread, type, priority, sort = '-createdAt' } = req.query;

  const query = { user: req.user.id };
  
  if (unread === 'true') {
    query['channels.inApp.read'] = false;
  }
  
  if (type) {
    query.type = type;
  }
  
  if (priority) {
    query.priority = priority;
  }

  const notifications = await Notification.find(query)
    .sort(sort)
    .lean();

  const unreadCount = await Notification.countDocuments({
    user: req.user.id,
    'channels.inApp.read': false
  });

  // Transform data for cleaner response
  const transformedNotifications = notifications.map(notification => ({
    id: notification._id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    data: notification.data,
    read: notification.channels.inApp.read,
    createdAt: notification.createdAt,
    expiresAt: notification.expiresAt
  }));

  res.status(200).json({
    success: true,
    count: notifications.length,
    unreadCount,
    data: transformedNotifications
  });
});

// Get unread notifications count only (for badge)
exports.getUnreadCount = catchAsync(async (req, res, next) => {
  const unreadCount = await Notification.countDocuments({
    user: req.user.id,
    'channels.inApp.read': false
  });

  res.status(200).json({
    success: true,
    unreadCount
  });
});

// Get single notification
exports.getNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  // Check if user owns this notification
  if (notification.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this notification'
    });
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

// Mark single notification as read
exports.markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  // Check if user owns this notification
  if (notification.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this notification'
    });
  }

  await notification.markAsRead();

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

// Mark multiple notifications as read
exports.batchMarkAsRead = catchAsync(async (req, res, next) => {
  const { notificationIds } = req.body;

  if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of notification IDs'
    });
  }

  await Notification.updateMany(
    {
      _id: { $in: notificationIds },
      user: req.user.id
    },
    {
      $set: {
        'channels.inApp.read': true,
        'channels.inApp.readAt': new Date()
      }
    }
  );

  res.status(200).json({
    success: true,
    message: 'Notifications marked as read'
  });
});

// Mark all notifications as read
exports.markAllAsRead = catchAsync(async (req, res, next) => {
  await Notification.updateMany(
    {
      user: req.user.id,
      'channels.inApp.read': false
    },
    {
      $set: {
        'channels.inApp.read': true,
        'channels.inApp.readAt': new Date()
      }
    }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// Delete single notification
exports.deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  // Check if user owns this notification
  if (notification.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this notification'
    });
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// Delete all notifications
exports.deleteAllNotifications = catchAsync(async (req, res, next) => {
  await Notification.deleteMany({ user: req.user.id });

  res.status(200).json({
    success: true,
    message: 'All notifications deleted successfully'
  });
});

// Get notification preferences
exports.getNotificationPreferences = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('notificationPreferences');

  res.status(200).json({
    success: true,
    data: {
      notificationPreferences: user.notificationPreferences
    }
  });
});

// Update notification preferences
exports.updateNotificationPreferences = catchAsync(async (req, res, next) => {
  const { notificationPreferences } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { notificationPreferences },
    { new: true, runValidators: true }
  ).select('notificationPreferences');

  res.status(200).json({
    success: true,
    message: 'Notification preferences updated successfully',
    data: {
      notificationPreferences: user.notificationPreferences
    }
  });
});

// Send test notification
exports.sendTestNotification = catchAsync(async (req, res, next) => {
  const { type, channel } = req.body;

  const notification = new Notification({
    user: req.user.id,
    title: 'Test Notification',
    message: 'This is a test notification to verify your settings.',
    type: type || 'system',
    priority: 'medium',
    data: {
      actionUrl: '/notifications',
      test: true
    }
  });

  await notification.save();

  // Send notification through selected channel
  if (channel === 'inApp') {
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${req.user.id}`).emit('new-notification', {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data,
        createdAt: notification.createdAt
      });
    }

    notification.channels.inApp.sent = true;
  } else if (channel === 'email') {
    const EmailService = require('../utils/emailService');
    await EmailService.sendEmail(
      req.user.email,
      'Test Notification',
      'generic',
      {
        name: req.user.fullName,
        title: notification.title,
        message: notification.message
      }
    );
    notification.channels.email.sent = true;
  }

  await notification.save();

  res.status(200).json({
    success: true,
    message: 'Test notification sent successfully',
    data: { notification }
  });
});

// Get notification statistics
exports.getNotificationStatistics = catchAsync(async (req, res, next) => {
  const stats = await Notification.aggregate([
    {
      $match: { user: req.user._id }
    },
    {
      $facet: {
        totalNotifications: [{ $count: 'count' }],
        unreadNotifications: [
          { $match: { 'channels.inApp.read': false } },
          { $count: 'count' }
        ],
        byType: [
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 }
            }
          }
        ],
        byChannel: [
          {
            $project: {
              email: { $cond: [{ $eq: ['$channels.email.sent', true] }, 1, 0] },
              sms: { $cond: [{ $eq: ['$channels.sms.sent', true] }, 1, 0] },
              push: { $cond: [{ $eq: ['$channels.push.sent', true] }, 1, 0] }
            }
          },
          {
            $group: {
              _id: null,
              email: { $sum: '$email' },
              sms: { $sum: '$sms' },
              push: { $sum: '$push' }
            }
          }
        ],
        recentActivity: [
          { $sort: { createdAt: -1 } },
          {
            $project: {
              title: 1,
              type: 1,
              createdAt: 1,
              read: '$channels.inApp.read'
            }
          }
        ]
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: stats[0]
  });
});

// Send notification to specific channels (admin/automated)
exports.sendNotification = catchAsync(async (req, res, next) => {
  const { userId, title, message, type, priority, data, channels = ['inApp'] } = req.body;

  // Only admin can send notifications to other users
  if (userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to send notifications to other users'
    });
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check user's notification preferences
  const preferences = user.notificationPreferences || {};
  const channelsToSend = channels.filter(channel => {
    const channelPref = preferences[`${channel}Notifications`];
    return channelPref === undefined || channelPref === true;
  });

  const notification = new Notification({
    user: userId,
    title,
    message,
    type: type || 'system',
    priority: priority || 'medium',
    data: data || {},
    channels: {
      inApp: { sent: channelsToSend.includes('inApp') },
      email: { sent: channelsToSend.includes('email') },
      sms: { sent: channelsToSend.includes('sms') },
      push: { sent: channelsToSend.includes('push') }
    }
  });

  await notification.save();

  // Send through selected channels
  const sentChannels = [];
  
  for (const channel of channelsToSend) {
    try {
      switch (channel) {
        case 'inApp':
          const io = req.app.get('io');
          if (io) {
            io.to(`user-${userId}`).emit('new-notification', {
              id: notification._id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              data: notification.data,
              createdAt: notification.createdAt
            });
          }
          break;
          
        case 'email':
          const EmailService = require('../utils/emailService');
          await EmailService.sendEmail(
            user.email,
            title,
            'generic',
            {
              name: user.fullName,
              title: notification.title,
              message: notification.message,
              actionUrl: data?.actionUrl
            }
          );
          break;
          
        case 'sms':
          // Add SMS service integration here
          // await SMSService.sendSMS(user.phone, message);
          break;
          
        case 'push':
          // Add push notification service integration here
          // await PushService.sendPush(user.pushToken, title, message);
          break;
      }
      sentChannels.push(channel);
    } catch (error) {
      console.error(`Failed to send notification via ${channel}:`, error);
    }
  }

  // Update notification with sent channels
  notification.channels.inApp.sent = sentChannels.includes('inApp');
  notification.channels.email.sent = sentChannels.includes('email');
  notification.channels.sms.sent = sentChannels.includes('sms');
  notification.channels.push.sent = sentChannels.includes('push');
  
  await notification.save();

  res.status(200).json({
    success: true,
    message: 'Notification sent successfully',
    data: {
      notification,
      sentChannels
    }
  });
});

// Price Alert Management

// Create price alert
exports.createPriceAlert = catchAsync(async (req, res, next) => {
  const { cropName, district, state, threshold, direction } = req.body;

  // Check if price alert already exists
  const existingAlert = await PriceAlert.findOne({
    user: req.user.id,
    cropName,
    district,
    state
  });

  if (existingAlert) {
    return res.status(400).json({
      success: false,
      message: 'Price alert already exists for this crop and location'
    });
  }

  const priceAlert = await PriceAlert.create({
    user: req.user.id,
    cropName,
    district,
    state,
    threshold,
    direction,
    isActive: true
  });

  res.status(201).json({
    success: true,
    message: 'Price alert created successfully',
    data: { priceAlert }
  });
});

// Get all price alerts
exports.getPriceAlerts = catchAsync(async (req, res, next) => {
  const priceAlerts = await PriceAlert.find({ user: req.user.id }).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: priceAlerts.length,
    data: priceAlerts
  });
});

// Update price alert
exports.updatePriceAlert = catchAsync(async (req, res, next) => {
  const { threshold, direction, isActive } = req.body;

  const priceAlert = await PriceAlert.findById(req.params.id);

  if (!priceAlert) {
    return res.status(404).json({
      success: false,
      message: 'Price alert not found'
    });
  }

  // Check if user owns this alert
  if (priceAlert.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this price alert'
    });
  }

  if (threshold !== undefined) priceAlert.threshold = threshold;
  if (direction !== undefined) priceAlert.direction = direction;
  if (isActive !== undefined) priceAlert.isActive = isActive;

  await priceAlert.save();

  res.status(200).json({
    success: true,
    message: 'Price alert updated successfully',
    data: { priceAlert }
  });
});

// Delete price alert
exports.deletePriceAlert = catchAsync(async (req, res, next) => {
  const priceAlert = await PriceAlert.findById(req.params.id);

  if (!priceAlert) {
    return res.status(404).json({
      success: false,
      message: 'Price alert not found'
    });
  }

  // Check if user owns this alert
  if (priceAlert.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this price alert'
    });
  }

  await priceAlert.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Price alert deleted successfully'
  });
});