const { sequelize } = require('../src/config/database');
const Session = require('../src/models/Session');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected using main app Sequelize instance');

    // Get a valid player_id
    const players = await sequelize.query('SELECT id FROM players LIMIT 1', { type: sequelize.QueryTypes.SELECT });
    const playerId = players[0].id;
    console.log('🎯 Using player_id:', playerId);

    // Start transaction
    const t = await sequelize.transaction();
    try {
      console.log('🔄 Starting transaction...');
      
      // Step 1: Insert session
      const newSession = await Session.create({
        player_id: playerId,
        session_date: new Date(),
        session_type: 'hittrax'
      }, { transaction: t });
      console.log('🆕 Inserted session id=', newSession.id);

      // Step 2: Verify visibility within transaction
      const foundInTx = await Session.findByPk(newSession.id, { transaction: t });
      console.log('🔍 Found in transaction:', foundInTx ? '✅ YES' : '❌ NO');
      
      if (foundInTx) {
        console.log('📋 Session details:', foundInTx.toJSON());
      }

      // Step 3: Test foreign key constraint
      console.log('🔗 Testing FK constraint...');
      try {
        await Session.create({
          player_id: 99999, // Invalid player
          session_date: new Date(),
          session_type: 'hittrax'
        }, { transaction: t });
        console.log('❌ FK constraint failed - should have rejected');
      } catch (fkError) {
        console.log('✅ FK constraint working:', fkError.message);
      }

      // Step 4: Verify outside transaction (should not see it)
      const outsideTx = await Session.findByPk(newSession.id);
      console.log('🔍 Outside transaction:', outsideTx ? '❌ FOUND (ERROR!)' : '✅ NOT FOUND (correct)');

      // Step 5: Rollback
      await t.rollback();
      console.log('↩️ Rolled back transaction');
      
      // Step 6: Verify rollback worked
      const afterRollback = await Session.findByPk(newSession.id);
      console.log('🔍 After rollback:', afterRollback ? '❌ FOUND (ERROR!)' : '✅ NOT FOUND (correct)');
      
    } catch (err) {
      console.error('❌ Error in transaction:', err);
      await t.rollback();
    }

    console.log('✅ Transaction verification complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
})(); 