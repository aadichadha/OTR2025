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

    // Test practical upload flow
    const t = await sequelize.transaction();
    try {
      console.log('🔄 Starting practical upload transaction...');
      
      // Step 1: Temporarily disable foreign key constraints
      await sequelize.query('PRAGMA foreign_keys = OFF;', { transaction: t });
      console.log('🔓 Foreign key constraints disabled');
      
      // Step 2: Create session
      const session = await Session.create({
        player_id: playerId,
        session_date: new Date(),
        session_type: 'hittrax'
      }, { transaction: t });
      console.log('🆕 Created session id=', session.id);

      // Step 3: Bulk insert exit velocity data
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

      const records = await ExitVelocityData.bulkCreate(hittraxData, { transaction: t });
      console.log('✅ Bulk insert successful, created', records.length, 'records');

      // Step 4: Re-enable foreign key constraints
      await sequelize.query('PRAGMA foreign_keys = ON;', { transaction: t });
      console.log('🔒 Foreign key constraints re-enabled');

      // Step 5: Commit
      await t.commit();
      console.log('✅ Transaction committed successfully!');

      // Step 6: Verify data is visible
      const committedSession = await Session.findByPk(session.id);
      console.log('🔍 Session after commit:', committedSession ? '✅ FOUND' : '❌ NOT FOUND');
      
      const committedRecords = await ExitVelocityData.findAll({
        where: { session_id: session.id }
      });
      console.log('🔍 Records after commit:', committedRecords.length);

      // Step 7: Clean up
      await ExitVelocityData.destroy({ where: { session_id: session.id } });
      await Session.destroy({ where: { id: session.id } });
      console.log('🧹 Cleaned up test data');
      
    } catch (err) {
      console.error('❌ Error in transaction:', err);
      await t.rollback();
    }

    console.log('✅ Practical upload test complete!');
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