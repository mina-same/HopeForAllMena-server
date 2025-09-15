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
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  organizer: {
    type: String,
    trim: true,
    maxlength: [100, 'Organizer name cannot exceed 100 characters']
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
    enum: ['meeting', 'training', 'workshop', 'conference', 'personal', 'other'],
    default: 'other'
  },
  isAllDay: {
    type: Boolean,
    default: false
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
