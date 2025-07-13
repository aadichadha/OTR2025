const { Session, ExitVelocityData, Player, BatSpeedData } = require('./src/models');
const { Op } = require('sequelize');

async function testPlayerStats() {
  try {
    console.log('🔍 Testing player stats calculation...');
    
    // Get all players with their aggregated stats
    const players = await Player.findAll({
      include: [{
        model: Session,
        as: 'sessions',
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

    console.log(`📊 Found ${players.length} players`);

    const playerStats = [];

    for (const player of players) {
      // Aggregate all exit velocity data
      const allExitVelocityData = [];
      const allBatSpeedData = [];

      for (const session of player.sessions) {
        if (session.exitVelocityData && Array.isArray(session.exitVelocityData)) {
          allExitVelocityData.push(...session.exitVelocityData);
        }
        if (session.batSpeedData && Array.isArray(session.batSpeedData)) {
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

      // Calculate bat speed metrics
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
      
      console.log(`\n📈 Player: ${player.name}`);
      console.log(`   Sessions: ${stats.total_sessions}`);
      console.log(`   Swings: ${stats.total_swings}`);
      console.log(`   Avg EV: ${stats.avg_exit_velocity}`);
      console.log(`   Avg LA: ${stats.avg_launch_angle}`);
      console.log(`   Barrel %: ${stats.barrel_percentage}`);
      console.log(`   Max EV: ${stats.max_exit_velocity}`);
    }

    // Filter out players with no data
    const filteredStats = playerStats.filter(player => player.total_swings > 0);

    console.log(`\n✅ Final stats for ${filteredStats.length} players with data:`);
    console.log(JSON.stringify(filteredStats, null, 2));

  } catch (error) {
    console.error('❌ Error testing player stats:', error);
  }
}

testPlayerStats(); 