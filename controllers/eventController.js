const Event = require('../models/Event');
const { validationResult } = require('express-validator');

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      category, 
      page = 1, 
      limit = 100 
    } = req.query;

    let query = {};

    // Date range filter
    if (startDate && endDate) {
      query = {
        $or: [
          { start: { $gte: new Date(startDate), $lte: new Date(endDate) } },
          { end: { $gte: new Date(startDate), $lte: new Date(endDate) } },
          { start: { $lte: new Date(startDate) }, end: { $gte: new Date(endDate) } }
        ]
      };
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ start: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
};

// Get single event
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
};

// Create new event
exports.createEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const eventData = {
      ...req.body,
      createdBy: req.user.id
    };

    const event = await Event.create(eventData);
    
    const populatedEvent = await Event.findById(event._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: populatedEvent
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message
    });
  }
};

// Update event
exports.updateEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user owns the event or is admin
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'name email')
     .populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating event',
      error: error.message
    });
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user owns the event or is admin
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting event',
      error: error.message
    });
  }
};

// Get upcoming events
exports.getUpcomingEvents = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const events = await Event.getUpcomingEvents(parseInt(limit));

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming events',
      error: error.message
    });
  }
};

// Get events by date range
exports.getEventsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const events = await Event.getEventsByDateRange(
      new Date(startDate),
      new Date(endDate)
    ).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching events by date range',
      error: error.message
    });
  }
};

// Get event statistics
exports.getEventStats = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const upcomingEvents = await Event.countDocuments({
      start: { $gte: new Date() },
      status: { $ne: 'cancelled' }
    });
    const completedEvents = await Event.countDocuments({
      status: 'completed'
    });
    const cancelledEvents = await Event.countDocuments({
      status: 'cancelled'
    });

    // Events by category
    const eventsByCategory = await Event.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Events by month (current year)
    const currentYear = new Date().getFullYear();
    const eventsByMonth = await Event.aggregate([
      {
        $match: {
          start: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$start' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEvents,
        upcomingEvents,
        completedEvents,
        cancelledEvents,
        eventsByCategory,
        eventsByMonth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event statistics',
      error: error.message
    });
  }
};

// Get public events (for website display)
exports.getPublicEvents = async (req, res) => {
  try {
    const { 
      category, 
      isFeatured,
      page = 1, 
      limit = 10 
    } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (isFeatured !== undefined) filters.isFeatured = isFeatured === 'true';

    const query = {
      isPublic: true,
      status: { $in: ['scheduled', 'confirmed'] },
      ...filters
    };

    const events = await Event.find(query)
      .select('-createdBy -updatedBy -reminders -attachments')
      .sort({ start: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching public events',
      error: error.message
    });
  }
};

// Get featured events (for homepage)
exports.getFeaturedEvents = async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    
    const events = await Event.getFeaturedEvents(parseInt(limit));

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured events',
      error: error.message
    });
  }
};

// Get event by slug (for event details page)
exports.getEventBySlug = async (req, res) => {
  try {
    const event = await Event.getBySlug(req.params.slug);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Increment views
    event.views = (event.views || 0) + 1;
    await event.save();

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
};
