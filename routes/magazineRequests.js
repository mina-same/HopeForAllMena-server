const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createMagazineRequest,
  getAllMagazineRequests,
  getMagazineRequestById,
  updateMagazineRequestStatus,
  approveMagazineRequest,
  rejectMagazineRequest,
  fulfillMagazineRequest,
  getMagazineRequestStatistics,
  deleteMagazineRequest,
  getPendingRequestsCount
} = require('../controllers/magazineRequestController');
const { authenticate: auth } = require('../middleware/auth');

// Validation middleware for creating magazine requests
const validateMagazineRequest = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be between 1-100 characters'),
  
  body('phoneNumber')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Phone number is required and must be between 1-20 characters'),
  
  body('churchName')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Church name is required and must be between 1-200 characters'),
  
  body('churchAddress')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Church address is required and must be between 1-500 characters'),
  
  body('magazines')
    .isArray({ min: 1 })
    .withMessage('At least one magazine must be selected'),
  body('magazines.*.magazineName')
    .notEmpty()
    .withMessage('Magazine name is required')
    .isIn([
      'The Great Book, the Book of Hope',
      'The Book of Hope',
      'The Gift That Changes Everything',
      'A Journey in the World of the Bible',
      'The Bible for Children',
      'The Path of Hope',
      'On the Edge'
    ])
    .withMessage('Please select a valid magazine'),
  body('magazines.*.numberOfCopies')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Number of copies must be between 1 and 10,000'),
  
  
  body('preferredContactMethod')
    .optional()
    .isIn(['phone', 'email', 'mail'])
    .withMessage('Preferred contact method must be phone, email, or mail')
];

// Validation middleware for updating magazine request status
const validateStatusUpdate = [
  body('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'fulfilled', 'cancelled'])
    .withMessage('Status must be one of: pending, approved, rejected, fulfilled, cancelled'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes cannot exceed 1000 characters'),
  
  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Tracking number cannot exceed 100 characters')
];

// Public routes
// POST /api/magazine-requests - Create a new magazine request
router.post('/', validateMagazineRequest, createMagazineRequest);

// Admin-only routes (require authentication)
// GET /api/magazine-requests - Get all magazine requests with filtering and pagination
router.get('/', auth, getAllMagazineRequests);

// GET /api/magazine-requests/statistics - Get magazine request statistics
router.get('/statistics', auth, getMagazineRequestStatistics);

// GET /api/magazine-requests/pending-count - Get count of pending requests
router.get('/pending-count', auth, getPendingRequestsCount);

// GET /api/magazine-requests/:id - Get a specific magazine request
router.get('/:id', auth, getMagazineRequestById);

// PUT /api/magazine-requests/:id/status - Update magazine request status
router.put('/:id/status', auth, validateStatusUpdate, updateMagazineRequestStatus);

// PUT /api/magazine-requests/:id/approve - Approve a magazine request
router.put('/:id/approve', auth, [
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes cannot exceed 1000 characters')
], approveMagazineRequest);

// PUT /api/magazine-requests/:id/reject - Reject a magazine request
router.put('/:id/reject', auth, [
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes cannot exceed 1000 characters')
], rejectMagazineRequest);

// PUT /api/magazine-requests/:id/fulfill - Fulfill a magazine request
router.put('/:id/fulfill', auth, [
  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Tracking number cannot exceed 100 characters'),
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes cannot exceed 1000 characters')
], fulfillMagazineRequest);

// DELETE /api/magazine-requests/:id - Delete a magazine request
router.delete('/:id', auth, deleteMagazineRequest);

module.exports = router;
