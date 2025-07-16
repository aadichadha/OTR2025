const { BatSpeedData, Session, Player } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function debugBlastData() {
  try {
    console.log('🔍 Debugging Blast Data...');
    
    // Find the most recent blast session
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
    
    // Get all bat speed data for this session
    const batSpeedData = await BatSpeedData.findAll({
      where: { session_id: latestSession.id },
      attributes: ['bat_speed', 'attack_angle', 'time_to_contact'],
      raw: true
    });
    
    console.log(`📈 Total bat speed records: ${batSpeedData.length}`);
    
    if (batSpeedData.length === 0) {
      console.log('❌ No bat speed data found for this session');
      return;
    }
    
    // Analyze the data
    const batSpeeds = batSpeedData.map(row => row.bat_speed).filter(val => val !== null && val > 0);
    const attackAngles = batSpeedData.map(row => row.attack_angle).filter(val => val !== null && !isNaN(val));
    const timeToContacts = batSpeedData.map(row => row.time_to_contact).filter(val => val !== null && !isNaN(val));
    
    console.log(`🔢 Valid bat speeds: ${batSpeeds.length}`);
    console.log(`🔢 Valid attack angles: ${attackAngles.length}`);
    console.log(`🔢 Valid time to contacts: ${timeToContacts.length}`);
    
    if (batSpeeds.length > 0) {
      console.log(`📊 Bat speed stats:`);
      console.log(`  - Max: ${Math.max(...batSpeeds)}`);
      console.log(`  - Min: ${Math.min(...batSpeeds)}`);
      console.log(`  - Avg: ${(batSpeeds.reduce((a, b) => a + b, 0) / batSpeeds.length).toFixed(2)}`);
      console.log(`  - Sample: ${batSpeeds.slice(0, 5)}`);
    }
    
    if (attackAngles.length > 0) {
      console.log(`📊 Attack angle stats:`);
      console.log(`  - Max: ${Math.max(...attackAngles)}`);
      console.log(`  - Min: ${Math.min(...attackAngles)}`);
      console.log(`  - Avg: ${(attackAngles.reduce((a, b) => a + b, 0) / attackAngles.length).toFixed(2)}`);
      console.log(`  - Sample: ${attackAngles.slice(0, 5)}`);
    }
    
    if (timeToContacts.length > 0) {
      console.log(`📊 Time to contact stats:`);
      console.log(`  - Max: ${Math.max(...timeToContacts)}`);
      console.log(`  - Min: ${Math.min(...timeToContacts)}`);
      console.log(`  - Avg: ${(timeToContacts.reduce((a, b) => a + b, 0) / timeToContacts.length).toFixed(3)}`);
      console.log(`  - Sample: ${timeToContacts.slice(0, 5)}`);
    }
    
    // Show raw data sample
    console.log(`📋 Raw data sample (first 5 records):`);
    console.log(JSON.stringify(batSpeedData.slice(0, 5), null, 2));
    
    // Check for null values
    const nullBatSpeeds = batSpeedData.filter(row => row.bat_speed === null).length;
    const nullAttackAngles = batSpeedData.filter(row => row.attack_angle === null).length;
    const nullTimeToContacts = batSpeedData.filter(row => row.time_to_contact === null).length;
    
    console.log(`❌ Null values:`);
    console.log(`  - Bat speeds: ${nullBatSpeeds}`);
    console.log(`  - Attack angles: ${nullAttackAngles}`);
    console.log(`  - Time to contacts: ${nullTimeToContacts}`);
    
  } catch (error) {
    console.error('💥 Error debugging blast data:', error);
  } finally {
    await sequelize.close();
  }
}

debugBlastData(); 