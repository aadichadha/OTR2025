const { Session, Player, BatSpeedData, ExitVelocityData } = require('../models');
const { aggregateReportData } = require('../services/reportAggregator');
const { generateReportPDF } = require('../services/pdfGenerator');
const emailService = require('../services/emailService');
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

      console.log(`[SESSION] Fetching sessions for player ${playerId} (${player.name})`);

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

      console.log(`[SESSION] Found ${sessions.length} sessions for player ${playerId}`);

      // Transform sessions to ensure consistent data structure
      const transformedSessions = sessions.map(session => {
        const sessionData = session.toJSON();
        
        // Ensure arrays are always present
        sessionData.batSpeedData = sessionData.batSpeedData || [];
        sessionData.exitVelocityData = sessionData.exitVelocityData || [];
        
        // Add data point counts
        sessionData.batSpeedCount = sessionData.batSpeedData.length;
        sessionData.exitVelocityCount = sessionData.exitVelocityData.length;
        
        // Ensure session_type is always a string
        sessionData.session_type = sessionData.session_type || 'unknown';
        
        // Ensure session_date is properly formatted
        if (sessionData.session_date) {
          sessionData.session_date = new Date(sessionData.session_date).toISOString().split('T')[0];
        }
        
        return sessionData;
      });

      res.status(200).json({
        success: true,
        data: transformedSessions,
        message: `Found ${transformedSessions.length} sessions for ${player.name}`
      });

    } catch (error) {
      console.error('Get player sessions error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve player sessions',
        details: error.message
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
          'pitch_speed',
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

  /**
   * Email session report with PDF attachment
   */
  static async emailSessionReport(req, res) {
    try {
      const { sessionId } = req.params;
      const { recipientEmail } = req.body;

      // Validate recipient email
      if (!recipientEmail) {
        return res.status(400).json({ error: 'Recipient email is required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Verify session exists
      const session = await Session.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Generate report data
      const reportData = await aggregateReportData(sessionId);

      // Send email with PDF attachment
      const result = await emailService.sendSessionReport(sessionId, recipientEmail, reportData);

      res.status(200).json({
        message: 'Session report sent successfully',
        recipient: recipientEmail,
        messageId: result.messageId
      });

    } catch (error) {
      console.error('Email session report error:', error);
      res.status(500).json({ 
        error: 'Failed to send session report email',
        details: error.message
      });
    }
  }

  /**
   * Generate report for multiple sessions
   */
  static async generateMultiSessionReport(req, res) {
    try {
      const { sessionIds } = req.body;

      if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
        return res.status(400).json({ error: 'Session IDs array is required' });
      }

      console.log(`[MULTI-REPORT] Generating report for ${sessionIds.length} sessions:`, sessionIds);

      // Verify all sessions exist and belong to the same player
      const sessions = await Session.findAll({
        where: { id: sessionIds },
        include: [{ model: Player, as: 'player' }],
        order: [['session_date', 'ASC']]
      });

      if (sessions.length !== sessionIds.length) {
        return res.status(404).json({ error: 'One or more sessions not found' });
      }

      // Check if all sessions belong to the same player
      const playerIds = [...new Set(sessions.map(s => s.player_id))];
      if (playerIds.length > 1) {
        return res.status(400).json({ error: 'All sessions must belong to the same player' });
      }

      const player = sessions[0].player;
      const playerLevel = sessions[0].player_level || 'High School';

      // Aggregate data from all sessions
      let allBatSpeedData = [];
      let allExitVelocityData = [];
      let sessionTypes = new Set();

      for (const session of sessions) {
        sessionTypes.add(session.session_type);
        
        if (session.session_type === 'blast') {
          const batSpeedData = await BatSpeedData.findAll({
            where: { session_id: session.id }
          });
          allBatSpeedData.push(...batSpeedData);
        } else if (session.session_type === 'hittrax') {
          const exitVelocityData = await ExitVelocityData.findAll({
            where: { session_id: session.id }
          });
          allExitVelocityData.push(...exitVelocityData);
        }
      }

      // Calculate aggregated metrics
      const MetricsCalculator = require('../services/metricsCalculator');
      let batSpeedMetrics = null;
      let exitVelocityMetrics = null;
      let summaryText = '';

      try {
        if (allBatSpeedData.length > 0) {
          console.log('[MULTI-REPORT] Calculating aggregated bat speed metrics');
          batSpeedMetrics = await MetricsCalculator.calculateAggregatedBatSpeedMetrics(
            allBatSpeedData, 
            playerLevel
          );
          summaryText += `### Bat Speed Metrics (${allBatSpeedData.length} swings)\n`;
          summaryText += `Max Bat Speed: ${batSpeedMetrics.maxBatSpeed ?? 'N/A'} mph\n`;
          summaryText += `Average Bat Speed: ${batSpeedMetrics.avgBatSpeed ?? 'N/A'} mph\n`;
          summaryText += `Average Attack Angle: ${batSpeedMetrics.avgAttackAngle ?? 'N/A'}°\n`;
          summaryText += `Average Time to Contact: ${batSpeedMetrics.avgTimeToContact ?? 'N/A'} sec\n\n`;
        }

        if (allExitVelocityData.length > 0) {
          console.log('[MULTI-REPORT] Calculating aggregated exit velocity metrics');
          exitVelocityMetrics = await MetricsCalculator.calculateAggregatedExitVelocityMetrics(
            allExitVelocityData, 
            playerLevel
          );
          summaryText += `### Exit Velocity Metrics (${allExitVelocityData.length} swings)\n`;
          summaryText += `Max Exit Velocity: ${exitVelocityMetrics.maxExitVelocity ?? 'N/A'} mph\n`;
          summaryText += `Average Exit Velocity: ${exitVelocityMetrics.avgExitVelocity ?? 'N/A'} mph\n`;
          summaryText += `Average Launch Angle: ${exitVelocityMetrics.avgLaunchAngle ?? 'N/A'}°\n`;
          summaryText += `Barrel Percentage: ${exitVelocityMetrics.barrelPercentage ?? 'N/A'}%\n`;
        }
      } catch (err) {
        console.error('[MULTI-REPORT] Metrics calculation failed:', err);
        summaryText = 'Metrics calculation failed for one or more sessions.';
      }

      // Create aggregated report data
      const reportData = {
        session: {
          id: `multi-${sessionIds.join('-')}`,
          date: new Date(),
          type: Array.from(sessionTypes).join('+'),
          sessionIds: sessionIds
        },
        player: {
          id: player.id,
          name: player.name,
          level: playerLevel
        },
        metrics: {
          batSpeed: batSpeedMetrics,
          exitVelocity: exitVelocityMetrics
        },
        summaryText,
        sessionCount: sessions.length,
        totalSwings: allBatSpeedData.length + allExitVelocityData.length,
        sessions: sessions.map(s => ({
          id: s.id,
          date: s.session_date,
          type: s.session_type,
          swingCount: s.session_type === 'blast' ? 
            allBatSpeedData.filter(d => d.session_id === s.id).length :
            allExitVelocityData.filter(d => d.session_id === s.id).length
        }))
      };

      res.status(200).json({
        success: true,
        data: reportData,
        message: `Generated report for ${sessions.length} sessions`
      });

    } catch (error) {
      console.error('Generate multi-session report error:', error);
      res.status(500).json({ 
        error: 'Failed to generate multi-session report',
        details: error.message
      });
    }
  }

  /**
   * Download multi-session report as PDF
   */
  static async downloadMultiSessionReport(req, res) {
    try {
      const { sessionIds } = req.body;

      if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
        return res.status(400).json({ error: 'Session IDs array is required' });
      }

      // First generate the report data
      const reportData = await this.generateMultiSessionReportData(sessionIds);

      // Create reports directory if it doesn't exist
      const reportsDir = path.join(__dirname, '../reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // Generate PDF
      const fileName = `multi_session_report_${sessionIds.join('_')}.pdf`;
      const filePath = path.join(reportsDir, fileName);
      await generateReportPDF(reportData, filePath);

      // Send file
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Clean up file after download
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

    } catch (error) {
      console.error('Download multi-session report error:', error);
      res.status(500).json({ 
        error: 'Failed to generate multi-session report PDF',
        details: error.message
      });
    }
  }

  /**
   * Helper method to generate multi-session report data
   */
  static async generateMultiSessionReportData(sessionIds) {
    // Verify all sessions exist and belong to the same player
    const sessions = await Session.findAll({
      where: { id: sessionIds },
      include: [{ model: Player, as: 'player' }],
      order: [['session_date', 'ASC']]
    });

    if (sessions.length !== sessionIds.length) {
      throw new Error('One or more sessions not found');
    }

    // Check if all sessions belong to the same player
    const playerIds = [...new Set(sessions.map(s => s.player_id))];
    if (playerIds.length > 1) {
      throw new Error('All sessions must belong to the same player');
    }

    const player = sessions[0].player;
    const playerLevel = sessions[0].player_level || 'High School';

    // Aggregate data from all sessions
    let allBatSpeedData = [];
    let allExitVelocityData = [];
    let sessionTypes = new Set();

    for (const session of sessions) {
      sessionTypes.add(session.session_type);
      
      if (session.session_type === 'blast') {
        const batSpeedData = await BatSpeedData.findAll({
          where: { session_id: session.id }
        });
        allBatSpeedData.push(...batSpeedData);
      } else if (session.session_type === 'hittrax') {
        const exitVelocityData = await ExitVelocityData.findAll({
          where: { session_id: session.id }
        });
        allExitVelocityData.push(...exitVelocityData);
      }
    }

    // Calculate aggregated metrics
    const MetricsCalculator = require('../services/metricsCalculator');
    let batSpeedMetrics = null;
    let exitVelocityMetrics = null;
    let summaryText = '';

    try {
      if (allBatSpeedData.length > 0) {
        batSpeedMetrics = await MetricsCalculator.calculateAggregatedBatSpeedMetrics(
          allBatSpeedData, 
          playerLevel
        );
        summaryText += `### Bat Speed Metrics (${allBatSpeedData.length} swings)\n`;
        summaryText += `Max Bat Speed: ${batSpeedMetrics.maxBatSpeed ?? 'N/A'} mph\n`;
        summaryText += `Average Bat Speed: ${batSpeedMetrics.avgBatSpeed ?? 'N/A'} mph\n`;
        summaryText += `Average Attack Angle: ${batSpeedMetrics.avgAttackAngle ?? 'N/A'}°\n`;
        summaryText += `Average Time to Contact: ${batSpeedMetrics.avgTimeToContact ?? 'N/A'} sec\n\n`;
      }

      if (allExitVelocityData.length > 0) {
        exitVelocityMetrics = await MetricsCalculator.calculateAggregatedExitVelocityMetrics(
          allExitVelocityData, 
          playerLevel
        );
        summaryText += `### Exit Velocity Metrics (${allExitVelocityData.length} swings)\n`;
        summaryText += `Max Exit Velocity: ${exitVelocityMetrics.maxExitVelocity ?? 'N/A'} mph\n`;
        summaryText += `Average Exit Velocity: ${exitVelocityMetrics.avgExitVelocity ?? 'N/A'} mph\n`;
        summaryText += `Average Launch Angle: ${exitVelocityMetrics.avgLaunchAngle ?? 'N/A'}°\n`;
        summaryText += `Barrel Percentage: ${exitVelocityMetrics.barrelPercentage ?? 'N/A'}%\n`;
      }
    } catch (err) {
      console.error('[MULTI-REPORT] Metrics calculation failed:', err);
      summaryText = 'Metrics calculation failed for one or more sessions.';
    }

    // Create aggregated report data
    return {
      session: {
        id: `multi-${sessionIds.join('-')}`,
        date: new Date(),
        type: Array.from(sessionTypes).join('+'),
        sessionIds: sessionIds
      },
      player: {
        id: player.id,
        name: player.name,
        level: playerLevel
      },
      metrics: {
        batSpeed: batSpeedMetrics,
        exitVelocity: exitVelocityMetrics
      },
      summaryText,
      sessionCount: sessions.length,
      totalSwings: allBatSpeedData.length + allExitVelocityData.length,
      sessions: sessions.map(s => ({
        id: s.id,
        date: s.session_date,
        type: s.session_type,
        swingCount: s.session_type === 'blast' ? 
          allBatSpeedData.filter(d => d.session_id === s.id).length :
          allExitVelocityData.filter(d => d.session_id === s.id).length
      }))
    };
  }
}

module.exports = SessionController; 