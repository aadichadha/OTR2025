const { Session, ExitVelocityData, Player, BatSpeedData } = require('../models');
const { Op } = require('sequelize');

// Get all swings for a specific session
const getSessionSwings = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const swings = await ExitVelocityData.findAll({
      where: { session_id: sessionId },
      order: [['created_at', 'ASC']],
      include: [{
        model: Session,
        as: 'session',
        include: [{
          model: Player,
          as: 'player'
        }]
      }]
    });

    // Add swing numbers if not already set
    const swingsWithNumbers = swings.map((swing, index) => ({
      ...swing.toJSON(),
      swing_number: swing.swing_number || index + 1
    }));

    res.json({
      success: true,
      data: swingsWithNumbers
    });
  } catch (error) {
    console.error('Error fetching session swings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session swings',
      error: error.message
    });
  }
};

// Update session category/tags
const updateSessionCategory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { session_category } = req.body;

    const session = await Session.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await session.update({ session_category });

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error updating session category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session category',
      error: error.message
    });
  }
};

// Get all sessions for a player with analytics
const getPlayerSessions = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { 
      session_category,
      limit = 50,
      offset = 0
    } = req.query;

    console.log(`[ANALYTICS] Fetching sessions for player ${playerId} with category: ${session_category}`);

    // Build where clause
    const whereClause = { player_id: playerId };
    if (session_category) {
      whereClause.session_category = session_category;
    }

    const sessions = await Session.findAll({
      where: whereClause,
      include: [{
        model: Player,
        as: 'player'
      }, {
        model: ExitVelocityData,
        as: 'exitVelocityData',
        attributes: ['exit_velocity', 'launch_angle', 'distance']
      }],
      order: [['session_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log(`[ANALYTICS] Found ${sessions.length} sessions for player ${playerId}`);

    // Add analytics for each session with proper data type handling
    const sessionsWithAnalytics = sessions.map(session => {
      const sessionData = session.toJSON();
      const swings = sessionData.exitVelocityData || [];
      
      // Ensure proper data type conversion for calculations
      const exitVelocities = swings.map(s => {
        const val = parseFloat(s.exit_velocity);
        return isNaN(val) || val <= 0 ? null : val;
      }).filter(v => v !== null);
      
      const launchAngles = swings.map(s => {
        const val = parseFloat(s.launch_angle);
        return isNaN(val) || Math.abs(val) <= 0.01 ? null : val;
      }).filter(v => v !== null);
      
      const distances = swings.map(s => {
        const val = parseFloat(s.distance);
        return isNaN(val) || val <= 0 ? null : val;
      }).filter(v => v !== null);

      // Calculate sweet spot swings with proper type handling
      const sweetSpotSwings = swings.filter(s => {
        const angle = parseFloat(s.launch_angle);
        const velocity = parseFloat(s.exit_velocity);
        return !isNaN(angle) && !isNaN(velocity) && angle >= 25 && angle <= 35 && velocity >= 90;
      }).length;

      // Ensure all calculated values are numbers or null
      const analytics = {
        total_swings: swings.length,
        average_exit_velocity: exitVelocities.length > 0 ? 
          parseFloat((exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length).toFixed(2)) : 0,
        average_launch_angle: launchAngles.length > 0 ? 
          parseFloat((launchAngles.reduce((a, b) => a + b, 0) / launchAngles.length).toFixed(2)) : 0,
        average_distance: distances.length > 0 ? 
          parseFloat((distances.reduce((a, b) => a + b, 0) / distances.length).toFixed(2)) : 0,
        best_exit_velocity: exitVelocities.length > 0 ? parseFloat(Math.max(...exitVelocities).toFixed(2)) : 0,
        sweet_spot_swings: sweetSpotSwings
      };

      return {
        ...sessionData,
        analytics
      };
    });

    res.json({
      success: true,
      data: sessionsWithAnalytics,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: sessionsWithAnalytics.length
      }
    });
  } catch (error) {
    console.error('Error fetching player sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player sessions',
      error: error.message
    });
  }
};

