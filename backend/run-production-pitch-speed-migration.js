const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

async function runProductionMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔧 Running pitch_speed migration on production database...');
    
    // Check if column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'exit_velocity_data' 
      AND column_name = 'pitch_speed'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ pitch_speed column already exists');
      return;
    }
    
    // Add the pitch_speed column
    await pool.query(`
      ALTER TABLE exit_velocity_data 
      ADD COLUMN pitch_speed DECIMAL(5,2) DEFAULT NULL
    `);
    
    console.log('✅ Successfully added pitch_speed column to exit_velocity_data table');
    
    // Add comment to the column
    await pool.query(`
      COMMENT ON COLUMN exit_velocity_data.pitch_speed IS 'Column E from Hittrax CSV - Pitch speed in mph'
    `);
    
    console.log('✅ Added comment to pitch_speed column');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runProductionMigration()
  .then(() => {
    console.log('🎉 Production migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }); 