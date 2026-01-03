const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Course title cannot exceed 200 characters']
  },
  titleAr: {
    type: String,
    trim: true,
    maxlength: [200, 'Arabic title cannot exceed 200 characters']
  },
  titleEn: {
    type: String,
    trim: true,
    maxlength: [200, 'English title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  descriptionAr: {
    type: String,
    trim: true,
    maxlength: [2000, 'Arabic description cannot exceed 2000 characters']
  },
  descriptionEn: {
    type: String,
    trim: true,
    maxlength: [2000, 'English description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  shortDescriptionAr: {
    type: String,
    trim: true,
    maxlength: [300, 'Arabic short description cannot exceed 300 characters']
  },
  shortDescriptionEn: {
    type: String,
    trim: true,
    maxlength: [300, 'English short description cannot exceed 300 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  categoryAr: {
    type: String,
    trim: true,
    maxlength: [100, 'Arabic category cannot exceed 100 characters']
  },
  categoryEn: {
    type: String,
    trim: true,
    maxlength: [100, 'English category cannot exceed 100 characters']
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [100, 'Subcategory cannot exceed 100 characters']
  },
  subcategoryAr: {
    type: String,
    trim: true,
    maxlength: [100, 'Arabic subcategory cannot exceed 100 characters']
  },
  subcategoryEn: {
    type: String,
    trim: true,
    maxlength: [100, 'English subcategory cannot exceed 100 characters']
  },
  level: {
    type: String,
    required: [true, 'Course level is required'],
    enum: {
      values: ['beginner', 'intermediate', 'advanced'],
      message: 'Level must be beginner, intermediate, or advanced'
    },
    default: 'beginner'
  },
  format: {
    type: String,
    required: [true, 'Course format is required'],
    enum: {
      values: ['online', 'offline', 'hybrid'],
      message: 'Format must be online, offline, or hybrid'
    },
    default: 'online'
  },
  duration: {
    type: String,
    trim: true,
    maxlength: [100, 'Duration cannot exceed 100 characters']
  },
  durationAr: {
    type: String,
    trim: true,
    maxlength: [100, 'Arabic duration cannot exceed 100 characters']
  },
  durationEn: {
    type: String,
    trim: true,
    maxlength: [100, 'English duration cannot exceed 100 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  currency: {
    type: String,
    default: 'EGP',
    maxlength: [5, 'Currency symbol cannot exceed 5 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  instructor: {
    type: String,
    required: [true, 'Instructor name is required'],
    trim: true,
    maxlength: [100, 'Instructor name cannot exceed 100 characters']
  },
  instructorAr: {
    type: String,
    trim: true,
    maxlength: [100, 'Arabic instructor name cannot exceed 100 characters']
  },
  instructorEn: {
    type: String,
    trim: true,
    maxlength: [100, 'English instructor name cannot exceed 100 characters']
  },
  institution: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
      maxlength: [200, 'Institution name cannot exceed 200 characters']
    },
    nameAr: {
      type: String,
      trim: true,
      maxlength: [200, 'Arabic institution name cannot exceed 200 characters']
    },
    nameEn: {
      type: String,
      trim: true,
      maxlength: [200, 'English institution name cannot exceed 200 characters']
    },
    logo: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    }
  },
  maxStudents: {
    type: Number,
    required: [true, 'Maximum students is required'],
    min: [1, 'Maximum students must be at least 1'],
    default: 20
  },
  availableSeats: {
    type: Number,
    required: [true, 'Available seats is required'],
    min: [0, 'Available seats cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.maxStudents;
      },
      message: 'Available seats cannot exceed maximum students'
    }
  },
  totalEnrollments: {
    type: Number,
    default: 0,
    min: [0, 'Total enrollments cannot be negative']
  },
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: [0, 'Total ratings cannot be negative']
  },
  imageUrl: {
    type: String,
    default: '',
    trim: true
  },
  prerequisites: [{
    type: String,
    trim: true,
    maxlength: [200, 'Prerequisite cannot exceed 200 characters']
  }],
  certification: {
    type: String,
    default: 'Certificate of Completion',
    trim: true,
    maxlength: [200, 'Certification cannot exceed 200 characters']
  },
  syllabus: [{
    week: {
      type: Number,
      required: true,
      min: [1, 'Week must be at least 1']
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Syllabus title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Syllabus description cannot exceed 500 characters']
    },
    topics: [{
      type: String,
      trim: true,
      maxlength: [100, 'Topic cannot exceed 100 characters']
    }]
  }],
  schedule: {
    type: String,
    default: 'TBD',
    trim: true,
    maxlength: [200, 'Schedule cannot exceed 200 characters']
  },
  language: {
    type: String,
    default: 'English',
    trim: true,
    maxlength: [50, 'Language cannot exceed 50 characters']
  },
  // Age requirements
  minAge: {
    type: Number,
    min: [0, 'Minimum age cannot be negative']
  },
  maxAge: {
    type: Number,
    min: [0, 'Maximum age cannot be negative']
  },
  // Diploma/Program structure
  diplomaLevels: [{
    level: {
      type: Number,
      required: true,
      min: [1, 'Level must be at least 1']
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Level title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Level description cannot exceed 1000 characters']
    }
  }],
  // Study hours and structure
  totalHours: {
    type: Number,
    min: [0, 'Total hours cannot be negative']
  },
  onlinePercentage: {
    type: Number,
    min: [0, 'Online percentage cannot be negative'],
    max: [100, 'Online percentage cannot exceed 100']
  },
  offlinePercentage: {
    type: Number,
    min: [0, 'Offline percentage cannot be negative'],
    max: [100, 'Offline percentage cannot exceed 100']
  },
  studyStructure: {
    semesters: {
      type: Number,
      min: [0, 'Number of semesters cannot be negative']
    },
    hasSummerCourse: {
      type: Boolean,
      default: false
    },
    hasGraduationProject: {
      type: Boolean,
      default: false
    },
    hasGraduationCeremony: {
      type: Boolean,
      default: false
    }
  },
  // Weekly schedule details
  weeklySchedule: {
    day: {
      type: String,
      trim: true,
      maxlength: [20, 'Day cannot exceed 20 characters']
    },
    startTime: {
      type: String,
      trim: true,
      maxlength: [10, 'Start time cannot exceed 10 characters']
    },
    endTime: {
      type: String,
      trim: true,
      maxlength: [10, 'End time cannot exceed 10 characters']
    },
    duration: {
      type: Number, // in minutes
      min: [0, 'Duration cannot be negative']
    },
    platform: {
      type: String,
      trim: true,
      maxlength: [50, 'Platform cannot exceed 50 characters']
    }
  },
  // Attendance policy
  attendancePolicy: {
    allowedAbsencesPerMonth: {
      type: Number,
      default: 1,
      min: [0, 'Allowed absences cannot be negative']
    },
    dismissalAfterAbsences: {
      type: Number,
      default: 2,
      min: [0, 'Dismissal threshold cannot be negative']
    },
    requiresExcuse: {
      type: Boolean,
      default: true
    }
  },
  // Payment and pricing
  paymentInstallments: {
    enabled: {
      type: Boolean,
      default: false
    },
    numberOfInstallments: {
      type: Number,
      min: [1, 'Number of installments must be at least 1'],
      default: 1
    },
    installmentAmount: {
      type: Number,
      min: [0, 'Installment amount cannot be negative']
    }
  },
  discountedPrice: {
    type: Number,
    min: [0, 'Discounted price cannot be negative']
  },
  actualPrice: {
    type: Number,
    min: [0, 'Actual price cannot be negative']
  },
  // Requirements
  requiresReferenceLetter: {
    type: Boolean,
    default: false
  },
  referenceLetterFrom: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference letter from cannot exceed 100 characters']
  },
  // Certificate issuer
  certificateIssuer: {
    type: String,
    trim: true,
    maxlength: [200, 'Certificate issuer cannot exceed 200 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'published', 'archived', 'cancelled'],
      message: 'Status must be draft, published, archived, or cancelled'
    },
    default: 'published'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
courseSchema.index({ title: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ format: 1 });
courseSchema.index({ startDate: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ featured: -1 });
courseSchema.index({ averageRating: -1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ 'institution.name': 1 });

// Virtual for enrollment percentage
courseSchema.virtual('enrollmentPercentage').get(function() {
  return this.maxStudents > 0 ? Math.round((this.totalEnrollments / this.maxStudents) * 100) : 0;
});

// Virtual for availability status
courseSchema.virtual('isAvailable').get(function() {
  return this.availableSeats > 0 && this.status === 'published' && new Date() < this.startDate;
});

// Virtual for course status
courseSchema.virtual('courseStatus').get(function() {
  const now = new Date();
  if (now < this.startDate) return 'upcoming';
  if (now > this.endDate) return 'completed';
  return 'ongoing';
});

// Pre-save middleware to update available seats
courseSchema.pre('save', function(next) {
  if (this.isModified('totalEnrollments') || this.isModified('maxStudents')) {
    this.availableSeats = Math.max(0, this.maxStudents - this.totalEnrollments);
  }
  next();
});

// Static method to get course statistics
courseSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
        draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
        archived: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } },
        totalEnrollments: { $sum: '$totalEnrollments' },
        averagePrice: { $avg: '$price' },
        averageRating: { $avg: '$averageRating' }
      }
    }
  ]);
  
  return stats[0] || { 
    total: 0, 
    published: 0, 
    draft: 0, 
    archived: 0, 
    totalEnrollments: 0, 
    averagePrice: 0, 
    averageRating: 0 
  };
};

