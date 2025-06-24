const { initDatabase } = require('./config/init-db');
const { User, Player } = require('./models');

const testDatabase = async () => {
  try {
    console.log('🚀 Testing database connection and operations...\n');
    
    // Initialize database
    await initDatabase();
    
    // Test basic operations
    console.log('\n📝 Testing basic database operations...');
    
    // Test User creation
    const testUser = await User.create({
      email: 'test@example.com',
      password: 'testpassword123',
      role: 'user'
    });
    console.log('✅ User created successfully:', testUser.email);
    
    // Test Player creation
    const testPlayer = await Player.create({
      name: 'Test Player',
      age: 16,
      travel_team: 'Test Team',
      high_school: 'Test High School'
    });
    console.log('✅ Player created successfully:', testPlayer.name);
    
    // Test User retrieval
    const foundUser = await User.findOne({ where: { email: 'test@example.com' } });
    console.log('✅ User retrieved successfully:', foundUser.email);
    
    // Test password comparison
    const isValidPassword = await foundUser.comparePassword('testpassword123');
    console.log('✅ Password comparison works:', isValidPassword);
    
    // Test Player retrieval
    const foundPlayer = await Player.findOne({ where: { name: 'Test Player' } });
    console.log('✅ Player retrieved successfully:', foundPlayer.name);
    
    // Clean up test data
    await testUser.destroy();
    await testPlayer.destroy();
    console.log('✅ Test data cleaned up successfully');
    
    console.log('\n🎉 All database tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testDatabase();
}

module.exports = { testDatabase }; 