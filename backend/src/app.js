const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const upload = require('./middleware/upload');
const { authenticateToken, validateDomain } = require('./middleware/auth');
const validateCsvParams = require('./middleware/validateCsvParams');
const UploadController = require('./controllers/uploadController');
const authRouter = require('./controllers/authController');
const PlayerController = require('./controllers/playerController');
const SessionController = require('./controllers/sessionController');
const AnalyticsController = require('./controllers/analyticsController');
require('dotenv').config();
const { sequelize } = require('./config/database');

const app = express();

// Parse and validate PORT
const parsePort = (portStr) => {
  const port = parseInt(portStr);
  if (isNaN(port) || port < 0 || port > 65535) {
    console.warn(`⚠️  Invalid PORT value: ${portStr}, using default port 3001`);
    return 3001;
  }
  return port;
};

const PORT = parsePort(process.env.PORT) || 3001;

// Security middleware - DISABLED temporarily to fix CSP header errors
// app.use(helmet({
//   contentSecurityPolicy: false, // Disable CSP temporarily to prevent header errors
//   crossOriginEmbedderPolicy: false,
//   crossOriginResourcePolicy: { policy: "cross-origin" }
// }));

// TODO: Re-enable Helmet with proper CSP configuration once API is working

// CORS configuration (MUST come before rate limiting)
const allowedOrigins = [
  'https://otr-data.com', // New custom domain
  'https://www.otr-data.com', // New custom domain with www
  'https://otr2025.onrender.com', // Render production domain
  'http://localhost:5173', // Local development
  'http://localhost:3000'  // Alternative local development
];

// Add FRONTEND_URL from environment if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
  console.log('🔧 Added FRONTEND_URL to CORS origins:', process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('🌐 CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Allowing origin:', origin);
      callback(null, true);
    } else if (origin.includes('otr-data.com')) {
      // Allow any subdomain of otr-data.com
      console.log('✅ CORS: Allowing otr-data.com subdomain:', origin);
      callback(null, true);
    } else {
      console.log('🚫 CORS: Blocking origin:', origin);
      console.log('📋 Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ]
};

console.log('🔧 CORS configured for origins:', allowedOrigins);

// Apply CORS middleware FIRST (before rate limiting)
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// CORS logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// Validate domain middleware
app.use(validateDomain);

// Rate limiting (AFTER CORS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Temporarily disabled general rate limiting for debugging
// app.use('/api/', limiter);

// Stricter rate limiting for auth routes (skip OPTIONS requests and debug endpoints)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Temporarily increased limit to allow testing
  message: 'Too many authentication attempts, please try again later.',
  skip: (req) => req.method === 'OPTIONS' || req.path.includes('/debug/'), // Skip rate limiting for preflight requests and debug endpoints
});

