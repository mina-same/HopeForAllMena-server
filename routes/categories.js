const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { 
  validateCategoryCreation, 
  validateCategoryUpdate, 
  validateCategoryId,
  validatePagination 
} = require('../middleware/validation');

// @route   GET /api/categories
// @desc    Get all categories with pagination and filtering
// @access  Public
router.get('/', 
  validatePagination,
  categoryController.getCategories
);

// @route   GET /api/categories/hierarchy
// @desc    Get category hierarchy
// @access  Public
router.get('/hierarchy', 
  categoryController.getCategoryHierarchy
);

// @route   GET /api/categories/stats
// @desc    Get category statistics
// @access  Private (Admin only)
router.get('/stats', 
  authenticate, 
  categoryController.getCategoryStats
);


// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Public
router.get('/:id', 
  validateCategoryId,
  categoryController.getCategoryById
);

// @route   POST /api/categories
// @desc    Create new category
// @access  Private (Admin only)
router.post('/', 
  authenticate, 
  validateCategoryCreation,
  categoryController.createCategory
);

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin only)
router.put('/:id', 
  authenticate, 
  validateCategoryId,
  validateCategoryUpdate,
  categoryController.updateCategory
);

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Admin only)
router.delete('/:id', 
  authenticate, 
  validateCategoryId,
  categoryController.deleteCategory
);

// @route   PATCH /api/categories/:id/status
// @desc    Update category status
// @access  Private (Admin only)
router.patch('/:id/status', 
  authenticate, 
  validateCategoryId,
  categoryController.updateCategoryStatus
);


// @route   PATCH /api/categories/:id/stats
// @desc    Update category statistics
// @access  Private (Admin only)
router.patch('/:id/stats', 
  authenticate, 
  validateCategoryId,
  categoryController.updateCategoryStats
);

module.exports = router;