// Get all swings for a player across sessions with filtering
const getPlayerSwings = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { 
      min_exit_velocity, 
      max_exit_velocity, 
      min_launch_angle, 
      max_launch_angle,
      min_pitch_speed,
      max_pitch_speed,
      strike_zone,
      session_category,
      limit = 100,
      offset = 0
    } = req.query;

    // Build where clause
    const whereClause = {};
    const sessionWhereClause = { player_id: playerId };

    if (min_exit_velocity || max_exit_velocity) {
      whereClause.exit_velocity = {};
      if (min_exit_velocity) whereClause.exit_velocity[Op.gte] = parseFloat(min_exit_velocity);
      if (max_exit_velocity) whereClause.exit_velocity[Op.lte] = parseFloat(max_exit_velocity);
    }

    if (min_launch_angle || max_launch_angle) {
      whereClause.launch_angle = {};
      if (min_launch_angle) whereClause.launch_angle[Op.gte] = parseFloat(min_launch_angle);
      if (max_launch_angle) whereClause.launch_angle[Op.lte] = parseFloat(max_launch_angle);
    }

    if (min_pitch_speed || max_pitch_speed) {
      whereClause.pitch_speed = {};
      if (min_pitch_speed) whereClause.pitch_speed[Op.gte] = parseFloat(min_pitch_speed);
      if (max_pitch_speed) whereClause.pitch_speed[Op.lte] = parseFloat(max_pitch_speed);
    }

    if (strike_zone) {
      whereClause.strike_zone = strike_zone;
    }

    if (session_category) {
      sessionWhereClause.session_category = session_category;
    }

    const swings = await ExitVelocityData.findAll({
      where: whereClause,
      include: [{
        model: Session,
        as: 'session',
        where: sessionWhereClause,
        include: [{
          model: Player,
          as: 'player'
        }]
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: swings,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: swings.length
      }
    });
  } catch (error) {
    console.error('Error fetching player swings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player swings',
      error: error.message
    });
  }
};

// Get analytics summary for a player
const getPlayerAnalytics = async (req, res) => {
  try {
    const { playerId } = req.params;

    // Get all swings for the player
    const swings = await ExitVelocityData.findAll({
      include: [{
        model: Session,
        as: 'session',
        where: { player_id: playerId }
      }]
    });

    if (swings.length === 0) {
      return res.json({
        success: true,
        data: {
          total_swings: 0,
          average_exit_velocity: 0,
          average_launch_angle: 0,
          average_distance: 0,
          best_exit_velocity: 0,
          sweet_spot_swings: 0,
          sessions_count: 0
        }
      });
    }

    // Calculate analytics
    const exitVelocities = swings.map(s => parseFloat(s.exit_velocity)).filter(v => !isNaN(v));
    const launchAngles = swings.map(s => parseFloat(s.launch_angle)).filter(v => !isNaN(v));
    const distances = swings.map(s => parseFloat(s.distance)).filter(v => !isNaN(v));

    const sweetSpotSwings = swings.filter(s => {
      const angle = parseFloat(s.launch_angle);
      const velocity = parseFloat(s.exit_velocity);
      return angle >= 25 && angle <= 35 && velocity >= 90;
    }).length;

    const uniqueSessions = new Set(swings.map(s => s.session_id)).size;

    const analytics = {
      total_swings: swings.length,
      average_exit_velocity: exitVelocities.length > 0 ? 
        (exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length).toFixed(2) : 0,
      average_launch_angle: launchAngles.length > 0 ? 
        (launchAngles.reduce((a, b) => a + b, 0) / launchAngles.length).toFixed(2) : 0,
      average_distance: distances.length > 0 ? 
        (distances.reduce((a, b) => a + b, 0) / distances.length).toFixed(2) : 0,
      best_exit_velocity: exitVelocities.length > 0 ? Math.max(...exitVelocities).toFixed(2) : 0,
      sweet_spot_swings: sweetSpotSwings,
      sessions_count: uniqueSessions
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching player analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player analytics',
      error: error.message
    });
  }
};

