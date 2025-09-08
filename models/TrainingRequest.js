const mongoose = require('mongoose');

const nearbyChurchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  responsiblePerson: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  }
});

const trainingRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
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
  serviceType: {
    type: String,
    required: true,
    enum: ['sunday-school', 'youth', 'other']
  },
  otherServiceType: {
    type: String,
    trim: true
  },
  numberOfServants: {
    type: Number,
    required: true,
    min: 1
  },
  numberOfServed: {
    type: Number,
    required: true,
    min: 1
  },
  suggestedDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
        return date >= twoWeeksFromNow;
      },
      message: 'Suggested date must be at least two weeks from today'
    }
  },
  nearbyChurches: [nearbyChurchSchema],
  status: {
    type: String,
    enum: ['pending', 'approved', 'scheduled', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedTrainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  confirmedDate: {
    type: Date
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

trainingRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TrainingRequest', trainingRequestSchema);
