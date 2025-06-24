const CSVParser = require('../services/csvParser');
const { Session, Player } = require('../models');
const path = require('path');
const fs = require('fs');

class UploadController {
  /**
   * Handle Blast CSV upload
   */
  static async uploadBlast(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { playerId, playerLevel = 'High School', sessionDate } = req.body;

      if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
      }

      // Verify player exists
      const player = await Player.findByPk(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      // Optionally: Check player ownership (if multi-user)
      // if (player.user_id && player.user_id !== req.user.id) {
      //   return res.status(403).json({ error: 'You do not have access to this player' });
      // }

      // Create session linked to player
      const session = await Session.create({
        player_id: playerId,
        session_date: sessionDate || new Date(),
        session_type: 'blast',
        player_level: playerLevel
      });

      // Parse CSV and store data
      const parseResult = await CSVParser.parseBlastCSV(req.file.path, session.id);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.status(200).json({
        message: 'Blast data uploaded successfully',
        sessionId: session.id,
        playerName: player.name,
        parseResult: {
          totalRows: parseResult.totalRows,
          skippedRows: parseResult.skippedRows,
          parsedRows: parseResult.parsedRows,
          errorCount: parseResult.errorCount
        }
      });

    } catch (error) {
      console.error('Blast upload error:', error);
      
      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ 
        error: 'Failed to process Blast file',
        details: error.message 
      });
    }
  }

  /**
   * Handle Hittrax CSV upload
   */
  static async uploadHittrax(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { playerId, playerLevel = 'High School', sessionDate } = req.body;

      if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
      }

      // Verify player exists
      const player = await Player.findByPk(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      // Optionally: Check player ownership (if multi-user)
      // if (player.user_id && player.user_id !== req.user.id) {
      //   return res.status(403).json({ error: 'You do not have access to this player' });
      // }

      // Create session linked to player
      const session = await Session.create({
        player_id: playerId,
        session_date: sessionDate || new Date(),
        session_type: 'hittrax',
        player_level: playerLevel
      });

      // Parse CSV and store data
      const parseResult = await CSVParser.parseHittraxCSV(req.file.path, session.id);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.status(200).json({
        message: 'Hittrax data uploaded successfully',
        sessionId: session.id,
        playerName: player.name,
        parseResult: {
          totalRows: parseResult.totalRows,
          parsedRows: parseResult.parsedRows,
          errorCount: parseResult.errorCount
        }
      });

    } catch (error) {
      console.error('Hittrax upload error:', error);
      
      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ 
        error: 'Failed to process Hittrax file',
        details: error.message 
      });
    }
  }
}

module.exports = UploadController; 