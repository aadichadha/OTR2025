#!/usr/bin/env node

console.log('🚀 OTR Baseball - Production Database Fix');
console.log('==========================================');
console.log('');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  console.log('');
  console.log('To fix this:');
  console.log('1. Get your production DATABASE_URL from Render dashboard');
  console.log('2. Set it as an environment variable:');
  console.log('   export DATABASE_URL="your-production-database-url"');
  console.log('3. Then run: node scripts/fix-production-database.js');
  console.log('');
  console.log('Or run this script directly in your Render shell where DATABASE_URL is already set.');
  process.exit(1);
}

console.log('✅ DATABASE_URL found');
console.log('🔗 Connecting to production database...');
console.log('');

// Import and run the fix
const { execSync } = require('child_process');

try {
  execSync('node scripts/fix-production-database.js', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('');
  console.log('🎉 Production database fix completed successfully!');
  console.log('');
  console.log('You can now:');
  console.log('1. Try logging in with demo credentials:');
  console.log('   - Admin: admin@otr.com / password123');
  console.log('   - Coach: coach@otr.com / password123');
  console.log('   - Player: player@otr.com / password123');
  console.log('');
  console.log('2. Access the admin dashboard to manage users');
} catch (error) {
  console.error('❌ Failed to run production database fix:', error.message);
  process.exit(1);
} 