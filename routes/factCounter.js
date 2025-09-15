const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  getFactCounterStats,
  updateFactCounterStats,
  getFactCounterHistory
} = require('../controllers/factCounterController');

// Validation middleware for updating stats
const validateStatsUpdate = [
  body('members')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Members must be a non-negative integer'),
  body('leadersTraining')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Leaders Training must be a non-negative integer'),
  body('publishedBooks')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Published Books must be a non-negative integer'),
  body('givenMagazines')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Given Magazines must be a non-negative integer')
];

// Public routes
router.get('/stats', getFactCounterStats);
router.get('/history', getFactCounterHistory);

// Protected routes (require authentication and admin permissions)
router.put('/stats', 
  authenticate,
  validateStatsUpdate,
  updateFactCounterStats
);

module.exports = router;