// Temporarily disabled auth rate limiting for debugging - RESTART
// app.use('/api/auth/', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Wrap route setup in try-catch to catch any import errors
try {
  console.log('🔧 Setting up API routes...');
  
  // Authentication routes (includes invitation routes)
  const authRouter = require('./controllers/authController');
  app.use('/api/auth', authRouter);
  console.log('✅ Auth routes loaded');

  // Protected routes
  // app.get('/api/auth/profile', authenticateToken, AuthController.getProfile);
  // app.put('/api/auth/profile', authenticateToken, AuthController.updateProfile);

  // Player management routes (protected)
  app.post('/api/players', authenticateToken, PlayerController.createPlayer);
  app.get('/api/players', authenticateToken, PlayerController.getPlayers);
  // New endpoints for player dashboard and leaderboard (must come before :id routes)
  app.get('/api/players/me/stats', authenticateToken, PlayerController.getMyStats);
  app.get('/api/players/me/sessions', authenticateToken, PlayerController.getMySessions);
  app.get('/api/leaderboard', authenticateToken, PlayerController.getLeaderboard);
  // Parameterized routes (must come after specific routes)
  app.get('/api/players/:id', authenticateToken, PlayerController.getPlayer);
  app.put('/api/players/:id', authenticateToken, PlayerController.updatePlayer);
  app.delete('/api/players/:id', authenticateToken, PlayerController.deletePlayer);
  app.get('/api/players/:id/stats', authenticateToken, PlayerController.getPlayerStats);
  console.log('✅ Player routes loaded');

  // Session management routes (protected)
  app.get('/api/players/:playerId/sessions', authenticateToken, SessionController.getPlayerSessions);
  app.post('/api/sessions', authenticateToken, SessionController.createSession);
  app.patch('/api/sessions/:sessionId', authenticateToken, SessionController.updateSession);
  app.delete('/api/sessions/:sessionId', authenticateToken, SessionController.deleteSession);
  app.get('/api/sessions/:sessionId', authenticateToken, SessionController.getSessionDetails);
  app.get('/api/sessions/:sessionId/report', authenticateToken, SessionController.downloadSessionReport);
  app.post('/api/sessions/:sessionId/email', authenticateToken, SessionController.emailSessionReport);
  app.get('/api/sessions/:sessionId/report-data', authenticateToken, SessionController.getSessionReportData);
  app.get('/api/sessions/:sessionId/swings', authenticateToken, SessionController.getSessionSwings);
  console.log('✅ Session routes loaded');

  // Analytics routes (protected)
  app.get('/api/sessions/compare', authenticateToken, AnalyticsController.compareSessions);
  app.get('/api/sessions/:sessionId/swings', authenticateToken, AnalyticsController.getSessionSwings);
  app.put('/api/sessions/:sessionId/category', authenticateToken, AnalyticsController.updateSessionCategory);
  app.get('/api/players/:playerId/sessions', authenticateToken, AnalyticsController.getPlayerSessions);
  app.get('/api/players/:playerId/swings', authenticateToken, AnalyticsController.getPlayerSwings);
  app.get('/api/players/:playerId/analytics', authenticateToken, AnalyticsController.getPlayerAnalytics);
  console.log('✅ Analytics routes loaded');

  // Advanced analytics routes (protected)
  app.get('/api/analytics/players/:playerId/trends', authenticateToken, AnalyticsController.getPlayerTrends);
  app.get('/api/analytics/players/:playerId/benchmarks', authenticateToken, AnalyticsController.getPlayerBenchmarks);
  app.get('/api/analytics/players/:playerId/progress', authenticateToken, AnalyticsController.getPlayerProgress);
  app.get('/api/analytics/players/:playerId/filter-options', authenticateToken, AnalyticsController.getFilterOptions);

  // Upload routes (protected)
  app.post('/api/upload/blast', authenticateToken, upload.single('file'), validateCsvParams, UploadController.uploadBlast);
  app.post('/api/upload/hittrax', authenticateToken, upload.single('file'), validateCsvParams, UploadController.uploadHittrax);
  console.log('✅ Upload routes loaded');

  // Analytics routes
  app.get('/api/analytics/sessions/:sessionId/swings', AnalyticsController.getSessionSwings);
  app.put('/api/analytics/sessions/:sessionId/category', AnalyticsController.updateSessionCategory);
  app.get('/api/analytics/players/:playerId/sessions', AnalyticsController.getPlayerSessions);
  app.get('/api/analytics/players/:playerId/swings', AnalyticsController.getPlayerSwings);
  app.get('/api/analytics/players/:playerId/analytics', AnalyticsController.getPlayerAnalytics);
  app.post('/api/analytics/compare-sessions', AnalyticsController.compareSessions);
  console.log('✅ All routes loaded successfully');

} catch (error) {
  console.error('❌ Error setting up routes:', error);
  console.error('Stack trace:', error.stack);
  throw error;
}

// Health check route
app.get('/api/health', (req, res) => {
  try {
    res.status(200).json({ 
      status: 'ok', 
      message: 'API is healthy!',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: 'connected', // We'll test this separately
      cors: 'enabled',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to check user data
app.get('/api/debug/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Import required modules
    const { User } = require('./models');
    
    // Find user directly
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.json({ 
        found: false,
        message: 'User not found'
      });
    }
    
    res.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        password: {
          exists: !!user.password,
          length: user.password ? user.password.length : 0,
          startsWithHash: user.password ? user.password.startsWith('$2a$') : false,
          firstChars: user.password ? user.password.substring(0, 20) : null,
          lastChars: user.password ? user.password.substring(user.password.length - 10) : null
        }
      }
    });
    
  } catch (error) {
    console.error('💥 DEBUG: Error checking user:', error);
    res.status(500).json({ 
      error: 'Failed to check user', 
      details: error.message 
    });
  }
});

