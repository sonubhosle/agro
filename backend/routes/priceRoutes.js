const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { priceValidation, queryValidation } = require('../middleware/validation');

// Public routes
router.get('/', 
  validate(queryValidation.pagination), 
  validate(queryValidation.filter), 
  priceController.getAllPrices
);

router.get('/location', 
  priceController.getPriceByLocation
);

router.get('/district/:district', 
  priceController.getDistrictPrices
);

router.get('/state/:state', 
  priceController.getStatePrices
);

router.get('/trends', 
  priceController.getPriceTrends
);

router.get('/comparison', 
  priceController.getPriceComparison
);

router.get('/predictions', 
  priceController.getPricePredictions
);

router.get('/:id', 
  priceController.getPrice
);

// Admin routes
router.use(protect, restrictTo('admin'));

router.post('/', 
  validate(priceValidation.create), 
  priceController.createPrice
);

router.put('/:id', 
  validate(priceValidation.update), 
  priceController.updatePrice
);

router.delete('/:id', 
  priceController.deletePrice
);

module.exports = router;