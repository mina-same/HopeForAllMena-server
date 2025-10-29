const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { sessionUtils } = require('../config/session');
const { cookieUtils } = require('../utils/cookies');

class AuthController {
  // Login user
  async login(req, res) {
    try {
      const { identifier, password } = req.body;

      // Find user by email or username
      const user = await User.findByEmailOrUsername(identifier);

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      // Account locking disabled - users can try anytime

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(401).json({
          status: 'error',
          message: 'User is not active. Contact your admin.'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        // No login attempt tracking - users can try anytime
        
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      // No login attempt tracking needed

      // Update last login
      await user.updateLastLogin();

      // Generate JWT token
      const token = generateToken(user._id);

      // Create session
      await sessionUtils.createUserSession(req, user);

      // Set authentication cookies
      cookieUtils.setAuthCookies(res, token);

      // Remove sensitive data from user object
      const userResponse = user.toJSON();
      delete userResponse.password;

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: userResponse,
          token,
          expiresIn: process.env.JWT_EXPIRE || '7d',
          sessionId: req.sessionID
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Login failed. Please try again.'
      });
    }
  }

  // Logout user
  async logout(req, res) {
    try {
      // Destroy session
      await sessionUtils.destroyUserSession(req);
      
      // Clear authentication cookies
      cookieUtils.clearAuthCookies(res);
      
      res.status(200).json({
        status: 'success',
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Logout failed'
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get user profile'
      });
    }
  }

  // Change user password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.user._id).select('+password');

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }

      // Check if new password is different from current
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        return res.status(400).json({
          status: 'error',
          message: 'New password must be different from current password'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to change password'
      });
    }
  }

  // Verify token
  async verifyToken(req, res) {
    try {
      res.status(200).json({
        status: 'success',
        message: 'Token is valid',
        data: {
          user: req.user.toJSON()
        }
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Token verification failed'
      });
    }
  }

  // Get user permissions
  async getPermissions(req, res) {
    try {
      const permissions = req.user.permissions || [];
      
      res.status(200).json({
        status: 'success',
        data: {
          permissions,
          role: req.user.role
        }
      });
    } catch (error) {
      console.error('Get permissions error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get permissions'
      });
    }
  }
}

module.exports = new AuthController();
