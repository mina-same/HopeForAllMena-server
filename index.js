const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

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
const uploadRoutes = require('./routes/upload');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || ['http://localhost:8000', 'http://localhost:8001'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Logging middleware
app.use(morgan('combined'));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: process.env.DB_NAME || 'azino_publishing'
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
  console.log('📊 Database:', mongoose.connection.db.databaseName);
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact-messages', contactMessageRoutes);
app.use('/api/magazine-requests', magazineRequestRoutes);
app.use('/api/training-books', trainingBookRoutes);
app.use('/api/training-requests', trainingRequestRoutes);
app.use('/api/training-follow-ups', trainingFollowUpRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Azino Publishing House API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.statusCode || 500).json({
    status: 'error',
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});