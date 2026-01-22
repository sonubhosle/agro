const express = require('express');
const router = express.Router();
const cropController = require('../controllers/cropController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { cropValidation, queryValidation } = require('../middleware/validation');
const { uploadCropImages } = require('../middleware/upload');

// Public routes
router.get('/', 
  validate(queryValidation.pagination), 
  validate(queryValidation.filter), 
  cropController.getAllCrops
);

router.get('/nearby', 
  cropController.getNearbyCrops
);

router.get('/search', 
  cropController.searchCrops
);

router.get('/:id', 
  cropController.getCrop
);

// Protected routes
router.use(protect);

// Farmer routes
router.post('/', 
  restrictTo('farmer'), 
  uploadCropImages, 
  validate(cropValidation.create), 
  cropController.createCrop
);

router.put('/:id', 
  restrictTo('farmer', 'admin'), 
  uploadCropImages, 
  validate(cropValidation.update), 
  cropController.updateCrop
);

router.delete('/:id', 
  restrictTo('farmer', 'admin'), 
  cropController.deleteCrop
);

router.get('/farmer/my-crops', 
  restrictTo('farmer'), 
  validate(queryValidation.pagination), 
  cropController.getMyCrops
);

router.get('/farmer/statistics', 
  restrictTo('farmer'), 
  cropController.getCropStatistics
);

// Admin routes
router.get('/admin/all', 
  restrictTo('admin'), 
  validate(queryValidation.pagination), 
  validate(queryValidation.filter), 
  cropController.getAllCrops
);

module.exports = router;