const { Session, ExitVelocityData, Player, BatSpeedData } = require('../models');
const { Op } = require('sequelize');
const { getPlayerLevel } = require('../utils/playerLevelUtils');
const Grade20to80 = require('../utils/grade20to80');

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
        attributes: ['exit_velocity', 'launch_angle', 'distance', 'pitch_speed']
      }, {
        model: BatSpeedData,
        as: 'batSpeedData',
        attributes: ['bat_speed', 'attack_angle', 'time_to_contact']
      }],
      order: [['session_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log(`[ANALYTICS] Found ${sessions.length} sessions for player ${playerId}`);

    // Add analytics for each session with proper data type handling
    const sessionsWithAnalytics = sessions.map(session => {
      const sessionData = session.toJSON();
      const exitVelocitySwings = sessionData.exitVelocityData || [];
      const batSpeedSwings = sessionData.batSpeedData || [];
      
      // Calculate exit velocity metrics
      const exitVelocities = exitVelocitySwings.map(s => {
        const val = parseFloat(s.exit_velocity);
        return isNaN(val) || val <= 0 ? null : val;
      }).filter(v => v !== null);
      
      const launchAngles = exitVelocitySwings.map(s => {
        const val = parseFloat(s.launch_angle);
        return isNaN(val) || Math.abs(val) <= 0.01 ? null : val;
      }).filter(v => v !== null);
      
      const distances = exitVelocitySwings.map(s => {
        const val = parseFloat(s.distance);
        return isNaN(val) || val <= 0 ? null : val;
      }).filter(v => v !== null);

      // Calculate bat speed metrics
      const batSpeeds = batSpeedSwings.map(s => {
        const val = parseFloat(s.bat_speed);
        return isNaN(val) || val <= 0 ? null : val;
      }).filter(v => v !== null);
      
      const attackAngles = batSpeedSwings.map(s => {
        const val = parseFloat(s.attack_angle);
        return isNaN(val) ? null : val;
      }).filter(v => v !== null);
      
      const timeToContacts = batSpeedSwings.map(s => {
        const val = parseFloat(s.time_to_contact);
        return isNaN(val) || val <= 0 ? null : val;
      }).filter(v => v !== null);

      // Calculate barrel percentage
      let barrelPercentage = 0;
      if (exitVelocities.length > 0) {
        const maxEV = Math.max(...exitVelocities);
        const barrelThreshold = maxEV * 0.90; // 90% of max EV
        
        const barrels = exitVelocitySwings.filter(s => {
          const ev = parseFloat(s.exit_velocity);
          const la = parseFloat(s.launch_angle);
          return !isNaN(ev) && !isNaN(la) && 
                 ev >= barrelThreshold && 
                 la >= 8 && la <= 25;
        }).length;
        
        barrelPercentage = exitVelocitySwings.length > 0 ? 
          Math.round((barrels / exitVelocitySwings.length) * 1000) / 10 : 0;
      }

      // Calculate sweet spot swings with proper type handling
      const sweetSpotSwings = exitVelocitySwings.filter(s => {
        const angle = parseFloat(s.launch_angle);
        const velocity = parseFloat(s.exit_velocity);
        return !isNaN(angle) && !isNaN(velocity) && angle >= 25 && angle <= 35 && velocity >= 90;
      }).length;

      // Ensure all calculated values are numbers or null
      const analytics = {
        total_swings: exitVelocitySwings.length + batSpeedSwings.length,
        total_exit_velocity_swings: exitVelocitySwings.length,
        total_bat_speed_swings: batSpeedSwings.length,
        average_exit_velocity: exitVelocities.length > 0 ? 
          parseFloat((exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length).toFixed(2)) : 0,
        average_launch_angle: launchAngles.length > 0 ? 
          parseFloat((launchAngles.reduce((a, b) => a + b, 0) / launchAngles.length).toFixed(2)) : 0,
        average_distance: distances.length > 0 ? 
          parseFloat((distances.reduce((a, b) => a + b, 0) / distances.length).toFixed(2)) : 0,
        best_exit_velocity: exitVelocities.length > 0 ? parseFloat(Math.max(...exitVelocities).toFixed(2)) : 0,
        avg_bat_speed: batSpeeds.length > 0 ? 
          parseFloat((batSpeeds.reduce((a, b) => a + b, 0) / batSpeeds.length).toFixed(2)) : 0,
        max_bat_speed: batSpeeds.length > 0 ? parseFloat(Math.max(...batSpeeds).toFixed(2)) : 0,
        avg_attack_angle: attackAngles.length > 0 ? 
          parseFloat((attackAngles.reduce((a, b) => a + b, 0) / attackAngles.length).toFixed(2)) : 0,
        avg_time_to_contact: timeToContacts.length > 0 ? 
          parseFloat((timeToContacts.reduce((a, b) => a + b, 0) / timeToContacts.length).toFixed(3)) : 0,
        barrel_percentage: barrelPercentage,
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
    console.log('[DEBUG] getPlayerAnalytics called for playerId:', playerId);

    // Get all swings for the player
    const swings = await ExitVelocityData.findAll({
      include: [{
        model: Session,
        as: 'session',
        where: { player_id: playerId }
      }]
    });

    console.log('[DEBUG] getPlayerAnalytics - found swings:', swings.length);
    console.log('[DEBUG] getPlayerAnalytics - sample swing data:', swings.slice(0, 3).map(s => ({
      id: s.id,
      exit_velocity: s.exit_velocity,
      launch_angle: s.launch_angle,
      distance: s.distance,
      session_id: s.session_id
    })));

    if (swings.length === 0) {
      console.log('[DEBUG] getPlayerAnalytics - no swings found, returning empty data');
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

    console.log('[DEBUG] getPlayerAnalytics - exitVelocities count:', exitVelocities.length);
    console.log('[DEBUG] getPlayerAnalytics - launchAngles count:', launchAngles.length);
    console.log('[DEBUG] getPlayerAnalytics - distances count:', distances.length);
    console.log('[DEBUG] getPlayerAnalytics - sample exit velocities:', exitVelocities.slice(0, 5));

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

    console.log('[DEBUG] getPlayerAnalytics - calculated analytics:', analytics);

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
        playerId, // Add support for single playerId parameter
        timeRange = 'all', // 'all', 'recent', 'career'
        pitchSpeedMin,
        pitchSpeedMax,
        sessionTags
      } = req.query;

      console.log('[FANGRAPHS] Getting player stats with filters:', { 
        startDate, 
        endDate, 
        playerLevel, 
        playerIds, 
        playerId,
        timeRange,
        pitchSpeedMin,
        pitchSpeedMax,
        sessionTags
      });

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
      if (playerId) {
        // If playerId is provided, use it to find the specific player
        playerFilter = { id: parseInt(playerId) };
      } else if (playerIds) {
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
        let allExitVelocityData = [];
        const allBatSpeedData = [];
        const sessionTagsSet = new Set();

        for (const session of player.sessions) {
          if (session.exitVelocityData && Array.isArray(session.exitVelocityData)) {
            allExitVelocityData.push(...session.exitVelocityData);
          }
          if (session.batSpeedData && Array.isArray(session.batSpeedData)) {
            allBatSpeedData.push(...session.batSpeedData);
          }
          // Collect session tags robustly (JSON array or comma-separated string)
          if (session.session_tags) {
            try {
              let tags;
              if (typeof session.session_tags === 'string') {
                try {
                  tags = JSON.parse(session.session_tags);
                } catch {
                  // Fallback: treat as comma-separated
                  tags = session.session_tags.split(',').map(t => t.trim()).filter(Boolean);
                }
              } else {
                tags = session.session_tags;
              }
              if (Array.isArray(tags)) {
                tags.forEach(tag => sessionTagsSet.add(tag));
              }
            } catch (e) {
              console.log('[FANGRAPHS] Error parsing session tags:', e);
            }
          }
        }

        // --- SWING FILTER: Only use swings within pitch speed range for all stats ---
        if (pitchSpeedMin || pitchSpeedMax) {
          allExitVelocityData = allExitVelocityData.filter(row => {
            const ps = parseFloat(row.pitch_speed);
            if (isNaN(ps)) return false;
            if (pitchSpeedMin && ps < parseFloat(pitchSpeedMin)) return false;
            if (pitchSpeedMax && ps > parseFloat(pitchSpeedMax)) return false;
            return true;
          });
        }

        // Get player level using utility function
        const inferredLevel = getPlayerLevel(player);

        // Calculate aggregated metrics
        let stats = {
          player_id: player.id,
          player_name: player.name,
          player_level: inferredLevel,
          position: player.position,
          total_sessions: player.sessions.length,
          total_swings: allExitVelocityData.length, // Swings after pitch speed filter
          last_session_date: player.sessions.length > 0 ? 
            player.sessions[0].session_date : null,
          // Initialize all stats fields to null
          avg_exit_velocity: null,
          max_exit_velocity: null,
          avg_launch_angle: null,
          avg_time_to_contact: null,
          avg_bat_speed: null,
          max_bat_speed: null,
          barrel_percentage: null,
          avg_pitch_speed: null,
          session_tags: Array.from(sessionTagsSet)
        };

        // Calculate exit velocity metrics (using filtered swings)
        if (allExitVelocityData.length > 0) {
          const exitVelocities = allExitVelocityData
            .map(row => parseFloat(row.exit_velocity))
            .filter(val => !isNaN(val) && val > 0);
          
          const launchAngles = allExitVelocityData
            .map(row => parseFloat(row.launch_angle))
            .filter(val => !isNaN(val));
          
          const pitchSpeeds = allExitVelocityData
            .map(row => parseFloat(row.pitch_speed))
            .filter(val => !isNaN(val) && val > 0);

          // Calculate barrel percentage using the same logic as metricsCalculator
          let barrels = 0;
          if (exitVelocities.length > 0) {
            const maxEV = Math.max(...exitVelocities);
            const barrelThreshold = maxEV * 0.90; // 90% of max EV
            
            barrels = allExitVelocityData.filter(row => {
              const ev = parseFloat(row.exit_velocity);
              const la = parseFloat(row.launch_angle);
              return !isNaN(ev) && !isNaN(la) && 
                     ev >= barrelThreshold && 
                     la >= 8 && la <= 25;
            }).length;
          }

          stats.avg_exit_velocity = exitVelocities.length > 0 ? 
            Math.round((exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length) * 10) / 10 : null;
          stats.max_exit_velocity = exitVelocities.length > 0 ? Math.max(...exitVelocities) : null;
          stats.avg_launch_angle = launchAngles.length > 0 ? 
            Math.round((launchAngles.reduce((a, b) => a + b, 0) / launchAngles.length) * 10) / 10 : null;
          stats.avg_pitch_speed = pitchSpeeds.length > 0 ? 
            Math.round((pitchSpeeds.reduce((a, b) => a + b, 0) / pitchSpeeds.length) * 10) / 10 : null;
          stats.barrel_percentage = allExitVelocityData.length > 0 ? 
            Math.round((barrels / allExitVelocityData.length) * 1000) / 10 : null;
        }

        // Calculate bat speed metrics (not filtered by pitch speed)
        if (allBatSpeedData.length > 0) {
          const batSpeeds = allBatSpeedData
            .map(row => parseFloat(row.bat_speed))
            .filter(val => !isNaN(val) && val > 0);
          
          const attackAngles = allBatSpeedData
            .map(row => parseFloat(row.attack_angle))
            .filter(val => !isNaN(val));
          
          const timeToContacts = allBatSpeedData
            .map(row => parseFloat(row.time_to_contact))
            .filter(val => !isNaN(val) && val > 0);

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

      // Apply additional filters (session tags only)
      let filteredStats = playerStats.filter(player => player.total_swings > 0);

      // Filter by session tags
      if (sessionTags) {
        const tagsArray = sessionTags.split(',').map(tag => tag.trim());
        filteredStats = filteredStats.filter(player => 
          player.session_tags && 
          tagsArray.some(tag => player.session_tags.includes(tag))
        );
      }

      console.log(`[FANGRAPHS] Returning stats for ${filteredStats.length} players`);
      console.log('[FANGRAPHS] Sample player stats:', filteredStats[0] || 'No data');

      res.json({
        success: true,
        players: filteredStats,
        total: filteredStats.length,
        filters: { 
          startDate, 
          endDate, 
          playerLevel, 
          playerIds, 
          timeRange,
          pitchSpeedMin,
          pitchSpeedMax,
          sessionTags
        }
      });

    } catch (error) {
      console.error('[FANGRAPHS] Error getting player stats:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get player stats',
        details: error.message 
      });
    }
  };

// Get dashboard stats for coaches
const getDashboardStats = async (req, res) => {
  try {
    console.log('[DASHBOARD] Getting dashboard stats');

    // Get total players count
    const totalPlayers = await Player.count();

    // Get total sessions count
    const totalSessions = await Session.count();

    console.log(`[DASHBOARD] Found ${totalPlayers} players and ${totalSessions} sessions`);

    res.json({
      success: true,
      data: {
        totalPlayers,
        totalSessions
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
};

// Get leaderboard data
const getLeaderboard = async (req, res) => {
  try {
    const { 
      metric = 'max_exit_velocity', // 'max_exit_velocity', 'avg_exit_velocity', 'barrel_percentage', 'avg_bat_speed'
      limit = 50,
      playerLevel,
      timeRange = 'all'
    } = req.query;

    console.log('[LEADERBOARD] Getting leaderboard with metric:', metric);

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
    }

    // Build player filter
    let playerFilter = {};
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

    const leaderboardData = [];

    for (const player of players) {
      // Aggregate all exit velocity data
      let allExitVelocityData = [];
      const allBatSpeedData = [];

      for (const session of player.sessions) {
        if (session.exitVelocityData && Array.isArray(session.exitVelocityData)) {
          allExitVelocityData.push(...session.exitVelocityData);
        }
        if (session.batSpeedData && Array.isArray(session.batSpeedData)) {
          allBatSpeedData.push(...session.batSpeedData);
        }
      }

      // Skip players with no data
      if (allExitVelocityData.length === 0 && allBatSpeedData.length === 0) continue;

      // Get player level using utility function
      const inferredLevel = getPlayerLevel(player);

      // Calculate metrics
      const exitVelocities = allExitVelocityData
        .map(row => parseFloat(row.exit_velocity))
        .filter(val => !isNaN(val) && val > 0);
      
      const launchAngles = allExitVelocityData
        .map(row => parseFloat(row.launch_angle))
        .filter(val => !isNaN(val));
      
      const batSpeeds = allBatSpeedData
        .map(row => parseFloat(row.bat_speed))
        .filter(val => !isNaN(val) && val > 0);

      // Calculate barrel percentage
      let barrels = 0;
      if (exitVelocities.length > 0) {
        const maxEV = Math.max(...exitVelocities);
        const barrelThreshold = maxEV * 0.90; // 90% of max EV
        
        barrels = allExitVelocityData.filter(row => {
          const ev = parseFloat(row.exit_velocity);
          const la = parseFloat(row.launch_angle);
          return !isNaN(ev) && !isNaN(la) && 
                 ev >= barrelThreshold && 
                 la >= 8 && la <= 25;
        }).length;
      }

      const playerData = {
        player_id: player.id,
        player_name: player.name,
        player_level: inferredLevel,
        position: player.position,
        total_sessions: player.sessions.length,
        total_swings: allExitVelocityData.length,
        max_exit_velocity: exitVelocities.length > 0 ? Math.max(...exitVelocities) : 0,
        avg_exit_velocity: exitVelocities.length > 0 ? 
          Math.round((exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length) * 10) / 10 : 0,
        avg_launch_angle: launchAngles.length > 0 ? 
          Math.round((launchAngles.reduce((a, b) => a + b, 0) / launchAngles.length) * 10) / 10 : 0,
        barrel_percentage: allExitVelocityData.length > 0 ? 
          Math.round((barrels / allExitVelocityData.length) * 1000) / 10 : 0,
        avg_bat_speed: batSpeeds.length > 0 ? 
          Math.round((batSpeeds.reduce((a, b) => a + b, 0) / batSpeeds.length) * 10) / 10 : 0,
        max_bat_speed: batSpeeds.length > 0 ? Math.max(...batSpeeds) : 0,
        last_session_date: player.sessions.length > 0 ? 
          player.sessions[0].session_date : null
      };

      leaderboardData.push(playerData);
    }

    // Sort by the specified metric
    leaderboardData.sort((a, b) => {
      const aValue = parseFloat(a[metric]) || 0;
      const bValue = parseFloat(b[metric]) || 0;
      return bValue - aValue; // Descending order
    });

    // Apply limit
    const limitedData = leaderboardData.slice(0, parseInt(limit));

    console.log(`[LEADERBOARD] Returning ${limitedData.length} players sorted by ${metric}`);

    res.json({
      success: true,
      data: limitedData,
      metric,
      total: leaderboardData.length
    });

  } catch (error) {
    console.error('[LEADERBOARD] Error getting leaderboard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get leaderboard',
      details: error.message 
    });
  }
};

// Get player progression data with 20-80 grades
const getPlayerProgression = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { days = 365 } = req.query;

    console.log(`[PROGRESSION] Fetching progression data for player ${playerId} over ${days} days`);

    // Get player info
    const player = await Player.findByPk(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    const playerLevel = getPlayerLevel(player);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    // Get all sessions for the player within the date range
    const sessions = await Session.findAll({
      where: {
        player_id: playerId,
        session_date: {
          [Op.gte]: cutoffDate
        }
      },
      include: [{
        model: ExitVelocityData,
        as: 'exitVelocityData',
        attributes: ['exit_velocity', 'launch_angle', 'distance', 'pitch_speed']
      }, {
        model: BatSpeedData,
        as: 'batSpeedData',
        attributes: ['bat_speed', 'attack_angle', 'time_to_contact']
      }],
      order: [['session_date', 'ASC']]
    });

    console.log(`[PROGRESSION] Found ${sessions.length} sessions for analysis`);

    // Calculate level statistics (mean and standard deviation) for each metric
    const levelStats = await calculateLevelStatistics(playerLevel);

    // Process each session and calculate metrics with grades
    const progressionData = sessions.map(session => {
      const sessionData = session.toJSON();
      const exitVelocitySwings = sessionData.exitVelocityData || [];
      const batSpeedSwings = sessionData.batSpeedData || [];
      
      // Calculate raw metrics
      const exitVelocities = exitVelocitySwings.map(s => parseFloat(s.exit_velocity)).filter(v => !isNaN(v) && v > 0);
      const batSpeeds = batSpeedSwings.map(s => parseFloat(s.bat_speed)).filter(v => !isNaN(v) && v > 0);
      const launchAngles = exitVelocitySwings.map(s => parseFloat(s.launch_angle)).filter(v => !isNaN(v));
      
      // Calculate session metrics
      const avgEv = exitVelocities.length > 0 ? exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length : null;
      const maxEv = exitVelocities.length > 0 ? Math.max(...exitVelocities) : null;
      const avgBs = batSpeeds.length > 0 ? batSpeeds.reduce((a, b) => a + b, 0) / batSpeeds.length : null;
      const maxBs = batSpeeds.length > 0 ? Math.max(...batSpeeds) : null;
      const avgLa = launchAngles.length > 0 ? launchAngles.reduce((a, b) => a + b, 0) / launchAngles.length : null;
      
      // Calculate barrel percentage
      let barrelPct = 0;
      if (exitVelocities.length > 0 && launchAngles.length > 0) {
        const maxEV = Math.max(...exitVelocities);
        const barrelThreshold = maxEV * 0.90;
        const barrels = exitVelocitySwings.filter(s => {
          const ev = parseFloat(s.exit_velocity);
          const la = parseFloat(s.launch_angle);
          return !isNaN(ev) && !isNaN(la) && ev >= barrelThreshold && la >= 8 && la <= 25;
        }).length;
        barrelPct = Math.round((barrels / exitVelocities.length) * 1000) / 10;
      }

      // Calculate 20-80 grades
      const grades = {
        avgEv: avgEv ? Grade20to80.calculateGrade(avgEv, levelStats.avgEv.average, levelStats.avgEv.upper) : null,
        maxEv: maxEv ? Grade20to80.calculateGrade(maxEv, levelStats.maxEv.average, levelStats.maxEv.upper) : null,
        avgBs: avgBs ? Grade20to80.calculateGrade(avgBs, levelStats.avgBs.average, levelStats.avgBs.upper) : null,
        maxBs: maxBs ? Grade20to80.calculateGrade(maxBs, levelStats.maxBs.average, levelStats.maxBs.upper) : null,
        barrelPct: barrelPct > 0 ? Grade20to80.calculateGrade(barrelPct, levelStats.barrelPct.average, levelStats.barrelPct.upper) : null
      };

      return {
        id: session.id,
        sessionId: session.id,
        sessionDate: session.session_date,
        sessionType: session.type,
        metrics: {
          avgEv: parseFloat(avgEv?.toFixed(2)) || null,
          maxEv: parseFloat(maxEv?.toFixed(2)) || null,
          avgBs: parseFloat(avgBs?.toFixed(2)) || null,
          maxBs: parseFloat(maxBs?.toFixed(2)) || null,
          avgLa: parseFloat(avgLa?.toFixed(2)) || null,
          barrelPct: barrelPct || null
        },
        grades,
        totalSwings: exitVelocitySwings.length + batSpeedSwings.length
      };
    });

    // Calculate trends and changes
    const trends = calculateTrends(progressionData, levelStats);

    // Get milestones achieved
    const milestones = calculateMilestones(progressionData, levelStats);

    // Get coaching tips
    const coachingTips = generateCoachingTips(progressionData, levelStats);

    res.json({
      success: true,
      data: {
        player: {
          id: player.id,
          name: player.name,
          level: playerLevel
        },
        progressionData,
        levelStats,
        trends,
        milestones,
        coachingTips
      }
    });

  } catch (error) {
    console.error('Error fetching player progression:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player progression',
      error: error.message
    });
  }
};

// Helper function to calculate level statistics
const calculateLevelStatistics = async (playerLevel) => {
  // Get benchmarks for the player's level
  const benchmarks = require('../config/benchmarks');
  const levelBenchmark = benchmarks[playerLevel] || benchmarks['High School'];
  
  // Return benchmark values for the new grading system
  return {
    avgEv: {
      average: levelBenchmark['Avg EV'],
      upper: levelBenchmark['Top 8th EV']
    },
    maxEv: {
      average: levelBenchmark['Avg EV'],
      upper: levelBenchmark['Top 8th EV']
    },
    avgBs: {
      average: levelBenchmark['Avg BatSpeed'],
      upper: levelBenchmark['90th% BatSpeed']
    },
    maxBs: {
      average: levelBenchmark['Avg BatSpeed'],
      upper: levelBenchmark['90th% BatSpeed']
    },
    barrelPct: {
      average: 15, // Average barrel percentage
      upper: 25    // Upper barrel percentage benchmark
    }
  };
};

// Helper function to calculate trends
const calculateTrends = (progressionData, levelStats) => {
  if (progressionData.length < 2) return {};

  const firstSession = progressionData[0];
  const lastSession = progressionData[progressionData.length - 1];
  const recentSessions = progressionData.slice(-4); // Last 4 sessions

  const trends = {};
  const metrics = ['avgEv', 'maxEv', 'avgBs', 'maxBs', 'barrelPct'];

  metrics.forEach(metric => {
    if (firstSession.metrics[metric] && lastSession.metrics[metric]) {
      const firstValue = firstSession.metrics[metric];
      const lastValue = lastSession.metrics[metric];
      const change = ((lastValue - firstValue) / firstValue) * 100;
      
      // Calculate recent average
      const recentValues = recentSessions
        .map(s => s.metrics[metric])
        .filter(v => v !== null);
      const recentAvg = recentValues.length > 0 ? 
        recentValues.reduce((a, b) => a + b, 0) / recentValues.length : null;
      
      // Calculate grade changes
      const gradeChange = Grade20to80.calculateGradeChange(
        firstValue, lastValue, 
        levelStats[metric].average, levelStats[metric].upper
      );

      trends[metric] = {
        firstValue,
        lastValue,
        percentChange: parseFloat(change.toFixed(1)),
        recentAverage: recentAvg ? parseFloat(recentAvg.toFixed(2)) : null,
        gradeChange,
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
      };
    }
  });

  return trends;
};

// Helper function to calculate milestones
const calculateMilestones = (progressionData, levelStats) => {
  const milestones = [];
  const metrics = ['avgEv', 'maxEv', 'avgBs', 'maxBs', 'barrelPct'];

  metrics.forEach(metric => {
    const metricMilestones = Grade20to80.getMilestones(metric, levelStats[metric].average, levelStats[metric].upper);
    
    metricMilestones.forEach(milestone => {
      // Check if player achieved this milestone
      const achievedSession = progressionData.find(session => 
        session.metrics[metric] >= milestone.value
      );
      
      if (achievedSession) {
        milestones.push({
          ...milestone,
          metric,
          achievedDate: achievedSession.sessionDate,
          sessionId: achievedSession.sessionId
        });
      }
    });
  });

  return milestones.sort((a, b) => new Date(a.achievedDate) - new Date(b.achievedDate));
};

// Helper function to generate coaching tips
const generateCoachingTips = (progressionData, levelStats) => {
  if (progressionData.length === 0) return [];

  const latestSession = progressionData[progressionData.length - 1];
  const tips = [];
  const metrics = ['avgEv', 'maxEv', 'avgBs', 'barrelPct'];

  metrics.forEach(metric => {
    const currentGrade = latestSession.grades[metric];
    if (currentGrade && currentGrade < 60) {
      const targetGrade = Math.min(60, currentGrade + 10);
      const tip = Grade20to80.getCoachingTip(metric, currentGrade, targetGrade);
      tips.push({
        metric,
        currentGrade,
        targetGrade,
        tip
      });
    }
  });

  return tips;
};

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
  getPlayerStats,
  getDashboardStats,
  getLeaderboard,
  getPlayerProgression
}; 