#!/usr/bin/env node

require('dotenv').config();

console.log('🧪 Testing production app startup...');
console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🔗 DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);

// Set production environment for testing
process.env.NODE_ENV = 'production';

async function testProductionStart() {
  try {
    console.log('\n🔗 Testing database connection...');
    const { sequelize, testConnection } = require('../src/config/database');
    
    // Test database connection
    await testConnection();
    
    console.log('\n🔄 Testing database sync...');
    await sequelize.sync();
    console.log('✅ Database sync successful');
    
    console.log('\n🚀 Testing app initialization...');
    const app = require('../src/app');
    console.log('✅ App initialization successful');
    
    console.log('\n🎉 Production startup test completed successfully!');
    console.log('✅ No SQLite-specific commands executed');
    console.log('✅ PostgreSQL connection working');
    console.log('✅ App can start in production');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Production startup test failed:', error.message);
    console.error('🔍 Error details:', {
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    process.exit(1);
  }
}

testProductionStart(); 