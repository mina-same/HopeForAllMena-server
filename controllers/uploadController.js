const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { promisify } = require('util');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload image to Cloudinary
const uploadToCloudinary = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: options.folder || 'azino',
        transformation: options.transformation || [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ],
        ...options
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

// Upload author image
const uploadAuthorImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'azino/authors',
      public_id: `author_${Date.now()}`,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    res.json({
      success: true,
      message: 'Author image uploaded successfully',
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height
      }
    });
  } catch (error) {
    console.error('Author image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload author image',
      error: error.message
    });
  }
};

// Upload book cover image
const uploadBookCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'azino/books',
      public_id: `book_${Date.now()}`,
      transformation: [
        { width: 600, height: 800, crop: 'fill' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    res.json({
      success: true,
      message: 'Book cover uploaded successfully',
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height
      }
    });
  } catch (error) {
    console.error('Book cover upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload book cover',
      error: error.message
    });
  }
};

// Upload training book cover image
const uploadTrainingBookCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'azino/training-books',
      public_id: `training_book_${Date.now()}`,
      transformation: [
        { width: 600, height: 800, crop: 'fill' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    res.json({
      success: true,
      message: 'Training book cover uploaded successfully',
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height
      }
    });
  } catch (error) {
    console.error('Training book cover upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload training book cover',
      error: error.message
    });
  }
};

// Delete image from Cloudinary
const deleteImage = async (req, res) => {
  try {
    const { public_id } = req.body;
    
    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    const result = await cloudinary.uploader.destroy(public_id);
    
    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  uploadAuthorImage,
  uploadBookCover,
  uploadTrainingBookCover,
  deleteImage
};
