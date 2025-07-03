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

    // Simulate the exact upload flow
    const t = await sequelize.transaction();
    try {
      console.log('🔄 Starting upload transaction...');
      
      // Step 1: Create session (like in uploadController)
      const session = await Session.create({
        player_id: playerId,
        session_date: new Date(),
        session_type: 'hittrax'
      }, { transaction: t });
      console.log('🆕 Created session id=', session.id);

      // Step 2: Try to find the session within the same transaction
      const foundSession = await Session.findByPk(session.id, { transaction: t });
      console.log('🔍 Session found in TX:', foundSession ? '✅ YES' : '❌ NO');
      
      if (foundSession) {
        console.log('📋 Session details:', foundSession.toJSON());
      }

      // Step 3: Simulate bulk insert of exit velocity data
      const mockExitVelocityData = [
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

      console.log('📊 Attempting bulk insert of', mockExitVelocityData.length, 'records...');
      
      const exitVelocityRecords = await ExitVelocityData.bulkCreate(mockExitVelocityData, { 
        transaction: t 
      });
      console.log('✅ Bulk insert successful, created', exitVelocityRecords.length, 'records');

      // Step 4: Verify the records are visible in transaction
      const foundRecords = await ExitVelocityData.findAll({
        where: { session_id: session.id },
        transaction: t
      });
      console.log('🔍 Exit velocity records found in TX:', foundRecords.length);

      // Step 5: Commit the transaction
      await t.commit();
      console.log('✅ Transaction committed successfully!');

      // Step 6: Verify data is now visible outside transaction
      const committedSession = await Session.findByPk(session.id);
      console.log('🔍 Session after commit:', committedSession ? '✅ FOUND' : '❌ NOT FOUND');
      
      const committedRecords = await ExitVelocityData.findAll({
        where: { session_id: session.id }
      });
      console.log('🔍 Exit velocity records after commit:', committedRecords.length);

      // Step 7: Clean up (delete the test data)
      await ExitVelocityData.destroy({ where: { session_id: session.id } });
      await Session.destroy({ where: { id: session.id } });
      console.log('🧹 Cleaned up test data');
      
    } catch (err) {
      console.error('❌ Error in upload simulation:', err);
      await t.rollback();
    }

    console.log('✅ Upload simulation complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
})(); 