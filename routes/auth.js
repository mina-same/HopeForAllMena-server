const express = require('express');
const authController = require('../controllers/authController');
const { authenticate, sensitiveOperationLimit } = require('../middleware/auth');
const { validateLogin, validatePasswordChange } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', 
  sensitiveOperationLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  validateLogin,
  authController.login
);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', 
  authenticate, 
  authController.logout
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', 
  authenticate, 
  authController.getProfile
);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', 
  authenticate,
  sensitiveOperationLimit(3, 15 * 60 * 1000), // 3 attempts per 15 minutes
  validatePasswordChange,
  authController.changePassword
);

// @route   POST /api/auth/verify-token
// @desc    Verify if token is valid
// @access  Private
router.post('/verify-token', 
  authenticate, 
  authController.verifyToken
);

// @route   GET /api/auth/permissions
// @desc    Get user permissions
// @access  Private
router.get('/permissions', 
  authenticate, 
  authController.getPermissions
);

module.exports = router;
