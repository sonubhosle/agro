const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { queryValidation } = require('../middleware/validation');

// All notification routes require authentication
router.use(protect);
router.get('/unread-count', notificationController.getUnreadCount);
router.get('/preferences', notificationController.getNotificationPreferences);
// Price alert routes
router.post('/price-alerts', 
  notificationController.createPriceAlert
);
// Get notification statistics
router.get('/statistics', 
  notificationController.getNotificationStatistics
);
router.get('/price-alerts', 
  notificationController.getPriceAlerts
);

// Get user notifications
router.get('/', 
  validate(queryValidation.pagination), 
  notificationController.getNotifications
);

// Get notification by ID
router.get('/:id', 
  notificationController.getNotification
);

// Mark notification as read
router.put('/:id/read', 
  notificationController.markAsRead
);

// Mark all notifications as read
router.put('/mark-all-read', 
  notificationController.markAllAsRead
);

// Delete notification
router.delete('/:id', 
  notificationController.deleteNotification
);



// Delete all notifications
router.delete('/', 
  notificationController.deleteAllNotifications
);

// Update notification preferences
router.put('/preferences', 
  notificationController.updateNotificationPreferences
);

// Send test notification
router.post('/test', 
  notificationController.sendTestNotification
);




router.put('/price-alerts/:id', 
  notificationController.updatePriceAlert
);

router.delete('/price-alerts/:id', 
  notificationController.deletePriceAlert
);

module.exports = router;