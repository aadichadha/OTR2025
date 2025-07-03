const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
let pool;

if (process.env.NODE_ENV === 'production') {
  // Production: Use DATABASE_URL from Render
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is required in production environment');
    process.exit(1);
  }
  
  console.log('🔗 Using DATABASE_URL for production connection');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // Development: Use individual environment variables or defaults
  console.log('🔗 Using individual database config for development');
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'otr_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  });
}

async function runMigrations() {
  let client;
  
  try {
    console.log('🚀 Starting database migrations...');
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Test connection first
    client = await pool.connect();
    console.log('✅ Database connection established successfully');
    
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 No migrations directory found, skipping migrations');
      return;
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // This will sort them numerically
    
    console.log(`📁 Found ${migrationFiles.length} migration files`);
    
    for (const file of migrationFiles) {
      const migrationName = file.replace('.sql', '');
      
      // Check if migration has already been run
      const { rows } = await client.query(
        'SELECT id FROM migrations WHERE name = $1',
        [migrationName]
      );
      
      if (rows.length > 0) {
        console.log(`⏭️  Migration ${migrationName} already executed, skipping...`);
        continue;
      }
      
      // Read and execute migration file
      const migrationPath = path.join(migrationsDir, file);
      let migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Replace CREATE TABLE with CREATE TABLE IF NOT EXISTS for safety
      migrationSQL = migrationSQL.replace(/CREATE TABLE (\w+)/g, 'CREATE TABLE IF NOT EXISTS $1');
      
      console.log(`🔄 Executing migration: ${migrationName}`);
      
      try {
        // Execute the migration
        await client.query(migrationSQL);
        
        // Record the migration as executed
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migrationName]
        );
        
        console.log(`✅ Migration ${migrationName} completed successfully`);
      } catch (error) {
        // If table already exists, mark migration as completed
        if (error.code === '42P07') { // relation already exists
          console.log(`⚠️  Table already exists for ${migrationName}, marking as completed`);
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [migrationName]
          );
        } else {
          console.error(`❌ Migration ${migrationName} failed:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
    
    // Show current tables
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name != 'migrations'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Current tables in database:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    if (pool) {
      await pool.end();
    }
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations }; 