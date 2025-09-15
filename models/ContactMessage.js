const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  phone: {
    type: String,
    trim: true,
    match: [
      /^[\+]?[0-9][\d]{7,15}$/,
      'Please provide a valid phone number'
    ]
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['general', 'book-order', 'support', 'partnership', 'feedback', 'complaint'],
    default: 'general'
  },
  bookTitle: {
    type: String,
    trim: true,
    maxlength: [200, 'Book title cannot exceed 200 characters']
  },
  bookAuthor: {
    type: String,
    trim: true,
    maxlength: [100, 'Book author cannot exceed 100 characters']
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  },
  quantity: {
    type: Number,
    min: [1, 'Quantity must be at least 1'],
    max: [100, 'Quantity cannot exceed 100']
  },
  preferredContactMethod: {
    type: String,
    enum: ['email', 'phone', 'either'],
    default: 'email'
  },
  status: {
    type: String,
    enum: ['new', 'read', 'in-progress', 'resolved', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  response: {
    content: {
      type: String,
      trim: true,
      maxlength: [2000, 'Response content cannot exceed 2000 characters']
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: {
      type: Date
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  source: {
    type: String,
    enum: ['website', 'email', 'phone', 'social-media', 'referral', 'other'],
    default: 'website'
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
contactMessageSchema.index({ email: 1 });
contactMessageSchema.index({ status: 1 });
contactMessageSchema.index({ type: 1 });
contactMessageSchema.index({ priority: 1 });
contactMessageSchema.index({ assignedTo: 1 });
contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ book: 1 });

// Text index for search
contactMessageSchema.index({
  name: 'text',
  email: 'text',
  subject: 'text',
  message: 'text',
  bookTitle: 'text',
  bookAuthor: 'text'
});

// Virtual for time since message
contactMessageSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
});

// Virtual for is new message
contactMessageSchema.virtual('isNew').get(function() {
  return this.status === 'new';
});

// Virtual for is urgent
contactMessageSchema.virtual('isUrgent').get(function() {
  return this.priority === 'urgent';
});

// Method to mark as read
contactMessageSchema.methods.markAsRead = function() {
  if (this.status === 'new') {
    this.status = 'read';
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to assign to user
contactMessageSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  if (this.status === 'new' || this.status === 'read') {
    this.status = 'in-progress';
  }
  return this.save();
};

// Method to respond to message
contactMessageSchema.methods.respond = function(content, userId) {
  this.response = {
    content,
    respondedBy: userId,
    respondedAt: new Date()
  };
  this.status = 'resolved';
  return this.save();
};

// Method to close message
contactMessageSchema.methods.close = function() {
  this.status = 'closed';
  return this.save();
};

// Method to add note
contactMessageSchema.methods.addNote = function(note) {
  const timestamp = new Date().toISOString();
  const newNote = `[${timestamp}] ${note}`;
  this.notes = this.notes ? `${this.notes}\n${newNote}` : newNote;
  return this.save();
};

// Static method to get contact message stats
contactMessageSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
        read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
        bookOrders: { $sum: { $cond: [{ $eq: ['$type', 'book-order'] }, 1, 0] } },
        general: { $sum: { $cond: [{ $eq: ['$type', 'general'] }, 1, 0] } },
        support: { $sum: { $cond: [{ $eq: ['$type', 'support'] }, 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || { 
    total: 0, 
    new: 0, 
    read: 0, 
    inProgress: 0, 
    resolved: 0, 
    closed: 0, 
    urgent: 0, 
    bookOrders: 0, 
    general: 0, 
    support: 0 
  };
};

// Static method to get recent messages
contactMessageSchema.statics.getRecentMessages = function(limit = 10) {
  return this.find({})
    .populate('book', 'title coverImageUrl author')
    .populate('book.author', 'name')
    .populate('assignedTo', 'name username')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get messages by status
contactMessageSchema.statics.getMessagesByStatus = function(status, options = {}) {
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = -1 
  } = options;
  
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };
  
  return this.find({ status })
    .populate('book', 'title coverImageUrl author')
    .populate('book.author', 'name')
    .populate('assignedTo', 'name username')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get book order messages
contactMessageSchema.statics.getBookOrders = function(options = {}) {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    sortBy = 'createdAt', 
    sortOrder = -1 
  } = options;
  
  const query = { type: 'book-order' };
  if (status) query.status = status;
  
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };
  
  return this.find(query)
    .populate('book', 'title coverImageUrl author price')
    .populate('book.author', 'name')
    .populate('assignedTo', 'name username')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to search contact messages
contactMessageSchema.statics.searchMessages = function(searchTerm, options = {}) {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    type, 
    priority, 
    assignedTo, 
    sortBy = 'createdAt', 
    sortOrder = -1 
  } = options;
  
  const query = {};
  
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }
  
  if (status) query.status = status;
  if (type) query.type = type;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;
  
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };
  
  return this.find(query)
    .populate('book', 'title coverImageUrl author')
    .populate('book.author', 'name')
    .populate('assignedTo', 'name username')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
