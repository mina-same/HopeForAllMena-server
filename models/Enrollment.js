const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow public enrollments without user accounts
  },
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
    maxlength: [100, 'Student name cannot exceed 100 characters']
  },
  studentEmail: {
    type: String,
    required: [true, 'Student email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  studentPhone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
      message: 'Status must be pending, approved, rejected, cancelled, or completed'
    },
    default: 'pending'
  },
  enrollmentDate: {
    type: Date,
    default: Date.now,
    required: [true, 'Enrollment date is required']
  },
  approvedDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'paid', 'refunded', 'failed'],
      message: 'Payment status must be pending, paid, refunded, or failed'
    },
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    min: [0, 'Payment amount cannot be negative'],
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash', 'free'],
    default: 'free'
  },
  transactionId: {
    type: String,
    trim: true
  },
  motivation: {
    type: String,
    trim: true,
    maxlength: [1000, 'Motivation cannot exceed 1000 characters']
  },
  experience: {
    type: String,
    trim: true,
    maxlength: [1000, 'Experience cannot exceed 1000 characters']
  },
  expectations: {
    type: String,
    trim: true,
    maxlength: [1000, 'Expectations cannot exceed 1000 characters']
  },
  previousEducation: {
    type: String,
    trim: true,
    maxlength: [500, 'Previous education cannot exceed 500 characters']
  },
  occupation: {
    type: String,
    trim: true,
    maxlength: [100, 'Occupation cannot exceed 100 characters']
  },
  age: {
    type: Number,
    min: [13, 'Age must be at least 13'],
    max: [120, 'Age cannot exceed 120']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    default: 'prefer_not_to_say'
  },
  country: {
    type: String,
    trim: true,
    maxlength: [100, 'Country cannot exceed 100 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters']
  },
  timezone: {
    type: String,
    trim: true,
    maxlength: [50, 'Timezone cannot exceed 50 characters']
  },
  preferredLanguage: {
    type: String,
    default: 'English',
    trim: true,
    maxlength: [50, 'Preferred language cannot exceed 50 characters']
  },
  specialRequirements: {
    type: String,
    trim: true,
    maxlength: [500, 'Special requirements cannot exceed 500 characters']
  },
  progress: {
    completedLessons: {
      type: Number,
      default: 0,
      min: [0, 'Completed lessons cannot be negative']
    },
    totalLessons: {
      type: Number,
      default: 0,
      min: [0, 'Total lessons cannot be negative']
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Completion percentage cannot be negative'],
      max: [100, 'Completion percentage cannot exceed 100']
    },
    lastAccessDate: {
      type: Date
    }
  },
  grades: [{
    assignment: {
      type: String,
      required: true,
      trim: true
    },
    score: {
      type: Number,
      required: true,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100']
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [500, 'Feedback cannot exceed 500 characters']
    },
    gradedDate: {
      type: Date,
      default: Date.now
    }
  }],
  attendance: [{
    sessionDate: {
      type: Date,
      required: true
    },
    attended: {
      type: Boolean,
      required: true,
      default: false
    },
    duration: {
      type: Number, // in minutes
      min: [0, 'Duration cannot be negative']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    }
  }],
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedDate: {
      type: Date
    },
    certificateId: {
      type: String,
      trim: true
    },
    downloadUrl: {
      type: String,
      trim: true
    }
  },
  feedback: {
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    review: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review cannot exceed 1000 characters']
    },
    reviewDate: {
      type: Date
    },
    wouldRecommend: {
      type: Boolean
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
enrollmentSchema.index({ courseId: 1 });
enrollmentSchema.index({ studentId: 1 });
enrollmentSchema.index({ studentEmail: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrollmentDate: -1 });
enrollmentSchema.index({ paymentStatus: 1 });
enrollmentSchema.index({ createdAt: -1 });
enrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true }); // Prevent duplicate enrollments

// Virtual for enrollment duration
enrollmentSchema.virtual('enrollmentDuration').get(function() {
  if (this.completedDate) {
    return Math.ceil((this.completedDate - this.enrollmentDate) / (1000 * 60 * 60 * 24)); // days
  }
  return Math.ceil((new Date() - this.enrollmentDate) / (1000 * 60 * 60 * 24)); // days
});

// Virtual for overall grade
enrollmentSchema.virtual('overallGrade').get(function() {
  if (this.grades.length === 0) return null;
  const totalScore = this.grades.reduce((sum, grade) => sum + grade.score, 0);
  return Math.round(totalScore / this.grades.length);
});

