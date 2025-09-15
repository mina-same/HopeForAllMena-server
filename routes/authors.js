const express = require('express');
const router = express.Router();
const authorController = require('../controllers/authorController');
const { authenticate } = require('../middleware/auth');
const { 
  validateAuthorCreation, 
  validateAuthorUpdate, 
  validateAuthorId,
  validatePagination 
} = require('../middleware/validation');

// @route   GET /api/authors
// @desc    Get all authors with pagination and filtering
// @access  Public
router.get('/', 
  validatePagination,
  authorController.getAuthors
);

// @route   GET /api/authors/stats
// @desc    Get author statistics
// @access  Private (Admin only)
router.get('/stats', 
  authenticate, 
  authorController.getAuthorStats
);

// @route   GET /api/authors/featured
// @desc    Get featured authors
// @access  Public
router.get('/featured', 
  authorController.getFeaturedAuthors
);

// @route   GET /api/authors/:id
// @desc    Get author by ID
// @access  Public
router.get('/:id', 
  validateAuthorId,
  authorController.getAuthorById
);

// @route   POST /api/authors
// @desc    Create new author
// @access  Private (Admin only)
router.post('/', 
  authenticate, 
  validateAuthorCreation,
  authorController.createAuthor
);

// @route   PUT /api/authors/:id
// @desc    Update author
// @access  Private (Admin only)
router.put('/:id', 
  authenticate, 
  validateAuthorId,
  validateAuthorUpdate,
  authorController.updateAuthor
);

// @route   DELETE /api/authors/:id
// @desc    Delete author
// @access  Private (Admin only)
router.delete('/:id', 
  authenticate, 
  validateAuthorId,
  authorController.deleteAuthor
);

// @route   PATCH /api/authors/:id/status
// @desc    Update author status
// @access  Private (Admin only)
router.patch('/:id/status', 
  authenticate, 
  validateAuthorId,
  authorController.updateAuthorStatus
);

// @route   PATCH /api/authors/:id/featured
// @desc    Toggle author featured status
// @access  Private (Admin only)
router.patch('/:id/featured', 
  authenticate, 
  validateAuthorId,
  authorController.toggleAuthorFeatured
);

// @route   PATCH /api/authors/:id/stats
// @desc    Update author statistics
// @access  Private (Admin only)
router.patch('/:id/stats', 
  authenticate, 
  validateAuthorId,
  authorController.updateAuthorStats
);

module.exports = router;
