const { Player, Session, BatSpeedData, ExitVelocityData } = require('../models');
const MetricsCalculator = require('../services/metricsCalculator');
const { Op } = require('sequelize');
const User = require('../models').User;

class PlayerController {
  /**
   * Create a new player
   */
  static async createPlayer(req, res) {
    try {
      const { 
        name: playerName, 
        age, 
        travel_team, 
        high_school, 
        little_league, 
        college, 
        position, 
        graduation_year,
        email // Add email parameter
      } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!playerName) {
        return res.status(400).json({ 
          error: 'Player name is required' 
        });
      }

      // Validate age
      if (age && (age < 8 || age > 25)) {
        return res.status(400).json({ 
          error: 'Age must be between 8 and 25' 
        });
      }

      // Validate graduation year
      if (graduation_year) {
        const currentYear = new Date().getFullYear();
        if (graduation_year < currentYear || graduation_year > currentYear + 6) {
          return res.status(400).json({ 
            error: 'Graduation year must be between current year and 6 years from now' 
          });
        }
      }

      // Validate email if provided
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ 
            error: 'Invalid email format' 
          });
        }
        
        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({ 
            error: 'User with this email already exists' 
          });
        }
      }

      // Generate unique player code
      let playerCode;
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        playerCode = Math.floor(1000 + Math.random() * 9000).toString();
        attempts++;
        
        // Check if code already exists
        const existingPlayerWithCode = await Player.findOne({ where: { player_code: playerCode } });
        if (!existingPlayerWithCode) break;
        
        if (attempts >= maxAttempts) {
          return res.status(500).json({ 
            error: 'Unable to generate unique player code' 
          });
        }
      } while (true);

      // Create the player
      const player = await Player.create({
        name: playerName,
        age,
        travel_team,
        high_school,
        little_league,
        college,
        position,
        graduation_year,
        player_code: playerCode
      });

      // Create a user account for the player
      const bcrypt = require('bcryptjs');
      const defaultPassword = 'password123'; // Default password for new players
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      // Use provided email or generate a fallback email
      const playerEmail = email || `${playerName.toLowerCase().replace(/\s+/g, '.')}@otrbaseball.com`;

      const playerUser = await User.create({
        name: playerName,
        email: playerEmail,
        password: hashedPassword,
        role: 'player',
        created_by: userId
      });

      res.status(201).json({
        message: 'Player and user account created successfully',
        player,
        user: {
          id: playerUser.id,
          name: playerUser.name,
          email: playerUser.email,
          role: playerUser.role
        },
        loginCredentials: {
          email: playerUser.email,
          password: defaultPassword
        }
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
      console.log('🔍 getPlayers called with query:', req.query);
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

      console.log('🔍 Where clause:', whereClause);

      const { count, rows: players } = await Player.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['name', 'ASC']]
      });

      console.log(`📊 Found ${count} players, returning ${players.length} for current page`);
      console.log('📋 Players:', players.map(p => ({ id: p.id, name: p.name, position: p.position })));

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
          as: 'sessions',
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
      const { name, age, travel_team, high_school, little_league, college, position, graduation_year } = req.body;

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
        little_league: little_league !== undefined ? little_league : player.little_league,
        college: college !== undefined ? college : player.college,
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

      // Get all sessions for this player
      const sessions = await Session.findAll({ where: { player_id: id } });
      
      // Delete all associated data for each session
      for (const session of sessions) {
        // Delete bat speed data
        await BatSpeedData.destroy({ where: { session_id: session.id } });
        // Delete exit velocity data
        await ExitVelocityData.destroy({ where: { session_id: session.id } });
      }
      
      // Delete all sessions
      await Session.destroy({ where: { player_id: id } });
      
      // Delete the player
      await player.destroy();

      res.status(200).json({
        message: 'Player and all associated data deleted successfully'
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
          as: 'sessions',
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
        totalSessions: player.sessions.length,
        blastSessions: player.sessions.filter(s => s.session_type === 'blast').length,
        hittraxSessions: player.sessions.filter(s => s.session_type === 'hittrax').length,
        lastSession: player.sessions.length > 0 ? 
          new Date(Math.max(...player.sessions.map(s => new Date(s.session_date)))) : null
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

  /**
 * Get stats for the currently logged-in player
 */
  static async getMyStats(req, res) {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const player = await Player.findOne({ where: { name: user.name } });
      if (!player) return res.status(404).json({ error: 'Player not found for user' });
      // Aggregate stats (example: max/avg exit velo, bat speed, session count)
      const sessions = await Session.findAll({ where: { player_id: player.id } });
      let maxExitVelocity = null, avgExitVelocity = null, maxBatSpeed = null, avgBatSpeed = null, barrels = 0;
      let exitVelocities = [], batSpeeds = [];
      let allExitVelocities = []; // For calculating top 10% threshold
      
      for (const session of sessions) {
        if (session.session_type === 'hittrax') {
          const evs = await ExitVelocityData.findAll({ where: { session_id: session.id } });
          const evValues = evs.map(e => parseFloat(e.exit_velocity)).filter(Number.isFinite);
          exitVelocities.push(...evValues);
          allExitVelocities.push(...evValues);
        }
        if (session.session_type === 'blast') {
          const bss = await BatSpeedData.findAll({ where: { session_id: session.id } });
          batSpeeds.push(...bss.map(b => parseFloat(b.bat_speed)).filter(Number.isFinite));
        }
      }
      
      // Calculate barrels: ≥90% of max EV with launch angle 8-25 degrees
      if (allExitVelocities.length > 0) {
        const maxEV = Math.max(...allExitVelocities);
        const barrelThreshold = maxEV * 0.90; // 90% of max EV
        
        // Count barrels across all sessions
        for (const session of sessions) {
          if (session.session_type === 'hittrax') {
            const evs = await ExitVelocityData.findAll({ where: { session_id: session.id } });
            for (const ev of evs) {
              const exitVel = parseFloat(ev.exit_velocity);
              const launchAngle = parseFloat(ev.launch_angle);
              
              if (exitVel >= barrelThreshold && 
                  launchAngle >= 8 && 
                  launchAngle <= 25) {
                barrels++;
              }
            }
          }
        }
      }
      
      if (exitVelocities.length) {
        maxExitVelocity = Math.max(...exitVelocities);
        avgExitVelocity = exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length;
      }
      if (batSpeeds.length) {
        maxBatSpeed = Math.max(...batSpeeds);
        avgBatSpeed = batSpeeds.reduce((a, b) => a + b, 0) / batSpeeds.length;
      }
      res.json({
        maxExitVelocity,
        avgExitVelocity,
        maxBatSpeed,
        avgBatSpeed,
        barrels,
        sessionCount: sessions.length
      });
    } catch (error) {
      console.error('Get my stats error:', error);
      res.status(500).json({ error: 'Failed to retrieve player statistics' });
    }
  };

  /**
 * Get sessions for the currently logged-in player
 */
  static async getMySessions(req, res) {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const player = await Player.findOne({ where: { name: user.name } });
      if (!player) return res.status(404).json({ error: 'Player not found for user' });
      const sessions = await Session.findAll({ where: { player_id: player.id }, order: [['session_date', 'DESC']] });
      res.json({ sessions });
    } catch (error) {
      console.error('Get my sessions error:', error);
      res.status(500).json({ error: 'Failed to retrieve player sessions' });
    }
  };

  /**
 * Get leaderboard (all players, sorted by max exit velocity)
 */
  static async getLeaderboard(req, res) {
    try {
      const players = await Player.findAll();
      const leaderboard = [];
      for (const player of players) {
        const sessions = await Session.findAll({ where: { player_id: player.id } });
        let maxExitVelocity = null, avgExitVelocity = null, maxBatSpeed = null, avgBatSpeed = null, barrels = 0;
        let exitVelocities = [], batSpeeds = [];
        let allExitVelocities = []; // For calculating top 10% threshold
        
        for (const session of sessions) {
          if (session.session_type === 'hittrax') {
            const evs = await ExitVelocityData.findAll({ where: { session_id: session.id } });
            const evValues = evs.map(e => parseFloat(e.exit_velocity)).filter(Number.isFinite);
            exitVelocities.push(...evValues);
            allExitVelocities.push(...evValues);
          }
          if (session.session_type === 'blast') {
            const bss = await BatSpeedData.findAll({ where: { session_id: session.id } });
            batSpeeds.push(...bss.map(b => parseFloat(b.bat_speed)).filter(Number.isFinite));
          }
        }
        
        // Calculate barrels: ≥90% of max EV with launch angle 8-25 degrees
        if (allExitVelocities.length > 0) {
          const maxEV = Math.max(...allExitVelocities);
          const barrelThreshold = maxEV * 0.90; // 90% of max EV
          
          // Count barrels across all sessions
          for (const session of sessions) {
            if (session.session_type === 'hittrax') {
              const evs = await ExitVelocityData.findAll({ where: { session_id: session.id } });
              for (const ev of evs) {
                const exitVel = parseFloat(ev.exit_velocity);
                const launchAngle = parseFloat(ev.launch_angle);
                
                if (exitVel >= barrelThreshold && 
                    launchAngle >= 8 && 
                    launchAngle <= 25) {
                  barrels++;
                }
              }
            }
          }
        }
        
        if (exitVelocities.length) {
          maxExitVelocity = Math.max(...exitVelocities);
          avgExitVelocity = exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length;
        }
        if (batSpeeds.length) {
          maxBatSpeed = Math.max(...batSpeeds);
          avgBatSpeed = batSpeeds.reduce((a, b) => a + b, 0) / batSpeeds.length;
        }
        leaderboard.push({
          id: player.id,
          name: player.name,
          level: player.high_school ? 'High School' : player.college ? 'College' : player.little_league ? 'Youth' : 'Other',
          maxExitVelocity: maxExitVelocity ? Math.round(maxExitVelocity * 10) / 10 : null,
          avgExitVelocity: avgExitVelocity ? Math.round(avgExitVelocity * 10) / 10 : null,
          maxBatSpeed: maxBatSpeed ? Math.round(maxBatSpeed * 10) / 10 : null,
          avgBatSpeed: avgBatSpeed ? Math.round(avgBatSpeed * 10) / 10 : null,
          barrels,
          sessionCount: sessions.length
        });
      }
      leaderboard.sort((a, b) => (b.maxExitVelocity || 0) - (a.maxExitVelocity || 0));
      res.json({ players: leaderboard });
    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({ error: 'Failed to retrieve leaderboard' });
    }
  };
}

module.exports = PlayerController; 