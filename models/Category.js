const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name_en: {
    type: String,
    required: [true, 'Category name (English) is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  name_ar: {
    type: String,
    required: [true, 'Category name (Arabic) is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description_en: {
    type: String,
    required: [true, 'Category description (English) is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  description_ar: {
    type: String,
    required: [true, 'Category description (Arabic) is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  icon: {
    type: String,
    trim: true,
    default: 'Book'
  },
  color: {
    type: String,
    trim: true,
    default: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isSubcategory: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  booksCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
categorySchema.index({ name_en: 1 });
categorySchema.index({ name_ar: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ status: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ sortOrder: 1 });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Virtual for books in this category
categorySchema.virtual('books', {
  ref: 'Book',
  localField: '_id',
  foreignField: 'category'
});

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name_en') && !this.slug) {
    this.slug = this.name_en
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  
  // Check if this is a subcategory
  if (this.parentCategory) {
    this.isSubcategory = true;
  }
  
  next();
});

// Method to update books count
categorySchema.methods.updateBooksCount = async function() {
  const Book = mongoose.model('Book');
  const count = await Book.countDocuments({ 
    category: this._id, 
    status: 'published' 
  });
  this.booksCount = count;
  return this.save();
};

// Static method to get category stats
categorySchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
        subcategories: { $sum: { $cond: ['$isSubcategory', 1, 0] } },
        totalBooks: { $sum: '$booksCount' }
      }
    }
  ]);
  
  return stats[0] || { 
    total: 0, 
    active: 0, 
    inactive: 0, 
    subcategories: 0, 
    totalBooks: 0 
  };
};

// Static method to get category hierarchy
categorySchema.statics.getHierarchy = async function() {
  const categories = await this.find({ status: 'active' })
    .populate('subcategories')
    .sort({ sortOrder: 1, name: 1 });
  
  return categories.filter(cat => !cat.isSubcategory);
};

// Static method to search categories
categorySchema.statics.searchCategories = function(searchTerm, options = {}) {
  const { page = 1, limit = 10, status, featured, parentCategory, sortBy = 'sortOrder', sortOrder = 1 } = options;
  
  const query = {};
  
  if (searchTerm) {
    query.$or = [
      { name_en: { $regex: searchTerm, $options: 'i' } },
      { name_ar: { $regex: searchTerm, $options: 'i' } },
      { description_en: { $regex: searchTerm, $options: 'i' } },
      { description_ar: { $regex: searchTerm, $options: 'i' } },
      { slug: { $regex: searchTerm, $options: 'i' } }
    ];
  }
  
  if (status) query.status = status;
  if (parentCategory) query.parentCategory = parentCategory;
  
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };
  
  return this.find(query)
    .populate('parentCategory', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Category', categorySchema);
