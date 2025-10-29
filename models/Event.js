const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  start: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.start;
      },
      message: 'End date must be after start date'
    }
  },
  color: {
    type: String,
    enum: ['default', 'green', 'red', 'azure', 'warning'],
    default: 'default'
  },
  address: {
    type: String,
    trim: true,
    maxlength: [300, 'Address cannot exceed 300 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [1500, 'Location URL cannot exceed 1500 characters']
  },
  organizer: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Organizer name cannot exceed 100 characters']
    },
    name_ar: String,
    email: String,
    phone: String
  },
  participants: {
    type: Number,
    min: [0, 'Participants cannot be negative'],
    default: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  category: {
    type: String,
    enum: ['meeting', 'training',"sunday-school", 'workshop', 'conference', 'personal', 'other'],
    default: 'other'
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  // Public Event Fields (optional - only needed when isPublic: true)
  title_ar: {
    type: String,
    trim: true,
    maxlength: [200, 'Arabic title cannot exceed 200 characters']
  },
  description_ar: {
    type: String,
    trim: true,
    maxlength: [2000, 'Arabic description cannot exceed 2000 characters']
  },
  address_ar: {
    type: String,
    trim: true,
    maxlength: [300, 'Arabic address cannot exceed 300 characters']
  },
  slug: {
    type: String,
    unique: true,
    sparse: true, // allows null values, only unique when present
    lowercase: true,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  imagePublicId: {
    type: String // Cloudinary public ID for deletion
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false // Default to internal calendar event
  },
  contactInfo: {
    email: String,
    phone: String,
    whatsapp: String,
    facebook: String,
    instagram: String
  },
  views: {
    type: Number,
    default: 0
  },
  recurring: {
    type: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none'
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    endDate: Date
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'notification'],
      required: true
    },
    time: {
      type: Number, // minutes before event
      required: true,
      min: 0
    }
  }],
  attachments: [{
    filename: String,
    url: String,
    size: Number
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Indexes for better query performance
eventSchema.index({ start: 1, end: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ slug: 1 });
eventSchema.index({ isPublic: 1, isFeatured: 1 });
eventSchema.index({ isPublic: 1, start: 1 });

// Virtual for event duration
eventSchema.virtual('duration').get(function() {
  return this.end - this.start;
});

// Virtual for formatted date range
eventSchema.virtual('dateRange').get(function() {
  const startDate = this.start.toLocaleDateString();
  const endDate = this.end.toLocaleDateString();
  return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
});

// Pre-save middleware
eventSchema.pre('save', function(next) {
  if (this.isModified('start') || this.isModified('end')) {
    if (this.end <= this.start) {
      return next(new Error('End date must be after start date'));
    }
  }
  
  // Auto-generate slug for public events if not provided
  if (this.isPublic && !this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  next();
});

// Static methods
eventSchema.statics.getUpcomingEvents = function(limit = 10) {
  return this.find({
    start: { $gte: new Date() },
    status: { $ne: 'cancelled' }
  })
  .sort({ start: 1 })
  .limit(limit)
  .populate('createdBy', 'name email');
};

eventSchema.statics.getEventsByDateRange = function(startDate, endDate) {
  return this.find({
    $or: [
      { start: { $gte: startDate, $lte: endDate } },
      { end: { $gte: startDate, $lte: endDate } },
      { start: { $lte: startDate }, end: { $gte: endDate } }
    ]
  }).sort({ start: 1 });
};

// Get public events (for website display)
eventSchema.statics.getPublicEvents = function(filters = {}) {
  const query = {
    isPublic: true,
    status: { $in: ['scheduled', 'confirmed'] }
  };
  
  if (filters.category) query.category = filters.category;
  if (filters.isFeatured !== undefined) query.isFeatured = filters.isFeatured;
  
  return this.find(query).sort({ start: 1 });
};

// Get featured events (for homepage)
eventSchema.statics.getFeaturedEvents = function(limit = 3) {
  return this.find({
    isPublic: true,
    isFeatured: true,
    status: { $in: ['scheduled', 'confirmed'] },
    start: { $gte: new Date() }
  })
  .sort({ start: 1 })
  .limit(limit);
};

// Get event by slug
eventSchema.statics.getBySlug = function(slug) {
  return this.findOne({ slug, isPublic: true })
    .populate('createdBy', 'name email');
};

// Instance methods
eventSchema.methods.isUpcoming = function() {
  return this.start > new Date();
};

eventSchema.methods.isOngoing = function() {
  const now = new Date();
  return this.start <= now && this.end >= now;
};

eventSchema.methods.isPast = function() {
  return this.end < new Date();
};

module.exports = mongoose.model('Event', eventSchema);