// Multi-session comparison
const compareSessions = async (req, res) => {
  try {
    const sessionIds = (req.query.session_ids || '').split(',').map(id => parseInt(id)).filter(Boolean);
    if (!sessionIds.length) {
      return res.status(400).json({ success: false, message: 'No session_ids provided' });
    }

    // Optional filters
    const { min_exit_velocity, max_exit_velocity, min_launch_angle, max_launch_angle, strike_zone } = req.query;
    const swingWhere = { session_id: sessionIds };
    if (min_exit_velocity) swingWhere.exit_velocity = { ...swingWhere.exit_velocity, [Op.gte]: parseFloat(min_exit_velocity) };
    if (max_exit_velocity) swingWhere.exit_velocity = { ...swingWhere.exit_velocity, [Op.lte]: parseFloat(max_exit_velocity) };
    if (min_launch_angle) swingWhere.launch_angle = { ...swingWhere.launch_angle, [Op.gte]: parseFloat(min_launch_angle) };
    if (max_launch_angle) swingWhere.launch_angle = { ...swingWhere.launch_angle, [Op.lte]: parseFloat(max_launch_angle) };
    if (strike_zone) swingWhere.strike_zone = strike_zone;

    // Get all swings for these sessions
    const swings = await ExitVelocityData.findAll({
      where: swingWhere,
      order: [['session_id', 'ASC'], ['created_at', 'ASC']],
      include: [{
        model: Session,
        as: 'session',
        include: [{ model: Player, as: 'player' }]
      }]
    });

    // Group swings by session
    const swingsBySession = {};
    swings.forEach(swing => {
      const sid = swing.session_id;
      if (!swingsBySession[sid]) swingsBySession[sid] = [];
      swingsBySession[sid].push(swing.toJSON());
    });

    // Get analytics for each session
    const sessionAnalytics = {};
    for (const sid of sessionIds) {
      const sessionSwings = swingsBySession[sid] || [];
      const exitVelocities = sessionSwings.map(s => parseFloat(s.exit_velocity)).filter(v => !isNaN(v));
      const launchAngles = sessionSwings.map(s => parseFloat(s.launch_angle)).filter(v => !isNaN(v));
      const distances = sessionSwings.map(s => parseFloat(s.distance)).filter(v => !isNaN(v));
      const sweetSpotSwings = sessionSwings.filter(s => {
        const angle = parseFloat(s.launch_angle);
        const velocity = parseFloat(s.exit_velocity);
        return angle >= 25 && angle <= 35 && velocity >= 90;
      }).length;
      sessionAnalytics[sid] = {
        total_swings: sessionSwings.length,
        average_exit_velocity: exitVelocities.length > 0 ? (exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length).toFixed(2) : 0,
        average_launch_angle: launchAngles.length > 0 ? (launchAngles.reduce((a, b) => a + b, 0) / launchAngles.length).toFixed(2) : 0,
        average_distance: distances.length > 0 ? (distances.reduce((a, b) => a + b, 0) / distances.length).toFixed(2) : 0,
        best_exit_velocity: exitVelocities.length > 0 ? Math.max(...exitVelocities).toFixed(2) : 0,
        sweet_spot_swings: sweetSpotSwings
      };
    }

    res.json({
      success: true,
      data: {
        swings_by_session: swingsBySession,
        analytics_by_session: sessionAnalytics
      }
    });
  } catch (error) {
    console.error('Error comparing sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to compare sessions', error: error.message });
  }
};

// Get trend analysis for a player over time
const getPlayerTrends = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { metric = 'exit_velocity', days = 30 } = req.query;

    // Get sessions within the specified time range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const sessions = await Session.findAll({
      where: {
        player_id: playerId,
        session_date: { [Op.gte]: startDate }
      },
      include: [{
        model: ExitVelocityData,
        as: 'exitVelocityData',
        attributes: ['exit_velocity', 'launch_angle', 'distance', 'created_at']
      }],
      order: [['session_date', 'ASC']]
    });

    // Calculate trends for each session
    const trends = sessions.map(session => {
      const swings = session.exitVelocityData || [];
      const values = swings.map(s => parseFloat(s[metric])).filter(v => !isNaN(v));
      
      return {
        session_id: session.id,
        session_date: session.session_date,
        session_category: session.session_category,
        average: values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0,
        best: values.length > 0 ? Math.max(...values).toFixed(2) : 0,
        count: values.length
      };
    });

    // Calculate overall trend
    const trendData = trends.filter(t => t.count > 0);
    let trendDirection = 'stable';
    let trendValue = 0;

    if (trendData.length >= 2) {
      const first = parseFloat(trendData[0].average);
      const last = parseFloat(trendData[trendData.length - 1].average);
      trendValue = ((last - first) / first * 100).toFixed(2);
      trendDirection = trendValue > 0 ? 'improving' : trendValue < 0 ? 'declining' : 'stable';
    }

    res.json({
      success: true,
      data: {
        trends,
        overall_trend: {
          direction: trendDirection,
          percentage_change: trendValue,
          sessions_analyzed: trendData.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching player trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player trends',
      error: error.message
    });
  }
};

