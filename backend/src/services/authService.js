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
    
    // Create user with minimal required fields
    const userDataToCreate = {
      name,
      email,
      password,
      role
    };
    
    // Try to add permissions if the column exists
    try {
      const permissions = User.getRolePermissions(role);
      userDataToCreate.permissions = permissions;
    } catch (error) {
      console.log('[REGISTER WARNING] Could not set permissions, continuing without:', error.message);
    }
    
    const user = await User.create(userDataToCreate);
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
    const { email, password: rawPassword } = credentials;
    const password = rawPassword ? rawPassword.trim() : rawPassword;
    console.log('[LOGIN DEBUG] Attempting login for:', email);
    console.log('[BCRYPT DEBUG] Original password:', JSON.stringify(password));
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }
    console.log('[BCRYPT DEBUG] Stored hash:', JSON.stringify(user.password));
    console.log('[BCRYPT DEBUG] Hash details:', {
      length: user.password.length,
      firstChars: user.password.substring(0, 10),
      type: typeof user.password,
      encoding: Buffer.from(user.password).toString('hex').substring(0, 20)
    });
    // Test with a fresh hash of the same password
    const bcrypt = require('bcrypt');
    const testHash = await bcrypt.hash(password, 10);
    console.log('[BCRYPT DEBUG] Fresh hash for same password:', testHash);
    const testCompare = await bcrypt.compare(password, testHash);
    console.log('[BCRYPT DEBUG] Fresh hash comparison:', testCompare);
    // Try the actual comparison with explicit await
    const actualCompare = await bcrypt.compare(password, user.password);
    console.log('[BCRYPT DEBUG] Actual comparison result:', actualCompare);
    if (!actualCompare) {
      throw new Error('Invalid email or password');
    }
    
    console.log('[LOGIN DEBUG] Password verified successfully');
    
    // Generate JWT token
    const token = this.generateToken(user);
    console.log('[LOGIN DEBUG] Token generated successfully');
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
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