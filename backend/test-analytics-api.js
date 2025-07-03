const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testAnalyticsAPI() {
  try {
    console.log('🧪 Testing Analytics API...\n');

    // Step 1: Create a test user and get token
    console.log('1. Creating test user...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      email: 'analytics_test@example.com',
      password: 'testpass123',
      name: 'Analytics Test User'
    });
    console.log('✅ User created successfully');

    // Step 2: Login to get token
    console.log('\n2. Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'analytics_test@example.com',
      password: 'testpass123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 3: Create a test player
    console.log('\n3. Creating test player...');
    const playerResponse = await axios.post(`${API_BASE}/players`, {
      name: 'Analytics Test Player',
      position: 'SS',
      graduation_year: '2025',
      player_code: 'ATP001'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const playerId = playerResponse.data.player.id;
    console.log('✅ Player created successfully');

    // Step 4: Test getting player sessions
    console.log('\n4. Testing getPlayerSessions...');
    const sessionsResponse = await axios.get(`${API_BASE}/players/${playerId}/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Player sessions retrieved:', sessionsResponse.data.data.length, 'sessions');

    // Step 5: Test getting player analytics
    console.log('\n5. Testing getPlayerAnalytics...');
    const analyticsResponse = await axios.get(`${API_BASE}/players/${playerId}/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Player analytics retrieved:', analyticsResponse.data.data);

    // Step 6: Test getting player swings
    console.log('\n6. Testing getPlayerSwings...');
    const swingsResponse = await axios.get(`${API_BASE}/players/${playerId}/swings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Player swings retrieved:', swingsResponse.data.data.length, 'swings');

    console.log('\n🎉 All analytics API tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAnalyticsAPI(); 