// Static method to search courses
courseSchema.statics.searchCourses = function(searchTerm, options = {}) {
  const { 
    page = 1, 
    limit = 10, 
    category, 
    level, 
    format, 
    priceRange, 
    rating,
    institution,
    status = 'published',
    sortBy = 'createdAt', 
    sortOrder = -1 
  } = options;
  
  const query = { status };
  
  if (searchTerm) {
    query.$or = [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { instructor: { $regex: searchTerm, $options: 'i' } },
      { category: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ];
  }
  
  if (category && category !== 'all') query.category = category;
  if (level && level !== 'all') query.level = level;
  if (format && format !== 'all') query.format = format;
  if (institution && institution !== 'all') query['institution.name'] = institution;
  
  if (priceRange && priceRange !== 'all') {
    switch (priceRange) {
      case 'free':
        query.price = 0;
        break;
      case 'under-500':
        query.price = { $gt: 0, $lt: 500 };
        break;
      case '500-1000':
        query.price = { $gte: 500, $lt: 1000 };
        break;
      case '1000-2000':
        query.price = { $gte: 1000, $lt: 2000 };
        break;
      case 'over-2000':
        query.price = { $gte: 2000 };
        break;
    }
  }
  
  if (rating && rating !== 'all') {
    query.averageRating = { $gte: parseFloat(rating) };
  }
  
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };
  
  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
};

