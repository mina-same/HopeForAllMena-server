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

// Enhanced authentication middleware supporting multiple methods
const authenticate = async (req, res, next) => {
  try {
    let token;
    let user = null;

    // Method 1: Check for session authentication
    if (sessionUtils.isAuthenticated(req)) {
      const userId = sessionUtils.getUserId(req);
      user = await User.findById(userId);
      if (user) {
        req.user = user;
        return next();
      }
    }

    // Method 2: Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Method 3: Check for token in cookies
    if (!token) {
      token = cookieUtils.getAuthToken(req);
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No authentication provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. User not found.'
      });
    }

    // Check if user account is active
    if (user.status !== 'active') {
      return res.status(401).json({
        status: 'error',
        message: 'Account is inactive. Please contact administrator.'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is temporarily locked due to multiple failed login attempts.'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired. Please login again.'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Authentication failed.'
    });
  }
};

// Check if user has specific permission
const authorize = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.'
      });
    }

    // Convert single permission to array
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    
    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some(permission => 
      req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions to access this resource.',
        required: requiredPermissions,
        current: req.user.permissions
      });
    }

    next();
  };
};

// Check if user is admin (has user management permission)
const requireAdmin = authorize(['users', 'user-management']);

// Check if user can manage users or is accessing their own data
const authorizeUserAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required.'
    });
  }

  const targetUserId = req.params.id || req.params.userId;
  const isAdmin = req.user.permissions.includes('users') || req.user.permissions.includes('user-management');
  const isOwnProfile = req.user._id.toString() === targetUserId;

  if (!isAdmin && !isOwnProfile) {
    return res.status(403).json({
      status: 'error',
      message: 'You can only access your own profile or need admin permissions.'
    });
  }

  next();
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + (req.user ? req.user._id : '');
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old attempts
    if (attempts.has(key)) {
      const userAttempts = attempts.get(key).filter(time => time > windowStart);
      attempts.set(key, userAttempts);
    }

    const currentAttempts = attempts.get(key) || [];

    if (currentAttempts.length >= maxAttempts) {
      return res.status(429).json({
        status: 'error',
        message: 'Too many attempts. Please try again later.',
        retryAfter: Math.ceil((currentAttempts[0] + windowMs - now) / 1000)
      });
    }

    // Add current attempt
    currentAttempts.push(now);
    attempts.set(key, currentAttempts);

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
