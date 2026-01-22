const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check if Cloudinary is available
let cloudinary;
let CloudinaryStorage;
let isCloudinaryAvailable = false;

try {
  cloudinary = require('../config/cloudinary').cloudinary;
  CloudinaryStorage = require('multer-storage-cloudinary').CloudinaryStorage;
  isCloudinaryAvailable = true;
} catch (error) {
  console.log('⚠ Cloudinary not available. Using local file storage.');
  isCloudinaryAvailable = false;
}

// Create uploads directory if it doesn't exist
const createUploadsDir = () => {
  const dirs = [
    'uploads/profiles',
    'uploads/documents',
    'uploads/crops'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

createUploadsDir();

// Configure storage based on environment
let storage;

if (isCloudinaryAvailable && process.env.NODE_ENV === 'production') {
  // Use Cloudinary in production
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'farmer-marketplace',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto:good' }
      ]
    }
  });
} else {
  // Use local storage for development
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      let uploadPath = 'uploads/profiles/';
      
      // Determine upload path based on field name
      if (file.fieldname === 'aadharCard' || file.fieldname === 'panCard' || 
          file.fieldname === 'businessLicense') {
        uploadPath = 'uploads/documents/';
      } else if (file.fieldname === 'landDocuments') {
        uploadPath = 'uploads/documents/land/';
      } else if (file.fieldname === 'images') {
        uploadPath = 'uploads/crops/';
      }
      
      // Create directory if it doesn't exist
      const fullPath = path.join(__dirname, '..', uploadPath);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const userId = req.user ? req.user.id : 'anonymous';
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const filename = `${userId}-${timestamp}${ext}`;
      cb(null, filename);
    }
  });
}

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|webp|WEBP)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Single file upload middleware
exports.uploadSingle = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'File upload failed',
          error: err.message
        });
      }
      
      if (req.fileValidationError) {
        return res.status(400).json({
          success: false,
          message: req.fileValidationError
        });
      }
      
      if (req.file) {
        // For local storage, store the path
        if (!isCloudinaryAvailable || process.env.NODE_ENV !== 'production') {
          req.body[fieldName] = `/uploads/${req.file.destination}/${req.file.filename}`;
        } else {
          req.body[fieldName] = req.file.path;
          req.body[`${fieldName}PublicId`] = req.file.filename;
        }
      }
      
      next();
    });
  };
};

// Multiple files upload middleware
exports.uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'Files upload failed',
          error: err.message
        });
      }
      
      if (req.fileValidationError) {
        return res.status(400).json({
          success: false,
          message: req.fileValidationError
        });
      }
      
      if (req.files && req.files.length > 0) {
        req.body[fieldName] = req.files.map(file => {
          if (!isCloudinaryAvailable || process.env.NODE_ENV !== 'production') {
            return `/uploads/${file.destination}/${file.filename}`;
          } else {
            return {
              url: file.path,
              publicId: file.filename,
              caption: file.originalname
            };
          }
        });
      }
      
      next();
    });
  };
};

// Profile image upload middleware
exports.uploadProfileImage = exports.uploadSingle('profileImage');

// Document upload middleware
exports.uploadDocuments = (req, res, next) => {
  upload.fields([
    { name: 'aadharCard', maxCount: 2 },
    { name: 'panCard', maxCount: 1 },
    { name: 'landDocuments', maxCount: 5 },
    { name: 'businessLicense', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: 'Documents upload failed',
        error: err.message
      });
    }
    
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }
    
    if (req.files) {
      if (req.files.aadharCard) {
        const file = req.files.aadharCard[0];
        req.body.aadharCard = !isCloudinaryAvailable || process.env.NODE_ENV !== 'production' 
          ? `/uploads/${file.destination}/${file.filename}`
          : file.path;
      }
      if (req.files.panCard) {
        const file = req.files.panCard[0];
        req.body.panCard = !isCloudinaryAvailable || process.env.NODE_ENV !== 'production'
          ? `/uploads/${file.destination}/${file.filename}`
          : file.path;
      }
      if (req.files.landDocuments) {
        req.body.landDocuments = req.files.landDocuments.map(file => {
          return !isCloudinaryAvailable || process.env.NODE_ENV !== 'production'
            ? `/uploads/${file.destination}/${file.filename}`
            : file.path;
        });
      }
      if (req.files.businessLicense) {
        const file = req.files.businessLicense[0];
        req.body.businessLicense = !isCloudinaryAvailable || process.env.NODE_ENV !== 'production'
          ? `/uploads/${file.destination}/${file.filename}`
          : file.path;
      }
    }
    
    next();
  });
};

// Helper function to get file URL
exports.getFileUrl = (file) => {
  if (!file) return null;
  
  if (typeof file === 'string') {
    return file; // Already a URL/path
  }
  
  if (file.path) {
    return file.path;
  }
  
  return null;
};

// Delete file
exports.deleteFile = async (fileUrl) => {
  if (!fileUrl) return false;
  
  try {
    // If it's a local file
    if (fileUrl.startsWith('/uploads/')) {
      const fs = require('fs');
      const filePath = path.join(__dirname, '..', fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    }
    
    // If it's a Cloudinary URL and we have Cloudinary available
    if (isCloudinaryAvailable && fileUrl.includes('cloudinary')) {
      const publicId = fileUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

exports.uploadCropImages = (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: 'Images upload failed',
        error: err.message
      });
    }
    
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }
    
    // Store files in req.files, NOT in req.body
    // Don't modify req.body here
    next();
  });
};