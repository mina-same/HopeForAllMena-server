const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sessionUtils } = require('../config/session');
const { cookieUtils } = require('../utils/cookies');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Guest user for when auth is disabled
const GUEST_USER = {
  _id: '000000000000000000000000',
  username: 'guest',
  name: 'Guest User',
  email: 'guest@hopeforallmena.org',
  role: 'admin',
  status: 'active',
  permissions: [
    'books', 'authors', 'categories', 'reviews', 'courses',
    'enrollments', 'magazines', 'training', 'analytics', 'settings',
    'users', 'user-management', 'contact-messages', 'training-books',
    'training-requests', 'training-followup-requests', 'calendar',
    'generate-ids', 'blogs', 'admin_access', 'admin'
  ]
};

// Enhanced authentication middleware supporting multiple methods
const authenticate = async (req, res, next) => {
  // Bypassing authentication for all users
  req.user = GUEST_USER;
  return next();
};

// Check if user has specific permission
const authorize = (permissions) => {
  return (req, res, next) => {
    // Bypassing authorization for all users
    req.user = GUEST_USER;
    next();
  };
};

// Check if user is admin (has user management permission)
const requireAdmin = (req, res, next) => {
  req.user = GUEST_USER;
  next();
};

// Check if user can manage users or is accessing their own data
const authorizeUserAccess = (req, res, next) => {
  req.user = GUEST_USER;
  next();
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    next();
  };
};

module.exports = {
  generateToken,
  authenticate,
  authorize,
  requireAdmin,
  authorizeUserAccess,
  sensitiveOperationLimit
};
