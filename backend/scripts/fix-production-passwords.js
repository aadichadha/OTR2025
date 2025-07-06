const bcrypt = require('bcryptjs');

// This script will be run locally but connect to production database
async function fixProductionPasswords() {
  try {
    console.log('🔧 Fixing production passwords...');
    
    // Test password hashing
    const testPassword = 'password123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    
    console.log('✅ Password hashing test:', isValid);
    console.log('🔐 Hashed password:', hashedPassword);
    
    // Connect to production database
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: 'postgresql://otrbaseball_user:otrbaseball_password_2025@dpg-cp8j8v6n7h5c73f8v8q0-a.oregon-postgres.render.com/otrbaseball_db',
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    console.log('🔗 Connected to production database');
    
    // Get all users
    const usersResult = await pool.query('SELECT id, email, password FROM "Users"');
    console.log(`📊 Found ${usersResult.rows.length} users`);
    
    // Update each user's password
    for (const user of usersResult.rows) {
      console.log(`🔄 Updating password for user: ${user.email}`);
      
      // Hash the password (assuming it's currently plain text)
      const newHashedPassword = await bcrypt.hash('password123', 10);
      
      // Update the user
      await pool.query(
        'UPDATE "Users" SET password = $1 WHERE id = $2',
        [newHashedPassword, user.id]
      );
      
      console.log(`✅ Updated password for ${user.email}`);
    }
    
    console.log('🎉 All passwords updated successfully!');
    console.log('\n📋 Test credentials for all users:');
    console.log('- Email: admin@otr.com, Password: password123');
    console.log('- Email: coach@otr.com, Password: password123');
    console.log('- Email: player@otr.com, Password: password123');
    console.log('- Email: aadichadha@gmail.com, Password: password123');
    
    await pool.end();
    
  } catch (error) {
    console.error('💥 Error fixing passwords:', error);
  }
}

fixProductionPasswords(); 