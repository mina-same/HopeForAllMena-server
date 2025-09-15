const mongoose = require('mongoose');

const factCounterSchema = new mongoose.Schema({
  members: {
    type: Number,
    required: true,
    default: 8860
  },
  leadersTraining: {
    type: Number,
    required: true,
    default: 456
  },
  publishedBooks: {
    type: Number,
    required: true,
    default: 55
  },
  givenMagazines: {
    type: Number,
    required: true,
    default: 10000
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one document exists (singleton pattern)
factCounterSchema.statics.getInstance = async function() {
  let instance = await this.findOne();
  if (!instance) {
    instance = await this.create({});
  }
  return instance;
};

factCounterSchema.statics.updateStats = async function(updates, userId) {
  let instance = await this.getInstance();
  
  // Update only provided fields
  Object.keys(updates).forEach(key => {
    if (instance.schema.paths[key] && key !== '_id' && key !== '__v') {
      instance[key] = updates[key];
    }
  });
  
  instance.lastUpdated = new Date();
  instance.updatedBy = userId;
  
  return await instance.save();
};

const FactCounter = mongoose.model('FactCounter', factCounterSchema);

module.exports = FactCounter;
