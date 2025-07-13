const axios = require('axios');

async function testPlayerStats() {
  try {
    // First, login to get a token
    console.log('🔧 Testing login...');
    const loginResponse = await axios.post('http://localhost:3001/api/test-login', {
      email: 'coach@example.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful, got token');

    // Now test the player stats endpoint
    console.log('🔧 Testing player stats endpoint...');
    const statsResponse = await axios.get('http://localhost:3001/api/analytics/player-stats?timeRange=all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Player stats response:');
    console.log(JSON.stringify(statsResponse.data, null, 2));

    // Check if we have data
    if (statsResponse.data.success && statsResponse.data.players) {
      console.log(`📊 Found ${statsResponse.data.players.length} players with stats`);
      
      if (statsResponse.data.players.length > 0) {
        const samplePlayer = statsResponse.data.players[0];
        console.log('📋 Sample player data:');
        console.log(JSON.stringify(samplePlayer, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error testing player stats:', error.response?.data || error.message);
  }
}

testPlayerStats(); 