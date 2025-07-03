const { Session, Player, BatSpeedData, ExitVelocityData } = require('../models');
const { aggregateReportData } = require('../services/reportAggregator');
const { generateReportPDF } = require('../services/pdfGenerator');
const path = require('path');
const fs = require('fs');

class SessionController {
  /**
   * Get all sessions for a specific player
   */
  static async getPlayerSessions(req, res) {
    try {
      const { playerId } = req.params;

      // Verify player exists
      const player = await Player.findByPk(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const sessions = await Session.findAll({
        where: { player_id: playerId },
        order: [['session_date', 'DESC']],
        include: [
          {
            model: BatSpeedData,
            as: 'batSpeedData',
            attributes: ['id']
          },
          {
            model: ExitVelocityData,
            as: 'exitVelocityData',
            attributes: ['id']
          }
        ]
      });

      res.status(200).json({
        sessions
      });

    } catch (error) {
      console.error('Get player sessions error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve player sessions' 
      });
    }
  }

  /**
   * Create a new session
   */
  static async createSession(req, res) {
    try {
      const { playerId, sessionDate, sessionType } = req.body;

      // Verify player exists
      const player = await Player.findByPk(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      // Create the session
      const session = await Session.create({
        player_id: playerId,
        session_date: sessionDate,
        session_type: sessionType
      });

      res.status(201).json({
        session
      });

    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({ 
        error: 'Failed to create session' 
      });
    }
  }

  /**
   * Update a session
   */
  static async updateSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { session_tags, session_type, session_date, notes } = req.body;

      // Verify session exists
      const session = await Session.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Update allowed fields
      const updateData = {};
      if (session_tags !== undefined) updateData.session_tags = session_tags;
      if (session_type !== undefined) updateData.session_type = session_type;
      if (session_date !== undefined) updateData.session_date = session_date;
      if (notes !== undefined) updateData.notes = notes;

      // Update the session
      await session.update(updateData);

      res.status(200).json({
        message: 'Session updated successfully',
        session
      });

    } catch (error) {
      console.error('Update session error:', error);
      res.status(500).json({ 
        error: 'Failed to update session' 
      });
    }
  }

  /**
   * Delete a session and all associated data
   */
  static async deleteSession(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await Session.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Delete associated data first
      await BatSpeedData.destroy({ where: { session_id: sessionId } });
      await ExitVelocityData.destroy({ where: { session_id: sessionId } });

      // Delete the session
      await session.destroy();

      res.status(200).json({
        message: 'Session deleted successfully'
      });

    } catch (error) {
      console.error('Delete session error:', error);
      res.status(500).json({ 
        error: 'Failed to delete session' 
      });
    }
  }

  /**
   * Get session details with all associated data
   */
  static async getSessionDetails(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await Session.findByPk(sessionId, {
        include: [
          {
            model: Player,
            as: 'player'
          },
          {
            model: BatSpeedData,
            as: 'batSpeedData'
          },
          {
            model: ExitVelocityData,
            as: 'exitVelocityData'
          }
        ]
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.status(200).json({
        session
      });

    } catch (error) {
      console.error('Get session details error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve session details' 
      });
    }
  }

  /**
   * Get session report data as JSON
   */
  static async getSessionReportData(req, res) {
    try {
      const { sessionId } = req.params;

      // Verify session exists
      const session = await Session.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Generate report data
      const reportData = await aggregateReportData(sessionId);

      res.status(200).json(reportData);

    } catch (error) {
      console.error('Get session report data error:', error);
      res.status(500).json({ 
        error: 'Failed to generate session report data' 
      });
    }
  }

  /**
   * Get swing data for visualization (Hittrax sessions only)
   */
  static async getSessionSwings(req, res) {
    try {
      const { sessionId } = req.params;

      // Verify session exists and is Hittrax type
      const session = await Session.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.session_type !== 'hittrax') {
        return res.status(400).json({ error: 'Swing data is only available for Hittrax sessions' });
      }

      // Get all swing data with spray chart fields
      const swings = await ExitVelocityData.findAll({
        where: { session_id: sessionId },
        attributes: [
          'id',
          'exit_velocity',
          'launch_angle',
          'distance',
          'spray_chart_x',
          'spray_chart_z',
          'horiz_angle',
          'strike_zone'
        ],
        order: [['id', 'ASC']]
      });

      res.status(200).json(swings);

    } catch (error) {
      console.error('Get session swings error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve swing data' 
      });
    }
  }

  /**
   * Download session report as PDF
   */
  static async downloadSessionReport(req, res) {
    try {
      const { sessionId } = req.params;

      // Verify session exists
      const session = await Session.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Generate report data
      const reportData = await aggregateReportData(sessionId);

      // Create reports directory if it doesn't exist
      const reportsDir = path.join(__dirname, '../reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // Generate PDF
      const filePath = path.join(reportsDir, `report_session_${sessionId}.pdf`);
      await generateReportPDF(reportData, filePath);

      // Send file
      res.download(filePath, `report_session_${sessionId}.pdf`, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Clean up file after download
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

    } catch (error) {
      console.error('Download session report error:', error);
      res.status(500).json({ 
        error: 'Failed to generate session report' 
      });
    }
  }
}

module.exports = SessionController; 