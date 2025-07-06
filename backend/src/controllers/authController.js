const AuthService = require('../services/authService');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

class AuthController {
  /**
   * Register a new user
   */
  static async register(req, res) {
    try {
      const { email, password, name, role } = req.body;

      // Validate required fields
      if (!email || !password || !name) {
        return res.status(400).json({ 
          error: 'Email, password, and name are required' 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          error: 'Invalid email format' 
        });
      }

      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'Password must be at least 6 characters long' 
        });
      }

      const result = await AuthService.registerUser({
        email,
        password,
        name,
        role
      });

      const token = jwt.sign({ userId: result.user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ 
        error: error.message 
      });
    }
  }

  /**
   * Login user
   */
  static async login(req, res) {
    try {
      const { email, password, expectedRole } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      const result = await AuthService.loginUser({ email, password });
      console.log('[LOGIN DEBUG] result.user:', result.user);
      
      if (!result.user || !result.user.id) {
        console.error('[LOGIN ERROR] User object missing or id is null:', result.user);
        return res.status(401).json({ error: 'Login failed: user not found or id is null' });
      }

      // Validate expected role if provided
      if (expectedRole && result.user.role !== expectedRole) {
        return res.status(403).json({ 
          error: `Role mismatch. Expected ${expectedRole}, but user is ${result.user.role}` 
        });
      }

      // Get user permissions
      const permissions = User.getRolePermissions(result.user.role);
      
      // Update user permissions if not set
      if (!result.user.permissions) {
        await result.user.update({ permissions });
      }

      const token = jwt.sign({ 
        userId: result.user.id,
        role: result.user.role,
        permissions: permissions
      }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          permissions: permissions
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ 
        error: error.message 
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req, res) {
    try {
      res.status(200).json({
        user: req.user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ 
        error: 'Failed to get user profile' 
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      const { name, email } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ 
          error: 'Name and email are required' 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          error: 'Invalid email format' 
        });
      }

      // Check if email is already taken by another user
      const existingUser = await AuthService.getUserById(userId);
      if (existingUser.email !== email) {
        const emailTaken = await AuthService.getUserByEmail(email);
        if (emailTaken) {
          return res.status(400).json({ 
            error: 'Email is already taken' 
          });
        }
      }

      // Update user
      await existingUser.update({ name, email });

      const permissions = User.getRolePermissions(existingUser.role);

      res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          permissions: permissions
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ 
        error: 'Failed to update profile' 
      });
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'role', 'created_at', 'created_by'],
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        users: users
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ 
        error: 'Failed to get users' 
      });
    }
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      // Validate role
      const validRoles = ['admin', 'coach', 'player'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: 'Invalid role. Must be admin, coach, or player' 
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      // Update role and permissions
      const permissions = User.getRolePermissions(role);
      await user.update({ role, permissions });

      res.status(200).json({
        message: 'User role updated successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: permissions
        }
      });

    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ 
        error: 'Failed to update user role' 
      });
    }
  }

  /**
   * Get all users (admin only, advanced: pagination, search, filter)
   */
  static async getAllUsersAdvanced(req, res) {
    try {
      let { page = 1, pageSize = 20, search = '', role = '' } = req.query;
      page = parseInt(page);
      pageSize = parseInt(pageSize);
      const where = {};
      if (role) where.role = role;
      if (search) {
        where[User.sequelize.Op.or] = [
          { name: { [User.sequelize.Op.iLike]: `%${search}%` } },
          { email: { [User.sequelize.Op.iLike]: `%${search}%` } }
        ];
      }
      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: ['id', 'name', 'email', 'role', 'created_at', 'created_by'],
        order: [['created_at', 'DESC']],
        offset: (page - 1) * pageSize,
        limit: pageSize
      });
      res.status(200).json({
        users: rows,
        total: count,
        page,
        pageSize
      });
    } catch (error) {
      console.error('Get all users (advanced) error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }

  /**
   * Update user (admin only, can update name, email, role, permissions)
   */
  static async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const { name, email, role, permissions } = req.body;
      const validRoles = ['admin', 'coach', 'player'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be admin, coach, or player' });
      }
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      // Check if email is already taken by another user
      if (email && email !== user.email) {
        const emailTaken = await User.findOne({ where: { email } });
        if (emailTaken) {
          return res.status(400).json({ error: 'Email is already taken' });
        }
      }
      // Update user
      await user.update({
        name: name !== undefined ? name : user.name,
        email: email !== undefined ? email : user.email,
        role: role !== undefined ? role : user.role,
        permissions: permissions !== undefined ? permissions : user.permissions
      });
      res.status(200).json({
        message: 'User updated successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions
        }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      await user.destroy();
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  /**
   * Reset user password (admin only)
   */
  static async resetUserPassword(req, res) {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hashed });
      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset user password error:', error);
      res.status(500).json({ error: 'Failed to reset user password' });
    }
  }
}

router.get('/verify', authenticateToken, (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: 'No user found in token' });
  }
});

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, AuthController.updateProfile);

// Admin routes
router.get('/users', authenticateToken, requireRole('admin'), AuthController.getAllUsers);
router.put('/users/:userId/role', authenticateToken, requireRole('admin'), AuthController.updateUserRole);
router.get('/users/advanced', authenticateToken, requireRole('admin'), AuthController.getAllUsersAdvanced);
router.put('/users/:userId', authenticateToken, requireRole('admin'), AuthController.updateUser);
router.delete('/users/:userId', authenticateToken, requireRole('admin'), AuthController.deleteUser);
router.post('/users/:userId/reset-password', authenticateToken, requireRole('admin'), AuthController.resetUserPassword);

router.get('/test', authenticateToken, (req, res) => {
  const permissions = User.getRolePermissions(req.user.role);
  res.json({ 
    success: true, 
    user: {
      ...req.user.toJSON(),
      permissions: permissions
    }
  });
});

module.exports = router; 