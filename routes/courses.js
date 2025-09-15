const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/courses
// @desc    Get all courses with pagination and filtering
// @access  Public
router.get('/', 
  courseController.getCourses
);

// @route   GET /api/courses/stats
// @desc    Get course statistics
// @access  Private (Admin only)
router.get('/stats', 
  authenticate, 
  courseController.getCourseStats
);

// @route   GET /api/courses/featured
// @desc    Get featured courses
// @access  Public
router.get('/featured', 
  courseController.getFeaturedCourses
);

// @route   GET /api/courses/categories
// @desc    Get unique course categories
// @access  Public
router.get('/categories', 
  courseController.getCategories
);

// @route   GET /api/courses/institutions
// @desc    Get unique institutions
// @access  Public
router.get('/institutions', 
  courseController.getInstitutions
);

// @route   GET /api/courses/instructors
// @desc    Get unique instructors
// @access  Public
router.get('/instructors', 
  courseController.getInstructors
);

// @route   GET /api/courses/category/:category
// @desc    Get courses by category
// @access  Public
router.get('/category/:category', 
  courseController.getCoursesByCategory
);

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Public
router.get('/:id', 
  courseController.getCourse
);

// @route   POST /api/courses
// @desc    Create new course
// @access  Private (Admin only)
router.post('/', 
  authenticate, 
  courseController.createCourse
);

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Admin only)
router.put('/:id', 
  authenticate, 
  courseController.updateCourse
);

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Admin only)
router.delete('/:id', 
  authenticate, 
  courseController.deleteCourse
);

// @route   PATCH /api/courses/:id/rating
// @desc    Update course rating
// @access  Public
router.patch('/:id/rating', 
  courseController.updateCourseRating
);

module.exports = router;
