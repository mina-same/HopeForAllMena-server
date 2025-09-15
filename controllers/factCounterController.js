const FactCounter = require('../models/FactCounter');
const { validationResult } = require('express-validator');

// Get current fact counter statistics
const getFactCounterStats = async (req, res) => {
  try {
    const stats = await FactCounter.getInstance();
    
    res.json({
      success: true,
      data: {
        members: stats.members,
        leadersTraining: stats.leadersTraining,
        publishedBooks: stats.publishedBooks,
        givenMagazines: stats.givenMagazines,
        lastUpdated: stats.lastUpdated,
        updatedBy: stats.updatedBy
      }
    });
  } catch (error) {
    console.error('Error fetching fact counter stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// Update fact counter statistics (Admin only)
const updateFactCounterStats = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { members, leadersTraining, publishedBooks, givenMagazines } = req.body;
    const userId = req.user._id;

    // Prepare updates object (only include provided fields)
    const updates = {};
    if (members !== undefined) updates.members = parseInt(members);
    if (leadersTraining !== undefined) updates.leadersTraining = parseInt(leadersTraining);
    if (publishedBooks !== undefined) updates.publishedBooks = parseInt(publishedBooks);
    if (givenMagazines !== undefined) updates.givenMagazines = parseInt(givenMagazines);

    // Update statistics
    const updatedStats = await FactCounter.updateStats(updates, userId);

    res.json({
      success: true,
      message: 'Statistics updated successfully',
      data: {
        members: updatedStats.members,
        leadersTraining: updatedStats.leadersTraining,
        publishedBooks: updatedStats.publishedBooks,
        givenMagazines: updatedStats.givenMagazines,
        lastUpdated: updatedStats.lastUpdated,
        updatedBy: updatedStats.updatedBy
      }
    });
  } catch (error) {
    console.error('Error updating fact counter stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update statistics',
      error: error.message
    });
  }
};

// Get historical data for analytics (mock data for now)
const getFactCounterHistory = async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const currentStats = await FactCounter.getInstance();
    
    // Generate mock historical data based on current values
    const monthsCount = parseInt(months);
    const history = [];
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      // Generate realistic growth patterns
      const growthFactor = (monthsCount - i) / monthsCount;
      
      history.push({
        month: date.toISOString().slice(0, 7), // YYYY-MM format
        monthName: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        members: Math.floor(currentStats.members * (0.7 + growthFactor * 0.3) + Math.random() * 200),
        leadersTraining: Math.floor(currentStats.leadersTraining * (0.6 + growthFactor * 0.4) + Math.random() * 30),
        publishedBooks: Math.floor(currentStats.publishedBooks * (0.5 + growthFactor * 0.5) + Math.random() * 5),
        givenMagazines: Math.floor(currentStats.givenMagazines * (0.6 + growthFactor * 0.4) + Math.random() * 500)
      });
    }
    
    // Ensure the last month matches current totals
    if (history.length > 0) {
      const lastMonth = history[history.length - 1];
      lastMonth.members = currentStats.members;
      lastMonth.leadersTraining = currentStats.leadersTraining;
      lastMonth.publishedBooks = currentStats.publishedBooks;
      lastMonth.givenMagazines = currentStats.givenMagazines;
    }

    res.json({
      success: true,
      data: {
        current: {
          members: currentStats.members,
          leadersTraining: currentStats.leadersTraining,
          publishedBooks: currentStats.publishedBooks,
          givenMagazines: currentStats.givenMagazines,
          lastUpdated: currentStats.lastUpdated
        },
        history: history
      }
    });
  } catch (error) {
    console.error('Error fetching fact counter history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch historical data',
      error: error.message
    });
  }
};

module.exports = {
  getFactCounterStats,
  updateFactCounterStats,
  getFactCounterHistory
};
