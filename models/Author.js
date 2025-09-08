const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  nameAr: {
    type: String,
    required: [true, 'Author Arabic name is required'],
    trim: true,
    maxlength: [100, 'Author Arabic name cannot exceed 100 characters']
  },
  biography: {
    type: String,
    required: [true, 'Author biography is required'],
    trim: true,
    maxlength: [2000, 'Biography cannot exceed 2000 characters']
  },
  biographyAr: {
    type: String,
    required: [true, 'Author Arabic biography is required'],
    trim: true,
    maxlength: [2000, 'Arabic biography cannot exceed 2000 characters']
  },
  avatarUrl: {
    type: String,
    trim: true,
    match: [
      /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i,
      'Please provide a valid image URL'
    ],
    default: null
  },
  booksCount: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
authorSchema.index({ name: 1 });
authorSchema.index({ nameAr: 1 });
authorSchema.index({ createdAt: -1 });

// Virtual for full name with proper formatting
authorSchema.virtual('displayName').get(function() {
  return this.name;
});

// Virtual for avatar URL with fallback
authorSchema.virtual('avatar').get(function() {
  return this.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=2194D1&color=fff&size=200`;
});

// Method to update books count
authorSchema.methods.updateBooksCount = async function() {
  const Book = mongoose.model('Book');
  const count = await Book.countDocuments({ author: this._id, status: 'published' });
  this.booksCount = count;
  return this.save();
};

// Method to update average rating
authorSchema.methods.updateAverageRating = async function() {
  const Book = mongoose.model('Book');
  const books = await Book.find({ author: this._id, status: 'published' });
  
  if (books.length === 0) {
    this.averageRating = 0;
    return this.save();
  }
  
  const totalRating = books.reduce((sum, book) => sum + (book.averageRating || 0), 0);
  this.averageRating = Math.round((totalRating / books.length) * 10) / 10;
  return this.save();
};

// Static method to get author stats
authorSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalBooks: { $sum: '$booksCount' },
        averageRating: { $avg: '$averageRating' }
      }
    }
  ]);
  
  return stats[0] || { 
    total: 0, 
    totalBooks: 0, 
    averageRating: 0 
  };
};

// Static method to search authors
authorSchema.statics.searchAuthors = function(searchTerm, options = {}) {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 } = options;
  
  const query = {};
  
  if (searchTerm) {
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { nameAr: { $regex: searchTerm, $options: 'i' } },
      { biography: { $regex: searchTerm, $options: 'i' } },
      { biographyAr: { $regex: searchTerm, $options: 'i' } }
    ];
  }
  
  
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };
  
  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Pre-save middleware to update books count
authorSchema.pre('save', async function(next) {
  if (this.isNew) {
    // For new authors, books count starts at 0
    this.booksCount = 0;
  }
  next();
});

module.exports = mongoose.model('Author', authorSchema);
