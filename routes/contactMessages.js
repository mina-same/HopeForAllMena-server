const express = require('express');
const router = express.Router();
const contactMessageController = require('../controllers/contactMessageController');
const { authenticate } = require('../middleware/auth');
const { 
  validateContactMessageCreation, 
  validateContactMessageUpdate, 
  validateContactMessageId,
  validatePagination 
} = require('../middleware/validation');

// @route   GET /api/contact-messages
// @desc    Get all contact messages with pagination and filtering
// @access  Private (Admin only)
router.get('/', 
  authenticate, 
  validatePagination,
  contactMessageController.getContactMessages
);

// @route   GET /api/contact-messages/stats
// @desc    Get contact message statistics
// @access  Private (Admin only)
router.get('/stats', 
  authenticate, 
  contactMessageController.getContactMessageStats
);

// @route   GET /api/contact-messages/recent
// @desc    Get recent contact messages
// @access  Private (Admin only)
router.get('/recent', 
  authenticate, 
  contactMessageController.getRecentMessages
);

// @route   GET /api/contact-messages/book-orders
// @desc    Get book order messages
// @access  Private (Admin only)
router.get('/book-orders', 
  authenticate, 
  validatePagination,
  contactMessageController.getBookOrders
);

// @route   GET /api/contact-messages/:id
// @desc    Get contact message by ID
// @access  Private (Admin only)
router.get('/:id', 
  authenticate, 
  validateContactMessageId,
  contactMessageController.getContactMessageById
);

// @route   POST /api/contact-messages
// @desc    Create new contact message
// @access  Public
router.post('/', 
  validateContactMessageCreation,
  contactMessageController.createContactMessage
);

// @route   PUT /api/contact-messages/:id
// @desc    Update contact message
// @access  Private (Admin only)
router.put('/:id', 
  authenticate, 
  validateContactMessageId,
  validateContactMessageUpdate,
  contactMessageController.updateContactMessage
);

// @route   DELETE /api/contact-messages/:id
// @desc    Delete contact message
// @access  Private (Admin only)
router.delete('/:id', 
  authenticate, 
  validateContactMessageId,
  contactMessageController.deleteContactMessage
);

// @route   PATCH /api/contact-messages/:id/status
// @desc    Update contact message status
// @access  Private (Admin only)
router.patch('/:id/status', 
  authenticate, 
  validateContactMessageId,
  contactMessageController.updateContactMessageStatus
);

// @route   PATCH /api/contact-messages/:id/assign
// @desc    Assign contact message to user
// @access  Private (Admin only)
router.patch('/:id/assign', 
  authenticate, 
  validateContactMessageId,
  contactMessageController.assignContactMessage
);

// @route   PATCH /api/contact-messages/:id/respond
// @desc    Respond to contact message
// @access  Private (Admin only)
router.patch('/:id/respond', 
  authenticate, 
  validateContactMessageId,
  contactMessageController.respondToContactMessage
);

// @route   PATCH /api/contact-messages/:id/close
// @desc    Close contact message
// @access  Private (Admin only)
router.patch('/:id/close', 
  authenticate, 
  validateContactMessageId,
  contactMessageController.closeContactMessage
);

// @route   PATCH /api/contact-messages/:id/note
// @desc    Add note to contact message
// @access  Private (Admin only)
router.patch('/:id/note', 
  authenticate, 
  validateContactMessageId,
  contactMessageController.addNoteToContactMessage
);

// @route   PATCH /api/contact-messages/:id/read
// @desc    Mark contact message as read
// @access  Private (Admin only)
router.patch('/:id/read', 
  authenticate, 
  validateContactMessageId,
  contactMessageController.markAsRead
);

module.exports = router;
