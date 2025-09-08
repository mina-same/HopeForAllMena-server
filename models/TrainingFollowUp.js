const mongoose = require('mongoose');

const bookRequestSchema = new mongoose.Schema({
  bookName: {
    type: String,
    required: true,
    trim: true
  },
  partName: {
    type: String,
    required: true,
    trim: true
  },
  copies: {
    type: Number,
    required: true,
    min: 1
  }
});

const tshirtSizeSchema = new mongoose.Schema({
  size6: {
    type: Number,
    default: 0,
    min: 0
  },
  size8: {
    type: Number,
    default: 0,
    min: 0
  },
  size10: {
    type: Number,
    default: 0,
    min: 0
  },
  sizeL: {
    type: Number,
    default: 0,
    min: 0
  },
  sizeXL: {
    type: Number,
    default: 0,
    min: 0
  },
  sizeXXL: {
    type: Number,
    default: 0,
    min: 0
  }
});

const trainingFollowUpSchema = new mongoose.Schema({
  trainerName: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  churchName: {
    type: String,
    required: true,
    trim: true
  },
  churchAddress: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  numberOfServed: {
    type: Number,
    required: true,
    min: 1
  },
  books: {
    type: [bookRequestSchema],
    required: true,
    validate: {
      validator: function(books) {
        return books && books.length > 0;
      },
      message: 'At least one book is required'
    }
  },
  servedListFile: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String
  },
  tshirtSizes: {
    type: tshirtSizeSchema,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  originalTrainingRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingRequest'
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

trainingFollowUpSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TrainingFollowUp', trainingFollowUpSchema);
