const crypto = require('crypto');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { catchAsync } = require('../middleware/error');
const EmailService = require('../utils/emailService');


exports.register = catchAsync(async (req, res, next) => {
  const {
    fullName,
    email,
    phone,
    password,
    confirmPassword,
    role,
    district,
    state,
    farmName,
    farmSize,
    farmType,
    cropsGrown,
    businessName,
    businessType
  } = req.body;

  // Validate password confirmation
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }

  // Create user
  const userData = {
    fullName,
    email,
    phone,
    password,
    role: role || 'buyer',
    address: {
      district,
      state
    }
  };

  // Add role-specific fields
  if (role === 'farmer') {
    userData.farmName = farmName;
    userData.farmSize = farmSize;
    userData.farmType = farmType || 'traditional';
    userData.cropsGrown = cropsGrown || [];
  } else if (role === 'buyer') {
    userData.businessName = businessName;
    userData.businessType = businessType;
  }

  const user = await User.create(userData);

  // Create wallet for user
  await Wallet.create({ user: user._id });

  // Generate email verification token
  const emailVerificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Set cookies
  res.cookie('token', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.cookie('refreshToken', refreshToken, {
    expires: new Date(
      Date.now() + process.env.JWT_REFRESH_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  // Remove password from output
  user.password = undefined;

  // Send welcome email with verification link
  try {
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${emailVerificationToken}`;
    await EmailService.sendWelcomeEmail(user, verificationUrl);
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError);
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    token,
    refreshToken,
    data: {
      user
    }
  });
});


exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Your account has been deactivated. Please contact support.'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Set cookies
  res.cookie('token', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.cookie('refreshToken', refreshToken, {
    expires: new Date(
      Date.now() + process.env.JWT_REFRESH_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  // Remove password from output
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    refreshToken,
    data: {
      user
    }
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});


exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate({
      path: 'crops',
      select: 'name variety quantity pricePerUnit status images'
    })
    .populate({
      path: 'orders',
      select: 'orderId totalAmount status createdAt'
    })
    .populate({
      path: 'soldOrders',
      select: 'orderId totalAmount status createdAt'
    });

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

exports.updateDetails = catchAsync(async (req, res, next) => {
  const fieldsToUpdate = {
    fullName: req.body.fullName,
    phone: req.body.phone,
    address: {
      street: req.body.street,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      pincode: req.body.pincode
    },
    profileImage: req.body.profileImage
  };

  // Add role-specific fields
  if (req.user.role === 'farmer') {
    if (req.body.farmName) fieldsToUpdate.farmName = req.body.farmName;
    if (req.body.farmSize) fieldsToUpdate.farmSize = req.body.farmSize;
    if (req.body.farmType) fieldsToUpdate.farmType = req.body.farmType;
    if (req.body.cropsGrown) fieldsToUpdate.cropsGrown = req.body.cropsGrown;
  } else if (req.user.role === 'buyer') {
    if (req.body.businessName) fieldsToUpdate.businessName = req.body.businessName;
    if (req.body.businessType) fieldsToUpdate.businessType = req.body.businessType;
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Validate password confirmation
  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'New passwords do not match'
    });
  }

  // Get user with password
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();

  // Generate new token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    token
  });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found with this email'
    });
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

  // Send email
  try {
    await EmailService.sendPasswordResetEmail(user, resetUrl);

    res.status(200).json({
      success: true,
      message: 'Password reset token sent to email'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: 'There was an error sending the email. Try again later.'
    });
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { password, confirmPassword } = req.body;

  // Validate password confirmation
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }

  // Get hashed token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Token is invalid or has expired'
    });
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();

  // Generate new token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
    token
  });
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  const { verifyRefreshToken } = require('../middleware/auth');
  const user = await verifyRefreshToken(refreshToken);

  const newToken = generateToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  res.status(200).json({
    success: true,
    token: newToken,
    refreshToken: newRefreshToken
  });
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  const user = await User.findOne({
    emailVerificationToken: token  
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification token'
    });
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});


exports.uploadDocuments = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const updateData = {
    verificationDocuments: {
      aadharCard: req.body.aadharCard || user.verificationDocuments?.aadharCard,
      panCard: req.body.panCard || user.verificationDocuments?.panCard,
      landDocuments: req.body.landDocuments || user.verificationDocuments?.landDocuments,
      businessLicense: req.body.businessLicense || user.verificationDocuments?.businessLicense
    },
    verificationStatus: 'pending'
  };

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Documents uploaded successfully',
    data: {
      user: updatedUser
    }
  });
});


exports.uploadProfilePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an image file'
    });
  }

  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get the file URL/path and public ID
  let profileImageUrl;
  let profileImagePublicId;
  
  if (req.file.path && req.file.path.includes('cloudinary')) {
    // Cloudinary URL
    profileImageUrl = req.file.path;
    profileImagePublicId = req.file.filename;
  } else {
    // Local file path
    profileImageUrl = `/uploads/profiles/${req.file.filename}`;
    profileImagePublicId = null;
  }

  // Delete old profile photo if exists
  if (user.profileImage) {
    try {
      const { deleteFile } = require('../middleware/upload');
      await deleteFile(user.profileImagePublicId || user.profileImage);
    } catch (error) {
      console.error('Error deleting old profile image:', error);
    }
  }

  // Update user with new profile image
  user.profileImage = profileImageUrl;
  user.profileImagePublicId = profileImagePublicId;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile photo uploaded successfully',
    data: {
      profileImage: profileImageUrl,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profileImage: user.profileImage
      }
    }
  });
});

exports.removeProfilePhoto = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!user.profileImage) {
    return res.status(400).json({
      success: false,
      message: 'No profile photo to remove'
    });
  }

  // Delete the file from storage
  try {
    const { deleteFile } = require('../middleware/upload');
    await deleteFile(user.profileImagePublicId || user.profileImage);
  } catch (error) {
    console.error('Error deleting profile image:', error);
  }

  // Remove profile image reference
  user.profileImage = undefined;
  user.profileImagePublicId = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile photo removed successfully',
    data: {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profileImage: null
      }
    }
  });
});

exports.updateNotificationPreferences = catchAsync(async (req, res, next) => {
  const { notificationPreferences } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { notificationPreferences },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Notification preferences updated successfully',
    data: {
      user
    }
  });
});

exports.updateLocation = catchAsync(async (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Please provide latitude and longitude'
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      'address.coordinates': {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Location updated successfully',
    data: {
      user
    }
  });
});