// Get benchmark comparisons
const getPlayerBenchmarks = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { age_group = 'high_school' } = req.query;

    // Get player's recent performance
    const recentSessions = await Session.findAll({
      where: { player_id: playerId },
      include: [{
        model: ExitVelocityData,
        as: 'exitVelocityData'
      }],
      order: [['session_date', 'DESC']],
      limit: 5
    });

    const allSwings = recentSessions.flatMap(s => s.exitVelocityData || []);
    const exitVelocities = allSwings.map(s => parseFloat(s.exit_velocity)).filter(v => !isNaN(v));
    const launchAngles = allSwings.map(s => parseFloat(s.launch_angle)).filter(v => !isNaN(v));

    const playerMetrics = {
      avg_exit_velocity: exitVelocities.length > 0 ? (exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length).toFixed(2) : 0,
      best_exit_velocity: exitVelocities.length > 0 ? Math.max(...exitVelocities).toFixed(2) : 0,
      avg_launch_angle: launchAngles.length > 0 ? (launchAngles.reduce((a, b) => a + b, 0) / launchAngles.length).toFixed(2) : 0
    };

    // Age group benchmarks (example data - you can expand this)
    const benchmarks = {
      youth: {
        avg_exit_velocity: 65,
        best_exit_velocity: 75,
        avg_launch_angle: 12
      },
      high_school: {
        avg_exit_velocity: 75,
        best_exit_velocity: 85,
        avg_launch_angle: 15
      },
      college: {
        avg_exit_velocity: 85,
        best_exit_velocity: 95,
        avg_launch_angle: 18
      },
      professional: {
        avg_exit_velocity: 90,
        best_exit_velocity: 100,
        avg_launch_angle: 20
      }
    };

    const benchmark = benchmarks[age_group] || benchmarks.high_school;

    // Calculate percentile rankings
    const exitVeloPercentile = ((parseFloat(playerMetrics.avg_exit_velocity) / benchmark.avg_exit_velocity) * 100).toFixed(1);
    const bestVeloPercentile = ((parseFloat(playerMetrics.best_exit_velocity) / benchmark.best_exit_velocity) * 100).toFixed(1);

    res.json({
      success: true,
      data: {
        player_metrics: playerMetrics,
        benchmark: benchmark,
        percentiles: {
          avg_exit_velocity: Math.min(parseFloat(exitVeloPercentile), 100),
          best_exit_velocity: Math.min(parseFloat(bestVeloPercentile), 100)
        },
        grades: {
          avg_exit_velocity: parseFloat(exitVeloPercentile) >= 90 ? 'A' : 
                           parseFloat(exitVeloPercentile) >= 80 ? 'B' : 
                           parseFloat(exitVeloPercentile) >= 70 ? 'C' : 
                           parseFloat(exitVeloPercentile) >= 60 ? 'D' : 'F',
          best_exit_velocity: parseFloat(bestVeloPercentile) >= 90 ? 'A' : 
                            parseFloat(bestVeloPercentile) >= 80 ? 'B' : 
                            parseFloat(bestVeloPercentile) >= 70 ? 'C' : 
                            parseFloat(bestVeloPercentile) >= 60 ? 'D' : 'F'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching player benchmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player benchmarks',
      error: error.message
    });
  }
};

// Get progress tracking and predictions
const getPlayerProgress = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { goal_metric = 'exit_velocity', goal_value = 90 } = req.query;

    // Get all sessions for the player
    const sessions = await Session.findAll({
      where: { player_id: playerId },
      include: [{
        model: ExitVelocityData,
        as: 'exitVelocityData'
      }],
      order: [['session_date', 'ASC']]
    });

    // Calculate progress over time
    const progressData = sessions.map(session => {
      const swings = session.exitVelocityData || [];
      const values = swings.map(s => parseFloat(s[goal_metric])).filter(v => !isNaN(v));
      
      return {
        session_id: session.id,
        session_date: session.session_date,
        average: values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0,
        best: values.length > 0 ? Math.max(...values).toFixed(2) : 0,
        count: values.length
      };
    }).filter(p => p.count > 0);

    // Calculate prediction
    let prediction = null;
    if (progressData.length >= 3) {
      const recent = progressData.slice(-3);
      const avgImprovement = recent.reduce((sum, p, i) => {
        if (i === 0) return 0;
        return sum + (parseFloat(p.average) - parseFloat(recent[i-1].average));
      }, 0) / (recent.length - 1);

      const currentAvg = parseFloat(progressData[progressData.length - 1].average);
      const goalDiff = parseFloat(goal_value) - currentAvg;
      
      if (avgImprovement > 0) {
        const sessionsToGoal = Math.ceil(goalDiff / avgImprovement);
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + (sessionsToGoal * 7)); // Assuming weekly sessions
        
        prediction = {
          current_average: currentAvg,
          goal_value: parseFloat(goal_value),
          sessions_to_goal: sessionsToGoal,
          estimated_date: estimatedDate.toISOString().split('T')[0],
          weekly_improvement_rate: avgImprovement.toFixed(2)
        };
      }
    }

    res.json({
      success: true,
      data: {
        progress: progressData,
        prediction,
        goal_metric,
        goal_value: parseFloat(goal_value)
      }
    });
  } catch (error) {
    console.error('Error fetching player progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player progress',
      error: error.message
    });
  }
};

