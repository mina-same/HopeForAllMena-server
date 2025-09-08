const express = require('express');
const router = express.Router();
const {
  getAllTrainingFollowUps,
  getTrainingFollowUpById,
  createTrainingFollowUp,
  updateTrainingFollowUpStatus,
  updateTrainingFollowUp,
  deleteTrainingFollowUp,
  getTrainingFollowUpsStats,
  downloadServedListFile,
  upload
} = require('../controllers/trainingFollowUpController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/', upload.single('servedListFile'), createTrainingFollowUp);

// Admin only routes
router.get('/', authenticate, getAllTrainingFollowUps);
router.get('/stats', authenticate, getTrainingFollowUpsStats);
router.get('/:id', authenticate, getTrainingFollowUpById);
router.put('/:id', authenticate, updateTrainingFollowUp);
router.patch('/:id/status', authenticate, updateTrainingFollowUpStatus);
router.delete('/:id', authenticate, deleteTrainingFollowUp);
router.get('/:id/download', authenticate, downloadServedListFile);

module.exports = router;
