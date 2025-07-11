const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function createTestUser() {
  try {
    console.log('🔧 Creating test user...');
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: 'coach@example.com' } });
    if (existingUser) {
      console.log('✅ Test user already exists');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create user
    const user = await User.create({
      name: 'Test Coach',
      email: 'coach@example.com',
      password: hashedPassword,
      role: 'coach',
      permissions: User.getRolePermissions('coach')
    });
    
    console.log('✅ Test user created successfully');
    console.log('📧 Email:', user.email);
    console.log('🔑 Password: password123');
    console.log('👤 Role:', user.role);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
}

createTestUser().then(() => {
  console.log('🏁 Test user setup complete');
  process.exit(0);
}).catch(console.error); 