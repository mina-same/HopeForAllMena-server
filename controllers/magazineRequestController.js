const MagazineRequest = require('../models/MagazineRequest');
const { validationResult } = require('express-validator');

// Create a new magazine request
const createMagazineRequest = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, phoneNumber, churchName, churchAddress, magazines, preferredContactMethod } = req.body;

    // Get client IP and user agent for tracking
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const magazineRequest = new MagazineRequest({
      name,
      phoneNumber,
      churchName,
      churchAddress,
      magazines: magazines || [],
      preferredContactMethod,
      ipAddress,
      userAgent
    });

    const savedRequest = await magazineRequest.save();

    res.status(201).json({
      success: true,
      message: 'Magazine request submitted successfully',
      data: {
        id: savedRequest._id,
        status: savedRequest.status,
        createdAt: savedRequest.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating magazine request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit magazine request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all magazine requests (Admin only)
const getAllMagazineRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { churchName: { $regex: search, $options: 'i' } },
        { magazineName: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [requests, totalCount] = await Promise.all([
      MagazineRequest.find(filter)
        .populate('processedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      MagazineRequest.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching magazine requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch magazine requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get a single magazine request by ID
const getMagazineRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await MagazineRequest.findById(id)
      .populate('processedBy', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Magazine request not found'
      });
    }

    res.json({
      success: true,
      data: request
    });

  } catch (error) {
    console.error('Error fetching magazine request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch magazine request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update magazine request status (Admin only)
const updateMagazineRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, priority, trackingNumber } = req.body;
    const adminId = req.user.id;

    const request = await MagazineRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Magazine request not found'
      });
    }

    // Update fields
    if (status) request.status = status;
    if (adminNotes) request.adminNotes = adminNotes;
    if (priority) request.priority = priority;
    if (trackingNumber) request.trackingNumber = trackingNumber;
    
    request.processedBy = adminId;
    request.processedAt = new Date();

    if (status === 'fulfilled') {
      request.fulfillmentDate = new Date();
    }

    const updatedRequest = await request.save();
    await updatedRequest.populate('processedBy', 'name email');

    res.json({
      success: true,
      message: 'Magazine request updated successfully',
      data: updatedRequest
    });

  } catch (error) {
    console.error('Error updating magazine request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update magazine request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Approve magazine request (Admin only)
const approveMagazineRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.id;

    const request = await MagazineRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Magazine request not found'
      });
    }

    await request.approve(adminId, adminNotes);
    await request.populate('processedBy', 'name email');

    res.json({
      success: true,
      message: 'Magazine request approved successfully',
      data: request
    });

  } catch (error) {
    console.error('Error approving magazine request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve magazine request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Reject magazine request (Admin only)
const rejectMagazineRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.id;

    const request = await MagazineRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Magazine request not found'
      });
    }

    await request.reject(adminId, adminNotes);
    await request.populate('processedBy', 'name email');

    res.json({
      success: true,
      message: 'Magazine request rejected successfully',
      data: request
    });

  } catch (error) {
    console.error('Error rejecting magazine request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject magazine request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Fulfill magazine request (Admin only)
const fulfillMagazineRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, adminNotes } = req.body;
    const adminId = req.user.id;

    const request = await MagazineRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Magazine request not found'
      });
    }

    await request.fulfill(adminId, trackingNumber, adminNotes);
    await request.populate('processedBy', 'name email');

    res.json({
      success: true,
      message: 'Magazine request fulfilled successfully',
      data: request
    });

  } catch (error) {
    console.error('Error fulfilling magazine request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fulfill magazine request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get magazine request statistics (Admin only)
const getMagazineRequestStatistics = async (req, res) => {
  try {
    const stats = await MagazineRequest.getStatistics();

    // Get recent requests
    const recentRequests = await MagazineRequest.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name churchName magazineName numberOfCopies status createdAt');

    // Get popular magazines
    const popularMagazines = await MagazineRequest.aggregate([
      {
        $group: {
          _id: '$magazineName',
          totalRequests: { $sum: 1 },
          totalCopies: { $sum: '$numberOfCopies' }
        }
      },
      { $sort: { totalRequests: -1 } },
      { $limit: 5 }
    ]);

    // Calculate total magazines approved/fulfilled
    const approvedMagazines = await MagazineRequest.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'fulfilled'] }
        }
      },
      {
        $unwind: '$magazines'
      },
      {
        $group: {
          _id: null,
          totalCopiesApproved: { $sum: '$magazines.numberOfCopies' },
          approvedCount: { $sum: 1 }
        }
      }
    ]);

    const totalCopiesApproved = approvedMagazines.length > 0 ? approvedMagazines[0].totalCopiesApproved : 0;
    const approvedCount = await MagazineRequest.countDocuments({ status: { $in: ['approved', 'fulfilled'] } });

    res.json({
      success: true,
      data: {
        ...stats,
        totalCopiesApproved,
        approvedCount,
        recentRequests,
        popularMagazines
      }
    });

  } catch (error) {
    console.error('Error fetching magazine request statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete magazine request (Admin only)
const deleteMagazineRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await MagazineRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Magazine request not found'
      });
    }

    await MagazineRequest.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Magazine request deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting magazine request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete magazine request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get pending requests count (for dashboard)
const getPendingRequestsCount = async (req, res) => {
  try {
    const count = await MagazineRequest.countDocuments({ status: 'pending' });
    
    res.json({
      success: true,
      data: { pendingCount: count }
    });

  } catch (error) {
    console.error('Error fetching pending requests count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests count',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
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
};
