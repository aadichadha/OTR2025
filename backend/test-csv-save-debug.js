const { BatSpeedData, Session, Player } = require('./src/models);
const { sequelize } = require('./src/config/database');

async function testCSVSaveDebug() {
  try {
    console.log('🧪 Testing CSV parsing and database save...');
    
    // Find the most recent blast session
    const latestSession = await Session.findOne({
      where: { session_type: 'blast' },
      order: [[created_at, ]],
      include: [{ model: Player, as: 'player }]
    });
    
    if (!latestSession) {
      console.log('❌ No blast sessions found);
      return;
    }
    
    console.log(`📊 Found session ID: ${latestSession.id}`);
    console.log(`👤 Player: ${latestSession.player.name}`);
    
    // Check if there's any bat speed data for this session
    const existingData = await BatSpeedData.count({
      where: { session_id: latestSession.id }
    });
    
    console.log(`📈 Existing bat speed records: ${existingData}`);
    
    if (existingData === 0) {
      console.log('❌ No bat speed data found for this session');
      console.log('🔍 This confirms the database save is not working');
    } else {
      console.log('✅ Bat speed data exists for this session');
      
      // Show sample data
      const sampleData = await BatSpeedData.findAll({ 
        where: { session_id: latestSession.id },
        limit: 5,
        attributes: ['bat_speed,attack_angle', 'time_to_contact']
      });
      
      console.log(📊 Sample data:', JSON.stringify(sampleData, null,2));
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {   await sequelize.close();
  }
}

testCSVSaveDebug(); 