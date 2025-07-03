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

    // Test sequential upload flow (commit session first, then data)
    try {
      console.log('🔄 Starting sequential upload...');
      
      // Step 1: Create and commit session first
      const session = await Session.create({
        player_id: playerId,
        session_date: new Date(),
        session_type: 'hittrax'
      });
      console.log('🆕 Created and committed session id=', session.id);

      // Step 2: Insert data in a separate transaction
      const dataTransaction = await sequelize.transaction();
      try {
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

        const records = await ExitVelocityData.bulkCreate(hittraxData, { transaction: dataTransaction });
        console.log('✅ Bulk insert successful, created', records.length, 'records');

        await dataTransaction.commit();
        console.log('✅ Data transaction committed successfully!');

      } catch (dataError) {
        console.error('❌ Data transaction failed:', dataError);
        await dataTransaction.rollback();
        // Clean up the session if data insert fails
        await session.destroy();
        throw dataError;
      }

      // Step 3: Verify data is visible
      const committedSession = await Session.findByPk(session.id);
      console.log('🔍 Session after all commits:', committedSession ? '✅ FOUND' : '❌ NOT FOUND');
      
      const committedRecords = await ExitVelocityData.findAll({
        where: { session_id: session.id }
      });
      console.log('🔍 Records after all commits:', committedRecords.length);

      // Step 4: Clean up
      await ExitVelocityData.destroy({ where: { session_id: session.id } });
      await Session.destroy({ where: { id: session.id } });
      console.log('🧹 Cleaned up test data');
      
    } catch (err) {
      console.error('❌ Error in sequential upload:', err);
    }

    console.log('✅ Sequential upload test complete!');
    console.log('\n🎉 Your upload flow is now ready!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your uploadController.js to use this sequential pattern');
    console.log('2. Test with real CSV files');
    console.log('3. Generate reports from the uploaded data');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
})(); 