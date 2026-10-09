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

// Admin-level access: an "admin" role or user-management rights
const isAdminUser = (user) => {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  const permissions = user.permissions || [];
  return role.includes('admin') || permissions.includes('user-management') || permissions.includes('users');
};

// Read the JWT from the Authorization header, falling back to the auth cookie
const getRequestToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return cookieUtils.getAuthToken(req);
};

// Require a logged-in, active user
const authenticate = async (req, res, next) => {
  try {
    let userId = null;

    const token = getRequestToken(req);
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (error) {
        userId = null;
      }
    }

    if (!userId && sessionUtils.getUserId(req) && req.session.isAuthenticated === true) {
      userId = sessionUtils.getUserId(req);
    }

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please log in.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User no longer exists. Please log in again.'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        status: 'error',
        message: 'User is not active. Contact your admin.'
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
};

// Check if user has at least one of the given permissions
const authorize = (permissions) => {
  const required = Array.isArray(permissions) ? permissions : [permissions];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please log in.'
      });
    }

    const userPermissions = req.user.permissions || [];
    const allowed = isAdminUser(req.user) || required.some((permission) => userPermissions.includes(permission));

    if (!allowed) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

// Check if user is admin (has user management permission)
const requireAdmin = (req, res, next) => {
  if (!isAdminUser(req.user)) {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    });
  }
  next();
};

// Check if user can manage users or is accessing their own data
const authorizeUserAccess = (req, res, next) => {
  const ownAccount = req.user && req.params.id && req.user._id.toString() === req.params.id;
  if (!isAdminUser(req.user) && !ownAccount) {
    return res.status(403).json({
      status: 'error',
      message: 'You can only access your own account'
    });
  }
  next();
};

// Rate limiting for sensitive operations (in-memory, per user or IP)
const sensitiveOperationLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  return (req, res, next) => {
    const key = req.user ? req.user._id.toString() : req.ip;
    const now = Date.now();
    const recent = (attempts.get(key) || []).filter((time) => now - time < windowMs);

    if (recent.length >= maxAttempts) {
      return res.status(429).json({
        status: 'error',
        message: 'Too many attempts. Please try again later.'
      });
    }

    recent.push(now);
    attempts.set(key, recent);
    next();
  };
};

// Attaches req.user when a valid token is present, but never rejects the request.
// Used by public endpoints that show extra data (e.g. draft courses) to logged-in staff.
const optionalAuth = async (req, res, next) => {
  try {
    const token = getRequestToken(req);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
  } catch (error) {
    // Invalid or expired token: treat as an anonymous visitor
  }
  return next();
};

module.exports = {
  generateToken,
  authenticate,
  optionalAuth,
  authorize,
  requireAdmin,
  authorizeUserAccess,
  sensitiveOperationLimit
};
