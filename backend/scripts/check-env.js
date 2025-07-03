#!/usr/bin/env node

require('dotenv').config();

console.log('🔍 Environment Check for OTR Baseball Backend');
console.log('============================================');

// Check environment
console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`🔗 DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);

// Check individual database variables (for development)
console.log(`🏠 DB_HOST: ${process.env.DB_HOST || 'not set'}`);
console.log(`🔌 DB_PORT: ${process.env.DB_PORT || 'not set'}`);
console.log(`📊 DB_NAME: ${process.env.DB_NAME || 'not set'}`);
console.log(`👤 DB_USER: ${process.env.DB_USER || 'not set'}`);
console.log(`🔑 DB_PASSWORD: ${process.env.DB_PASSWORD ? 'Set' : 'Not set'}`);

// Check other important variables
console.log(`🔐 JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
console.log(`🌐 FRONTEND_URL: ${process.env.FRONTEND_URL || 'not set'}`);

// Test database connection if possible
if (process.env.DATABASE_URL || (process.env.DB_HOST && process.env.DB_NAME)) {
  console.log('\n🔗 Testing database connection...');
  
  const { testConnection } = require('../src/config/database');
  
  testConnection()
    .then(() => {
      console.log('✅ Database connection successful!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    });
} else {
  console.log('\n⚠️  No database configuration found, skipping connection test');
  console.log('💡 Set DATABASE_URL (production) or DB_HOST/DB_NAME (development)');
  process.exit(1);
} 