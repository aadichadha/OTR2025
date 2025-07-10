#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration for PostgreSQL
let pool;

if (process.env.NODE_ENV === 'production') {
  // Production: Use DATABASE_URL from Render
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is required in production environment');
    process.exit(1);
  }
  
  console.log('🔗 Using DATABASE_URL for production PostgreSQL connection');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // Development: Use individual environment variables
  console.log('🔗 Using individual database config for development PostgreSQL');
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'otr_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  });
}

async function runPostgresMigrations() {
  let client;
  
  try {
    console.log('🚀 Starting PostgreSQL database migrations...');
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Test connection first
    client = await pool.connect();
    console.log('✅ PostgreSQL connection established successfully');
    
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
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
      
      // Remove any SQLite-specific PRAGMA statements
      migrationSQL = migrationSQL.replace(/PRAGMA\s+[^;]+;/gi, '-- PRAGMA statement removed for PostgreSQL');
      
      console.log(`🔄 Executing migration: ${migrationName}`);
      
      try {
        // Execute the migration in a transaction
        await client.query('BEGIN');
        
        // Split the SQL into individual statements and execute each one
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await client.query(statement);
            } catch (stmtError) {
              // Handle specific PostgreSQL errors gracefully
              if (stmtError.code === '42710') { // duplicate_object - ENUM type already exists
                console.log(`⚠️  ENUM type already exists, continuing...`);
              } else if (stmtError.code === '42P07') { // relation already exists
                console.log(`⚠️  Table/relation already exists, continuing...`);
              } else if (stmtError.code === '42701') { // duplicate_column - column already exists
                console.log(`⚠️  Column already exists, continuing...`);
              } else {
                throw stmtError; // Re-throw other errors
              }
            }
          }
        }
        
        // Record the migration as executed
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migrationName]
        );
        
        await client.query('COMMIT');
        console.log(`✅ Migration ${migrationName} completed successfully`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        
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
    
    console.log('🎉 All PostgreSQL migrations completed successfully!');
    
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
    console.error('❌ PostgreSQL migration failed:', error);
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

// Run if called directly
if (require.main === module) {
  runPostgresMigrations()
    .then(() => {
      console.log('✅ PostgreSQL migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ PostgreSQL migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runPostgresMigrations }; 