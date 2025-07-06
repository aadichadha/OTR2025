const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthService {
  /**
   * Register a new user
   */
  static async registerUser(userData) {
    const { email, password, name } = userData;
    const role = 'player'; // Always register as player
    console.log('[REGISTER DEBUG] Attempting to register:', email, name, role);
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    console.log('[REGISTER DEBUG] Existing user:', existingUser);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });
    console.log('[REGISTER DEBUG] Created user:', user);
    // Generate JWT token
    const token = this.generateToken(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  /**
   * Login user
   */
  static async loginUser(credentials) {
    const { email, password } = credentials;
    console.log('[LOGIN DEBUG] Attempting login for:', email);
    // Find user
    const user = await User.findOne({ where: { email } });
    console.log('[LOGIN DEBUG] Found user:', user);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('[LOGIN DEBUG] Password valid:', isValidPassword);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }
    // Generate JWT token
    const token = this.generateToken(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  /**
   * Generate JWT token
   */
  static generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    let secret = process.env.JWT_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production');
      }
      secret = 'your-secret-key'; // fallback only in dev
    }
    const options = {
      expiresIn: '24h'
    };

    return jwt.sign(payload, secret, options);
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    try {
      let secret = process.env.JWT_SECRET;
      if (!secret) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('JWT_SECRET must be set in production');
        }
        secret = 'your-secret-key'; // fallback only in dev
      }
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

module.exports = AuthService; 