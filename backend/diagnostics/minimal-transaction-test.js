// diagnostics/minimal-transaction-test.js
const { sequelize } = require('../src/config/database');
const Session = require('../src/models/Session');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected using main app Sequelize instance');

    // Check if we have any players first
    const playerCount = await sequelize.query('SELECT COUNT(*) as count FROM players', { type: sequelize.QueryTypes.SELECT });
    console.log('🔍 Players in database:', playerCount[0].count);
    
    if (playerCount[0].count === 0) {
      console.log('⚠️  No players found. Creating a test player...');
      await sequelize.query('INSERT INTO players (name, position, graduation_year, player_code) VALUES (?, ?, ?, ?)', {
        replacements: ['Test Player', 'OF', 2025, 'TEST001'],
        type: sequelize.QueryTypes.INSERT
      });
      console.log('✅ Test player created');
    }

    // Get a valid player_id
    const players = await sequelize.query('SELECT id FROM players LIMIT 1', { type: sequelize.QueryTypes.SELECT });
    const playerId = players[0].id;
    console.log('🎯 Using player_id:', playerId);

    // start transaction
    const t = await sequelize.transaction();
    try {
      console.log('🔄 Starting transaction...');
      
      // 1) insert
      const newSession = await Session.create({
        player_id:  playerId,
        session_date: new Date(),
        session_type: 'hittrax'
      }, { transaction: t });
      console.log('🆕 Inserted session id=', newSession.id);

      // 2) read it back inside same TX
      const found = await Session.findAll({
        where: { id: newSession.id },
        transaction: t
      });
      console.log('🔍 Found inside TX:', found.map(s => s.toJSON()));

      // 3) verify foreign key constraint works
      console.log('🔗 Testing foreign key constraint...');
      try {
        await Session.create({
          player_id: 99999, // non-existent player
          session_date: new Date(),
          session_type: 'hittrax'
        }, { transaction: t });
        console.log('❌ Foreign key constraint failed - should have rejected invalid player_id');
      } catch (fkError) {
        console.log('✅ Foreign key constraint working - rejected invalid player_id:', fkError.message);
      }

      // 4) purposely rollback
      await t.rollback();
      console.log('↩️ Rolled back transaction');
      
      // 5) verify rollback worked
      const afterRollback = await Session.findAll({
        where: { id: newSession.id }
      });
      console.log('🔍 After rollback, session count:', afterRollback.length);
      
    } catch (err) {
      console.error('❌ Error in TX:', err);
      await t.rollback();
    }

    console.log('✅ Transaction test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
})(); 