#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

console.log('🚀 OTR Baseball - Add Demo Users to Production');
console.log('==============================================');
console.log('');

// Check if DATABASE_URL is provided
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL not found!');
  console.log('');
  console.log('Please set your production DATABASE_URL:');
  console.log('export DATABASE_URL="postgresql://username:password@host:port/database"');
  console.log('');
  console.log('Or run this script with the URL:');
  console.log('DATABASE_URL="your-url" node scripts/add-demo-users-production.js');
  process.exit(1);
}

async function addDemoUsers() {
  let sequelize;
  
  try {
    console.log('🔗 Connecting to production PostgreSQL database...');
    console.log('Host:', new URL(databaseUrl).hostname);
    
    // Connect to production database
    sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      retry: {
        max: 3,
        timeout: 10000
      }
    });
    
    await sequelize.authenticate();
    console.log('✅ Production database connection established');

    console.log('🔄 Adding demo users...');

    // Hash password for all users (password123)
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('✅ Password hashed successfully');

    // Demo users to create
    const demoUsers = [
      {
        email: 'admin@otr.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
        permissions: JSON.stringify([
          'view_all_players',
          'manage_players',
          'manage_coaches',
          'manage_users',
          'view_own_data',
          'download_reports',
          'view_analytics',
          'view_admin_dashboard'
        ])
      },
      {
        email: 'coach@otr.com',
        password: hashedPassword,
        name: 'Coach User',
        role: 'coach',
        permissions: JSON.stringify([
          'view_all_players',
          'manage_players',
          'view_own_data',
          'download_reports',
          'view_analytics',
          'view_coach_dashboard'
        ])
      },
      {
        email: 'player@otr.com',
        password: hashedPassword,
        name: 'Player User',
        role: 'player',
        permissions: JSON.stringify([
          'view_own_data',
          'download_reports',
          'view_player_dashboard'
        ])
      }
    ];

    // Create each demo user
    for (const userData of demoUsers) {
      try {
        // Check if user already exists
        const [existingUsers] = await sequelize.query(
          'SELECT id FROM users WHERE email = $1',
          {
            bind: [userData.email],
            type: sequelize.QueryTypes.SELECT
          }
        );
        
        if (existingUsers && existingUsers.length > 0) {
          console.log(`⚠️  User ${userData.email} already exists, updating...`);
          
          await sequelize.query(
            `UPDATE users 
             SET name = $1, role = $2, permissions = $3, password = $4, updated_at = NOW()
             WHERE email = $5`,
            {
              bind: [
                userData.name,
                userData.role,
                userData.permissions,
                userData.password,
                userData.email
              ]
            }
          );
          console.log(`✅ Updated user: ${userData.email} (${userData.role})`);
        } else {
          // Create new user
          await sequelize.query(
            `INSERT INTO users (name, email, password, role, permissions, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
            {
              bind: [
                userData.name,
                userData.email,
                userData.password,
                userData.role,
                userData.permissions
              ]
            }
          );
          console.log(`✅ Created user: ${userData.email} (${userData.role})`);
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userData.email}:`, error.message);
      }
    }

    console.log('\n🎉 Demo users added successfully!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('Admin: admin@otr.com / password123');
    console.log('Coach: coach@otr.com / password123');
    console.log('Player: player@otr.com / password123');
    console.log('');
    console.log('🔗 You can now test login at your production frontend URL');

  } catch (error) {
    console.error('❌ Failed to add demo users:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    
    if (error.message.includes('Connection terminated')) {
      console.log('');
      console.log('💡 The database connection was terminated. This might be due to:');
      console.log('   - Network connectivity issues');
      console.log('   - Database server maintenance');
      console.log('   - Firewall restrictions');
      console.log('');
      console.log('🔄 Try running this script again in a few minutes.');
    }
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
addDemoUsers(); 