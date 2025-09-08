const TrainingFollowUp = require('../models/TrainingFollowUp');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/training-followup/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word documents, and images are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all training follow-ups (Admin only)
const getAllTrainingFollowUps = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = status ? { status } : {};
    
    const followUps = await TrainingFollowUp.find(query)
      .populate('originalTrainingRequest', 'name churchName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TrainingFollowUp.countDocuments(query);

    res.json({
      followUps,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching training follow-ups', error: error.message });
  }
};

// Get training follow-up by ID
const getTrainingFollowUpById = async (req, res) => {
  try {
    const followUp = await TrainingFollowUp.findById(req.params.id)
      .populate('originalTrainingRequest', 'name churchName');
    
    if (!followUp) {
      return res.status(404).json({ message: 'Training follow-up not found' });
    }
    
    res.json(followUp);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching training follow-up', error: error.message });
  }
};

// Create new training follow-up
const createTrainingFollowUp = async (req, res) => {
  try {
    const {
      trainerName,
      name,
      churchName,
      churchAddress,
      phoneNumber,
      numberOfServed,
      books,
      tshirtSizes,
      originalTrainingRequest
    } = req.body;

    // Parse books if it's a string (from form data)
    let parsedBooks;
    try {
      parsedBooks = typeof books === 'string' ? JSON.parse(books) : books;
    } catch (error) {
      return res.status(400).json({ message: 'Invalid books format' });
    }

    // Parse tshirtSizes if it's a string (from form data)
    let parsedTshirtSizes;
    try {
      parsedTshirtSizes = typeof tshirtSizes === 'string' ? JSON.parse(tshirtSizes) : tshirtSizes;
    } catch (error) {
      return res.status(400).json({ message: 'Invalid tshirt sizes format' });
    }

    const followUpData = {
      trainerName,
      name,
      churchName,
      churchAddress,
      phoneNumber,
      numberOfServed: parseInt(numberOfServed),
      books: parsedBooks,
      tshirtSizes: parsedTshirtSizes,
      originalTrainingRequest
    };

    // Handle file upload if present
    if (req.file) {
      followUpData.servedListFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      };
    }

    const trainingFollowUp = new TrainingFollowUp(followUpData);
    const savedFollowUp = await trainingFollowUp.save();
    
    res.status(201).json(savedFollowUp);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error creating training follow-up', error: error.message });
  }
};

// Update training follow-up status (Admin only)
const updateTrainingFollowUpStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const updatedFollowUp = await TrainingFollowUp.findByIdAndUpdate(
      req.params.id,
      {
        status,
        notes,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('originalTrainingRequest', 'name churchName');

    if (!updatedFollowUp) {
      return res.status(404).json({ message: 'Training follow-up not found' });
    }

    res.json(updatedFollowUp);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error updating training follow-up status', error: error.message });
  }
};

// Update training follow-up (Admin only)
const updateTrainingFollowUp = async (req, res) => {
  try {
    const {
      trainerName,
      name,
      churchName,
      churchAddress,
      phoneNumber,
      numberOfServed,
      books,
      tshirtSizes,
      status,
      notes
    } = req.body;

    // Parse books if it's a string (from form data)
    let parsedBooks;
    if (books) {
      try {
        parsedBooks = typeof books === 'string' ? JSON.parse(books) : books;
      } catch (error) {
        return res.status(400).json({ message: 'Invalid books format' });
      }
    }

    // Parse tshirtSizes if it's a string (from form data)
    let parsedTshirtSizes;
    if (tshirtSizes) {
      try {
        parsedTshirtSizes = typeof tshirtSizes === 'string' ? JSON.parse(tshirtSizes) : tshirtSizes;
      } catch (error) {
        return res.status(400).json({ message: 'Invalid tshirt sizes format' });
      }
    }

    const updateData = {
      trainerName,
      name,
      churchName,
      churchAddress,
      phoneNumber,
      numberOfServed: numberOfServed ? parseInt(numberOfServed) : undefined,
      books: parsedBooks,
      tshirtSizes: parsedTshirtSizes,
      status,
      notes,
      updatedAt: Date.now()
    };

    // Handle file upload if present
    if (req.file) {
      updateData.servedListFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      };
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const updatedFollowUp = await TrainingFollowUp.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('originalTrainingRequest', 'name churchName');

    if (!updatedFollowUp) {
      return res.status(404).json({ message: 'Training follow-up not found' });
    }

    res.json(updatedFollowUp);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error updating training follow-up', error: error.message });
  }
};

// Delete training follow-up (Admin only)
const deleteTrainingFollowUp = async (req, res) => {
  try {
    const deletedFollowUp = await TrainingFollowUp.findByIdAndDelete(req.params.id);

    if (!deletedFollowUp) {
      return res.status(404).json({ message: 'Training follow-up not found' });
    }

    res.json({ message: 'Training follow-up deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting training follow-up', error: error.message });
  }
};

// Get training follow-ups statistics (Admin only)
const getTrainingFollowUpsStats = async (req, res) => {
  try {
    const stats = await TrainingFollowUp.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await TrainingFollowUp.countDocuments();
    
    // Get book requests statistics
    const bookStats = await TrainingFollowUp.aggregate([
      { $unwind: '$books' },
      {
        $group: {
          _id: '$books.bookName',
          totalCopies: { $sum: '$books.copies' },
          requests: { $sum: 1 }
        }
      },
      { $sort: { totalCopies: -1 } }
    ]);

    // Get t-shirt size statistics
    const tshirtStats = await TrainingFollowUp.aggregate([
      {
        $project: {
          sizes: { $objectToArray: '$tshirtSizes' }
        }
      },
      { $unwind: '$sizes' },
      {
        $group: {
          _id: '$sizes.k',
          total: { $sum: '$sizes.v' }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    res.json({
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      bookRequests: bookStats,
      tshirtRequests: tshirtStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching training follow-ups statistics', error: error.message });
  }
};

// Download served list file (Admin only)
const downloadServedListFile = async (req, res) => {
  try {
    const followUp = await TrainingFollowUp.findById(req.params.id);
    
    if (!followUp) {
      return res.status(404).json({ message: 'Training follow-up not found' });
    }

    if (!followUp.servedListFile) {
      return res.status(404).json({ message: 'No file found for this follow-up request' });
    }

    const filePath = path.join(__dirname, '..', followUp.servedListFile.path);
    res.download(filePath, followUp.servedListFile.originalName);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading file', error: error.message });
  }
};

module.exports = {
  getAllTrainingFollowUps,
  getTrainingFollowUpById,
  createTrainingFollowUp,
  updateTrainingFollowUpStatus,
  updateTrainingFollowUp,
  deleteTrainingFollowUp,
  getTrainingFollowUpsStats,
  downloadServedListFile,
  upload
};