// Get advanced filtering options
const getFilterOptions = async (req, res) => {
  try {
    const { playerId } = req.params;

    // Get unique values for filters
    const sessions = await Session.findAll({
      where: { player_id: playerId },
      attributes: ['session_category', 'session_type', 'session_date'],
      include: [{
        model: ExitVelocityData,
        as: 'exitVelocityData',
        attributes: ['strike_zone']
      }]
    });

    const categories = [...new Set(sessions.map(s => s.session_category).filter(Boolean))];
    const sessionTypes = [...new Set(sessions.map(s => s.session_type))];
    const strikeZones = [...new Set(sessions.flatMap(s => s.exitVelocityData?.map(sw => sw.strike_zone) || []).filter(Boolean))];

    // Calculate value ranges
    const allSwings = sessions.flatMap(s => s.exitVelocityData || []);
    const exitVelocities = allSwings.map(s => parseFloat(s.exit_velocity)).filter(v => !isNaN(v));
    const launchAngles = allSwings.map(s => parseFloat(s.launch_angle)).filter(v => !isNaN(v));
    const pitchSpeeds = allSwings.map(s => parseFloat(s.pitch_speed)).filter(v => !isNaN(v));

    res.json({
      success: true,
      data: {
        categories,
        session_types: sessionTypes,
        strike_zones: strikeZones.sort((a, b) => a - b),
        value_ranges: {
          exit_velocity: {
            min: exitVelocities.length > 0 ? Math.min(...exitVelocities).toFixed(1) : 0,
            max: exitVelocities.length > 0 ? Math.max(...exitVelocities).toFixed(1) : 0,
            avg: exitVelocities.length > 0 ? (exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length).toFixed(1) : 0
          },
          launch_angle: {
            min: launchAngles.length > 0 ? Math.min(...launchAngles).toFixed(1) : 0,
            max: launchAngles.length > 0 ? Math.max(...launchAngles).toFixed(1) : 0,
            avg: launchAngles.length > 0 ? (launchAngles.reduce((a, b) => a + b, 0) / launchAngles.length).toFixed(1) : 0
          },
          pitch_speed: {
            min: pitchSpeeds.length > 0 ? Math.min(...pitchSpeeds).toFixed(1) : 0,
            max: pitchSpeeds.length > 0 ? Math.max(...pitchSpeeds).toFixed(1) : 0,
            avg: pitchSpeeds.length > 0 ? (pitchSpeeds.reduce((a, b) => a + b, 0) / pitchSpeeds.length).toFixed(1) : 0
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filter options',
      error: error.message
    });
  }
};

// Get aggregated player stats for Fangraphs-style dashboard
const getPlayerStats = async (req, res) => {
    try {
      const { 
        startDate, 
        endDate, 
        playerLevel, 
        playerIds,
        timeRange = 'all' // 'all', 'recent', 'career'
      } = req.query;

      console.log('[FANGRAPHS] Getting player stats with filters:', { startDate, endDate, playerLevel, playerIds, timeRange });

      // Build date filter
      let dateFilter = {};
      if (timeRange === 'recent') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        dateFilter = {
          session_date: {
            [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0]
          }
        };
      } else if (startDate && endDate) {
        dateFilter = {
          session_date: {
            [Op.between]: [startDate, endDate]
          }
        };
      }

      // Build player filter
      let playerFilter = {};
      if (playerIds) {
        const playerIdArray = playerIds.split(',').map(id => parseInt(id.trim()));
        playerFilter = { id: { [Op.in]: playerIdArray } };
      }
      if (playerLevel) {
        playerFilter.player_level = playerLevel;
      }

      // Get all players with their aggregated stats
      const players = await Player.findAll({
        where: playerFilter,
        include: [{
          model: Session,
          as: 'sessions',
          where: dateFilter,
          required: false,
          include: [
            {
              model: ExitVelocityData,
              as: 'exitVelocityData',
              required: false
            },
            {
              model: BatSpeedData,
              as: 'batSpeedData',
              required: false
            }
          ]
        }],
        order: [['name', 'ASC']]
      });

      const playerStats = [];

      for (const player of players) {
        // Aggregate all exit velocity data
        const allExitVelocityData = [];
        const allBatSpeedData = [];

        for (const session of player.sessions) {
          if (session.exitVelocityData) {
            allExitVelocityData.push(...session.exitVelocityData);
          }
          if (session.batSpeedData) {
            allBatSpeedData.push(...session.batSpeedData);
          }
        }

        // Calculate aggregated metrics
        let stats = {
          player_id: player.id,
          player_name: player.name,
          player_level: player.player_level || 'High School',
          position: player.position,
          total_sessions: player.sessions.length,
          total_swings: allExitVelocityData.length + allBatSpeedData.length
        };

        // Calculate exit velocity metrics
        if (allExitVelocityData.length > 0) {
          const exitVelocities = allExitVelocityData.map(row => row.exit_velocity).filter(val => val !== null);
          const launchAngles = allExitVelocityData.map(row => row.launch_angle).filter(val => val !== null);
          const pitchSpeeds = allExitVelocityData.map(row => row.pitch_speed).filter(val => val !== null);
          const barrelSwings = allExitVelocityData.filter(row => row.is_barrel === 1).length;

          stats.avg_exit_velocity = exitVelocities.length > 0 ? 
            Math.round((exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length) * 10) / 10 : null;
          stats.max_exit_velocity = exitVelocities.length > 0 ? Math.max(...exitVelocities) : null;
          stats.avg_launch_angle = launchAngles.length > 0 ? 
            Math.round((launchAngles.reduce((a, b) => a + b, 0) / launchAngles.length) * 10) / 10 : null;
          stats.avg_pitch_speed = pitchSpeeds.length > 0 ? 
            Math.round((pitchSpeeds.reduce((a, b) => a + b, 0) / pitchSpeeds.length) * 10) / 10 : null;
          stats.barrel_percentage = allExitVelocityData.length > 0 ? 
            Math.round((barrelSwings / allExitVelocityData.length) * 1000) / 10 : null;
        }

        // Calculate bat speed metrics
        if (allBatSpeedData.length > 0) {
          const batSpeeds = allBatSpeedData.map(row => row.bat_speed).filter(val => val !== null);
          const attackAngles = allBatSpeedData.map(row => row.attack_angle).filter(val => val !== null);
          const timeToContacts = allBatSpeedData.map(row => row.time_to_contact).filter(val => val !== null);

          stats.avg_bat_speed = batSpeeds.length > 0 ? 
            Math.round((batSpeeds.reduce((a, b) => a + b, 0) / batSpeeds.length) * 10) / 10 : null;
          stats.max_bat_speed = batSpeeds.length > 0 ? Math.max(...batSpeeds) : null;
          stats.avg_attack_angle = attackAngles.length > 0 ? 
            Math.round((attackAngles.reduce((a, b) => a + b, 0) / attackAngles.length) * 10) / 10 : null;
          stats.avg_time_to_contact = timeToContacts.length > 0 ? 
            Math.round((timeToContacts.reduce((a, b) => a + b, 0) / timeToContacts.length) * 1000) / 1000 : null;
        }

        playerStats.push(stats);
      }

      // Filter out players with no data if requested
      const filteredStats = playerStats.filter(player => player.total_swings > 0);

      console.log(`[FANGRAPHS] Returning stats for ${filteredStats.length} players`);

      res.json({
        success: true,
        players: filteredStats,
        total: filteredStats.length,
        filters: { startDate, endDate, playerLevel, playerIds, timeRange }
      });

    } catch (error) {
      console.error('[FANGRAPHS] Error getting player stats:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get player stats',
        details: error.message 
      });
    }
  }

module.exports = {
  getSessionSwings,
  updateSessionCategory,
  getPlayerSessions,
  getPlayerSwings,
  getPlayerAnalytics,
  compareSessions,
  getPlayerTrends,
  getPlayerBenchmarks,
  getPlayerProgress,
  getFilterOptions,
  getPlayerStats
}; 