const { sequelize } = require('./database');
const { testConnection } = require('./database');
const models = require('../models');
const fs = require('fs');
const path = require('path');

const initDatabase = async () => {
  try {
    // Test connection first
    await testConnection();
    
    // Sync all models (creates tables if they don't exist)
    await sequelize.sync({ force: false }); // Set force: true to drop and recreate tables
    console.log('✅ Database models synchronized successfully.');
    
    // Run SQL migrations if they exist
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      for (const file of migrationFiles) {
        const migrationPath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        try {
          await sequelize.query(migrationSQL);
          console.log(`✅ Migration ${file} executed successfully.`);
        } catch (error) {
          console.log(`⚠️  Migration ${file} skipped (likely already applied): ${error.message}`);
        }
      }
    }
    
    // Run seeds if they exist
    const seedsDir = path.join(__dirname, '../../database/seeds');
    if (fs.existsSync(seedsDir)) {
      const seedFiles = fs.readdirSync(seedsDir)
        .filter(file => file.endsWith('.sql'));
      
      for (const file of seedFiles) {
        const seedPath = path.join(seedsDir, file);
        const seedSQL = fs.readFileSync(seedPath, 'utf8');
        
        try {
          await sequelize.query(seedSQL);
          console.log(`✅ Seed ${file} executed successfully.`);
        } catch (error) {
          console.log(`⚠️  Seed ${file} skipped: ${error.message}`);
        }
      }
    }
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

module.exports = { initDatabase }; 