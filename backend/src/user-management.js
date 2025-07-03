const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'otr_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function deleteAllUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Deleting all users...');
    
    const result = await client.query('DELETE FROM users');
    console.log(`✅ Deleted ${result.rowCount} users`);
    
  } catch (error) {
    console.error('❌ Error deleting users:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function createTestUser(email = 'test@example.com', password = 'password123') {
  const client = await pool.connect();
  
  try {
    console.log(`👤 Creating test user: ${email}`);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert the user with explicit timestamps
    const result = await client.query(
      'INSERT INTO users (email, password, role, created_at, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id, email, role, created_at',
      [email, hashedPassword, 'user']
    );
    
    const user = result.rows[0];
    console.log('✅ Test user created successfully:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - Created: ${user.created_at}`);
    console.log(`  - Password: ${password} (plain text for testing)`);
    
    return user;
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function listAllUsers() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Listing all users...');
    
    const result = await client.query(
      'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    
    if (result.rows.length === 0) {
      console.log('No users found in the database');
    } else {
      console.log(`Found ${result.rows.length} users:`);
      result.rows.forEach(user => {
        console.log(`  - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Created: ${user.created_at}`);
      });
    }
    
    return result.rows;
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function verifyUserExists(email) {
  const client = await pool.connect();
  
  try {
    console.log(`🔍 Verifying user exists: ${email}`);
    
    const result = await client.query(
      'SELECT id, email, role, created_at FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return null;
    } else {
      const user = result.rows[0];
      console.log('✅ User found:');
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Role: ${user.role}`);
      console.log(`  - Created: ${user.created_at}`);
      return user;
    }
    
  } catch (error) {
    console.error('❌ Error verifying user:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Command line interface
async function main() {
  const command = process.argv[2];
  const email = process.argv[3] || 'test@example.com';
  const password = process.argv[4] || 'password123';
  
  try {
    switch (command) {
      case 'delete-all':
        await deleteAllUsers();
        break;
      case 'create-test':
        await createTestUser(email, password);
        break;
      case 'list':
        await listAllUsers();
        break;
      case 'verify':
        await verifyUserExists(email);
        break;
      default:
        console.log('Available commands:');
        console.log('  node src/user-management.js delete-all');
        console.log('  node src/user-management.js create-test [email] [password]');
        console.log('  node src/user-management.js list');
        console.log('  node src/user-management.js verify [email]');
    }
  } catch (error) {
    console.error('❌ Command failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  deleteAllUsers,
  createTestUser,
  listAllUsers,
  verifyUserExists
}; 