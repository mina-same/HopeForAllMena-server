const express = require('express');
const router = express.Router();

const {
  createDevelopmentProjectRequest,
  getAllDevelopmentProjectRequests,
  getDevelopmentProjectRequestById,
  updateDevelopmentProjectRequestStatus,
  downloadAttachment
} = require('../controllers/developmentProjectRequestController');

const { authenticate } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

// Public - with file upload support
router.post('/', upload.array('attachments', 3), handleMulterError, createDevelopmentProjectRequest);

// Admin
router.get('/', authenticate, getAllDevelopmentProjectRequests);
router.get('/:id', authenticate, getDevelopmentProjectRequestById);
router.get('/:id/attachments/:filename', authenticate, downloadAttachment);
router.patch('/:id/status', authenticate, updateDevelopmentProjectRequestStatus);

module.exports = router;
