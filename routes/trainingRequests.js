const express = require('express');
const router = express.Router();
const {
  getAllTrainingRequests,
  getTrainingRequestById,
  createTrainingRequest,
  updateTrainingRequestStatus,
  updateTrainingRequest,
  deleteTrainingRequest,
  getTrainingRequestsStats
} = require('../controllers/trainingRequestController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/', createTrainingRequest);

// Admin only routes
router.get('/', authenticate, getAllTrainingRequests);
router.get('/stats', authenticate, getTrainingRequestsStats);
router.get('/:id', authenticate, getTrainingRequestById);
router.put('/:id', authenticate, updateTrainingRequest);
router.patch('/:id/status', authenticate, updateTrainingRequestStatus);
router.delete('/:id', authenticate, deleteTrainingRequest);

module.exports = router;
