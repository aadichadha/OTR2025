/* eslint-disable no-console */
const db = require('../src/models');          // Sequelize instance
const CSVParser = require('../src/services/csvParser');
const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

(async () => {
  const uploadId = Date.now();
  console.log(`🔍 [DEBUG ${uploadId}] Starting debug upload flow`);
  
  // 🔁 CHANGE THESE VALUES TO MATCH YOUR TEST CASE
  const playerId = 1;                    // Use a real player ID from your DB
  const csvPath = path.resolve(__dirname, '../test/fixtures/sample_hittrax.csv'); // Use your failing CSV
  const sessionDate = new Date().toISOString().slice(0, 10);
  
  console.log(`🔍 [DEBUG ${uploadId}] Test config:`, {
    playerId,
    csvPath,
    sessionDate,
    fileExists: fs.existsSync(csvPath)
  });

  // 1️⃣ Print DB state before
  console.log(`\n🔍 [DEBUG ${uploadId}] === BEFORE players ===`);
  const beforePlayers = await db.Player.findAll({ raw: true });
  console.table(beforePlayers);
  
  console.log(`\n🔍 [DEBUG ${uploadId}] === BEFORE sessions ===`);
  const beforeSessions = await db.Session.findAll({ raw: true });
  console.table(beforeSessions);

  // 2️⃣ Verify player exists
  const player = await db.Player.findByPk(playerId);
  if (!player) {
    console.error(`🚨 [DEBUG ${uploadId}] Player ${playerId} not found!`);
    process.exit(1);
  }
  console.log(`✅ [DEBUG ${uploadId}] Found player:`, player.toJSON());

  // 3️⃣ Check for existing session
  const existingSession = await db.Session.findOne({
    where: {
      player_id: playerId,
      session_date: sessionDate,
      session_type: 'hittrax'
    }
  });
  if (existingSession) {
    console.log(`⚠️ [DEBUG ${uploadId}] Existing session found:`, existingSession.toJSON());
  } else {
    console.log(`✅ [DEBUG ${uploadId}] No existing session found for this player/date`);
  }

  // 4️⃣ Wrap upload in a manual transaction so *nothing* sticks
  const t = await sequelize.transaction({ 
    logging: (sql) => console.log(`🔍 [DEBUG ${uploadId}] SQL:`, sql)
  });
  
  try {
    console.log(`\n🔍 [DEBUG ${uploadId}] === STARTING UPLOAD SIMULATION ===`);
    
    // Create session linked to player
    console.log(`🔍 [DEBUG ${uploadId}] Creating session with player_id: ${playerId}`);
    const session = await db.Session.create({
      player_id: playerId,
      session_date: sessionDate,
      session_type: 'hittrax',
      player_level: 'High School'
    }, { transaction: t });
    
    console.log(`✅ [DEBUG ${uploadId}] Session created:`, session.toJSON());

    // Parse CSV and store data
    console.log(`🔍 [DEBUG ${uploadId}] Starting CSV parsing...`);
    const parseResult = await CSVParser.parseHittraxCSV(csvPath, session.id, t);
    
    console.log(`✅ [DEBUG ${uploadId}] CSV parsing complete:`, {
      totalRows: parseResult.totalRows,
      parsedRows: parseResult.parsedRows,
      errorCount: parseResult.errorCount
    });

    // Check what was actually inserted
    console.log(`\n🔍 [DEBUG ${uploadId}] === CHECKING INSERTED DATA ===`);
    const insertedSessions = await db.Session.findAll({ 
      where: { id: session.id }, 
      transaction: t, 
      raw: true 
    });
    console.log('Inserted sessions:', insertedSessions);
    
    const insertedData = await db.ExitVelocityData.findAll({ 
      where: { session_id: session.id }, 
      transaction: t, 
      raw: true,
      limit: 5
    });
    console.log('First 5 inserted exit velocity records:', insertedData);

    console.log(`✅ [DEBUG ${uploadId}] Upload simulation completed successfully`);
    
  } catch (err) {
    console.error(`\n🚨 [DEBUG ${uploadId}] Upload threw error:`);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    
    // Check if it's a foreign key error
    if (err.message.includes('FOREIGN KEY constraint failed')) {
      console.error(`\n🔍 [DEBUG ${uploadId}] FOREIGN KEY ERROR ANALYSIS:`);
      console.error('- This usually means session_id in exit_velocity_data references a non-existent session');
      console.error('- Or player_id in sessions references a non-existent player');
      console.error('- Check the SQL logs above for the exact INSERT statement that failed');
    }
    
  } finally {
    console.log(`\n🔍 [DEBUG ${uploadId}] Rolling back transaction...`);
    await t.rollback();
  }

  // 5️⃣ Print DB state after (should be unchanged due to rollback)
  console.log(`\n🔍 [DEBUG ${uploadId}] === AFTER (rolled-back) players ===`);
  const afterPlayers = await db.Player.findAll({ raw: true });
  console.table(afterPlayers);
  
  console.log(`\n🔍 [DEBUG ${uploadId}] === AFTER (rolled-back) sessions ===`);
  const afterSessions = await db.Session.findAll({ raw: true });
  console.table(afterSessions);

  // 6️⃣ Verify no changes (sanity check)
  const playersChanged = JSON.stringify(beforePlayers) !== JSON.stringify(afterPlayers);
  const sessionsChanged = JSON.stringify(beforeSessions) !== JSON.stringify(afterSessions);
  
  if (playersChanged || sessionsChanged) {
    console.error(`🚨 [DEBUG ${uploadId}] WARNING: Database state changed despite rollback!`);
    console.error('Players changed:', playersChanged);
    console.error('Sessions changed:', sessionsChanged);
  } else {
    console.log(`✅ [DEBUG ${uploadId}] Database state unchanged (rollback successful)`);
  }

  console.log(`\n🔍 [DEBUG ${uploadId}] Debug complete. Check the logs above for the issue.`);
  process.exit(0);
})().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 