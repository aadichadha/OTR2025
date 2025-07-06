const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');

async function initializeLocalDatabase() {
  try {
    console.log('🔄 Initializing local database...');
    
    // Sync all models to create tables
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created');
    
    // Create demo users
    const demoUsers = [
      {
        name: 'Demo Admin',
        email: 'admin@demo.com',
        password: 'demo123',
        role: 'admin',
        permissions: JSON.stringify(['read', 'write', 'delete', 'admin'])
      },
      {
        name: 'Demo Coach',
        email: 'coach@demo.com',
        password: 'demo123',
        role: 'coach',
        permissions: JSON.stringify(['read', 'write'])
      },
      {
        name: 'Demo Player',
        email: 'player@demo.com',
        password: 'demo123',
        role: 'player',
        permissions: JSON.stringify(['read'])
      }
    ];
    
    for (const userData of demoUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await User.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        permissions: userData.permissions
      });
      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    }
    
    console.log('🎉 Local database initialized successfully!');
    console.log('\n📋 Demo Users:');
    console.log('- Admin: admin@demo.com / demo123');
    console.log('- Coach: coach@demo.com / demo123');
    console.log('- Player: player@demo.com / demo123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initializeLocalDatabase(); 