const TrainingRequest = require('../models/TrainingRequest');

// Get all training requests (Admin only)
const getAllTrainingRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = status ? { status } : {};
    
    const requests = await TrainingRequest.find(query)
      .populate('assignedTrainer', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TrainingRequest.countDocuments(query);

    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching training requests', error: error.message });
  }
};

// Get training request by ID
const getTrainingRequestById = async (req, res) => {
  try {
    const request = await TrainingRequest.findById(req.params.id)
      .populate('assignedTrainer', 'name email');
    
    if (!request) {
      return res.status(404).json({ message: 'Training request not found' });
    }
    
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching training request', error: error.message });
  }
};

// Create new training request
const createTrainingRequest = async (req, res) => {
  try {
    const {
      name,
      churchName,
      churchAddress,
      serviceType,
      otherServiceType,
      numberOfServants,
      numberOfServed,
      suggestedDate,
      nearbyChurches
    } = req.body;

    const trainingRequest = new TrainingRequest({
      name,
      churchName,
      churchAddress,
      serviceType,
      otherServiceType,
      numberOfServants: parseInt(numberOfServants),
      numberOfServed: parseInt(numberOfServed),
      suggestedDate: new Date(suggestedDate),
      nearbyChurches: nearbyChurches || []
    });

    const savedRequest = await trainingRequest.save();
    res.status(201).json(savedRequest);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error creating training request', error: error.message });
  }
};

// Update training request status (Admin only)
const updateTrainingRequestStatus = async (req, res) => {
  try {
    const { status, assignedTrainer, confirmedDate, notes } = req.body;

    const updateData = {
      status,
      notes,
      updatedAt: Date.now()
    };

    if (assignedTrainer) {
      updateData.assignedTrainer = assignedTrainer;
    }

    if (confirmedDate) {
      updateData.confirmedDate = new Date(confirmedDate);
    }

    const updatedRequest = await TrainingRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTrainer', 'name email');

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Training request not found' });
    }

    res.json(updatedRequest);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error updating training request', error: error.message });
  }
};

// Update training request (Admin only)
const updateTrainingRequest = async (req, res) => {
  try {
    const {
      name,
      churchName,
      churchAddress,
      serviceType,
      otherServiceType,
      numberOfServants,
      numberOfServed,
      suggestedDate,
      nearbyChurches,
      status,
      assignedTrainer,
      confirmedDate,
      notes
    } = req.body;

    const updateData = {
      name,
      churchName,
      churchAddress,
      serviceType,
      otherServiceType,
      numberOfServants: numberOfServants ? parseInt(numberOfServants) : undefined,
      numberOfServed: numberOfServed ? parseInt(numberOfServed) : undefined,
      suggestedDate: suggestedDate ? new Date(suggestedDate) : undefined,
      nearbyChurches,
      status,
      assignedTrainer,
      confirmedDate: confirmedDate ? new Date(confirmedDate) : undefined,
      notes,
      updatedAt: Date.now()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const updatedRequest = await TrainingRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTrainer', 'name email');

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Training request not found' });
    }

    res.json(updatedRequest);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error updating training request', error: error.message });
  }
};

// Delete training request (Admin only)
const deleteTrainingRequest = async (req, res) => {
  try {
    const deletedRequest = await TrainingRequest.findByIdAndDelete(req.params.id);

    if (!deletedRequest) {
      return res.status(404).json({ message: 'Training request not found' });
    }

    res.json({ message: 'Training request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting training request', error: error.message });
  }
};

// Get training requests statistics (Admin only)
const getTrainingRequestsStats = async (req, res) => {
  try {
    const stats = await TrainingRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await TrainingRequest.countDocuments();
    
    res.json({
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching training requests statistics', error: error.message });
  }
};

module.exports = {
  getAllTrainingRequests,
  getTrainingRequestById,
  createTrainingRequest,
  updateTrainingRequestStatus,
  updateTrainingRequest,
  deleteTrainingRequest,
  getTrainingRequestsStats
};
