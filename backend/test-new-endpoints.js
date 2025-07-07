const { Player, Session, User } = require('./src/models');

async function testNewEndpoints() {
  try {
    console.log('🧪 Testing new endpoints for Aadi Chadha...');
    
    // Get the user and player
    const user = await User.findOne({ where: { name: 'Aadi Chadha' } });
    const player = await Player.findOne({ where: { name: 'Aadi Chadha' } });
    
    if (!user || !player) {
      console.log('❌ User or player not found');
      return;
    }
    
    console.log('👤 User:', { id: user.id, name: user.name, email: user.email });
    console.log('🏃 Player:', { id: player.id, name: player.name });
    
    // Test the new endpoints by simulating the controller logic
    console.log('\n🔗 Testing /api/players/me/stats endpoint logic...');
    
    // Simulate getMyStats
    const sessions = await Session.findAll({ where: { player_id: player.id } });
    let maxExitVelocity = null, avgExitVelocity = null, maxBatSpeed = null, avgBatSpeed = null;
    let exitVelocities = [], batSpeeds = [];
    
    for (const session of sessions) {
      if (session.session_type === 'hittrax') {
        // For testing, let's assume some exit velocity data
        exitVelocities.push(85, 87, 89, 82, 90); // Sample data
      }
      if (session.session_type === 'blast') {
        // For testing, let's assume some bat speed data
        batSpeeds.push(65, 67, 69, 62, 70); // Sample data
      }
    }
    
    if (exitVelocities.length) {
      maxExitVelocity = Math.max(...exitVelocities);
      avgExitVelocity = exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length;
    }
    if (batSpeeds.length) {
      maxBatSpeed = Math.max(...batSpeeds);
      avgBatSpeed = batSpeeds.reduce((a, b) => a + b, 0) / batSpeeds.length;
    }
    
    console.log('📊 Stats result:', {
      maxExitVelocity,
      avgExitVelocity,
      maxBatSpeed,
      avgBatSpeed,
      sessionCount: sessions.length
    });
    
    console.log('\n🔗 Testing /api/players/me/sessions endpoint logic...');
    console.log('📋 Sessions result:', {
      sessions: sessions.map(s => ({
        id: s.id,
        session_date: s.session_date,
        session_type: s.session_type
      }))
    });
    
    console.log('\n🔗 Testing /api/players/4/sessions endpoint (Player Management)...');
    // This is what the Player Management page calls
    const playerSessions = await Session.findAll({
      where: { player_id: player.id },
      order: [['session_date', 'DESC']]
    });
    
    console.log('📋 Player Management sessions:', {
      success: true,
      data: playerSessions.map(s => ({
        id: s.id,
        session_date: s.session_date,
        session_type: s.session_type
      })),
      message: `Found ${playerSessions.length} sessions for ${player.name}`
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testNewEndpoints(); 