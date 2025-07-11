const AuthService = require('../services/authService');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const InvitationService = require('../services/invitationService');

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

      // Use the token from AuthService instead of generating a new one
      const token = result.token;
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
    console.log('🔍 LOGIN DEBUG - Start');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    try {
      const { email, password: rawPassword } = req.body;
      const password = rawPassword ? rawPassword.trim() : rawPassword;

      console.log('📧 Email received:', email);
      console.log('🔑 Password received:', password ? 'YES' : 'NO');
      console.log('🔑 Password length:', password ? password.length : 0);
      console.log('🔑 Password first char:', password ? `"${password.charAt(0)}"` : 'N/A');

      // Validate required fields
      if (!email || !password) {
        console.log('❌ Missing email or password');
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      console.log('🔍 Calling AuthService.loginUser...');
      const result = await AuthService.loginUser({ email, password });
      console.log('[LOGIN DEBUG] result.user:', result.user);
      
      if (!result.user || !result.user.id) {
        console.error('[LOGIN ERROR] User object missing or id is null:', result.user);
        return res.status(401).json({ error: 'Login failed: user not found or id is null' });
      }

      // Get user permissions - handle missing permissions column gracefully
      let permissions = [];
      try {
        permissions = User.getRolePermissions(result.user.role);
      } catch (error) {
        console.log('[LOGIN WARNING] Could not get role permissions, using defaults:', error.message);
        // Set default permissions based on role
        if (result.user.role === 'admin') {
          permissions = ['view_all_players', 'manage_players', 'manage_coaches', 'manage_users', 'view_own_data', 'download_reports', 'view_analytics', 'view_admin_dashboard'];
        } else if (result.user.role === 'coach') {
          permissions = ['view_all_players', 'manage_players', 'view_own_data', 'download_reports', 'view_analytics', 'view_coach_dashboard'];
        } else {
          permissions = ['view_own_data', 'download_reports', 'view_player_dashboard', 'view_analytics'];
        }
      }
      
      // Update user permissions if not set (but don't fail if permissions column doesn't exist)
      if (!result.user.permissions) {
        try {
          await result.user.update({ permissions });
        } catch (error) {
          console.log('[LOGIN WARNING] Could not update user permissions:', error.message);
          // Continue without updating permissions
        }
      }

      // Use the token from AuthService instead of generating a new one
      const token = result.token;

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
   * Create a new user (admin only)
   */
  static async createUser(req, res) {
    try {
      const { name, email, password, role = 'player' } = req.body;

      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({ 
          error: 'Name, email, and password are required' 
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

      // Validate role
      const validRoles = ['admin', 'coach', 'player'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: 'Invalid role. Must be admin, coach, or player' 
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ 
          error: 'User with this email already exists' 
        });
      }

      // Create user using AuthService
      const result = await AuthService.registerUser({
        name,
        email,
        password,
        role
      });

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role
        }
      });

    } catch (error) {
      console.error('Create user error:', error);
      res.status(400).json({ 
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
   * Change user password
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Current password and new password are required' 
        });
      }

      // Validate new password strength
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          error: 'New password must be at least 6 characters long' 
        });
      }

      // Get user and verify current password
      const user = await AuthService.getUserById(userId);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      const isValidPassword = await AuthService.verifyPassword(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ 
          error: 'Current password is incorrect' 
        });
      }

      // Hash new password and update user
      const hashedPassword = await AuthService.hashPassword(newPassword);
      await user.update({ password: hashedPassword });

      res.status(200).json({
        message: 'Password changed successfully',
        success: true
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ 
        error: 'Failed to change password' 
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

      // Import Player model
      const Player = require('../models/Player');
      const Session = require('../models/Session');
      const BatSpeedData = require('../models/BatSpeedData');
      const ExitVelocityData = require('../models/ExitVelocityData');

      // Find and delete associated player (linked by name)
      const player = await Player.findOne({ where: { name: user.name } });
      if (player) {
        // Get all sessions for this player
        const sessions = await Session.findAll({ where: { player_id: player.id } });
        
        // Delete all associated data for each session
        for (const session of sessions) {
          // Delete bat speed data
          await BatSpeedData.destroy({ where: { session_id: session.id } });
          // Delete exit velocity data
          await ExitVelocityData.destroy({ where: { session_id: session.id } });
        }
        
        // Delete all sessions
        await Session.destroy({ where: { player_id: player.id } });
        
        // Delete the player
        await player.destroy();
      }

      // Delete the user
      await user.destroy();
      
      res.status(200).json({ 
        message: 'User and all associated data deleted successfully' 
      });
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

  /**
   * DEBUG: Check users in database
   */
  static async checkUsers(req, res) {
    try {
      console.log('🔍 DEBUG: Checking users in database...');
      
      const users = await User.findAll({
        attributes: ['id', 'email', 'name', 'role', 'password']
      });
      
      console.log('📊 Found users:', users.length);
      
      const userList = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      }));
      
      res.json({
        totalUsers: users.length,
        users: userList
      });
    } catch (error) {
      console.error('💥 DEBUG: Error checking users:', error);
      res.status(500).json({ error: 'Database error', details: error.message });
    }
  }

  /**
   * DEBUG: Create test user with proper hashing
   */
  static async createTestUser(req, res) {
    try {
      const bcrypt = require('bcryptjs');
      
      const email = 'admin@otr.com';
      const password = 'password123';
      const name = 'Admin User';
      const role = 'admin';
      
      console.log('🔧 DEBUG: Creating test user:', email);
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      console.log('🔐 Password hashed successfully');
      
      // Check if user exists
      const existingUser = await User.findOne({ where: { email } });
      
      if (existingUser) {
        console.log('🔄 Updating existing user...');
        await existingUser.update({
          password: hashedPassword,
          name: name,
          role: role
        });
      } else {
        console.log('➕ Creating new user...');
        await User.create({
          email: email,
          password: hashedPassword,
          name: name,
          role: role
        });
      }
      
      console.log('✅ Test user created/updated successfully');
      
      res.json({
        message: 'Test user created successfully',
        testCredentials: {
          email: 'admin@otr.com',
          password: 'password123'
        }
      });
      
    } catch (error) {
      console.error('💥 DEBUG: Error creating test user:', error);
      res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
  }

  /**
   * DEBUG: Fix all user passwords in production
   */
  static async fixAllPasswords(req, res) {
    try {
      const bcrypt = require('bcryptjs');
      
      console.log('🔧 DEBUG: Fixing all user passwords...');
      
      // Get all users
      const users = await User.findAll();
      console.log(`📊 Found ${users.length} users to fix`);
      
      // Update each user's password with detailed debugging
      for (const user of users) {
        console.log(`🔄 Fixing password for: ${user.email}`);
        
        // Hash the password properly with detailed logging
        const password = 'password123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        console.log(`[BCRYPT DEBUG] Generated hash for ${user.email}:`, hashedPassword);
        
        // Test the hash immediately
        const testResult = await bcrypt.compare(password, hashedPassword);
        console.log(`[BCRYPT DEBUG] Test result for ${user.email}:`, testResult);
        
        if (!testResult) {
          console.error(`[BCRYPT ERROR] Hash verification failed for ${user.email}`);
          continue;
        }
        
        // Update the user (bypass hooks to avoid double-hashing)
        await user.update({ password: hashedPassword }, { hooks: false });
        
        // Test again after database save
        const savedUser = await User.findOne({ where: { email: user.email } });
        const finalTest = await bcrypt.compare(password, savedUser.password);
        console.log(`[BCRYPT DEBUG] Final test for ${user.email}:`, finalTest);
        
        console.log(`✅ Fixed password for: ${user.email}`);
      }
      
      console.log('🎉 All passwords fixed successfully!');
      
      res.json({
        message: 'All passwords fixed successfully',
        usersFixed: users.length,
        testCredentials: {
          email: 'any_user_email',
          password: 'password123'
        }
      });
      
    } catch (error) {
      console.error('💥 DEBUG: Error fixing passwords:', error);
      res.status(500).json({ error: 'Failed to fix passwords', details: error.message });
    }
  }

  /**
   * DEBUG: Test password hashing
   */
  static async testPassword(req, res) {
    try {
      const { password } = req.body;
      const bcrypt = require('bcryptjs');
      
      console.log('🔧 DEBUG: Testing password hashing for:', password);
      
      // Hash the password
      const saltRounds = 10;
      const hash = await bcrypt.hash(password, saltRounds);
      
      // Immediately verify it
      const isValid = await bcrypt.compare(password, hash);
      
      console.log('✅ Password test result:', isValid);
      
      res.json({
        originalPassword: password,
        hashedPassword: hash,
        verificationResult: isValid,
        message: isValid ? 'Password hashing working correctly' : 'Password hashing BROKEN'
      });
      
    } catch (error) {
      console.error('💥 DEBUG: Password test failed:', error);
      res.status(500).json({ error: 'Password test failed', details: error.message });
    }
  }

  /**
   * DEBUG: Test login without rate limiting
   */
  static async testLogin(req, res) {
    try {
      const { email, password } = req.body;
      
      console.log('🔧 DEBUG: Testing login for:', email);
      
      // Use the same logic as the regular login but without rate limiting
      const result = await AuthService.loginUser({ email, password });
      
      console.log('✅ Test login successful');
      
      res.json({
        success: true,
        message: 'Login successful',
        user: result.user,
        token: result.token
      });
      
    } catch (error) {
      console.error('💥 DEBUG: Test login failed:', error);
      res.status(401).json({ 
        success: false,
        error: 'Login failed', 
        details: error.message 
      });
    }
  }

  /**
   * DEBUG: Regenerate admin password with fresh hash
   */
  static async regenerateAdminPassword(req, res) {
    try {
      const bcrypt = require('bcryptjs');
      
      // Find admin user
      const user = await User.findOne({ where: { email: 'admin@otr.com' } });
      if (!user) {
        return res.status(404).json({ error: 'Admin user not found' });
      }
      
      console.log('Current hash:', user.password);
      
      // Generate new hash with explicit parameters
      const password = 'password123';
      const saltRounds = 10;
      const newHash = await bcrypt.hash(password, saltRounds);
      
      console.log('New hash generated:', newHash);
      
      // Test the new hash immediately
      const testResult = await bcrypt.compare(password, newHash);
      console.log('New hash test result:', testResult);
      
      if (!testResult) {
        return res.status(500).json({ error: 'New hash failed verification' });
      }
      
      // Update user with new hash (bypass hooks to avoid double-hashing)
      await user.update({ password: newHash }, { hooks: false });
      
      // Test again after database save
      const savedUser = await User.findOne({ where: { email: 'admin@otr.com' } });
      console.log('Saved hash in DB:', savedUser.password);
      console.log('Hash comparison details:', {
        originalHash: newHash,
        savedHash: savedUser.password,
        hashesMatch: newHash === savedUser.password,
        savedHashLength: savedUser.password.length
      });
      const finalTest = await bcrypt.compare(password, savedUser.password);
      
      res.json({
        message: 'Admin password regenerated successfully',
        oldHashLength: user.password.length,
        newHashLength: newHash.length,
        immediateTest: testResult,
        finalTest: finalTest,
        ready: finalTest
      });
      
    } catch (error) {
      console.error('Password regeneration error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DEBUG: Test bcrypt functionality
   */
  static async testBcrypt(req, res) {
    try {
      const bcrypt = require('bcryptjs');
      
      const testPassword = 'test123';
      const hash = await bcrypt.hash(testPassword, 10);
      const comparison = await bcrypt.compare(testPassword, hash);
      
      res.json({
        bcryptVersion: require('bcryptjs/package.json').version,
        testPassword: testPassword,
        generatedHash: hash,
        comparisonResult: comparison,
        working: comparison === true
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DEBUG: Check admin password in database
   */
  static async checkAdminPassword(req, res) {
    try {
      const user = await User.findOne({ where: { email: 'admin@otr.com' } });
      if (!user) {
        return res.status(404).json({ error: 'Admin user not found' });
      }
      
      const bcrypt = require('bcryptjs');
      const testPassword = 'password123';
      const comparison = await bcrypt.compare(testPassword, user.password);
      
      res.json({
        email: user.email,
        passwordHash: user.password,
        hashLength: user.password.length,
        hashStartsWith: user.password.substring(0, 7),
        testPassword: testPassword,
        comparisonResult: comparison,
        working: comparison === true
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create a player invitation (coach/admin only)
   */
  static async createPlayerInvitation(req, res) {
    try {
      const { name, email, position, team } = req.body;
      const inviterId = req.user.id;

      // Check if inviter has permission
      if (!['admin', 'coach'].includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'Only coaches and admins can invite players' 
        });
      }

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

      const invitationService = new InvitationService();
      const result = await invitationService.createPlayerInvitation(inviterId, {
        name,
        email,
        position,
        team
      });

      res.status(201).json(result);

    } catch (error) {
      console.error('Create invitation error:', error);
      
      if (error.message === 'User with this email already has an account') {
        return res.status(400).json({ 
          error: 'User with this email already has an account' 
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to create invitation' 
      });
    }
  }

  /**
   * Verify invitation token
   */
  static async verifyInvitation(req, res) {
    try {
      const { token } = req.params;

      const invitationService = new InvitationService();
      const user = await invitationService.verifyInvitationToken(token);

      res.json({
        message: 'Invitation token is valid',
        user: {
          name: user.name,
          email: user.email,
          expires_at: user.invitation_expires_at
        }
      });

    } catch (error) {
      console.error('Verify invitation error:', error);
      res.status(400).json({ 
        error: error.message 
      });
    }
  }

  /**
   * Complete invitation by setting password
   */
  static async completeInvitation(req, res) {
    try {
      const { token, password } = req.body;

      // Validate password
      if (!password || password.length < 6) {
        return res.status(400).json({ 
          error: 'Password must be at least 6 characters long' 
        });
      }

      const invitationService = new InvitationService();
      const result = await invitationService.completeInvitation(token, password);

      // Generate JWT token for immediate login
      const user = await User.findByPk(result.user.id);
      const jwtToken = AuthService.generateToken(user);

      res.json({
        message: result.message,
        user: result.user,
        token: jwtToken
      });

    } catch (error) {
      console.error('Complete invitation error:', error);
      res.status(400).json({ 
        error: error.message 
      });
    }
  }

  /**
   * Get pending invitations for coach/admin
   */
  static async getPendingInvitations(req, res) {
    try {
      const inviterId = req.user.id;

      // Check if user has permission
      if (!['admin', 'coach'].includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'Only coaches and admins can view invitations' 
        });
      }

      const invitationService = new InvitationService();
      const invitations = await invitationService.getPendingInvitations(inviterId);

      res.json({
        invitations,
        count: invitations.length
      });

    } catch (error) {
      console.error('Get invitations error:', error);
      res.status(500).json({ 
        error: 'Failed to get invitations' 
      });
    }
  }

  /**
   * Cancel an invitation
   */
  static async cancelInvitation(req, res) {
    try {
      const { invitationId } = req.params;
      const inviterId = req.user.id;

      // Check if user has permission
      if (!['admin', 'coach'].includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'Only coaches and admins can cancel invitations' 
        });
      }

      const invitationService = new InvitationService();
      const result = await invitationService.cancelInvitation(invitationId, inviterId);

      res.json(result);

    } catch (error) {
      console.error('Cancel invitation error:', error);
      res.status(400).json({ 
        error: error.message 
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
router.post('/create-user', authenticateToken, requireRole('admin'), AuthController.createUser); // Added createUser route
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, AuthController.updateProfile);
router.put('/change-password', authenticateToken, AuthController.changePassword);

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

// DEBUG ROUTES - Remove in production
router.get('/debug/check-users', AuthController.checkUsers);
router.post('/debug/create-test-user', AuthController.createTestUser);
router.post('/debug/test-password', AuthController.testPassword);
router.post('/debug/fix-all-passwords', AuthController.fixAllPasswords);
router.post('/debug/test-login', AuthController.testLogin);
router.post('/debug/regenerate-admin-password', AuthController.regenerateAdminPassword);
router.get('/debug/bcrypt-test', AuthController.testBcrypt);
router.get('/debug/check-admin-password', AuthController.checkAdminPassword);
router.get('/debug/raw-admin-password', async (req, res) => {
  try {
    const user = await require('../models').User.findOne({ where: { email: 'admin@otr.com' } });
    if (!user) {
      return res.status(404).json({ error: 'Admin user not found' });
    }
    res.json({
      email: user.email,
      password: user.password,
      length: user.password.length,
      startsWith: user.password.substring(0, 7)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Invitation routes
router.post('/invite-player', authenticateToken, AuthController.createPlayerInvitation);
router.get('/verify-invitation/:token', AuthController.verifyInvitation);
router.post('/complete-invitation', AuthController.completeInvitation);
router.get('/pending-invitations', authenticateToken, AuthController.getPendingInvitations);
router.delete('/invitations/:invitationId', authenticateToken, AuthController.cancelInvitation);

// Force restart
module.exports = router; 