/* eslint-disable no-console */
const db = require('../src/models');
const { sequelize } = require('../src/config/database');

(async () => {
  console.log('🔍 Checking database state...\n');

  // Check foreign key enforcement
  const fkResultRaw = await sequelize.query('PRAGMA foreign_keys;');
  console.log('Raw PRAGMA foreign_keys result:', fkResultRaw);
  const fkEnabled = Array.isArray(fkResultRaw) && fkResultRaw[0] && fkResultRaw[0][0] && (fkResultRaw[0][0].foreign_keys === 1 || fkResultRaw[0][0].foreign_keys === true);
  console.log('Foreign key enforcement:', fkEnabled ? 'ENABLED' : 'DISABLED');

  // Check foreign key constraints on sessions table
  const fkListRaw = await sequelize.query("PRAGMA foreign_key_list('sessions');");
  console.log('\nRaw PRAGMA foreign_key_list result:', fkListRaw);
  const fkList = Array.isArray(fkListRaw) && fkListRaw[0] ? fkListRaw[0] : [];
  console.log('\nForeign key constraints on sessions table:');
  console.table(fkList);

  // Check players
  const players = await db.Player.findAll({ raw: true });
  console.log('\nPlayers:');
  console.table(players);

  // Check sessions
  const sessions = await db.Session.findAll({ raw: true });
  console.log('\nSessions:');
  console.table(sessions);

  // Check for orphaned sessions (sessions with non-existent players)
  const orphanedSessions = sessions.filter(session => 
    !players.find(player => player.id === session.player_id)
  );
  
  if (orphanedSessions.length > 0) {
    console.log('\n🚨 ORPHANED SESSIONS (sessions with non-existent players):');
    console.table(orphanedSessions);
  } else {
    console.log('\n✅ No orphaned sessions found');
  }

  // Check exit velocity data
  const exitVelocityData = await db.ExitVelocityData.findAll({ raw: true, limit: 10 });
  console.log('\nExit velocity data (first 10):');
  console.table(exitVelocityData);

  // Check for orphaned exit velocity data (data with non-existent sessions)
  const orphanedData = exitVelocityData.filter(data => 
    !sessions.find(session => session.id === data.session_id)
  );
  
  if (orphanedData.length > 0) {
    console.log('\n🚨 ORPHANED EXIT VELOCITY DATA (data with non-existent sessions):');
    console.table(orphanedData);
  } else {
    console.log('\n✅ No orphaned exit velocity data found');
  }

  process.exit(0);
})().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 