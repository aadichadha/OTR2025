const { sequelize } = require('./src/config/database');

async function checkSchema() {
  try {
    console.log('🔍 Checking database schemas...\n');
    
    // Check sessions table
    console.log('📋 SESSIONS TABLE:');
    const [sessionsSchema] = await sequelize.query('.schema sessions');
    console.log(sessionsSchema);
    
    // Check exit_velocity_data table
    console.log('\n📋 EXIT_VELOCITY_DATA TABLE:');
    const [exitVelocitySchema] = await sequelize.query('.schema exit_velocity_data');
    console.log(exitVelocitySchema);
    
    // Check bat_speed_data table
    console.log('\n📋 BAT_SPEED_DATA TABLE:');
    const [batSpeedSchema] = await sequelize.query('.schema bat_speed_data');
    console.log(batSpeedSchema);
    
    // Check foreign key enforcement
    console.log('\n🔍 FOREIGN KEY ENFORCEMENT:');
    const [fkResult] = await sequelize.query('PRAGMA foreign_keys');
    console.log('PRAGMA foreign_keys:', fkResult);
    
    // Check foreign key list
    console.log('\n🔍 FOREIGN KEY LIST:');
    const [fkList] = await sequelize.query('PRAGMA foreign_key_list(exit_velocity_data)');
    console.log('exit_velocity_data FKs:', fkList);
    
    const [fkList2] = await sequelize.query('PRAGMA foreign_key_list(bat_speed_data)');
    console.log('bat_speed_data FKs:', fkList2);
    
    // Check existing data integrity
    console.log('\n🔍 DATA INTEGRITY CHECK:');
    const [sessionIds] = await sequelize.query(`
      SELECT session_id, COUNT(*) as count 
      FROM exit_velocity_data 
      GROUP BY session_id
    `);
    console.log('Session IDs in exit_velocity_data:', sessionIds);
    
    const [validSessions] = await sequelize.query(`
      SELECT ev.session_id, s.id as session_exists
      FROM exit_velocity_data ev
      LEFT JOIN sessions s ON ev.session_id = s.id
      WHERE s.id IS NULL
    `);
    console.log('Orphaned records (no matching session):', validSessions);
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  } finally {
    await sequelize.close();
  }
}

checkSchema(); 