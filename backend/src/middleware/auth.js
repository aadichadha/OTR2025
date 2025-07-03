const AuthService = require('../services/authService');
const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and add user to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    console.log('[AUTH] Raw header:', authHeader);
    console.log('[AUTH] Extracted token:', token);
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    // Verify token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
      console.log('[AUTH] Decoded token:', decoded);
    } catch (err) {
      console.error('[AUTH] Token verification error:', err);
      return res.status(403).json({ error: 'Invalid or expired token', details: err.message });
    }
    // Get user data
    const userId = decoded.userId;
    console.log('[AUTH] Using userId for lookup:', userId);
    const user = await AuthService.getUserById(userId);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token', details: error.message });
  }
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = AuthService.verifyToken(token);
      const user = await AuthService.getUserById(decoded.id);
      req.user = user;
    }
  } catch (error) {
    // Ignore token errors for optional auth
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth
}; 