// Static method to get featured courses
courseSchema.statics.getFeaturedCourses = function(limit = 6) {
  return this.find({ 
    status: 'published', 
    featured: true,
    startDate: { $gt: new Date() }
  })
    .sort({ averageRating: -1, createdAt: -1 })
    .limit(limit)
    .populate('createdBy', 'name email');
};

// Static method to get courses by category
courseSchema.statics.getCoursesByCategory = function(category, limit = 10) {
  return this.find({ 
    status: 'published', 
    category: category 
  })
    .sort({ averageRating: -1, createdAt: -1 })
    .limit(limit)
    .populate('createdBy', 'name email');
};

// Method to update rating
courseSchema.methods.updateRating = function(newRating) {
  const totalScore = this.averageRating * this.totalRatings + newRating;
  this.totalRatings += 1;
  this.averageRating = totalScore / this.totalRatings;
  return this.save();
};

// Method to increment enrollment
courseSchema.methods.incrementEnrollment = function() {
  if (this.availableSeats > 0) {
    this.totalEnrollments += 1;
    this.availableSeats = Math.max(0, this.maxStudents - this.totalEnrollments);
    return this.save();
  }
  throw new Error('No available seats');
};

// Method to decrement enrollment
courseSchema.methods.decrementEnrollment = function() {
  if (this.totalEnrollments > 0) {
    this.totalEnrollments -= 1;
    this.availableSeats = Math.max(0, this.maxStudents - this.totalEnrollments);
    return this.save();
  }
  throw new Error('No enrollments to remove');
};

module.exports = mongoose.model('Course', courseSchema);
