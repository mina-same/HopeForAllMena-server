const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { 
  validateReviewCreation, 
  validateReviewUpdate, 
  validateReviewId,
  validatePagination 
} = require('../middleware/validation');

// @route   GET /api/reviews
// @desc    Get all reviews with pagination and filtering
// @access  Private (Admin only)
router.get('/', 
  authenticate, 
  validatePagination,
  reviewController.getReviews
);

// @route   GET /api/reviews/stats
// @desc    Get review statistics
// @access  Private (Admin only)
router.get('/stats', 
  authenticate, 
  reviewController.getReviewStats
);

// @route   GET /api/reviews/pending
// @desc    Get pending reviews
// @access  Private (Admin only)
router.get('/pending', 
  authenticate, 
  validatePagination,
  reviewController.getPendingReviews
);

// @route   GET /api/reviews/book/:bookId
// @desc    Get reviews by book
// @access  Public
router.get('/book/:bookId', 
  validatePagination,
  reviewController.getReviewsByBook
);

// @route   GET /api/reviews/user/:userId
// @desc    Get reviews by user
// @access  Private (Admin only)
router.get('/user/:userId', 
  authenticate, 
  validatePagination,
  reviewController.getReviewsByUser
);

// @route   GET /api/reviews/:id
// @desc    Get review by ID
// @access  Private (Admin only)
router.get('/:id', 
  authenticate, 
  validateReviewId,
  reviewController.getReviewById
);

// @route   POST /api/reviews
// @desc    Create new review
// @access  Public (Authenticated users or guests)
router.post('/', 
  (req, res, next) => {
    // Make authentication optional for review creation
    if (req.headers.authorization) {
      authenticate(req, res, next);
    } else {
      next();
    }
  },
  validateReviewCreation,
  reviewController.createReview
);

// @route   PUT /api/reviews/:id
// @desc    Update review
// @access  Private (Owner or Admin)
router.put('/:id', 
  authenticate, 
  validateReviewId,
  validateReviewUpdate,
  reviewController.updateReview
);

// @route   DELETE /api/reviews/:id
// @desc    Delete review
// @access  Private (Owner or Admin)
router.delete('/:id', 
  authenticate, 
  validateReviewId,
  reviewController.deleteReview
);

// @route   PATCH /api/reviews/:id/moderate
// @desc    Moderate review (approve/reject)
// @access  Private (Admin only)
router.patch('/:id/moderate', 
  authenticate, 
  validateReviewId,
  reviewController.moderateReview
);

// @route   PATCH /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Public
router.patch('/:id/helpful', 
  validateReviewId,
  reviewController.markHelpful
);

// @route   PATCH /api/reviews/:id/not-helpful
// @desc    Mark review as not helpful
// @access  Public
router.patch('/:id/not-helpful', 
  validateReviewId,
  reviewController.markNotHelpful
);

module.exports = router;
