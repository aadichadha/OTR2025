#!/usr/bin/env node

const { initDatabase } = require('../src/config/init-db');
const { runMigrations } = require('../src/migrate');

async function deployProduction() {
  try {
    console.log('🚀 Starting production deployment...');
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
    
    // Check required environment variables
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is required for production deployment');
      process.exit(1);
    }
    
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is required for production deployment');
      process.exit(1);
    }
    
    console.log('✅ Environment variables validated');
    
    // Initialize database (creates tables, runs migrations, seeds data)
    console.log('\n📊 Initializing database...');
    await initDatabase();
    
    // Run any additional migrations if needed
    console.log('\n🔄 Running database migrations...');
    await runMigrations();
    
    console.log('\n🎉 Production deployment completed successfully!');
    console.log('✅ Database is ready');
    console.log('✅ Application can start');
    
  } catch (error) {
    console.error('\n❌ Production deployment failed:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  deployProduction();
}

module.exports = { deployProduction }; 