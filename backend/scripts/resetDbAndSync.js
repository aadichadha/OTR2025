const { sequelize } = require('../src/config/database');
// Import all models to register them with Sequelize
require('../src/models');

async function resetAndSync() {
  try {
    console.log('⚠️  This will drop and recreate all tables!');
    await sequelize.sync({ force: true });
    console.log('✅ Database has been reset and synced with models.');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await sequelize.close();
  }
}

resetAndSync(); 