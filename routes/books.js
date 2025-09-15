const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticate } = require('../middleware/auth');
const { 
  validateBookCreation, 
  validateBookUpdate, 
  validateBookId,
  validateBookPagination 
} = require('../middleware/validation');

// @route   GET /api/books
// @desc    Get all books with pagination and filtering
// @access  Public
router.get('/', 
  validateBookPagination,
  bookController.getBooks
);

// @route   GET /api/books/stats
// @desc    Get book statistics
// @access  Private (Admin only)
router.get('/stats', 
  authenticate, 
  bookController.getBookStats
);

// @route   GET /api/books/recent
// @desc    Get recent books
// @access  Public
router.get('/recent', 
  bookController.getRecentBooks
);

// @route   GET /api/books/:id
// @desc    Get book by ID
// @access  Public
router.get('/:id', 
  validateBookId,
  bookController.getBookById
);

// @route   POST /api/books
// @desc    Create new book
// @access  Private (Admin only)
router.post('/', 
  authenticate, 
  validateBookCreation,
  bookController.createBook
);

// @route   PUT /api/books/:id
// @desc    Update book
// @access  Private (Admin only)
router.put('/:id', 
  authenticate, 
  validateBookId,
  validateBookUpdate,
  bookController.updateBook
);

// @route   DELETE /api/books/:id
// @desc    Delete book
// @access  Private (Admin only)
router.delete('/:id', 
  authenticate, 
  validateBookId,
  bookController.deleteBook
);

// @route   PATCH /api/books/:id/status
// @desc    Update book status
// @access  Private (Admin only)
router.patch('/:id/status', 
  authenticate, 
  validateBookId,
  bookController.updateBookStatus
);


// @route   PATCH /api/books/:id/rating
// @desc    Update book rating
// @access  Private (Admin only)
router.patch('/:id/rating', 
  authenticate, 
  validateBookId,
  bookController.updateBookRating
);

module.exports = router;