// Virtual for attendance rate
enrollmentSchema.virtual('attendanceRate').get(function() {
  if (this.attendance.length === 0) return null;
  const attendedSessions = this.attendance.filter(session => session.attended).length;
  return Math.round((attendedSessions / this.attendance.length) * 100);
});

// Pre-save middleware to update progress percentage
enrollmentSchema.pre('save', function(next) {
  if (this.progress.totalLessons > 0) {
    this.progress.completionPercentage = Math.round(
      (this.progress.completedLessons / this.progress.totalLessons) * 100
    );
  }
  
  // Auto-complete if 100% progress
  if (this.progress.completionPercentage === 100 && this.status === 'approved') {
    this.status = 'completed';
    this.completedDate = new Date();
  }
  
  next();
});

// Static method to get enrollment statistics
enrollmentSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$paymentAmount', 0] } }
      }
    }
  ]);
  
  return stats[0] || { 
    total: 0, 
    pending: 0, 
    approved: 0, 
    rejected: 0, 
    completed: 0, 
    cancelled: 0,
    totalRevenue: 0
  };
};

// Static method to search enrollments
enrollmentSchema.statics.searchEnrollments = function(searchTerm, options = {}) {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    courseId,
    paymentStatus,
    sortBy = 'createdAt', 
    sortOrder = -1 
  } = options;
  
  const query = {};
  
  if (searchTerm) {
    query.$or = [
      { studentName: { $regex: searchTerm, $options: 'i' } },
      { studentEmail: { $regex: searchTerm, $options: 'i' } },
      { studentPhone: { $regex: searchTerm, $options: 'i' } }
    ];
  }
  
  if (status) query.status = status;
  if (courseId) query.courseId = courseId;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };
  
  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('courseId', 'title instructor startDate endDate price')
    .populate('studentId', 'name email')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
};

// Static method to get enrollments by course
enrollmentSchema.statics.getEnrollmentsByCourse = function(courseId, status = null) {
  const query = { courseId };
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('studentId', 'name email')
    .populate('createdBy', 'name email');
};

// Static method to get enrollments by student
enrollmentSchema.statics.getEnrollmentsByStudent = function(studentId, status = null) {
  const query = { studentId };
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('courseId', 'title instructor startDate endDate price institution')
    .populate('createdBy', 'name email');
};

// Method to approve enrollment
enrollmentSchema.methods.approve = function(approvedBy) {
  this.status = 'approved';
  this.approvedDate = new Date();
  this.updatedBy = approvedBy;
  return this.save();
};

// Method to reject enrollment
enrollmentSchema.methods.reject = function(rejectedBy) {
  this.status = 'rejected';
  this.updatedBy = rejectedBy;
  return this.save();
};

// Method to complete enrollment
enrollmentSchema.methods.complete = function(completedBy) {
  this.status = 'completed';
  this.completedDate = new Date();
  this.updatedBy = completedBy;
  return this.save();
};

// Method to add grade
enrollmentSchema.methods.addGrade = function(assignment, score, feedback = '') {
  this.grades.push({
    assignment,
    score,
    feedback,
    gradedDate: new Date()
  });
  return this.save();
};

// Method to record attendance
enrollmentSchema.methods.recordAttendance = function(sessionDate, attended, duration = 0, notes = '') {
  this.attendance.push({
    sessionDate,
    attended,
    duration,
    notes
  });
  
  if (attended) {
    this.progress.lastAccessDate = new Date();
  }
  
  return this.save();
};

// Method to update progress
enrollmentSchema.methods.updateProgress = function(completedLessons, totalLessons) {
  this.progress.completedLessons = completedLessons;
  this.progress.totalLessons = totalLessons;
  this.progress.lastAccessDate = new Date();
  return this.save();
};

// Method to issue certificate
enrollmentSchema.methods.issueCertificate = function(certificateId, downloadUrl) {
  this.certificate.issued = true;
  this.certificate.issuedDate = new Date();
  this.certificate.certificateId = certificateId;
  this.certificate.downloadUrl = downloadUrl;
  return this.save();
};

// Method to add feedback
enrollmentSchema.methods.addFeedback = function(rating, review, wouldRecommend) {
  this.feedback.rating = rating;
  this.feedback.review = review;
  this.feedback.reviewDate = new Date();
  this.feedback.wouldRecommend = wouldRecommend;
  return this.save();
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);
