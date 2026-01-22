const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { orderValidation, queryValidation } = require('../middleware/validation');

// Protected routes
router.use(protect);

// Buyer routes
router.post('/', 
  validate(orderValidation.create), 
  orderController.createOrder
);

router.get('/buyer/my-orders', 
  validate(queryValidation.pagination), 
  validate(queryValidation.filter), 
  orderController.getMyOrders
);

router.get('/buyer/statistics', 
  orderController.getOrderStatistics
);

// Farmer routes
router.get('/farmer/orders', 
  validate(queryValidation.pagination), 
  validate(queryValidation.filter), 
  orderController.getFarmerOrders
);

router.put('/:id/status', 
  validate(orderValidation.updateStatus), 
  orderController.updateOrderStatus
);



// Common routes
router.get('/', 
  validate(queryValidation.pagination), 
  validate(queryValidation.filter), 
  orderController.getAllOrders
);

router.get('/:id', 
  orderController.getOrder
);

router.post('/:id/cancel', 
  orderController.cancelOrder
);

router.post('/:id/return', 
  orderController.requestReturn
);

router.post('/:id/dispute', 
  orderController.raiseDispute
);

router.post('/:id/tracking', 
  orderController.updateTracking
);

// Admin routes
router.get('/admin/all', 
  restrictTo('admin'), 
  validate(queryValidation.pagination), 
  validate(queryValidation.filter), 
  orderController.getAllOrders
);

router.put('/admin/:id/resolve-dispute', 
  restrictTo('admin'), 
  orderController.resolveDispute
);

module.exports = router;