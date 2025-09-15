const User = require('../models/User');

class UserController {
  // Get all users with pagination and filtering
  async getUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status,
        role,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Convert sortOrder to number
      const sort = sortOrder === 'asc' || sortOrder === '1' ? 1 : -1;

      // Build query
      const query = {};
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) query.status = status;
      if (role) query.role = { $regex: role, $options: 'i' };

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortObj = { [sortBy]: sort };

      // Get users with pagination
      const [users, total] = await Promise.all([
        User.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit))
          .select('-password'),
        User.countDocuments(query)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        status: 'success',
        data: {
          users,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalUsers: total,
            hasNextPage,
            hasPrevPage,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve users'
      });
    }
  }

  // Get user statistics
  async getUserStats(req, res) {
    try {
      const stats = await User.getStats();
      
      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentRegistrations = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Get users by role
      const roleStats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          ...stats,
          recentRegistrations,
          roleDistribution: roleStats
        }
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve user statistics'
      });
    }
  }

  // Get user by ID
  async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id).select('-password');
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: {
          user
        }
      });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve user'
      });
    }
  }

  // Create new user
  async createUser(req, res) {
    try {
      const { name, email, username, password, role, permissions = [], status = 'active' } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username }
        ]
      });

      if (existingUser) {
        const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
        const fieldName = field === 'email' ? 'Email address' : 'Username';
        return res.status(400).json({
          status: 'error',
          message: `${fieldName} is already taken. Please choose a different ${field === 'email' ? 'email address' : 'username'}.`,
          field: field,
          suggestion: field === 'email' ? 'Try using a different email address' : 'Try adding numbers or changing the username'
        });
      }

      // Create new user
      const user = new User({
        name,
        email: email.toLowerCase(),
        username,
        password,
        role,
        permissions,
        status
      });

      await user.save();

      // Remove password from response
      const userResponse = user.toJSON();

      res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: {
          user: userResponse
        }
      });

    } catch (error) {
      console.error('Create user error:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const fieldName = field === 'email' ? 'Email address' : field === 'username' ? 'Username' : field.charAt(0).toUpperCase() + field.slice(1);
        return res.status(400).json({
          status: 'error',
          message: `${fieldName} is already taken. Please choose a different ${field === 'email' ? 'email address' : field === 'username' ? 'username' : field}.`,
          field: field,
          suggestion: field === 'email' ? 'Try using a different email address' : field === 'username' ? 'Try adding numbers or changing the username' : 'This value must be unique'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to create user'
      });
    }
  }

  // Update user
  async updateUser(req, res) {
    try {
      const { name, email, username, password, role, permissions, status } = req.body;
      const userId = req.params.id;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Check if email or username is already taken by another user
      if (email || username) {
        const query = {
          _id: { $ne: userId },
          $or: []
        };

        if (email) query.$or.push({ email: email.toLowerCase() });
        if (username) query.$or.push({ username });

        if (query.$or.length > 0) {
          const existingUser = await User.findOne(query);
          if (existingUser) {
            const field = existingUser.email === email?.toLowerCase() ? 'email' : 'username';
            const fieldName = field === 'email' ? 'Email address' : 'Username';
            return res.status(400).json({
              status: 'error',
              message: `${fieldName} is already taken by another user. Please choose a different ${field === 'email' ? 'email address' : 'username'}.`,
              field: field,
              suggestion: field === 'email' ? 'Try using a different email address' : 'Try adding numbers or changing the username'
            });
          }
        }
      }

      // Prepare update data
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email.toLowerCase();
      if (username) updateData.username = username;
      if (role) updateData.role = role;
      if (permissions) updateData.permissions = permissions;
      if (status) updateData.status = status;

      // Handle password update separately to ensure proper hashing
      if (password) {
        updateData.password = password;
      }

      // Update user - use save() method if password is being updated to trigger pre-save middleware
      let updatedUser;
      if (password) {
        // If password is being updated, we need to use save() to trigger pre-save middleware
        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) {
          return res.status(404).json({
            status: 'error',
            message: 'User not found'
          });
        }
        
        // Update all fields
        Object.assign(userToUpdate, updateData);
        updatedUser = await userToUpdate.save();
      } else {
        // For non-password updates, use findByIdAndUpdate
        updatedUser = await User.findByIdAndUpdate(
          userId,
          updateData,
          { new: true, runValidators: true }
        );
      }

      // Remove password from response
      const userResponse = updatedUser.toJSON();

      res.status(200).json({
        status: 'success',
        message: 'User updated successfully',
        data: {
          user: updatedUser
        }
      });

    } catch (error) {
      console.error('Update user error:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const fieldName = field === 'email' ? 'Email address' : field === 'username' ? 'Username' : field.charAt(0).toUpperCase() + field.slice(1);
        return res.status(400).json({
          status: 'error',
          message: `${fieldName} is already taken. Please choose a different ${field === 'email' ? 'email address' : field === 'username' ? 'username' : field}.`,
          field: field,
          suggestion: field === 'email' ? 'Try using a different email address' : field === 'username' ? 'Try adding numbers or changing the username' : 'This value must be unique'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to update user'
      });
    }
  }

  // Delete user
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      // Prevent admin from deleting themselves
      if (userId === req.user._id.toString()) {
        return res.status(400).json({
          status: 'error',
          message: 'You cannot delete your own account'
        });
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Delete user
      await User.findByIdAndDelete(userId);

      res.status(200).json({
        status: 'success',
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete user'
      });
    }
  }

  // Update user status
  async updateUserStatus(req, res) {
    try {
      const { status } = req.body;
      const userId = req.params.id;

      if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Valid status is required (active, inactive, or suspended)'
        });
      }

      // Prevent admin from deactivating themselves
      if (userId === req.user._id.toString() && status !== 'active') {
        return res.status(400).json({
          status: 'error',
          message: 'You cannot deactivate your own account'
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { status },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      res.status(200).json({
        status: 'success',
        message: `User ${status === 'active' ? 'activated' : status === 'inactive' ? 'deactivated' : 'suspended'} successfully`,
        data: {
          user
        }
      });

    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update user status'
      });
    }
  }

  // Update user permissions
  async updateUserPermissions(req, res) {
    try {
      const { permissions } = req.body;
      const userId = req.params.id;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          status: 'error',
          message: 'Permissions must be an array'
        });
      }

      const validPermissions = [
        'books', 'courses', 'magazines', 'training', 'users', 'analytics', 'settings',
        'authors', 'categories', 'reviews', 'enrollments', 'contact-messages',
        'training-books', 'training-requests', 'training-followup-requests',
        'calendar', 'user-management', 'generate-ids'
      ];

      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid permissions: ${invalidPermissions.join(', ')}`
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { permissions },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'User permissions updated successfully',
        data: {
          user
        }
      });

    } catch (error) {
      console.error('Update user permissions error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update user permissions'
      });
    }
  }

  // Unlock user account
  async unlockUser(req, res) {
    try {
      const userId = req.params.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Reset login attempts and unlock
      await user.resetLoginAttempts();

      res.status(200).json({
        status: 'success',
        message: 'User account unlocked successfully'
      });

    } catch (error) {
      console.error('Unlock user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to unlock user account'
      });
    }
  }
}

module.exports = new UserController();
