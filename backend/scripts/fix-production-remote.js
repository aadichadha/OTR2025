const { Sequelize } = require('sequelize');

// Instructions for the user
console.log('🚀 OTR Baseball - Remote Production Database Fix');
console.log('================================================');
console.log('');
console.log('INSTRUCTIONS:');
console.log('1. Get your DATABASE_URL from Render dashboard');
console.log('2. Set it as an environment variable:');
console.log('   export DATABASE_URL="your-production-database-url"');
console.log('3. Then run: node scripts/fix-production-remote.js');
console.log('');

// Check if DATABASE_URL is provided
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL not found!');
  console.log('');
  console.log('Please set your production DATABASE_URL:');
  console.log('export DATABASE_URL="postgresql://username:password@host:port/database"');
  console.log('');
  console.log('You can find this in your Render dashboard:');
  console.log('1. Go to your backend service');
  console.log('2. Click "Environment" tab');
  console.log('3. Copy the DATABASE_URL value');
  process.exit(1);
}

async function fixProductionDatabase() {
  let sequelize;
  
  try {
    console.log('🔗 Connecting to production PostgreSQL database...');
    console.log('Host:', new URL(databaseUrl).hostname);
    
    // Connect directly to production database
    sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
    
    await sequelize.authenticate();
    console.log('✅ Production database connection established');

    console.log('🔄 Fixing production database schema...');

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
        console.log('⚠️  Error adding role column:', error.message);
      }
    }

    // Add permissions column if it doesn't exist
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN permissions JSONB
      `);
      console.log('✅ Added permissions column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Permissions column already exists');
      } else {
        console.log('⚠️  Error adding permissions column:', error.message);
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
        console.log('⚠️  Error adding created_by column:', error.message);
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
        console.log('⚠️  Error adding team_id column:', error.message);
      }
    }

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

    // Update existing users to have appropriate roles and permissions
    console.log('🔄 Updating existing users...');
    
    // Update admin users
    try {
      await sequelize.query(`
        UPDATE users 
        SET role = 'admin', permissions = $1
        WHERE email LIKE '%admin%' OR email LIKE '%@otr.com'
      `, {
        bind: [JSON.stringify(rolePermissions.admin)]
      });
      console.log('✅ Updated admin users');
    } catch (error) {
      console.log('⚠️  Error updating admin users:', error.message);
    }

    // Update coach users
    try {
      await sequelize.query(`
        UPDATE users 
        SET role = 'coach', permissions = $1
        WHERE email LIKE '%coach%'
      `, {
        bind: [JSON.stringify(rolePermissions.coach)]
      });
      console.log('✅ Updated coach users');
    } catch (error) {
      console.log('⚠️  Error updating coach users:', error.message);
    }

    // Set default role for remaining users
    try {
      await sequelize.query(`
        UPDATE users 
        SET role = 'player', permissions = $1
        WHERE role IS NULL OR role = 'user'
      `, {
        bind: [JSON.stringify(rolePermissions.player)]
      });
      console.log('✅ Updated remaining users to player role');
    } catch (error) {
      console.log('⚠️  Error updating remaining users:', error.message);
    }

    console.log('\n🎉 Production database fixed successfully!');
    console.log('');
    console.log('You can now:');
    console.log('1. Try logging in with demo credentials:');
    console.log('   - Admin: admin@otr.com / password123');
    console.log('   - Coach: coach@otr.com / password123');
    console.log('   - Player: player@otr.com / password123');
    console.log('');
    console.log('2. Access the admin dashboard to manage users');

  } catch (error) {
    console.error('❌ Production database fix failed:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the fix
fixProductionDatabase(); 