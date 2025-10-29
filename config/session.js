const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production',
  resave: true, // Force session save even if not modified
  saveUninitialized: true, // Save uninitialized sessions
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/azino_publishing',
    dbName: process.env.DB_NAME || 'azino_publishing',
    touchAfter: 24 * 3600, // lazy session update (24 hours)
    ttl: 7 * 24 * 60 * 60, // session expires in 7 days
    autoRemove: 'native', // automatically remove expired sessions
    autoIndex: false, // disable automatic index creation
    stringify: false, // store as BSON
  }),
  cookie: {
    secure: false, // Set to false for development (localhost)
    httpOnly: true, // prevent XSS attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax', // More permissive for development
  },
  name: 'hope-for-all-session', // custom session name
};

// Session middleware factory
const createSessionMiddleware = () => {
  // Ensure MongoDB connection is established before creating session store
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️  MongoDB not connected when creating session middleware');
  }
  
  return session(sessionConfig);
};

// Session utilities
const sessionUtils = {
  // Create a new session for a user
  createUserSession: (req, user) => {
    console.log('🔐 Creating session for user:', user._id);
    
    // Set session data
    req.session.userId = user._id.toString();
    req.session.userRole = user.role;
    req.session.isAuthenticated = true;
    req.session.loginTime = new Date();
    req.session.userEmail = user.email;
    req.session.userName = user.name;
    
    console.log('📝 Session data set:', {
      userId: req.session.userId,
      userRole: req.session.userRole,
      isAuthenticated: req.session.isAuthenticated,
      sessionID: req.sessionID
    });
    
    // Save session
    return new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('❌ Session save error:', err);
          reject(err);
        } else {
          console.log('✅ Session saved successfully:', req.sessionID);
          console.log('🔍 Session data after save:', {
            userId: req.session.userId,
            isAuthenticated: req.session.isAuthenticated
          });
          resolve(req.session);
        }
      });
    });
  },

  // Destroy user session
  destroyUserSession: (req) => {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  // Check if user is authenticated via session
  isAuthenticated: (req) => {
    const isAuth = req.session && req.session.isAuthenticated === true;
    if (req.session) {
      console.log('🔍 Session check - ID:', req.sessionID, 'Authenticated:', isAuth, 'UserID:', req.session.userId);
      console.log('📊 Full session data:', {
        isAuthenticated: req.session.isAuthenticated,
        userId: req.session.userId,
        userRole: req.session.userRole,
        userEmail: req.session.userEmail,
        loginTime: req.session.loginTime
      });
    } else {
      console.log('❌ No session found for request');
    }
    return isAuth;
  },

  // Get user ID from session
  getUserId: (req) => {
    return req.session ? req.session.userId : null;
  },

  // Get user role from session
  getUserRole: (req) => {
    return req.session ? req.session.userRole : null;
  },

  // Regenerate session ID (for security)
  regenerateSession: (req) => {
    return new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) reject(err);
        else resolve(req.session);
      });
    });
  },

  // Update session data
  updateSession: (req, data) => {
    Object.assign(req.session, data);
    return new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve(req.session);
      });
    });
  }
};

module.exports = {
  sessionConfig,
  createSessionMiddleware,
  sessionUtils
};
