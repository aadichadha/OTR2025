const { Player, Session, User } = require('./src/models');

async function testPlayerSessions() {
  try {
    console.log('🔍 Testing player sessions for Aadi Chadha...');
    
    // Check if Aadi Chadha exists as a user
    const user = await User.findOne({ where: { name: 'Aadi Chadha' } });
    console.log('👤 User found:', user ? { id: user.id, name: user.name, email: user.email } : 'NOT FOUND');
    
    // Check if Aadi Chadha exists as a player
    const player = await Player.findOne({ where: { name: 'Aadi Chadha' } });
    console.log('🏃 Player found:', player ? { id: player.id, name: player.name } : 'NOT FOUND');
    
    if (player) {
      // Get sessions for this player
      const sessions = await Session.findAll({ 
        where: { player_id: player.id },
        order: [['session_date', 'DESC']]
      });
      
      console.log(`📊 Found ${sessions.length} sessions for Aadi Chadha:`);
      sessions.forEach(session => {
        console.log(`  - Session ${session.id}: ${session.session_date} (${session.session_type})`);
      });
      
      // Test the API endpoint
      console.log('\n🔗 Testing API endpoint...');
      console.log(`GET /api/players/${player.id}/sessions`);
    } else {
      console.log('❌ No player found with name "Aadi Chadha"');
      
      // List all players to see what's available
      const allPlayers = await Player.findAll();
      console.log('\n📋 All players in database:');
      allPlayers.forEach(p => {
        console.log(`  - ${p.id}: ${p.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testPlayerSessions(); 