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

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:5173"]
    }
  }
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
  // In production, use FRONTEND_URL if set, otherwise allow common frontend domains
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    allowedOrigins = [frontendUrl];
  } else {
    // Fallback to common Vercel/Netlify domains if FRONTEND_URL not set
    allowedOrigins = [
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
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
};
// REMINDER: Set FRONTEND_URL in your production environment variables to your deployed frontend domain.
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'API is healthy!',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
const authRouter = require('./controllers/authController');
app.use('/api/auth', authRouter);

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

// Session management routes (protected)
app.get('/api/players/:playerId/sessions', authenticateToken, SessionController.getPlayerSessions);
app.post('/api/sessions', authenticateToken, SessionController.createSession);
app.patch('/api/sessions/:sessionId', authenticateToken, SessionController.updateSession);
app.delete('/api/sessions/:sessionId', authenticateToken, SessionController.deleteSession);
app.get('/api/sessions/:sessionId', authenticateToken, SessionController.getSessionDetails);
app.get('/api/sessions/:sessionId/report', authenticateToken, SessionController.downloadSessionReport);
app.get('/api/sessions/:sessionId/report-data', authenticateToken, SessionController.getSessionReportData);
app.get('/api/sessions/:sessionId/swings', authenticateToken, SessionController.getSessionSwings);

// Analytics routes (protected)
app.get('/api/sessions/compare', authenticateToken, AnalyticsController.compareSessions);
app.get('/api/sessions/:sessionId/swings', authenticateToken, AnalyticsController.getSessionSwings);
app.put('/api/sessions/:sessionId/category', authenticateToken, AnalyticsController.updateSessionCategory);
app.get('/api/players/:playerId/sessions', authenticateToken, AnalyticsController.getPlayerSessions);
app.get('/api/players/:playerId/swings', authenticateToken, AnalyticsController.getPlayerSwings);
app.get('/api/players/:playerId/analytics', authenticateToken, AnalyticsController.getPlayerAnalytics);

// Advanced analytics routes (protected)
app.get('/api/analytics/players/:playerId/trends', authenticateToken, AnalyticsController.getPlayerTrends);
app.get('/api/analytics/players/:playerId/benchmarks', authenticateToken, AnalyticsController.getPlayerBenchmarks);
app.get('/api/analytics/players/:playerId/progress', authenticateToken, AnalyticsController.getPlayerProgress);
app.get('/api/analytics/players/:playerId/filter-options', authenticateToken, AnalyticsController.getFilterOptions);

// Upload routes (protected)
app.post('/api/upload/blast', authenticateToken, upload.single('file'), validateCsvParams, UploadController.uploadBlast);
app.post('/api/upload/hittrax', authenticateToken, upload.single('file'), validateCsvParams, UploadController.uploadHittrax);

// Analytics routes
app.get('/api/analytics/sessions/:sessionId/swings', AnalyticsController.getSessionSwings);
app.put('/api/analytics/sessions/:sessionId/category', AnalyticsController.updateSessionCategory);
app.get('/api/analytics/players/:playerId/sessions', AnalyticsController.getPlayerSessions);
app.get('/api/analytics/players/:playerId/swings', AnalyticsController.getPlayerSwings);
app.get('/api/analytics/players/:playerId/analytics', AnalyticsController.getPlayerAnalytics);
app.post('/api/analytics/compare-sessions', AnalyticsController.compareSessions);

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' });
    }
  }
  
  console.error('Server error:', error);
  
  /* dev-mode detailed errors */
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({ 
      error: error.message, 
      sql: error.parent?.sql,
      stack: error.stack 
    });
  }
  
  res.status(500).json({ error: 'Internal server error' });
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