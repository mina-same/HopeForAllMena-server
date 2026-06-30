require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createSessionMiddleware } = require('./config/session');
const { createCookieParser } = require('./utils/cookies');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const authorRoutes = require('./routes/authors');
const categoryRoutes = require('./routes/categories');
const bookRoutes = require('./routes/books');
const reviewRoutes = require('./routes/reviews');
const contactMessageRoutes = require('./routes/contactMessages');
const magazineRequestRoutes = require('./routes/magazineRequests');
const trainingBookRoutes = require('./routes/trainingBooks');
const trainingRequestRoutes = require('./routes/trainingRequests');
const trainingFollowUpRoutes = require('./routes/trainingFollowUps');
const developmentProjectRequestRoutes = require('./routes/developmentProjectRequests');
const uploadRoutes = require('./routes/upload');
const eventRoutes = require('./routes/events');
const courseRoutes = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollments');
const factCounterRoutes = require('./routes/factCounter');
const blogRoutes = require('./routes/blogRoutes');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// CORS configuration - Enhanced for better compatibility
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:8000',
      'http://localhost:8001',
      'http://127.0.0.1:8000',
      'http://127.0.0.1:8001',
      'https://hope-for-all-mena-client.vercel.app',
      'https://hope2allmena-server.vercel.app'
    ];
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-HTTP-Method-Override'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Additional CORS handling for preflight requests
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(createCookieParser());

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Azino Publishing House API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('📊 MongoDB connection closed');
    process.exit(0);
  });
});

async function start() {
  try {
    const dbName = process.env.DB_NAME || 'azino_publishing';
    const primaryUri = process.env.MONGODB_URI;
    if (!primaryUri) {
      throw new Error('MONGODB_URI is not set');
    }

    try {
      await mongoose.connect(primaryUri, { dbName });
    } catch (error) {
      const isDev = process.env.NODE_ENV === 'development';
      const isSrv = typeof primaryUri === 'string' && primaryUri.startsWith('mongodb+srv://');
      const isSrvDnsError =
        (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND' || error?.code === 'ETIMEOUT') &&
        typeof error?.hostname === 'string' &&
        error.hostname.includes('_mongodb._tcp');

      if (isDev && isSrv && isSrvDnsError) {
        const fallbackUri =
          process.env.MONGODB_URI_LOCAL || `mongodb://127.0.0.1:27017/${dbName}`;
        console.warn('⚠️  MongoDB SRV lookup failed. Falling back to local MongoDB.');
        console.warn('⚠️  Fallback URI:', fallbackUri);
        try {
          await mongoose.connect(fallbackUri, { dbName });
        } catch (fallbackError) {
          console.error('❌ Local MongoDB fallback failed. Starting API without DB.');
          console.error(fallbackError);
        }
      } else {
        console.error('❌ MongoDB connection failed. Starting API without DB.');
        console.error(error);
      }
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      console.log('✅ Connected to MongoDB successfully');
      console.log('📊 Database:', mongoose.connection.db.databaseName);
    }

    // Session middleware (falls back to MemoryStore if DB is down)
    app.use(createSessionMiddleware());

    const requireDb = (req, res, next) => {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          status: 'error',
          message: 'Database unavailable. Please try again later.'
        });
      }
      next();
    };

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', requireDb, userRoutes);
    app.use('/api/authors', requireDb, authorRoutes);
    app.use('/api/categories', requireDb, categoryRoutes);
    app.use('/api/books', requireDb, bookRoutes);
    app.use('/api/reviews', requireDb, reviewRoutes);
    app.use('/api/contact-messages', requireDb, contactMessageRoutes);
    app.use('/api/magazine-requests', requireDb, magazineRequestRoutes);
    app.use('/api/training-books', requireDb, trainingBookRoutes);
    app.use('/api/training-requests', requireDb, trainingRequestRoutes);
    app.use('/api/training-follow-ups', requireDb, trainingFollowUpRoutes);
    app.use('/api/development-project-requests', requireDb, developmentProjectRequestRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/events', requireDb, eventRoutes);
    app.use('/api/blogs', requireDb, blogRoutes);
    app.use('/api/courses', requireDb, courseRoutes);
    app.use('/api/enrollments', requireDb, enrollmentRoutes);
    app.use('/api/fact-counter', requireDb, factCounterRoutes);

    // 404 handler (must be AFTER routes)
    app.use('*', (req, res) => {
      res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`
      });
    });

    // Global error handler (after routes)
    app.use((error, req, res, next) => {
      console.error('Global error handler:', error);

      res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });
  } catch (error) {
    console.error('❌ Startup error:', error);
    process.exit(1);
  }
}

start();

module.exports = app;