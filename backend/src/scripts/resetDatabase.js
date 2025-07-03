const path = require('path');
const fs = require('fs');
const { sequelize } = require('../config/database');

// Import ALL models to register them
require('../models/User');
require('../models/Player');
require('../models/Session');
require('../models/BatSpeedData');
require('../models/ExitVelocityData');
require('../models/Report');

async function resetDatabase() {
  try {
    // Ensure database directory exists
    const dbDir = path.join(__dirname, '../../../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('Created database directory');
    }
    // Force sync all models
    await sequelize.sync({ force: true });
    console.log('✅ All tables created successfully');
    // Verify tables exist
    const tables = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table'",
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('Tables created:', tables.map(t => t.name));
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase(); 