const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/database');

console.log('🚀 OTR Baseball - Create Demo Users (Simple)');
console.log('============================================');
console.log('');

async function createDemoUsers() {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('🔄 Creating demo users...');

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
          'SELECT id FROM users WHERE email = ?',
          {
            bind: [userData.email],
            type: sequelize.QueryTypes.SELECT
          }
        );
        
        if (existingUsers && existingUsers.length > 0) {
          console.log(`⚠️  User ${userData.email} already exists, updating...`);
          
          await sequelize.query(
            `UPDATE users 
             SET name = ?, role = ?, permissions = ?, password = ?
             WHERE email = ?`,
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
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
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

    console.log('\n🎉 Demo users created successfully!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('Admin: admin@otr.com / password123');
    console.log('Coach: coach@otr.com / password123');
    console.log('Player: player@otr.com / password123');
    console.log('');
    console.log('🔗 You can now test login at your frontend URL');

  } catch (error) {
    console.error('❌ Demo users creation failed:', error);
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

// Run the creation
createDemoUsers(); 