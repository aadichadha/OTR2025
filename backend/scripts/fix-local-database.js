const { sequelize } = require('../src/config/database');

async function fixLocalDatabase() {
  try {
    console.log('🔗 Connecting to local SQLite database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('🔄 Fixing local database schema...');

    // Check what columns exist
    const [columns] = await sequelize.query(`
      PRAGMA table_info(users)
    `);
    
    console.log('📋 Current columns:', columns.map(col => col.name));

    // Add permissions column if it doesn't exist
    const hasPermissions = columns.some(col => col.name === 'permissions');
    if (!hasPermissions) {
      try {
        await sequelize.query(`
          ALTER TABLE users 
          ADD COLUMN permissions TEXT
        `);
        console.log('✅ Added permissions column');
      } catch (error) {
        console.log('⚠️  Error adding permissions column:', error.message);
      }
    } else {
      console.log('⚠️  Permissions column already exists');
    }

    // Add created_by column if it doesn't exist
    const hasCreatedBy = columns.some(col => col.name === 'created_by');
    if (!hasCreatedBy) {
      try {
        await sequelize.query(`
          ALTER TABLE users 
          ADD COLUMN created_by INTEGER
        `);
        console.log('✅ Added created_by column');
      } catch (error) {
        console.log('⚠️  Error adding created_by column:', error.message);
      }
    } else {
      console.log('⚠️  Created_by column already exists');
    }

    // Add team_id column if it doesn't exist
    const hasTeamId = columns.some(col => col.name === 'team_id');
    if (!hasTeamId) {
      try {
        await sequelize.query(`
          ALTER TABLE users 
          ADD COLUMN team_id INTEGER
        `);
        console.log('✅ Added team_id column');
      } catch (error) {
        console.log('⚠️  Error adding team_id column:', error.message);
      }
    } else {
      console.log('⚠️  Team_id column already exists');
    }

    // Update existing users to have appropriate roles and permissions
    console.log('🔄 Updating existing users...');
    
    // Define role permissions
    const rolePermissions = {
      admin: [
        'view_all_players',
        'manage_players',
        'manage_coaches',
        'manage_users',
        'view_own_data',
        'download_reports',
        'view_analytics',
        'view_admin_dashboard'
      ],
      coach: [
        'view_all_players',
        'manage_players',
        'view_own_data',
        'download_reports',
        'view_analytics',
        'view_coach_dashboard'
      ],
      player: [
        'view_own_data',
        'download_reports',
        'view_player_dashboard'
      ]
    };

    // Update admin users
    try {
      await sequelize.query(`
        UPDATE users 
        SET role = 'admin', permissions = ?
        WHERE email LIKE '%admin%' OR email LIKE '%@otr.com'
      `, {
        replacements: [JSON.stringify(rolePermissions.admin)]
      });
      console.log('✅ Updated admin users');
    } catch (error) {
      console.log('⚠️  Error updating admin users:', error.message);
    }

    // Update coach users
    try {
      await sequelize.query(`
        UPDATE users 
        SET role = 'coach', permissions = ?
        WHERE email LIKE '%coach%'
      `, {
        replacements: [JSON.stringify(rolePermissions.coach)]
      });
      console.log('✅ Updated coach users');
    } catch (error) {
      console.log('⚠️  Error updating coach users:', error.message);
    }

    // Set default role for remaining users
    try {
      await sequelize.query(`
        UPDATE users 
        SET role = 'player', permissions = ?
        WHERE role IS NULL OR role = 'user'
      `, {
        replacements: [JSON.stringify(rolePermissions.player)]
      });
      console.log('✅ Updated remaining users to player role');
    } catch (error) {
      console.log('⚠️  Error updating remaining users:', error.message);
    }

    console.log('\n🎉 Local database fixed successfully!');

  } catch (error) {
    console.error('❌ Local database fix failed:', error);
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

// Run the fix
fixLocalDatabase(); 