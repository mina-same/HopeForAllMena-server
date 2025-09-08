const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, requireAdmin, authorizeUserAccess, sensitiveOperationLimit } = require('../middleware/auth');
const { 
  validateUserCreation, 
  validateUserUpdate, 
  validateUserId, 
  validatePagination 
} = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users with pagination and filtering
// @access  Private (Admin only)
router.get('/', 
  authenticate, 
  requireAdmin, 
  validatePagination,
  userController.getUsers
);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (Admin only)
router.get('/stats', 
  authenticate, 
  requireAdmin,
  userController.getUserStats
);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin or own profile)
router.get('/:id', 
  authenticate, 
  validateUserId,
  authorizeUserAccess,
  userController.getUserById
);

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin only)
router.post('/', 
  authenticate, 
  requireAdmin,
  sensitiveOperationLimit(10, 60 * 60 * 1000), // 10 user creations per hour
  validateUserCreation,
  userController.createUser
);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin or own profile)
router.put('/:id', 
  authenticate, 
  validateUserId,
  authorizeUserAccess,
  validateUserUpdate,
  userController.updateUser
);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', 
  authenticate, 
  requireAdmin,
  validateUserId,
  sensitiveOperationLimit(5, 60 * 60 * 1000), // 5 deletions per hour
  userController.deleteUser
);

// @route   PATCH /api/users/:id/status
// @desc    Update user status (activate/deactivate/suspend)
// @access  Private (Admin only)
router.patch('/:id/status', 
  authenticate, 
  requireAdmin,
  validateUserId,
  userController.updateUserStatus
);

// @route   PATCH /api/users/:id/permissions
// @desc    Update user permissions
// @access  Private (Admin only)
router.patch('/:id/permissions', 
  authenticate, 
  requireAdmin,
  validateUserId,
  userController.updateUserPermissions
);

// @route   POST /api/users/:id/unlock
// @desc    Unlock user account (reset login attempts)
// @access  Private (Admin only)
router.post('/:id/unlock', 
  authenticate, 
  requireAdmin,
  validateUserId,
  userController.unlockUser
);

module.exports = router;
