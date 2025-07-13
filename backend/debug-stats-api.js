const express = require('express');
const { Player, Session, ExitVelocityData, BatSpeedData } = require('./src/models');
const { Op } = require('sequelize');

// Create a minimal Express app to test the API
const app = express();
app.use(express.json());

// Mock the getPlayerStats function exactly as it exists in analyticsController
const getPlayerStats = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      playerLevel, 
      playerIds,
      timeRange = 'all'
    } = req.query;

    console.log('[DEBUG] API called with params:', { startDate, endDate, playerLevel, playerIds, timeRange });

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

    console.log('[DEBUG] Player filter:', playerFilter);
    console.log('[DEBUG] Date filter:', dateFilter);

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

    console.log(`[DEBUG] Found ${players.length} players`);

    const playerStats = [];

    for (const player of players) {
      console.log(`[DEBUG] Processing player: ${player.name} (ID: ${player.id})`);
      console.log(`[DEBUG] Player has ${player.sessions.length} sessions`);
      
      // Aggregate all exit velocity data
      const allExitVelocityData = [];
      const allBatSpeedData = [];

      for (const session of player.sessions) {
        console.log(`[DEBUG] Session ${session.id} has ${session.exitVelocityData?.length || 0} exit velocity records`);
        if (session.exitVelocityData && Array.isArray(session.exitVelocityData)) {
          allExitVelocityData.push(...session.exitVelocityData);
        }
        if (session.batSpeedData && Array.isArray(session.batSpeedData)) {
          allBatSpeedData.push(...session.batSpeedData);
        }
      }

      console.log(`[DEBUG] Total exit velocity data: ${allExitVelocityData.length}`);
      console.log(`[DEBUG] Total bat speed data: ${allBatSpeedData.length}`);

      // Calculate aggregated metrics
      let stats = {
        player_id: player.id,
        player_name: player.name,
        player_level: player.player_level || 'High School',
        position: player.position,
        total_sessions: player.sessions.length,
        total_swings: Math.max(allExitVelocityData.length, allBatSpeedData.length),
        last_session_date: player.sessions.length > 0 ? 
          player.sessions[0].session_date : null,
        // Initialize all stats fields to null
        avg_exit_velocity: null,
        max_exit_velocity: null,
        avg_launch_angle: null,
        avg_time_to_contact: null,
        avg_bat_speed: null,
        max_bat_speed: null,
        barrel_percentage: null
      };

      // Calculate exit velocity metrics
      if (allExitVelocityData.length > 0) {
        const exitVelocities = allExitVelocityData
          .map(row => parseFloat(row.exit_velocity))
          .filter(val => !isNaN(val) && val > 0);
        
        const launchAngles = allExitVelocityData
          .map(row => parseFloat(row.launch_angle))
          .filter(val => !isNaN(val));

        // Calculate barrel percentage using the same logic as metricsCalculator
        let barrels = 0;
        if (exitVelocities.length > 0) {
          const maxEV = Math.max(...exitVelocities);
          const barrelThreshold = maxEV * 0.90;
          
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
        stats.barrel_percentage = allExitVelocityData.length > 0 ? 
          Math.round((barrels / allExitVelocityData.length) * 1000) / 10 : null;

        console.log(`[DEBUG] Calculated stats for ${player.name}:`, {
          avg_exit_velocity: stats.avg_exit_velocity,
          max_exit_velocity: stats.max_exit_velocity,
          avg_launch_angle: stats.avg_launch_angle,
          barrel_percentage: stats.barrel_percentage
        });
      }

      // Calculate bat speed metrics
      if (allBatSpeedData.length > 0) {
        const batSpeeds = allBatSpeedData
          .map(row => parseFloat(row.bat_speed))
          .filter(val => !isNaN(val) && val > 0);
        
        const timeToContacts = allBatSpeedData
          .map(row => parseFloat(row.time_to_contact))
          .filter(val => !isNaN(val) && val > 0);

        stats.avg_bat_speed = batSpeeds.length > 0 ? 
          Math.round((batSpeeds.reduce((a, b) => a + b, 0) / batSpeeds.length) * 10) / 10 : null;
        stats.max_bat_speed = batSpeeds.length > 0 ? Math.max(...batSpeeds) : null;
        stats.avg_time_to_contact = timeToContacts.length > 0 ? 
          Math.round((timeToContacts.reduce((a, b) => a + b, 0) / timeToContacts.length) * 1000) / 1000 : null;
      }

      playerStats.push(stats);
    }

    // Filter out players with no data if requested
    const filteredStats = playerStats.filter(player => player.total_swings > 0);

    console.log(`[DEBUG] Final response: ${filteredStats.length} players with data`);
    console.log('[DEBUG] Sample player stats:', JSON.stringify(filteredStats[0], null, 2));

    res.json({
      success: true,
      players: filteredStats,
      total: filteredStats.length,
      filters: { startDate, endDate, playerLevel, playerIds, timeRange }
    });

  } catch (error) {
    console.error('[DEBUG] Error getting player stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get player stats',
      details: error.message 
    });
  }
};

// Test the API endpoint
app.get('/api/analytics/player-stats', getPlayerStats);

// Start server and test
const PORT = 3002;
app.listen(PORT, async () => {
  console.log(`🚀 Debug server running on port ${PORT}`);
  console.log('🔍 Testing API endpoint...');
  
  try {
    const response = await fetch(`http://localhost:${PORT}/api/analytics/player-stats?timeRange=all`);
    const data = await response.json();
    console.log('📊 API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error testing API:', error);
  } finally {
    process.exit(0);
  }
}); 