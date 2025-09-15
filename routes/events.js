const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getEventsByDateRange,
  getEventStats
} = require('../controllers/eventController');
const { authenticate } = require('../middleware/auth');

// Validation middleware
const eventValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('start')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('end')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  body('organizer')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Organizer name cannot exceed 100 characters'),
  body('participants')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Participants must be a non-negative number'),
  body('color')
    .optional()
    .isIn(['default', 'green', 'red', 'azure', 'warning'])
    .withMessage('Invalid color value'),
  body('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),
  body('category')
    .optional()
    .isIn(['meeting', 'training', 'workshop', 'conference', 'personal', 'other'])
    .withMessage('Invalid category value'),
  body('isAllDay')
    .optional()
    .isBoolean()
    .withMessage('isAllDay must be a boolean value')
];

// Public routes (read-only)
router.get('/public', getAllEvents);
router.get('/public/upcoming', getUpcomingEvents);
router.get('/public/date-range', getEventsByDateRange);
router.get('/public/stats', getEventStats);
router.get('/public/:id', getEvent);

// Protected routes (require authentication)
router.use(authenticate);

// CRUD operations
router.route('/')
  .get(getAllEvents)
  .post(eventValidation, createEvent);

router.route('/:id')
  .get(getEvent)
  .put(eventValidation, updateEvent)
  .delete(deleteEvent);

// Additional endpoints
router.get('/upcoming', getUpcomingEvents);
router.get('/date-range', getEventsByDateRange);
router.get('/stats', getEventStats);

module.exports = router;
