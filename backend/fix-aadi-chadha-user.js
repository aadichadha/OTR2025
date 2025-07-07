const { Player, Session, User } = require('./src/models');

async function fixAadiChadhaUser() {
  try {
    console.log('🔧 Fixing Aadi Chadha user-player link...');
    
    // Check if Aadi Chadha exists as a user
    const user = await User.findOne({ where: { name: 'Aadi Chadha' } });
    console.log('👤 User found:', user ? { id: user.id, name: user.name, email: user.email } : 'NOT FOUND');
    
    // Check if Aadi Chadha exists as a player
    const player = await Player.findOne({ where: { name: 'Aadi Chadha' } });
    console.log('🏃 Player found:', player ? { id: player.id, name: player.name } : 'NOT FOUND');
    
    if (!user && player) {
      console.log('❌ User not found but player exists. Creating user record...');
      
      // Create a user record for Aadi Chadha
      const newUser = await User.create({
        name: 'Aadi Chadha',
        email: 'aadi@otr.com', // You can change this email
        password: 'password123', // This will be hashed automatically
        role: 'player'
      });
      
      console.log('✅ Created user:', { id: newUser.id, name: newUser.name, email: newUser.email });
    } else if (user && player) {
      console.log('✅ Both user and player exist. Link is correct.');
    } else if (user && !player) {
      console.log('❌ User exists but player doesn\'t. Creating player record...');
      
      // Create a player record for Aadi Chadha
      const newPlayer = await Player.create({
        name: 'Aadi Chadha',
        age: 16, // You can adjust this
        position: 'SS',
        player_code: Math.floor(1000 + Math.random() * 9000).toString()
      });
      
      console.log('✅ Created player:', { id: newPlayer.id, name: newPlayer.name });
    } else {
      console.log('❌ Neither user nor player exists. Creating both...');
      
      // Create both user and player
      const newUser = await User.create({
        name: 'Aadi Chadha',
        email: 'aadi@otr.com',
        password: 'password123',
        role: 'player'
      });
      
      const newPlayer = await Player.create({
        name: 'Aadi Chadha',
        age: 16,
        position: 'SS',
        player_code: Math.floor(1000 + Math.random() * 9000).toString()
      });
      
      console.log('✅ Created both user and player:', { 
        user: { id: newUser.id, name: newUser.name },
        player: { id: newPlayer.id, name: newPlayer.name }
      });
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const finalUser = await User.findOne({ where: { name: 'Aadi Chadha' } });
    const finalPlayer = await Player.findOne({ where: { name: 'Aadi Chadha' } });
    
    console.log('👤 Final user:', finalUser ? { id: finalUser.id, name: finalUser.name, email: finalUser.email } : 'NOT FOUND');
    console.log('🏃 Final player:', finalPlayer ? { id: finalPlayer.id, name: finalPlayer.name } : 'NOT FOUND');
    
    if (finalPlayer) {
      const sessions = await Session.findAll({ where: { player_id: finalPlayer.id } });
      console.log(`📊 Sessions for player: ${sessions.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixAadiChadhaUser(); 