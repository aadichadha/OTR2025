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

    // start transaction
    const t = await sequelize.transaction();
    try {
      console.log('🔄 Starting transaction...');
      
      // 1) Check initial state
      const initialSessions = await Session.findAll({ transaction: t });
      console.log('📊 Initial sessions in TX:', initialSessions.length);
      
      // 2) insert
      const newSession = await Session.create({
        player_id:  playerId,
        session_date: new Date(),
        session_type: 'hittrax'
      }, { transaction: t });
      console.log('🆕 Inserted session id=', newSession.id);
      console.log('🆕 Session object:', newSession.toJSON());

      // 3) Check all sessions in TX
      const allSessions = await Session.findAll({ transaction: t });
      console.log('📊 All sessions in TX after insert:', allSessions.length);
      console.log('📊 Session IDs in TX:', allSessions.map(s => s.id));

      // 4) Try to find by ID specifically
      const foundById = await Session.findByPk(newSession.id, { transaction: t });
      console.log('🔍 Found by ID in TX:', foundById ? foundById.toJSON() : 'NOT FOUND');

      // 5) Try raw query in transaction
      const rawResult = await sequelize.query(
        'SELECT * FROM sessions WHERE id = ?',
        { 
          replacements: [newSession.id],
          type: sequelize.QueryTypes.SELECT,
          transaction: t
        }
      );
      console.log('🔍 Raw query result in TX:', rawResult);

      // 6) Check outside transaction (should not see it)
      const outsideResult = await Session.findByPk(newSession.id);
      console.log('🔍 Outside TX (should be null):', outsideResult ? 'FOUND (ERROR!)' : 'NOT FOUND (correct)');

      // 7) rollback
      await t.rollback();
      console.log('↩️ Rolled back transaction');
      
      // 8) verify rollback worked
      const afterRollback = await Session.findByPk(newSession.id);
      console.log('🔍 After rollback:', afterRollback ? 'FOUND (ERROR!)' : 'NOT FOUND (correct)');
      
    } catch (err) {
      console.error('❌ Error in TX:', err);
      await t.rollback();
    }

    console.log('✅ Detailed transaction test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
})(); 