const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// All payment routes require authentication
router.use(protect);

router.post('/:id/payment/link', paymentController.createPaymentLink);

router.get('/callback', paymentController.paymentCallback);

module.exports = router;