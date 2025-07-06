const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/database');

async function setupProductionUsers() {
  try {
    console.log('🔗 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

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

    // Create demo users
    const demoUsers = [
      {
        name: 'Admin User',
        email: 'admin@otr.com',
        password: await bcrypt.hash('password123', 10),
        role: 'admin',
        permissions: JSON.stringify(rolePermissions.admin)
      },
      {
        name: 'Coach User',
        email: 'coach@otr.com',
        password: await bcrypt.hash('password123', 10),
        role: 'coach',
        permissions: JSON.stringify(rolePermissions.coach)
      },
      {
        name: 'Player User',
        email: 'player@otr.com',
        password: await bcrypt.hash('password123', 10),
        role: 'player',
        permissions: JSON.stringify(rolePermissions.player)
      }
    ];

    for (const userData of demoUsers) {
      try {
        // Check if user already exists
        const [existingUsers] = await sequelize.query(
          'SELECT * FROM users WHERE email = ?',
          {
            replacements: [userData.email],
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
              replacements: [
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
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: [
                userData.name,
                userData.email,
                userData.password,
                userData.role,
                userData.permissions,
                new Date(),
                new Date()
              ]
            }
          );
          console.log(`✅ Created user: ${userData.email} (${userData.role})`);
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userData.email}:`, error.message);
      }
    }

    console.log('\n🎉 Production users setup completed!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@otr.com / password123');
    console.log('Coach: coach@otr.com / password123');
    console.log('Player: player@otr.com / password123');

  } catch (error) {
    console.error('❌ Error setting up production users:', error);
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

// Run the setup
setupProductionUsers(); 