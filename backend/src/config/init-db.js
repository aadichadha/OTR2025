const { sequelize } = require('./database');
const { testConnection } = require('./database');
const models = require('../models');
const fs = require('fs');
const path = require('path');

const initDatabase = async () => {
  try {
    console.log('🚀 Starting database initialization...');
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Test connection first
    await testConnection();
    
    // Sync all models (creates tables if they don't exist)
    console.log('🔄 Syncing database models...');
    await sequelize.sync({ force: false }); // Set force: true to drop and recreate tables
    console.log('✅ Database models synchronized successfully.');
    
    // Run SQL migrations if they exist
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    if (fs.existsSync(migrationsDir)) {
      console.log('📁 Found migrations directory, running SQL migrations...');
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      console.log(`📋 Found ${migrationFiles.length} SQL migration files`);
      
      for (const file of migrationFiles) {
        const migrationPath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        try {
          await sequelize.query(migrationSQL);
          console.log(`✅ Migration ${file} executed successfully.`);
        } catch (error) {
          // Check if it's a "table already exists" error
          if (error.message.includes('already exists') || error.code === '42P07') {
            console.log(`⚠️  Migration ${file} skipped (table already exists): ${error.message}`);
          } else {
            console.log(`⚠️  Migration ${file} failed: ${error.message}`);
            // Don't throw here, continue with other migrations
          }
        }
      }
    } else {
      console.log('📁 No migrations directory found, skipping SQL migrations');
    }
    
    // Run seeds if they exist
    const seedsDir = path.join(__dirname, '../../database/seeds');
    if (fs.existsSync(seedsDir)) {
      console.log('🌱 Found seeds directory, running seed data...');
      const seedFiles = fs.readdirSync(seedsDir)
        .filter(file => file.endsWith('.sql'));
      
      console.log(`📋 Found ${seedFiles.length} seed files`);
      
      for (const file of seedFiles) {
        const seedPath = path.join(seedsDir, file);
        const seedSQL = fs.readFileSync(seedPath, 'utf8');
        
        try {
          await sequelize.query(seedSQL);
          console.log(`✅ Seed ${file} executed successfully.`);
        } catch (error) {
          console.log(`⚠️  Seed ${file} failed: ${error.message}`);
          // Don't throw here, continue with other seeds
        }
      }
    } else {
      console.log('🌱 No seeds directory found, skipping seed data');
    }
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    throw error;
  }
};

module.exports = { initDatabase }; 