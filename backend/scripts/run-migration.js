const { sequelize } = require('../src/config/database');

async function runMigration() {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('🔄 Running migration...');

    // Add role column if it doesn't exist
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(20) DEFAULT 'player'
      `);
      console.log('✅ Added role column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Role column already exists');
      } else {
        throw error;
      }
    }

    // Add permissions column if it doesn't exist
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN permissions JSON
      `);
      console.log('✅ Added permissions column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Permissions column already exists');
      } else {
        throw error;
      }
    }

    // Add created_by column if it doesn't exist
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN created_by INTEGER
      `);
      console.log('✅ Added created_by column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Created_by column already exists');
      } else {
        throw error;
      }
    }

    // Add team_id column if it doesn't exist
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN team_id INTEGER
      `);
      console.log('✅ Added team_id column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Team_id column already exists');
      } else {
        throw error;
      }
    }

    // Update existing users to have appropriate roles
    console.log('🔄 Updating existing users...');
    
    try {
      await sequelize.query(`
        UPDATE users 
        SET role = 'admin' 
        WHERE email LIKE '%admin%' OR email LIKE '%@otr.com'
      `);
      console.log('✅ Updated admin users');
    } catch (error) {
      console.log('⚠️  Error updating admin users:', error.message);
    }

    try {
      await sequelize.query(`
        UPDATE users 
        SET role = 'coach' 
        WHERE email LIKE '%coach%'
      `);
      console.log('✅ Updated coach users');
    } catch (error) {
      console.log('⚠️  Error updating coach users:', error.message);
    }

    // Set default role for remaining users
    try {
      await sequelize.query(`
        UPDATE users 
        SET role = 'player' 
        WHERE role IS NULL OR role = 'user'
      `);
      console.log('✅ Updated remaining users to player role');
    } catch (error) {
      console.log('⚠️  Error updating remaining users:', error.message);
    }

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
runMigration(); 