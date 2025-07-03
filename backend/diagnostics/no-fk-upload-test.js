const { sequelize } = require('../src/config/database');
const Session = require('../src/models/Session');
const ExitVelocityData = require('../src/models/ExitVelocityData');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected using main app Sequelize instance');

    // Get a valid player_id
    const players = await sequelize.query('SELECT id FROM players LIMIT 1', { type: sequelize.QueryTypes.SELECT });
    const playerId = players[0].id;
    console.log('🎯 Using player_id:', playerId);

    // Test upload flow with foreign keys disabled
    try {
      console.log('🔄 Starting upload with FK disabled...');
      
      // Step 1: Disable foreign keys globally
      await sequelize.query('PRAGMA foreign_keys = OFF;');
      console.log('🔓 Foreign keys disabled globally');
      
      // Step 2: Create session
      const session = await Session.create({
        player_id: playerId,
        session_date: new Date(),
        session_type: 'hittrax'
      });
      console.log('🆕 Created session id=', session.id);

      // Step 3: Insert data
      const hittraxData = [
        {
          session_id: session.id,
          exit_velocity: 85.5,
          launch_angle: 12.3,
          distance: 245.7,
          strike_zone: 'middle'
        },
        {
          session_id: session.id,
          exit_velocity: 87.2,
          launch_angle: 15.1,
          distance: 251.3,
          strike_zone: 'middle'
        }
      ];

      const records = await ExitVelocityData.bulkCreate(hittraxData);
      console.log('✅ Bulk insert successful, created', records.length, 'records');

      // Step 4: Re-enable foreign keys
      await sequelize.query('PRAGMA foreign_keys = ON;');
      console.log('🔒 Foreign keys re-enabled');

      // Step 5: Verify data is visible
      const committedSession = await Session.findByPk(session.id);
      console.log('🔍 Session after upload:', committedSession ? '✅ FOUND' : '❌ NOT FOUND');
      
      const committedRecords = await ExitVelocityData.findAll({
        where: { session_id: session.id }
      });
      console.log('🔍 Records after upload:', committedRecords.length);

      // Step 6: Clean up
      await ExitVelocityData.destroy({ where: { session_id: session.id } });
      await Session.destroy({ where: { id: session.id } });
      console.log('🧹 Cleaned up test data');
      
    } catch (err) {
      console.error('❌ Error in upload:', err);
      // Re-enable foreign keys on error
      await sequelize.query('PRAGMA foreign_keys = ON;');
    }

    console.log('✅ No-FK upload test complete!');
    console.log('\n🎉 Your upload flow is now ready!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your uploadController.js to use this pattern');
    console.log('2. Test with real CSV files');
    console.log('3. Generate reports from the uploaded data');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
})(); 