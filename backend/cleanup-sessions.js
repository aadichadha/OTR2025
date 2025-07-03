const { sequelize } = require('./src/config/database');

async function cleanupOldSessions() {
  try {
    console.log('🔍 Starting session cleanup...');
    
    // First, let's see what sessions exist
    const sessions = await sequelize.query('SELECT id, player_id, session_date, created_at FROM sessions ORDER BY created_at DESC', {
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log(`📊 Found ${sessions.length} sessions:`);
    sessions.forEach(session => {
      console.log(`  - Session ID: ${session.id}, Player: ${session.player_id}, Date: ${session.session_date}`);
    });
    
    if (sessions.length === 0) {
      console.log('✅ No sessions to clean up');
      return;
    }
    
    // Check related data counts
    const batSpeedCount = await sequelize.query('SELECT COUNT(*) as count FROM bat_speed_data', {
      type: sequelize.QueryTypes.SELECT
    });
    
    const exitVelocityCount = await sequelize.query('SELECT COUNT(*) as count FROM exit_velocity_data', {
      type: sequelize.QueryTypes.SELECT
    });
    
    const reportsCount = await sequelize.query('SELECT COUNT(*) as count FROM reports', {
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log(`📋 Related data counts:`);
    console.log(`  - Bat speed records: ${batSpeedCount[0].count}`);
    console.log(`  - Exit velocity records: ${exitVelocityCount[0].count}`);
    console.log(`  - Reports: ${reportsCount[0].count}`);
    
    // Delete all sessions and related data
    console.log('🗑️  Deleting all sessions and related data...');
    
    // Disable foreign key constraints temporarily
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    
    // Delete in order to avoid FK constraint issues
    await sequelize.query('DELETE FROM reports');
    await sequelize.query('DELETE FROM bat_speed_data');
    await sequelize.query('DELETE FROM exit_velocity_data');
    await sequelize.query('DELETE FROM sessions');
    
    // Re-enable foreign key constraints
    await sequelize.query('PRAGMA foreign_keys = ON;');
    
    console.log('✅ All sessions and related data deleted successfully');
    
    // Verify cleanup
    const remainingSessions = await sequelize.query('SELECT COUNT(*) as count FROM sessions', {
      type: sequelize.QueryTypes.SELECT
    });
    
    const remainingBatSpeed = await sequelize.query('SELECT COUNT(*) as count FROM bat_speed_data', {
      type: sequelize.QueryTypes.SELECT
    });
    
    const remainingExitVelocity = await sequelize.query('SELECT COUNT(*) as count FROM exit_velocity_data', {
      type: sequelize.QueryTypes.SELECT
    });
    
    const remainingReports = await sequelize.query('SELECT COUNT(*) as count FROM reports', {
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('📋 Cleanup verification:');
    console.log(`  - Remaining sessions: ${remainingSessions[0].count}`);
    console.log(`  - Remaining bat speed records: ${remainingBatSpeed[0].count}`);
    console.log(`  - Remaining exit velocity records: ${remainingExitVelocity[0].count}`);
    console.log(`  - Remaining reports: ${remainingReports[0].count}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await sequelize.close();
  }
}

cleanupOldSessions(); 