const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow null for guest reviews
  },
  guestInfo: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Guest name cannot exceed 100 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    }
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [100, 'Review title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Review content is required'],
    trim: true,
    maxlength: [1000, 'Review content cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  helpful: {
    type: Number,
    default: 0
  },
  notHelpful: {
    type: Number,
    default: 0
  },
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  moderatorNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Moderator notes cannot exceed 500 characters']
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
reviewSchema.index({ book: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ helpful: -1 });

// Compound index to ensure one review per user per book (for authenticated users only)
reviewSchema.index({ book: 1, user: 1 }, { 
  unique: true, 
  partialFilterExpression: { user: { $ne: null } } // Only apply to authenticated users
});

// Index for guest reviews to prevent duplicates by email
reviewSchema.index({ book: 1, 'guestInfo.email': 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { user: null }
});

// Virtual for helpful percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
  const total = this.helpful + this.notHelpful;
  if (total === 0) return 0;
  return Math.round((this.helpful / total) * 100);
});

// Virtual for time since review
reviewSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
});

// Method to mark as helpful
reviewSchema.methods.markHelpful = function() {
  this.helpful += 1;
  return this.save();
};

// Method to mark as not helpful
reviewSchema.methods.markNotHelpful = function() {
  this.notHelpful += 1;
  return this.save();
};

// Method to moderate review
reviewSchema.methods.moderate = async function(status, moderatorId, notes = '') {
  this.status = status;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderatorNotes = notes;
  
  await this.save();
  
  // Update book's average rating when review is approved or rejected
  if (status === 'approved' || status === 'rejected') {
    const Book = require('./Book');
    const book = await Book.findById(this.book);
    if (book) {
      await book.updateAverageRating();
    }
  }
  
  return this;
};

// Static method to get review stats
reviewSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        averageRating: { $avg: '$rating' },
        totalHelpful: { $sum: '$helpful' },
        totalNotHelpful: { $sum: '$notHelpful' },
        verifiedPurchases: { $sum: { $cond: ['$verifiedPurchase', 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || { 
    total: 0, 
    pending: 0, 
    approved: 0, 
    rejected: 0, 
    averageRating: 0, 
    totalHelpful: 0, 
    totalNotHelpful: 0, 
    verifiedPurchases: 0 
  };
};

// Static method to get reviews by book
reviewSchema.statics.getReviewsByBook = function(bookId, options = {}) {
  const { 
    page = 1, 
    limit = 10, 
    status = 'approved', 
    rating, 
    sortBy = 'createdAt', 
    sortOrder = -1 
  } = options;
  
  const query = { book: bookId };
  
  // Handle multiple statuses (comma-separated)
  if (status) {
    if (status.includes(',')) {
      query.status = { $in: status.split(',').map(s => s.trim()) };
    } else {
      query.status = status;
    }
  }
  
  if (rating) {
    query.rating = rating;
  }
  
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };
  
  return this.find(query)
    .populate('user', 'name username avatar')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get reviews by user
reviewSchema.statics.getReviewsByUser = function(userId, options = {}) {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    sortBy = 'createdAt', 
    sortOrder = -1 
  } = options;
  
  const query = { user: userId };
  
  if (status) {
    query.status = status;
  }
  
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };
  
  return this.find(query)
    .populate('book', 'title coverImageUrl author')
    .populate('book.author', 'name')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get pending reviews
reviewSchema.statics.getPendingReviews = function(options = {}) {
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = -1 
  } = options;
  
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };
  
  return this.find({ status: 'pending' })
    .populate('book', 'title coverImageUrl author')
    .populate('book.author', 'name')
    .populate('user', 'name username email')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to search reviews
reviewSchema.statics.searchReviews = function(searchTerm, options = {}) {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    rating, 
    book, 
    user, 
    sortBy = 'createdAt', 
    sortOrder = -1 
  } = options;
  
  const query = {};
  
  if (searchTerm) {
    query.$or = [
      { title: { $regex: searchTerm, $options: 'i' } },
      { content: { $regex: searchTerm, $options: 'i' } }
    ];
  }
  
  if (status) query.status = status;
  if (rating) query.rating = rating;
  if (book) query.book = book;
  if (user) query.user = user;
  
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };
  
  return this.find(query)
    .populate('book', 'title coverImageUrl author')
    .populate('book.author', 'name')
    .populate('user', 'name username')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Pre-save validation for guest reviews
reviewSchema.pre('save', function(next) {
  // If user is null, guestInfo must be provided
  if (!this.user && (!this.guestInfo || !this.guestInfo.name || !this.guestInfo.email)) {
    return next(new Error('Guest reviews must include name and email'));
  }
  
  // If user is provided, guestInfo should not be set
  if (this.user && this.guestInfo && (this.guestInfo.name || this.guestInfo.email)) {
    this.guestInfo = undefined;
  }
  
  next();
});

// Post-save middleware to update book's average rating
reviewSchema.post('save', async function() {
  if (this.status === 'approved') {
    const Book = mongoose.model('Book');
    const book = await Book.findById(this.book);
    if (book) {
      await book.updateAverageRating();
    }
  }
});

// Post-remove middleware to update book's average rating
reviewSchema.post('remove', async function() {
  const Book = mongoose.model('Book');
  const book = await Book.findById(this.book);
  if (book) {
    await book.updateAverageRating();
  }
});

module.exports = mongoose.model('Review', reviewSchema);
