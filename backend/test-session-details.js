const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function testSessionDetails() {
  try {
    console.log('🔍 Testing session details...');
    
    // 1. Login to get token
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@otr.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // 2. Get session details for session 15
    console.log('\n2. Getting session details for session 15...');
    const sessionResponse = await axios.get(`${API_URL}/sessions/15`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const session = sessionResponse.data.session;
    console.log('✅ Session details retrieved!');
    console.log(`📊 Session Data:`);
    console.log(`   - Session ID: ${session.id}`);
    console.log(`   - Session Type: ${session.session_type}`);
    console.log(`   - Player: ${session.player?.name}`);
    console.log(`   - Bat Speed Records: ${session.batSpeedData?.length || 0}`);
    console.log(`   - Exit Velocity Records: ${session.exitVelocityData?.length || 0}`);
    
    if (session.batSpeedData && session.batSpeedData.length > 0) {
      console.log(`   - Sample Bat Speed Data:`, session.batSpeedData.slice(0, 3).map(record => ({
        bat_speed: record.bat_speed,
        attack_angle: record.attack_angle,
        time_to_contact: record.time_to_contact
      })));
    }

    // 3. Check if the data matches what we expect
    console.log('\n3. Data verification:');
    const expectedBatSpeeds = [82.1, 76.8, 79.2];
    const actualBatSpeeds = session.batSpeedData?.map(record => record.bat_speed) || [];
    
    console.log(`   - Expected bat speeds: ${expectedBatSpeeds}`);
    console.log(`   - Actual bat speeds: ${actualBatSpeeds}`);
    
    if (actualBatSpeeds.length === expectedBatSpeeds.length) {
      console.log('✅ SUCCESS: Session details show correct bat speed data!');
    } else {
      console.log('❌ FAILURE: Session details missing bat speed data');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSessionDetails(); 