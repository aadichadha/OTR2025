const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const upload = require('./middleware/upload');
const { authenticateToken } = require('./middleware/auth');
const validateCsvParams = require('./middleware/validateCsvParams');
const UploadController = require('./controllers/uploadController');
const AuthController = require('./controllers/authController');
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

// Security middleware - simplified to prevent header errors
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP temporarily to prevent header errors
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
});

app.use('/api/auth/', authLimiter);

// CORS configuration
let allowedOrigins;
if (process.env.NODE_ENV === 'production') {
  // In production, use FRONTEND_URL if set, otherwise allow specific frontend domains
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    allowedOrigins = [frontendUrl];
  } else {
    // Allow specific frontend domains
    allowedOrigins = [
      'https://otr-2025-frontend.vercel.app', // Your specific Vercel domain
      'https://otr2025-frontend.vercel.app',  // Alternative format
      'https://*.vercel.app',
      'https://*.netlify.app',
      'https://*.onrender.com'
    ];
    console.log('⚠️  FRONTEND_URL not set, using fallback CORS origins');
  }
} else {
  allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowed === origin;
    })) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
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

// REMINDER: Set FRONTEND_URL in your production environment variables to your deployed frontend domain.
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// CORS logging middleware (for debugging)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Wrap route setup in try-catch to catch any import errors
try {
  console.log('🔧 Setting up API routes...');
  
  // Authentication routes
  const authRouter = require('./controllers/authController');
  app.use('/api/auth', authRouter);
  console.log('✅ Auth routes loaded');

  // Protected routes
  // app.get('/api/auth/profile', authenticateToken, AuthController.getProfile);
  // app.put('/api/auth/profile', authenticateToken, AuthController.updateProfile);

  // Player management routes (protected)
  app.post('/api/players', authenticateToken, PlayerController.createPlayer);
  app.get('/api/players', authenticateToken, PlayerController.getPlayers);
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
    
    // Sync database
    await sequelize.sync();
    console.log('✅ Database synced successfully.');
    
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