// Direct login test endpoint (bypasses all rate limiting)
app.post('/api/test-login', async (req, res) => {
  try {
    const { email, password: rawPassword } = req.body;
    const password = rawPassword ? rawPassword.trim() : rawPassword;
    
    console.log('🔧 DIRECT TEST: Testing login for:', email);
    
    // Import required modules
    const { User } = require('./models');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    
    // Find user directly
    const user = await User.findOne({ where: { email } });
    console.log('🔧 DIRECT TEST: User found:', user ? 'YES' : 'NO');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Login failed', 
        details: 'User not found'
      });
    }
    
    console.log('🔧 DIRECT TEST: User password field:', {
      exists: !!user.password,
      length: user.password ? user.password.length : 0,
      startsWithHash: user.password ? user.password.startsWith('$2a$') : false
    });
    
    // Test password comparison directly
    console.log('🔧 DIRECT TEST: Testing password comparison...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔧 DIRECT TEST: Password comparison result:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Login failed', 
        details: 'Invalid password'
      });
    }
    
    // Generate token
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });
    
    console.log('✅ DIRECT TEST: Login successful');
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token: token
    });
    
  } catch (error) {
    console.error('💥 DIRECT TEST: Login failed:', error);
    res.status(401).json({ 
      success: false,
      error: 'Login failed', 
      details: error.message 
    });
  }
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  try {
    res.status(200).json({ 
      message: 'CORS is working!',
      origin: req.headers.origin || 'No origin header',
      allowedOrigins: allowedOrigins,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('CORS test error:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Auth CORS test endpoint
app.get('/api/auth/cors-test', (req, res) => {
  try {
    res.status(200).json({ 
      message: 'Auth CORS is working!',
      origin: req.headers.origin || 'No origin header',
      allowedOrigins: allowedOrigins,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth CORS test error:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Basic API info endpoint
app.get('/api', (req, res) => {
  try {
    res.status(200).json({
      message: 'OTR Baseball Analytics API',
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        players: '/api/players',
        sessions: '/api/sessions',
        analytics: '/api/analytics',
        upload: '/api/upload'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API info error:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  // Log the full error details
  console.error('🚨 Server Error Details:');
  console.error('  Error:', error.message);
  console.error('  Stack:', error.stack);
  console.error('  URL:', req.url);
  console.error('  Method:', req.method);
  console.error('  Headers:', req.headers);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' });
    }
  }
  
  // Return detailed error in development, generic in production
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({ 
      error: error.message, 
      stack: error.stack,
      url: req.url,
      method: req.method,
      sql: error.parent?.sql,
      code: error.code,
      detail: error.detail
    });
  }
  
  // Production: Log error but return generic message
  console.error('❌ Production Error:', {
    message: error.message,
    code: error.code,
    detail: error.detail,
    hint: error.hint,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
    requestId: Math.random().toString(36).substr(2, 9)
  });
});

// Initialize database and start server
async function initializeApp() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database with error handling for missing columns
    try {
      await sequelize.sync();
      console.log('✅ Database synced successfully.');
    } catch (error) {
      if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('⚠️  Database sync warning: Some columns may not exist yet. This is normal if migrations haven\'t been run.');
        console.log('📝 To fix this permanently, run the database migrations.');
      } else {
        throw error;
      }
    }
    // Production deployment trigger - migration completed successfully
    
    // Handle foreign key enforcement based on database type
    if (process.env.NODE_ENV === 'production') {
      // PostgreSQL: Foreign keys are enforced by default, no PRAGMA needed
      console.log('🔗 PostgreSQL: Foreign key enforcement is enabled by default');
    } else {
      // SQLite: Enable foreign key enforcement
      try {
        await sequelize.query('PRAGMA foreign_keys = ON');
        const [fkResult] = await sequelize.query('PRAGMA foreign_keys');
        console.log('🔗 SQLite: Foreign key enforcement:', fkResult.foreign_keys === 1 ? 'ENABLED' : 'DISABLED');
      } catch (error) {
        console.log('⚠️  Could not enable SQLite foreign keys:', error.message);
      }
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Database: ${process.env.NODE_ENV === 'production' ? 'PostgreSQL' : 'SQLite'}`);
      console.log(`📡 API available at: ${process.env.NODE_ENV === 'production' ? `https://your-app.onrender.com` : `http://localhost:${PORT}`}`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    process.exit(1);
  }
}

// Start the application
initializeApp();

module.exports = app; 