const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Domain validation middleware
const validateDomain = (req, res, next) => {
  const allowedDomains = [
    'otr-data.com',
    'www.otr-data.com',
    'otr2025.onrender.com', // Render production domain
    'localhost:5173',
    'localhost:3000',
    'localhost:3001'
  ];
  
  const host = req.get('host');
  const origin = req.get('origin');
  
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin && !host) {
    return next();
  }
  
  // Check if host or origin is in allowed list
  const isAllowed = allowedDomains.some(domain => {
    return (host && host.includes(domain)) || (origin && origin.includes(domain));
  });
  
  // Debug logging
  console.log('🔍 Domain validation:', { host, origin, allowedDomains, isAllowed });
  
  if (isAllowed) {
    next();
  } else {
    console.log('🚫 Domain validation failed:', { host, origin });
    res.status(403).json({ error: 'Access denied - invalid domain' });
  }
};

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    console.log('🔍 [Auth Middleware] Verifying token...');
    
    // Get JWT secret with fallback
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    console.log('🔍 [Auth Middleware] JWT_SECRET:', jwtSecret ? 'SET' : 'NOT SET');
    
    const decoded = jwt.verify(token, jwtSecret);
    console.log('🔍 [Auth Middleware] Token decoded:', decoded);
    
    const user = await User.findByPk(decoded.userId);
    console.log('🔍 [Auth Middleware] User found:', user ? user.id : 'NOT FOUND');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user has specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role === 'admin') {
      return next(); // Admin has all permissions
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient role permissions' });
    }

    next();
  };
};

// Middleware to check if user can access specific player data
const canAccessPlayer = async (req, res, next) => {
  const playerId = req.params.playerId || req.params.id;
  
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Admin and coaches can access all players
  if (req.user.role === 'admin' || req.user.role === 'coach') {
    return next();
  }

  // Players can only access their own data
  if (req.user.role === 'player') {
    // Check if the playerId matches the user's associated player
    // This assumes there's a relationship between users and players
    // You may need to adjust this based on your data model
    if (req.user.id === parseInt(playerId)) {
      return next();
    }
    return res.status(403).json({ error: 'Can only access own data' });
  }

  next();
};

// Middleware to check if user can access specific session data
const canAccessSession = async (req, res, next) => {
  const sessionId = req.params.sessionId || req.params.id;
  
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Admin and coaches can access all sessions
  if (req.user.role === 'admin' || req.user.role === 'coach') {
    return next();
  }

  // Players can only access their own sessions
  if (req.user.role === 'player') {
    // You'll need to implement session ownership check here
    // This is a placeholder - adjust based on your session model
    return res.status(403).json({ error: 'Can only access own sessions' });
  }

  next();
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  canAccessPlayer,
  canAccessSession,
  validateDomain
}; 