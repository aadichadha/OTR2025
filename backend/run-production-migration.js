const { Sequelize } = require('sequelize');

// Production database configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: console.log
});

async function runMigration() {
  try {
    console.log('🔗 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('🔧 Running player_level migration...');
    
    // Add player_level column to players table
    await sequelize.query(`
      ALTER TABLE "players" 
      ADD COLUMN "player_level" VARCHAR(50) DEFAULT 'High School';
    `);
    
    console.log('✅ player_level column added successfully');
    
    // Add comment to the column
    await sequelize.query(`
      COMMENT ON COLUMN "players"."player_level" IS 'Player level: Little League, High School, College, etc.';
    `);
    
    console.log('✅ Column comment added');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Check if column already exists
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Column already exists, migration not needed');
    } else {
      console.error('Full error:', error);
    }
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

runMigration(); 