const { User } = require('./src/models');

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');
    
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'password']
    });
    
    console.log(`📊 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUsers(); 