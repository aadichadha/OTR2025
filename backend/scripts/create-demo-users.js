const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');

async function createDemoUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Create demo users
    const demoUsers = [
      {
        name: 'Admin User',
        email: 'admin@otr.com',
        password: 'password123',
        role: 'admin',
        permissions: User.getRolePermissions('admin')
      },
      {
        name: 'Coach User',
        email: 'coach@otr.com',
        password: 'password123',
        role: 'coach',
        permissions: User.getRolePermissions('coach')
      },
      {
        name: 'Player User',
        email: 'player@otr.com',
        password: 'password123',
        role: 'player',
        permissions: User.getRolePermissions('player')
      }
    ];

    for (const userData of demoUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: userData.email } });
      
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, updating...`);
        await existingUser.update({
          name: userData.name,
          role: userData.role,
          permissions: userData.permissions
        });
        console.log(`✅ Updated user: ${userData.email} (${userData.role})`);
      } else {
        // Create new user
        const user = await User.create(userData);
        console.log(`✅ Created user: ${user.email} (${user.role})`);
      }
    }

    console.log('\n🎉 Demo users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@otr.com / password123');
    console.log('Coach: coach@otr.com / password123');
    console.log('Player: player@otr.com / password123');

  } catch (error) {
    console.error('❌ Error creating demo users:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
createDemoUsers(); 