const mongoose = require('mongoose');

const magazineRequestSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  
  // Church Information
  churchName: {
    type: String,
    required: [true, 'Church name is required'],
    trim: true,
    maxlength: [200, 'Church name cannot exceed 200 characters']
  },
  churchAddress: {
    type: String,
    required: [true, 'Church address is required'],
    trim: true,
    maxlength: [500, 'Church address cannot exceed 500 characters']
  },
  
  // Magazine Request Details
  magazines: [{
    magazineName: {
      type: String,
      required: [true, 'Magazine name is required'],
      trim: true,
      enum: [
        'The Great Book, the Book of Hope',
        'The Book of Hope',
        'The Gift That Changes Everything',
        'A Journey in the World of the Bible',
        'The Bible for Children',
        'The Path of Hope',
        'On the Edge'
      ]
    },
    numberOfCopies: {
      type: Number,
      required: [true, 'Number of copies is required'],
      min: [1, 'Number of copies must be at least 1'],
      max: [10000, 'Number of copies cannot exceed 10,000']
    }
  }],
  
  // Request Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  
  // Admin Notes
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  
  // Processing Information
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  
  // Fulfillment Information
  fulfillmentDate: {
    type: Date
  },
  trackingNumber: {
    type: String,
    trim: true,
    maxlength: [100, 'Tracking number cannot exceed 100 characters']
  },
  
  // Request Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Contact Preferences
  preferredContactMethod: {
    type: String,
    enum: ['phone', 'email', 'mail'],
    default: 'phone'
  },
  
  // Metadata
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
magazineRequestSchema.index({ status: 1, createdAt: -1 });
magazineRequestSchema.index({ churchName: 1 });
magazineRequestSchema.index({ magazineName: 1 });
magazineRequestSchema.index({ createdAt: -1 });
magazineRequestSchema.index({ priority: 1, status: 1 });

// Virtual for total copies requested (including additional magazines)
magazineRequestSchema.virtual('totalCopiesRequested').get(function() {
  let total = this.numberOfCopies || 0;
  
  if (this.anotherBook) {
    // Extract numbers from additional magazines string
    const matches = this.anotherBook.match(/\((\d+)\s+copies\)/g);
    if (matches) {
      matches.forEach(match => {
        const num = parseInt(match.match(/\d+/)[0]);
        total += num;
      });
    }
  }
  
  return total;
});

// Virtual for formatted request date
magazineRequestSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for status badge color
magazineRequestSchema.virtual('statusColor').get(function() {
  const colors = {
    pending: 'yellow',
    approved: 'blue',
    rejected: 'red',
    fulfilled: 'green',
    cancelled: 'gray'
  };
  return colors[this.status] || 'gray';
});

// Pre-save middleware to update processedAt when status changes
magazineRequestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending') {
    this.processedAt = new Date();
  }
  next();
});

// Static method to get requests by status
magazineRequestSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get pending requests
magazineRequestSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort({ priority: -1, createdAt: -1 });
};

// Static method to get requests by date range
magazineRequestSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

// Static method to get statistics
magazineRequestSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalCopies: { $sum: '$numberOfCopies' }
      }
    }
  ]);
  
  const totalRequests = await this.countDocuments();
  const pendingRequests = await this.countDocuments({ status: 'pending' });
  const fulfilledRequests = await this.countDocuments({ status: 'fulfilled' });
  
  return {
    totalRequests,
    pendingRequests,
    fulfilledRequests,
    statusBreakdown: stats,
    fulfillmentRate: totalRequests > 0 ? (fulfilledRequests / totalRequests * 100).toFixed(2) : 0
  };
};

// Instance method to approve request
magazineRequestSchema.methods.approve = function(adminId, notes) {
  this.status = 'approved';
  this.processedBy = adminId;
  this.processedAt = new Date();
  if (notes) this.adminNotes = notes;
  return this.save();
};

// Instance method to reject request
magazineRequestSchema.methods.reject = function(adminId, notes) {
  this.status = 'rejected';
  this.processedBy = adminId;
  this.processedAt = new Date();
  if (notes) this.adminNotes = notes;
  return this.save();
};

// Instance method to fulfill request
magazineRequestSchema.methods.fulfill = function(adminId, trackingNumber, notes) {
  this.status = 'fulfilled';
  this.processedBy = adminId;
  this.fulfillmentDate = new Date();
  if (trackingNumber) this.trackingNumber = trackingNumber;
  if (notes) this.adminNotes = notes;
  return this.save();
};

const MagazineRequest = mongoose.model('MagazineRequest', magazineRequestSchema);

module.exports = MagazineRequest;
