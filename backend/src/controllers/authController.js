const AuthService = require('../services/authService');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

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
      const { email, password } = req.body;

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

      const token = jwt.sign({ userId: result.user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: result.user.id,
          email: result.user.email
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
        const emailTaken = await AuthService.getUserById(email);
        if (emailTaken) {
          return res.status(400).json({ 
            error: 'Email is already taken' 
          });
        }
      }

      // Update user
      await existingUser.update({ name, email });

      res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ 
        error: 'Failed to update profile' 
      });
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

router.get('/test', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router; 