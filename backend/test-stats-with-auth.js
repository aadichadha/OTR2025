const axios = require('axios');

async function testStatsWithAuth() {
  try {
    console.log('🔍 Testing player stats with proper authentication...');
    
    // First, login to get a token using demo user
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'coach@otr.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    console.log('🔑 Token received:', token ? 'YES' : 'NO');
    
    // Now test the player stats endpoint with the token
    const statsResponse = await axios.get('http://localhost:3001/api/analytics/player-stats?timeRange=all', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Player stats response:');
    console.log('Status:', statsResponse.status);
    console.log('Success:', statsResponse.data.success);
    console.log('Total players:', statsResponse.data.total);
    console.log('Players data:', JSON.stringify(statsResponse.data.players, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testStatsWithAuth(); 