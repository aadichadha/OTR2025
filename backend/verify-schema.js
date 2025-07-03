const { sequelize } = require('./src/config/database');

async function verifySchema() {
  try {
    console.log('🔍 Comprehensive Schema Verification\n');
    
    // Check foreign key enforcement
    console.log('1️⃣ FOREIGN KEY ENFORCEMENT:');
    const [fkResult] = await sequelize.query('PRAGMA foreign_keys');
    console.log('   PRAGMA foreign_keys:', fkResult);
    
    // Check all table schemas
    console.log('\n2️⃣ TABLE SCHEMAS:');
    
    const tables = ['sessions', 'exit_velocity_data', 'bat_speed_data', 'players'];
    
    for (const table of tables) {
      console.log(`\n   📋 ${table.toUpperCase()} TABLE:`);
      const [schema] = await sequelize.query(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`);
      if (schema && schema.length > 0) {
        console.log('   ', schema[0].sql);
      } else {
        console.log('   ❌ Table not found!');
      }
    }
    
    // Check foreign key constraints
    console.log('\n3️⃣ FOREIGN KEY CONSTRAINTS:');
    
    const [exitVelocityFks] = await sequelize.query('PRAGMA foreign_key_list(exit_velocity_data)');
    console.log('   exit_velocity_data FKs:', exitVelocityFks);
    
    const [batSpeedFks] = await sequelize.query('PRAGMA foreign_key_list(bat_speed_data)');
    console.log('   bat_speed_data FKs:', batSpeedFks);
    
    const [sessionsFks] = await sequelize.query('PRAGMA foreign_key_list(sessions)');
    console.log('   sessions FKs:', sessionsFks);
    
    // Check data integrity
    console.log('\n4️⃣ DATA INTEGRITY CHECK:');
    
    // Check sessions
    const [sessionCount] = await sequelize.query('SELECT COUNT(*) as count FROM sessions');
    console.log('   Sessions count:', sessionCount[0].count);
    
    // Check exit_velocity_data
    const [exitVelocityCount] = await sequelize.query('SELECT COUNT(*) as count FROM exit_velocity_data');
    console.log('   Exit velocity records count:', exitVelocityCount[0].count);
    
    // Check for orphaned records
    const [orphanedExit] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM exit_velocity_data ev 
      LEFT JOIN sessions s ON ev.session_id = s.id 
      WHERE s.id IS NULL
    `);
    console.log('   Orphaned exit_velocity_data records:', orphanedExit[0].count);
    
    // Check bat_speed_data
    const [batSpeedCount] = await sequelize.query('SELECT COUNT(*) as count FROM bat_speed_data');
    console.log('   Bat speed records count:', batSpeedCount[0].count);
    
    const [orphanedBat] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM bat_speed_data bsd 
      LEFT JOIN sessions s ON bsd.session_id = s.id 
      WHERE s.id IS NULL
    `);
    console.log('   Orphaned bat_speed_data records:', orphanedBat[0].count);
    
    // Check players
    const [playerCount] = await sequelize.query('SELECT COUNT(*) as count FROM players');
    console.log('   Players count:', playerCount[0].count);
    
    // Check for sessions without players
    const [orphanedSessions] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM sessions s 
      LEFT JOIN players p ON s.player_id = p.id 
      WHERE p.id IS NULL
    `);
    console.log('   Sessions without valid players:', orphanedSessions[0].count);
    
    // Sample data check
    console.log('\n5️⃣ SAMPLE DATA:');
    
    const [sampleSessions] = await sequelize.query('SELECT id, player_id, session_type FROM sessions LIMIT 3');
    console.log('   Sample sessions:', sampleSessions);
    
    const [sampleExit] = await sequelize.query('SELECT session_id, exit_velocity FROM exit_velocity_data LIMIT 3');
    console.log('   Sample exit_velocity_data:', sampleExit);
    
    console.log('\n✅ Schema verification complete!');
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
  } finally {
    await sequelize.close();
  }
}

verifySchema(); 