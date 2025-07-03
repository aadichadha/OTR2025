const { sequelize } = require('./src/config/database');
const { User } = require('./src/models');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('📁 Database path:', sequelize.config.storage);
    console.log('🔧 Full config:', JSON.stringify(sequelize.config, null, 2));
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Test table access
    console.log('🔍 Testing table access...');
    const tables = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'", {
      type: sequelize.QueryTypes.SELECT
    });
    console.log('📋 Available tables:', tables.map(t => t.name));
    
    // Test User model
    console.log('🔍 Testing User model...');
    const userCount = await User.count();
    console.log('👥 User count:', userCount);
    
    // Test finding a user
    const user = await User.findOne({ where: { email: 'test@example.com' } });
    console.log('👤 Found user:', user ? user.email : 'Not found');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testDatabase(); 