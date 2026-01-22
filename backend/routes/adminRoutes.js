const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const { validate } = require('../middleware/validation');
const { queryValidation } = require('../middleware/validation');

// All admin routes require admin role
router.use(protect, restrictTo('admin'));

// Dashboard statistics
router.get('/dashboard/stats', 
  adminController.getDashboardStats
);

// User Management
router.get('/users', 
  validate(queryValidation.pagination), 
  validate(queryValidation.filter), 
  adminController.getAllUsers
);

router.get('/users/:id', 
  adminController.getUserDetails
);

router.put('/users/:id/verify', 
  adminController.verifyUser
);

router.put('/users/:id/status', 
  adminController.updateUserStatus
);

router.delete('/users/:id', 
  adminController.deleteUser
);

// Crop Management
router.get('/crops', 
  validate(queryValidation.pagination), 
  validate(queryValidation.filter), 
  adminController.getAllCrops
);

router.put('/crops/:id/status', 
  adminController.updateCropStatus
);

router.delete('/crops/:id', 
  adminController.deleteCrop
);

// Order Management
router.get('/orders', 
  validate(queryValidation.pagination), 
  validate(queryValidation.filter), 
  adminController.getAllOrders
);

router.get('/orders/:id', 
  adminController.getOrderDetails
);

router.put('/orders/:id/status', 
  adminController.updateOrderStatus
);

router.put('/orders/:id/resolve-dispute', 
  adminController.resolveDispute
);

// Price Management
router.get('/prices', 
  validate(queryValidation.pagination), 
  validate(queryValidation.filter), 
  adminController.getAllPrices
);

router.post('/prices', 
  adminController.createPrice
);

router.put('/prices/:id', 
  adminController.updatePrice
);

router.delete('/prices/:id', 
  adminController.deletePrice
);

// Notification Management
router.get('/notifications', 
  validate(queryValidation.pagination), 
  adminController.getAllNotifications
);

router.post('/notifications/broadcast', 
  adminController.broadcastNotification
);

// Analytics
router.get('/analytics/users', 
  adminController.getUserAnalytics
);

router.get('/analytics/orders', 
  adminController.getOrderAnalytics
);

router.get('/analytics/revenue', 
  adminController.getRevenueAnalytics
);

router.get('/analytics/crops', 
  adminController.getCropAnalytics
);

// Reports
router.get('/reports/users', 
  adminController.generateUserReport
);

router.get('/reports/orders', 
  adminController.generateOrderReport
);

router.get('/reports/transactions', 
  adminController.generateTransactionReport
);

// System Settings
router.get('/settings', 
  adminController.getSystemSettings
);

router.put('/settings', 
  adminController.updateSystemSettings
);

// Price Update
router.post('/prices/update-batch', 
  adminController.updateBatchPrices
);

// Platform Metrics
router.get('/metrics', 
  adminController.getPlatformMetrics
);

module.exports = router;