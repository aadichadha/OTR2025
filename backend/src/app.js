const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const upload = require('./middleware/upload');
const { authenticateToken } = require('./middleware/auth');
const UploadController = require('./controllers/uploadController');
const AuthController = require('./controllers/authController');
const PlayerController = require('./controllers/playerController');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is healthy!' });
});

// Authentication routes
app.post('/api/auth/register', AuthController.register);
app.post('/api/auth/login', AuthController.login);

// Protected routes
app.get('/api/auth/profile', authenticateToken, AuthController.getProfile);
app.put('/api/auth/profile', authenticateToken, AuthController.updateProfile);

// Player management routes (protected)
app.post('/api/players', authenticateToken, PlayerController.createPlayer);
app.get('/api/players', authenticateToken, PlayerController.getPlayers);
app.get('/api/players/:id', authenticateToken, PlayerController.getPlayer);
app.put('/api/players/:id', authenticateToken, PlayerController.updatePlayer);
app.delete('/api/players/:id', authenticateToken, PlayerController.deletePlayer);
app.get('/api/players/:id/stats', authenticateToken, PlayerController.getPlayerStats);
app.get('/api/players/:playerId/sessions', authenticateToken, PlayerController.getSessionHistory);

// Upload routes (protected)
app.post('/api/upload/blast', authenticateToken, upload.single('file'), UploadController.uploadBlast);
app.post('/api/upload/hittrax', authenticateToken, upload.single('file'), UploadController.uploadHittrax);

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
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app; 