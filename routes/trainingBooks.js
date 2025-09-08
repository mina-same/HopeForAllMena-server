const express = require('express');
const router = express.Router();
const {
  getAllTrainingBooks,
  getTrainingBookById,
  createTrainingBook,
  updateTrainingBook,
  deleteTrainingBook,
  getBookParts
} = require('../controllers/trainingBookController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/', getAllTrainingBooks);
router.get('/:id', getTrainingBookById);
router.get('/:id/parts', getBookParts);

// Admin only routes
router.post('/', authenticate, createTrainingBook);
router.put('/:id', authenticate, updateTrainingBook);
router.delete('/:id', authenticate, deleteTrainingBook);

module.exports = router;
