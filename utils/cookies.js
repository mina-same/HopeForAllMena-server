const jwt = require('jsonwebtoken');

// Cookie configuration
const cookieConfig = {
  // Auth token cookie
  authToken: {
    name: 'authToken',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    }
  },
  
  // Refresh token cookie
  refreshToken: {
    name: 'refreshToken',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    }
  },
  
  // User preferences cookie
  userPrefs: {
    name: 'userPrefs',
    options: {
      httpOnly: false, // Allow client-side access for preferences
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      path: '/'
    }
  }
};

// Cookie utilities
const cookieUtils = {
  // Set a cookie
  setCookie: (res, name, value, options = {}) => {
    const cookieOptions = {
      ...cookieConfig[name]?.options,
      ...options
    };
    
    res.cookie(name, value, cookieOptions);
  },

  // Get a cookie from request
  getCookie: (req, name) => {
    return req.cookies ? req.cookies[name] : null;
  },

  // Clear a cookie
  clearCookie: (res, name, options = {}) => {
    const cookieOptions = {
      ...cookieConfig[name]?.options,
      ...options,
      maxAge: 0,
      expires: new Date(0)
    };
    
    res.clearCookie(name, cookieOptions);
  },

  // Set authentication cookies
  setAuthCookies: (res, token, refreshToken = null) => {
    cookieUtils.setCookie(res, 'authToken', token);
    if (refreshToken) {
      cookieUtils.setCookie(res, 'refreshToken', refreshToken);
    }
  },

  // Clear authentication cookies
  clearAuthCookies: (res) => {
    cookieUtils.clearCookie(res, 'authToken');
    cookieUtils.clearCookie(res, 'refreshToken');
  },

  // Get authentication token from cookies
  getAuthToken: (req) => {
    return cookieUtils.getCookie(req, 'authToken');
  },

  // Get refresh token from cookies
  getRefreshToken: (req) => {
    return cookieUtils.getCookie(req, 'refreshToken');
  },

  // Verify JWT token from cookie
  verifyTokenFromCookie: (req) => {
    const token = cookieUtils.getAuthToken(req);
    if (!token) return null;

    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
    } catch (error) {
      return null;
    }
  },

  // Set user preferences cookie
  setUserPrefs: (res, preferences) => {
    cookieUtils.setCookie(res, 'userPrefs', JSON.stringify(preferences));
  },

  // Get user preferences from cookie
  getUserPrefs: (req) => {
    const prefs = cookieUtils.getCookie(req, 'userPrefs');
    try {
      return prefs ? JSON.parse(prefs) : {};
    } catch (error) {
      return {};
    }
  },

  // Check if cookies are enabled (client-side check)
  areCookiesEnabled: (req) => {
    return req.cookies && Object.keys(req.cookies).length > 0;
  }
};

// Middleware to parse cookies
const cookieParser = require('cookie-parser');

// Enhanced cookie parser with options
const createCookieParser = () => {
  return cookieParser(process.env.COOKIE_SECRET || 'your-cookie-secret');
};

module.exports = {
  cookieConfig,
  cookieUtils,
  createCookieParser
};
