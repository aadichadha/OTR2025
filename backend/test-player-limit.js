const axios = require('axios');

async function testPlayerLimit() {
  try {
    console.log('🔍 Testing player limit fix...');
    
    // First, login to get a token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'coach@otr.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    
    // Test the players endpoint
    const playersResponse = await axios.get('http://localhost:3001/api/players', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Players response:');
    console.log('Status:', playersResponse.status);
    console.log('Total players:', playersResponse.data.pagination?.total || 'N/A');
    console.log('Players returned:', playersResponse.data.players?.length || 0);
    console.log('Limit used:', playersResponse.data.pagination?.limit || 'N/A');
    console.log('Players:', playersResponse.data.players?.map(p => p.name) || []);
    
    // Test with explicit limit
    const playersResponseWithLimit = await axios.get('http://localhost:3001/api/players?limit=50', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\n📊 Players response with limit=50:');
    console.log('Players returned:', playersResponseWithLimit.data.players?.length || 0);
    console.log('Limit used:', playersResponseWithLimit.data.pagination?.limit || 'N/A');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPlayerLimit(); 