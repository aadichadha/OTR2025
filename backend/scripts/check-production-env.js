/**
 * Production Environment Validation Script
 * Checks all required environment variables for production deployment
 */

console.log('🔍 Production Environment Validation');
console.log('=====================================\n');

const requiredEnvVars = [
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET',
  'PORT'
];

const optionalEnvVars = [
  'FRONTEND_URL',
  'CORS_ORIGIN',
  'LOG_LEVEL'
];

let allValid = true;

console.log('📋 Required Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set`);
    
    // Special validation for specific variables
    if (varName === 'DATABASE_URL') {
      if (value.includes('postgres://') || value.includes('postgresql://')) {
        console.log(`   🔗 Database URL format: Valid PostgreSQL URL`);
      } else {
        console.log(`   ⚠️  Database URL format: May not be PostgreSQL`);
        allValid = false;
      }
    }
    
    if (varName === 'PORT') {
      const portNum = parseInt(value);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        console.log(`   ❌ PORT: Invalid port number (${value})`);
        allValid = false;
      } else {
        console.log(`   🔌 PORT: Valid port number (${portNum})`);
      }
    }
    
    if (varName === 'JWT_SECRET') {
      if (value.length < 32) {
        console.log(`   ⚠️  JWT_SECRET: Consider using a longer secret (current: ${value.length} chars)`);
      } else {
        console.log(`   🔐 JWT_SECRET: Good length (${value.length} chars)`);
      }
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allValid = false;
  }
});

console.log('\n📋 Optional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set (${value})`);
  } else {
    console.log(`⚠️  ${varName}: Not set (optional)`);
  }
});

console.log('\n🌍 Current Environment:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`   Environment: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}`);

console.log('\n📊 Database Configuration:');
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const isPostgres = dbUrl.includes('postgres');
  console.log(`   Type: ${isPostgres ? 'PostgreSQL' : 'Unknown'}`);
  console.log(`   SSL: ${dbUrl.includes('sslmode=require') ? 'Required' : 'Not specified'}`);
  
  if (isPostgres && !dbUrl.includes('sslmode=require')) {
    console.log(`   ⚠️  Warning: PostgreSQL URL should include SSL configuration`);
  }
} else {
  console.log(`   ❌ No DATABASE_URL configured`);
}

console.log('\n🔧 CORS Configuration:');
const corsOrigin = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
if (corsOrigin) {
  console.log(`   Frontend URL: ${corsOrigin}`);
} else {
  console.log(`   ⚠️  No frontend URL configured for CORS`);
}

console.log('\n📋 Validation Summary:');
if (allValid) {
  console.log('✅ All required environment variables are set');
  console.log('✅ Production environment appears to be properly configured');
} else {
  console.log('❌ Some required environment variables are missing or invalid');
  console.log('❌ Please fix the issues above before deploying');
}

console.log('\n💡 Recommendations:');
console.log('1. Ensure DATABASE_URL includes SSL configuration for PostgreSQL');
console.log('2. Use a strong JWT_SECRET (32+ characters)');
console.log('3. Set FRONTEND_URL for proper CORS configuration');
console.log('4. Consider setting LOG_LEVEL for better debugging');

if (!allValid) {
  process.exit(1);
} else {
  console.log('\n🎉 Environment validation passed!');
} 