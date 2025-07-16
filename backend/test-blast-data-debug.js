const { BatSpeedData, Session, Player } = require('./src/models');
const { sequelize } = require('./src/config/database');
const MetricsCalculator = require('./src/services/metricsCalculator');

async function debugBlastData() {
  try {
    console.log('🔍 Starting blast data debug...');
    
    // Get the most recent blast session
    const latestSession = await Session.findOne({
      where: { session_type: 'blast' },
      order: [['created_at', 'DESC']],
      include: [{ model: Player, as: 'player' }]
    });
    
    if (!latestSession) {
      console.log('❌ No blast sessions found');
      return;
    }
    
    console.log(`📊 Found session ID: ${latestSession.id}`);
    console.log(`👤 Player: ${latestSession.player.name}`);
    console.log(`📅 Date: ${latestSession.session_date}`);
    console.log(`🏷️ Level: ${latestSession.player?.player_level || 'High School'}`);
    
    // Get all bat speed data for this session
    const batSpeedData = await BatSpeedData.findAll({
      where: { session_id: latestSession.id },
      attributes: ['bat_speed', 'attack_angle', 'time_to_contact'],
      raw: true
    });
    
    console.log(`📈 Total bat speed records: ${batSpeedData.length}`);
    
    if (batSpeedData.length === 0) {
      console.log('❌ No bat speed data found in database!');
      return;
    }
    
    // Show sample data
    console.log('📋 Sample data (first 5 records):');
    batSpeedData.slice(0, 5).forEach((record, index) => {
      console.log(`  ${index + 1}. BatSpeed: ${record.bat_speed}, AttackAngle: ${record.attack_angle}, TimeToContact: ${record.time_to_contact}`);
    });
    
    // Extract arrays for analysis
    const batSpeeds = batSpeedData.map(row => row.bat_speed).filter(val => val !== null && val > 0);
    const attackAngles = batSpeedData.map(row => row.attack_angle).filter(val => val !== null && !isNaN(val));
    const timeToContacts = batSpeedData.map(row => row.time_to_contact).filter(val => val !== null && !isNaN(val));
    
    console.log('\n📊 Data analysis:');
    console.log(`  Valid bat speeds: ${batSpeeds.length}/${batSpeedData.length}`);
    console.log(`  Valid attack angles: ${attackAngles.length}/${batSpeedData.length}`);
    console.log(`  Valid time to contacts: ${timeToContacts.length}/${batSpeedData.length}`);
    
    if (batSpeeds.length > 0) {
      console.log(`  Max bat speed: ${Math.max(...batSpeeds)}`);
      console.log(`  Avg bat speed: ${(batSpeeds.reduce((a, b) => a + b, 0) / batSpeeds.length).toFixed(2)}`);
    }
    
    if (attackAngles.length > 0) {
      console.log(`  Avg attack angle: ${(attackAngles.reduce((a, b) => a + b, 0) / attackAngles.length).toFixed(2)}`);
    }
    
    if (timeToContacts.length > 0) {
      console.log(`  Avg time to contact: ${(timeToContacts.reduce((a, b) => a + b, 0) / timeToContacts.length).toFixed(3)}`);
    }
    
    // Test metrics calculation
    console.log('\n🧮 Testing metrics calculation...');
    const playerLevel = latestSession.player?.player_level || 'High School';
    const metrics = await MetricsCalculator.calculateBatSpeedMetrics(latestSession.id, playerLevel);
    console.log('✅ Metrics calculation result:');
    console.log(JSON.stringify(metrics, null, 2));
    
  } catch (error) {
    console.error('💥 Debug error:', error);
  } finally {
    await sequelize.close();
  }
}

debugBlastData(); 