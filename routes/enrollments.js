const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/enrollments
// @desc    Get all enrollments with pagination and filtering
// @access  Public (for basic enrollment data)
router.get('/', 
  enrollmentController.getEnrollments
);

// @route   GET /api/enrollments/stats
// @desc    Get enrollment statistics
// @access  Private (Admin only)
router.get('/stats', 
  authenticate, 
  enrollmentController.getEnrollmentStats
);

// @route   GET /api/enrollments/course/:courseId
// @desc    Get enrollments by course
// @access  Public (for course enrollment display)
router.get('/course/:courseId', 
  enrollmentController.getEnrollmentsByCourse
);

// @route   GET /api/enrollments/student/:studentId
// @desc    Get enrollments by student
// @access  Private (Admin/Student only)
router.get('/student/:studentId', 
  authenticate, 
  enrollmentController.getEnrollmentsByStudent
);

// @route   GET /api/enrollments/:id
// @desc    Get enrollment by ID
// @access  Private (Admin/Student only)
router.get('/:id', 
  authenticate, 
  enrollmentController.getEnrollment
);

// @route   POST /api/enrollments
// @desc    Create new enrollment
// @access  Public (for course enrollment)
router.post('/', 
  enrollmentController.createEnrollment
);

// @route   PUT /api/enrollments/:id
// @desc    Update enrollment
// @access  Private (Admin only)
router.put('/:id', 
  authenticate, 
  enrollmentController.updateEnrollment
);

// @route   DELETE /api/enrollments/:id
// @desc    Delete enrollment
// @access  Private (Admin only)
router.delete('/:id', 
  authenticate, 
  enrollmentController.deleteEnrollment
);

// @route   PATCH /api/enrollments/:id/approve
// @desc    Approve enrollment
// @access  Private (Admin only)
router.patch('/:id/approve', 
  authenticate, 
  enrollmentController.approveEnrollment
);

// @route   PATCH /api/enrollments/:id/reject
// @desc    Reject enrollment
// @access  Private (Admin only)
router.patch('/:id/reject', 
  authenticate, 
  enrollmentController.rejectEnrollment
);

// @route   PATCH /api/enrollments/:id/progress
// @desc    Update enrollment progress
// @access  Private (Admin/Instructor only)
router.patch('/:id/progress', 
  authenticate, 
  enrollmentController.updateProgress
);

// @route   POST /api/enrollments/:id/grades
// @desc    Add grade to enrollment
// @access  Private (Admin/Instructor only)
router.post('/:id/grades', 
  authenticate, 
  enrollmentController.addGrade
);

// @route   POST /api/enrollments/:id/attendance
// @desc    Record attendance
// @access  Private (Admin/Instructor only)
router.post('/:id/attendance', 
  authenticate, 
  enrollmentController.recordAttendance
);

// @route   POST /api/enrollments/:id/feedback
// @desc    Add feedback to enrollment
// @access  Private (Student only)
router.post('/:id/feedback', 
  authenticate, 
  enrollmentController.addFeedback
);

module.exports = router;
