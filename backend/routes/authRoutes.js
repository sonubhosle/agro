const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { authValidation } = require('../middleware/validation');
const { uploadProfileImage, uploadDocuments } = require('../middleware/upload');

// Public routes
router.post('/register', 
  validate(authValidation.register), 
  authController.register
);

router.post('/login', 
  validate(authValidation.login), 
  authController.login
);

router.post('/forgot-password', 
  validate(authValidation.forgotPassword), 
  authController.forgotPassword
);

router.put('/reset-password/:token', 
  validate(authValidation.resetPassword), 
  authController.resetPassword
);

router.post('/refresh-token', 
  authController.refreshToken
);

router.get('/verify-email/:token', 
  authController.verifyEmail
);

// Protected routes
router.use(protect);

router.get('/logout', 
  authController.logout
);

router.get('/me', 
  authController.getMe
);

router.put('/update-details', 
  authController.updateDetails
);

router.put('/update-password', 
  authController.updatePassword
);

router.put('/update-location',
  authController.updateLocation
);

router.post('/upload-profile-photo',
  uploadProfileImage,
  authController.uploadProfilePhoto
);

router.delete('/remove-profile-photo',
  authController.removeProfilePhoto
);

router.post('/upload-documents', 
  uploadDocuments, 
  authController.uploadDocuments
);

router.put('/notification-preferences', 
  authController.updateNotificationPreferences
);

module.exports = router;