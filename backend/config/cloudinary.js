const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret'
});

// Create storage engine for Cloudinary
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'farmer-marketplace/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
    public_id: (req, file) => {
      // Use user ID + timestamp for unique filename
      const userId = req.user ? req.user.id : 'anonymous';
      const timestamp = Date.now();
      return `${userId}-${timestamp}`;
    }
  }
});

// Local storage option (if you prefer local storage)
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    const userId = req.user ? req.user.id : 'anonymous';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${timestamp}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|webp|WEBP)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Choose storage (Cloudinary or Local)
const storage = process.env.NODE_ENV === 'production' ? cloudinaryStorage : localStorage;

// Create upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Middleware for single profile image upload
exports.uploadProfileImage = upload.single('profileImage');

// Middleware for multiple document uploads
exports.uploadDocuments = upload.fields([
  { name: 'aadharCard', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'landDocuments', maxCount: 5 },
  { name: 'businessLicense', maxCount: 1 }
]);

// Helper function to get file URL/path
exports.getFileUrl = (file) => {
  if (!file) return null;
  
  if (process.env.NODE_ENV === 'production') {
    return file.path; // Cloudinary URL
  } else {
    return `/uploads/profiles/${file.filename}`; // Local path
  }
};

// Delete file from storage
exports.deleteFile = async (fileUrl) => {
  if (!fileUrl) return;
  
  if (process.env.NODE_ENV === 'production' && fileUrl.includes('cloudinary')) {
    // Extract public_id from Cloudinary URL
    const publicId = fileUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`farmer-marketplace/profiles/${publicId}`);
  } else {
    // For local files
    const fs = require('fs');
    const filePath = path.join(__dirname, '..', fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};