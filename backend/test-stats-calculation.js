const { Player, Session, ExitVelocityData, BatSpeedData } = require('./src/models');
const { Op } = require('sequelize');

async function testStatsCalculation() {
  try {
    console.log('🔍 Testing player stats calculation...');
    
    // Get all players with their sessions and data
    const players = await Player.findAll({
      include: [{
        model: Session,
        as: 'sessions',
        include: [
          {
            model: ExitVelocityData,
            as: 'exitVelocityData',
          },
          {
            model: BatSpeedData,
            as: 'batSpeedData',
          }
        ]
      }],
      order: [['name', 'ASC']]
    });

    console.log(`📊 Found ${players.length} players`);

    for (const player of players) {
      console.log(`\n👤 Player: ${player.name} (ID: ${player.id})`);
      
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

      console.log(`   📈 Sessions: ${player.sessions.length}`);
      console.log(`   🏏 Exit Velocity swings: ${allExitVelocityData.length}`);
      console.log(`   ⚡ Bat Speed swings: ${allBatSpeedData.length}`);

      if (allExitVelocityData.length > 0) {
        const exitVelocities = allExitVelocityData
          .map(row => parseFloat(row.exit_velocity))
          .filter(val => !isNaN(val) && val > 0);
        
        const launchAngles = allExitVelocityData
          .map(row => parseFloat(row.launch_angle))
          .filter(val => !isNaN(val));

        // Calculate barrel percentage
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

        const avgEV = exitVelocities.length > 0 ? 
          (exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length) : 0;
        const avgLA = launchAngles.length > 0 ? 
          (launchAngles.reduce((a, b) => a + b, 0) / launchAngles.length) : 0;
        const barrelPct = allExitVelocityData.length > 0 ? 
          (barrels / allExitVelocityData.length) * 100 : 0;

        console.log(`   🚀 Avg Exit Velocity: ${avgEV.toFixed(1)} mph`);
        console.log(`   📐 Avg Launch Angle: ${avgLA.toFixed(1)}°`);
        console.log(`   🛢️  Barrel Percentage: ${barrelPct.toFixed(1)}%`);
        console.log(`   🎯 Barrels: ${barrels}/${allExitVelocityData.length}`);
      }

      if (allBatSpeedData.length > 0) {
        const batSpeeds = allBatSpeedData
          .map(row => parseFloat(row.bat_speed))
          .filter(val => !isNaN(val) && val > 0);
        
        const timeToContacts = allBatSpeedData
          .map(row => parseFloat(row.time_to_contact))
          .filter(val => !isNaN(val) && val > 0);

        const avgBS = batSpeeds.length > 0 ? 
          (batSpeeds.reduce((a, b) => a + b, 0) / batSpeeds.length) : 0;
        const avgTTC = timeToContacts.length > 0 ? 
          (timeToContacts.reduce((a, b) => a + b, 0) / timeToContacts.length) : 0;

        console.log(`   ⚡ Avg Bat Speed: ${avgBS.toFixed(1)} mph`);
        console.log(`   ⏱️  Avg Time to Contact: ${avgTTC.toFixed(3)} sec`);
      }
    }

    console.log('\n✅ Stats calculation test completed!');
  } catch (error) {
    console.error('❌ Error testing stats calculation:', error);
  } finally {
    process.exit(0);
  }
}

testStatsCalculation(); 