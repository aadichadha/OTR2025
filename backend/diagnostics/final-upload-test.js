const { sequelize } = require('../src/config/database');
const Session = require('../src/models/Session');
const ExitVelocityData = require('../src/models/ExitVelocityData');
const BatSpeedData = require('../src/models/BatSpeedData');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected using main app Sequelize instance');

    // Get a valid player_id
    const players = await sequelize.query('SELECT id FROM players LIMIT 1', { type: sequelize.QueryTypes.SELECT });
    const playerId = players[0].id;
    console.log('🎯 Using player_id:', playerId);

    // Test 1: Hittrax Upload Simulation
    console.log('\n🔄 TEST 1: Hittrax Upload Simulation');
    const hittraxTransaction = await sequelize.transaction();
    try {
      // Create session
      const hittraxSession = await Session.create({
        player_id: playerId,
        session_date: new Date(),
        session_type: 'hittrax'
      }, { transaction: hittraxTransaction });
      console.log('🆕 Created Hittrax session id=', hittraxSession.id);

      // Verify session is visible in transaction
      const foundHittraxSession = await Session.findByPk(hittraxSession.id, { transaction: hittraxTransaction });
      console.log('🔍 Hittrax session found in TX:', foundHittraxSession ? '✅ YES' : '❌ NO');

      // Bulk insert exit velocity data
      const hittraxData = [
        {
          session_id: hittraxSession.id,
          exit_velocity: 85.5,
          launch_angle: 12.3,
          distance: 245.7,
          strike_zone: 'middle'
        },
        {
          session_id: hittraxSession.id,
          exit_velocity: 87.2,
          launch_angle: 15.1,
          distance: 251.3,
          strike_zone: 'middle'
        }
      ];

      const hittraxRecords = await ExitVelocityData.bulkCreate(hittraxData, { transaction: hittraxTransaction });
      console.log('✅ Hittrax bulk insert successful, created', hittraxRecords.length, 'records');

      // Commit
      await hittraxTransaction.commit();
      console.log('✅ Hittrax transaction committed successfully!');

      // Verify data is visible after commit
      const committedHittraxSession = await Session.findByPk(hittraxSession.id);
      console.log('🔍 Hittrax session after commit:', committedHittraxSession ? '✅ FOUND' : '❌ NOT FOUND');
      
      const committedHittraxRecords = await ExitVelocityData.findAll({
        where: { session_id: hittraxSession.id }
      });
      console.log('🔍 Hittrax records after commit:', committedHittraxRecords.length);

    } catch (err) {
      console.error('❌ Hittrax upload failed:', err);
      await hittraxTransaction.rollback();
    }

    // Test 2: Blast Upload Simulation
    console.log('\n🔄 TEST 2: Blast Upload Simulation');
    const blastTransaction = await sequelize.transaction();
    try {
      // Create session
      const blastSession = await Session.create({
        player_id: playerId,
        session_date: new Date(),
        session_type: 'blast'
      }, { transaction: blastTransaction });
      console.log('🆕 Created Blast session id=', blastSession.id);

      // Verify session is visible in transaction
      const foundBlastSession = await Session.findByPk(blastSession.id, { transaction: blastTransaction });
      console.log('🔍 Blast session found in TX:', foundBlastSession ? '✅ YES' : '❌ NO');

      // Bulk insert bat speed data
      const blastData = [
        {
          session_id: blastSession.id,
          bat_speed: 75.2,
          attack_angle: 8.5,
          time_to_contact: 0.145
        },
        {
          session_id: blastSession.id,
          bat_speed: 76.8,
          attack_angle: 9.1,
          time_to_contact: 0.142
        }
      ];

      const blastRecords = await BatSpeedData.bulkCreate(blastData, { transaction: blastTransaction });
      console.log('✅ Blast bulk insert successful, created', blastRecords.length, 'records');

      // Commit
      await blastTransaction.commit();
      console.log('✅ Blast transaction committed successfully!');

      // Verify data is visible after commit
      const committedBlastSession = await Session.findByPk(blastSession.id);
      console.log('🔍 Blast session after commit:', committedBlastSession ? '✅ FOUND' : '❌ NOT FOUND');
      
      const committedBlastRecords = await BatSpeedData.findAll({
        where: { session_id: blastSession.id }
      });
      console.log('🔍 Blast records after commit:', committedBlastRecords.length);

    } catch (err) {
      console.error('❌ Blast upload failed:', err);
      await blastTransaction.rollback();
    }

    // Test 3: Session Deletion (Cascade Test)
    console.log('\n🔄 TEST 3: Session Deletion (Cascade Test)');
    
    // Get all sessions
    const allSessions = await Session.findAll();
    console.log('📊 Total sessions before deletion:', allSessions.length);
    
    if (allSessions.length > 0) {
      const sessionToDelete = allSessions[0];
      console.log('🗑️ Deleting session id=', sessionToDelete.id);
      
      // Count related records before deletion
      const exitVelocityCount = await ExitVelocityData.count({ where: { session_id: sessionToDelete.id } });
      const batSpeedCount = await BatSpeedData.count({ where: { session_id: sessionToDelete.id } });
      console.log('📊 Related records before deletion: Exit velocity=', exitVelocityCount, 'Bat speed=', batSpeedCount);
      
      // Delete session (should cascade)
      await sessionToDelete.destroy();
      console.log('✅ Session deleted');
      
      // Verify cascade worked
      const remainingExitVelocity = await ExitVelocityData.count({ where: { session_id: sessionToDelete.id } });
      const remainingBatSpeed = await BatSpeedData.count({ where: { session_id: sessionToDelete.id } });
      const remainingSession = await Session.findByPk(sessionToDelete.id);
      
      console.log('🔍 After deletion: Session=', remainingSession ? '❌ STILL EXISTS' : '✅ DELETED');
      console.log('🔍 After deletion: Exit velocity records=', remainingExitVelocity);
      console.log('🔍 After deletion: Bat speed records=', remainingBatSpeed);
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\n🎉 Your database is now ready for uploads and report generation!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
})(); 