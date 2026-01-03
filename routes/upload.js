const express = require('express');
const router = express.Router();
const { 
  upload, 
  uploadAuthorImage, 
  uploadBookCover, 
  uploadTrainingBookCover,
  uploadCourseImage,
  deleteImage 
} = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');

// All upload routes require authentication
router.use(authenticate);

// Upload author image
router.post('/author-image', upload.single('image'), uploadAuthorImage);

// Upload book cover
router.post('/book-cover', upload.single('image'), uploadBookCover);

// Upload training book cover
router.post('/training-book-cover', upload.single('image'), uploadTrainingBookCover);

// Upload course image
router.post('/course-image', upload.single('image'), uploadCourseImage);

// Delete image
router.delete('/image', deleteImage);

module.exports = router;
