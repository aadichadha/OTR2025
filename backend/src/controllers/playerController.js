const { Player, Session, BatSpeedData, ExitVelocityData } = require('../models');
const MetricsCalculator = require('../services/metricsCalculator');

class PlayerController {
  /**
   * Create a new player
   */
  static async createPlayer(req, res) {
    try {
      const { name, age, travel_team, high_school, position, graduation_year } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ 
          error: 'Player name is required' 
        });
      }

      // Validate age if provided
      if (age && (age < 8 || age > 25)) {
        return res.status(400).json({ 
          error: 'Age must be between 8 and 25' 
        });
      }

      // Validate graduation year if provided
      if (graduation_year) {
        const currentYear = new Date().getFullYear();
        if (graduation_year < currentYear || graduation_year > currentYear + 6) {
          return res.status(400).json({ 
            error: 'Graduation year must be between current year and 6 years from now' 
          });
        }
      }

      const player = await Player.create({
        name,
        age,
        travel_team,
        high_school,
        position,
        graduation_year
      });

      res.status(201).json({
        message: 'Player created successfully',
        player
      });

    } catch (error) {
      console.error('Create player error:', error);
      res.status(500).json({ 
        error: 'Failed to create player' 
      });
    }
  }

  /**
   * Get all players (with optional filtering)
   */
  static async getPlayers(req, res) {
    try {
      const { page = 1, limit = 10, search, team, school } = req.query;
      const offset = (page - 1) * limit;

      // Build where clause for filtering
      const whereClause = {};
      if (search) {
        whereClause.name = { [require('sequelize').Op.iLike]: `%${search}%` };
      }
      if (team) {
        whereClause.travel_team = { [require('sequelize').Op.iLike]: `%${team}%` };
      }
      if (school) {
        whereClause.high_school = { [require('sequelize').Op.iLike]: `%${school}%` };
      }

      const { count, rows: players } = await Player.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['name', 'ASC']],
        include: [{
          model: Session,
          attributes: ['id', 'session_date', 'session_type'],
          required: false
        }]
      });

      res.status(200).json({
        players,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      console.error('Get players error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve players' 
      });
    }
  }

  /**
   * Get a single player by ID
   */
  static async getPlayer(req, res) {
    try {
      const { id } = req.params;

      const player = await Player.findByPk(id, {
        include: [{
          model: Session,
          attributes: ['id', 'session_date', 'session_type'],
          order: [['session_date', 'DESC']]
        }]
      });

      if (!player) {
        return res.status(404).json({ 
          error: 'Player not found' 
        });
      }

      res.status(200).json({
        player
      });

    } catch (error) {
      console.error('Get player error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve player' 
      });
    }
  }

  /**
   * Update a player
   */
  static async updatePlayer(req, res) {
    try {
      const { id } = req.params;
      const { name, age, travel_team, high_school, position, graduation_year } = req.body;

      const player = await Player.findByPk(id);
      if (!player) {
        return res.status(404).json({ 
          error: 'Player not found' 
        });
      }

      // Validate age if provided
      if (age && (age < 8 || age > 25)) {
        return res.status(400).json({ 
          error: 'Age must be between 8 and 25' 
        });
      }

      // Validate graduation year if provided
      if (graduation_year) {
        const currentYear = new Date().getFullYear();
        if (graduation_year < currentYear || graduation_year > currentYear + 6) {
          return res.status(400).json({ 
            error: 'Graduation year must be between current year and 6 years from now' 
          });
        }
      }

      await player.update({
        name: name || player.name,
        age: age !== undefined ? age : player.age,
        travel_team: travel_team !== undefined ? travel_team : player.travel_team,
        high_school: high_school !== undefined ? high_school : player.high_school,
        position: position !== undefined ? position : player.position,
        graduation_year: graduation_year !== undefined ? graduation_year : player.graduation_year
      });

      res.status(200).json({
        message: 'Player updated successfully',
        player
      });

    } catch (error) {
      console.error('Update player error:', error);
      res.status(500).json({ 
        error: 'Failed to update player' 
      });
    }
  }

  /**
   * Delete a player
   */
  static async deletePlayer(req, res) {
    try {
      const { id } = req.params;

      const player = await Player.findByPk(id);
      if (!player) {
        return res.status(404).json({ 
          error: 'Player not found' 
        });
      }

      // Check if player has sessions
      const sessionCount = await Session.count({ where: { player_id: id } });
      if (sessionCount > 0) {
        return res.status(400).json({ 
          error: `Cannot delete player with ${sessionCount} session(s). Delete sessions first.` 
        });
      }

      await player.destroy();

      res.status(200).json({
        message: 'Player deleted successfully'
      });

    } catch (error) {
      console.error('Delete player error:', error);
      res.status(500).json({ 
        error: 'Failed to delete player' 
      });
    }
  }

  /**
   * Get player statistics
   */
  static async getPlayerStats(req, res) {
    try {
      const { id } = req.params;

      const player = await Player.findByPk(id, {
        include: [{
          model: Session,
          attributes: ['id', 'session_date', 'session_type'],
          required: false
        }]
      });

      if (!player) {
        return res.status(404).json({ 
          error: 'Player not found' 
        });
      }

      const stats = {
        totalSessions: player.Sessions.length,
        blastSessions: player.Sessions.filter(s => s.session_type === 'blast').length,
        hittraxSessions: player.Sessions.filter(s => s.session_type === 'hittrax').length,
        lastSession: player.Sessions.length > 0 ? 
          new Date(Math.max(...player.Sessions.map(s => new Date(s.session_date)))) : null
      };

      res.status(200).json({
        player: {
          id: player.id,
          name: player.name,
          age: player.age,
          travel_team: player.travel_team,
          high_school: player.high_school,
          position: player.position,
          graduation_year: player.graduation_year
        },
        stats
      });

    } catch (error) {
      console.error('Get player stats error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve player statistics' 
      });
    }
  }

  /**
   * Get session history for a player, including key metrics per session
   */
  static async getSessionHistory(req, res) {
    try {
      const { playerId } = req.params;
      // Fetch all sessions for the player
      const sessions = await Session.findAll({
        where: { player_id: playerId },
        order: [['session_date', 'ASC']],
      });
      // For each session, aggregate metrics
      const sessionHistory = await Promise.all(sessions.map(async (session) => {
        let avgBatSpeed = null, topBatSpeed = null, avgExitVelocity = null, topExitVelocity = null;
        if (session.session_type === 'blast') {
          const batSpeeds = await BatSpeedData.findAll({ where: { session_id: session.id } });
          const batSpeedVals = batSpeeds.map(row => parseFloat(row.bat_speed)).filter(Number.isFinite);
          avgBatSpeed = batSpeedVals.length ? (batSpeedVals.reduce((a, b) => a + b, 0) / batSpeedVals.length) : null;
          topBatSpeed = batSpeedVals.length ? Math.max(...batSpeedVals) : null;
        }
        if (session.session_type === 'hittrax') {
          const exitVelocities = await ExitVelocityData.findAll({ where: { session_id: session.id } });
          const exitVelocityVals = exitVelocities.map(row => parseFloat(row.exit_velocity)).filter(Number.isFinite);
          avgExitVelocity = exitVelocityVals.length ? (exitVelocityVals.reduce((a, b) => a + b, 0) / exitVelocityVals.length) : null;
          topExitVelocity = exitVelocityVals.length ? Math.max(...exitVelocityVals) : null;
        }
        return {
          sessionId: session.id,
          sessionDate: session.session_date,
          sessionType: session.session_type,
          metrics: {
            avgBatSpeed,
            topBatSpeed,
            avgExitVelocity,
            topExitVelocity
          }
        };
      }));
      // Calculate trends between sessions
      const trends = MetricsCalculator.calculateSessionTrends(sessionHistory);
      res.status(200).json({ sessionHistory, trends });
    } catch (error) {
      console.error('Get session history error:', error);
      res.status(500).json({ error: 'Failed to retrieve session history' });
    }
  }
}

module.exports = PlayerController; 