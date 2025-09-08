const TrainingBook = require('../models/TrainingBook');

// Get all training books
const getAllTrainingBooks = async (req, res) => {
  try {
    // For admin panel, return all books. For public API, filter by isActive
    const isAdminRequest = req.headers.authorization; // Check if authenticated (admin request)
    const filter = isAdminRequest ? {} : { isActive: true };
    const books = await TrainingBook.find(filter).sort({ name: 1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching training books', error: error.message });
  }
};

// Get training book by ID
const getTrainingBookById = async (req, res) => {
  try {
    const book = await TrainingBook.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Training book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching training book', error: error.message });
  }
};

// Create new training book (Admin only)
const createTrainingBook = async (req, res) => {
  try {
    const { name, nameAr, parts, description, descriptionAr, coverImageUrl } = req.body;

    const trainingBook = new TrainingBook({
      name,
      nameAr,
      parts,
      description,
      descriptionAr,
      coverImageUrl
    });

    const savedBook = await trainingBook.save();
    res.status(201).json(savedBook);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error creating training book', error: error.message });
  }
};

// Update training book (Admin only)
const updateTrainingBook = async (req, res) => {
  try {
    const { name, nameAr, parts, description, descriptionAr, coverImageUrl, isActive } = req.body;

    const updatedBook = await TrainingBook.findByIdAndUpdate(
      req.params.id,
      {
        name,
        nameAr,
        parts,
        description,
        descriptionAr,
        coverImageUrl,
        isActive,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ message: 'Training book not found' });
    }

    res.json(updatedBook);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error updating training book', error: error.message });
  }
};

// Delete training book (Admin only) - Soft delete
const deleteTrainingBook = async (req, res) => {
  try {
    const updatedBook = await TrainingBook.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ message: 'Training book not found' });
    }

    res.json({ message: 'Training book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting training book', error: error.message });
  }
};

// Get available book parts for a specific book
const getBookParts = async (req, res) => {
  try {
    const book = await TrainingBook.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Training book not found' });
    }
    res.json(book.parts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching book parts', error: error.message });
  }
};

module.exports = {
  getAllTrainingBooks,
  getTrainingBookById,
  createTrainingBook,
  updateTrainingBook,
  deleteTrainingBook,
  getBookParts
};
