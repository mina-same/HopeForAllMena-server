const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Book title cannot exceed 200 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
    required: [true, 'Author is required']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  description: {
    type: String,
    required: [true, 'Book description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    trim: true,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  coverImageUrl: {
    type: String,
    required: [true, 'Cover image URL is required'],
    trim: true,
    match: [
      /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i,
      'Please provide a valid image URL'
    ]
  },
  pages: {
    type: Number,
    min: [1, 'Pages must be at least 1'],
    max: [10000, 'Pages cannot exceed 10000']
  },
  language: {
    type: String,
    required: [true, 'Language is required'],
    trim: true,
    default: 'English'
  },
  publicationYear: {
    type: Number,
    required: [true, 'Publication year is required'],
    min: [1000, 'Publication year must be at least 1000'],
    max: [new Date().getFullYear() + 10, 'Publication year cannot be more than 10 years in the future']
  },
  status: {
    type: String,
    enum: ['published', 'not-published'],
    default: 'not-published'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalViews: {
    type: Number,
    default: 0
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  format: {
    type: String,
    enum: ['paperback', 'hardcover'],
    default: 'paperback'
  },
  ageGroup: {
    type: String,
    enum: ['children', 'young-adult', 'adult', 'all-ages'],
    default: 'adult'
  },
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  // Arabic fields
  titleAr: {
    type: String,
    required: [true, 'Arabic title is required'],
    trim: true,
    maxlength: [200, 'Arabic title cannot exceed 200 characters']
  },
  descriptionAr: {
    type: String,
    required: [true, 'Arabic description is required'],
    trim: true,
    maxlength: [2000, 'Arabic description cannot exceed 2000 characters']
  },
  shortDescriptionAr: {
    type: String,
    required: [true, 'Arabic short description is required'],
    trim: true,
    maxlength: [300, 'Arabic short description cannot exceed 300 characters']
  },
  metaTitleAr: {
    type: String,
    trim: true,
    maxlength: [60, 'Arabic meta title cannot exceed 60 characters']
  },
  metaDescriptionAr: {
    type: String,
    trim: true,
    maxlength: [160, 'Arabic meta description cannot exceed 160 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
bookSchema.index({ title: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ category: 1 });
bookSchema.index({ status: 1 });
bookSchema.index({ publicationYear: -1 });
bookSchema.index({ averageRating: -1 });
bookSchema.index({ totalSales: -1 });
bookSchema.index({ createdAt: -1 });

// Text index for search
bookSchema.index({
  title: 'text',
  titleAr: 'text',
  description: 'text',
  descriptionAr: 'text',
  shortDescription: 'text',
  shortDescriptionAr: 'text',
  tags: 'text'
});

// Virtual for availability status
bookSchema.virtual('isAvailable').get(function() {
  return this.status === 'published';
});

// Method to update average rating
bookSchema.methods.updateAverageRating = async function() {
  const Review = mongoose.model('Review');
  const reviews = await Review.find({ book: this._id, status: 'approved' });
  
  if (reviews.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
  } else {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
    this.totalReviews = reviews.length;
  }
  
  return this.save();
};

// Method to increment views
bookSchema.methods.incrementViews = function() {
  this.totalViews += 1;
  return this.save();
};

// Method to increment sales
bookSchema.methods.incrementSales = function(quantity = 1) {
  this.totalSales += quantity;
  return this.save();
};

// Static method to get book stats
bookSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
        notPublished: { $sum: { $cond: [{ $eq: ['$status', 'not-published'] }, 1, 0] } },
        totalSales: { $sum: '$totalSales' },
        totalViews: { $sum: '$totalViews' },
        averageRating: { $avg: '$averageRating' }
      }
    }
  ]);
  
  return stats[0] || { 
    total: 0, 
    published: 0, 
    notPublished: 0, 
    totalSales: 0, 
    totalViews: 0, 
    averageRating: 0 
  };
};

// Static method to search books
bookSchema.statics.searchBooks = function(searchTerm, options = {}) {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    category, 
    author, 
    minRating,
    sortBy = 'createdAt', 
    sortOrder = -1 
  } = options;
  
  const query = {};
  
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }
  
  if (status) query.status = status;
  if (category) query.category = category;
  if (author) query.author = author;
  
  if (minRating !== undefined) {
    query.averageRating = { $gte: minRating };
  }
  
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };
  
  return this.find(query)
    .populate({
      path: 'author',
      select: 'name nameAr avatarUrl biography biographyAr'
    })
    .populate('category', 'name slug color')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get recent books
bookSchema.statics.getRecentBooks = function(limit = 10) {
  return this.find({ 
    status: 'published'
  })
    .populate({
      path: 'author',
      select: 'name nameAr avatarUrl biography biographyAr'
    })
    .populate('category', 'name slug color')
    .sort({ publicationYear: -1, createdAt: -1 })
    .limit(limit);
};

// Middleware to update author and category book counts
bookSchema.post('save', async function(doc) {
  try {
    const Author = mongoose.model('Author');
    const Category = mongoose.model('Category');
    
    // Update author book count
    if (doc.author) {
      const authorBookCount = await mongoose.model('Book').countDocuments({ 
        author: doc.author, 
        status: 'published' 
      });
      await Author.findByIdAndUpdate(doc.author, { booksCount: authorBookCount });
    }
    
    // Update category book count
    if (doc.category) {
      const categoryBookCount = await mongoose.model('Book').countDocuments({ 
        category: doc.category, 
        status: 'published' 
      });
      await Category.findByIdAndUpdate(doc.category, { booksCount: categoryBookCount });
    }
  } catch (error) {
    console.error('Error updating book counts after save:', error);
  }
});

// Middleware to update counts when book is deleted
bookSchema.post('findOneAndDelete', async function(doc) {
  if (!doc) return;
  
  try {
    const Author = mongoose.model('Author');
    const Category = mongoose.model('Category');
    
    // Update author book count
    if (doc.author) {
      const authorBookCount = await mongoose.model('Book').countDocuments({ 
        author: doc.author, 
        status: 'published' 
      });
      await Author.findByIdAndUpdate(doc.author, { booksCount: authorBookCount });
    }
    
    // Update category book count
    if (doc.category) {
      const categoryBookCount = await mongoose.model('Book').countDocuments({ 
        category: doc.category, 
        status: 'published' 
      });
      await Category.findByIdAndUpdate(doc.category, { booksCount: categoryBookCount });
    }
  } catch (error) {
    console.error('Error updating book counts after delete:', error);
  }
});

// Middleware to update counts when book is updated
bookSchema.post('findOneAndUpdate', async function(doc) {
  if (!doc) return;
  
  try {
    const Author = mongoose.model('Author');
    const Category = mongoose.model('Category');
    
    // Update author book count
    if (doc.author) {
      const authorBookCount = await mongoose.model('Book').countDocuments({ 
        author: doc.author, 
        status: 'published' 
      });
      await Author.findByIdAndUpdate(doc.author, { booksCount: authorBookCount });
    }
    
    // Update category book count
    if (doc.category) {
      const categoryBookCount = await mongoose.model('Book').countDocuments({ 
        category: doc.category, 
        status: 'published' 
      });
      await Category.findByIdAndUpdate(doc.category, { booksCount: categoryBookCount });
    }
  } catch (error) {
    console.error('Error updating book counts after update:', error);
  }
});

module.exports = mongoose.model('Book', bookSchema);
