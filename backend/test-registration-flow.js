const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function testRegistrationFlow() {
  console.log('🧪 Testing Registration Flow...\n');
  
  try {
    // Test 1: Register a new user
    console.log('1️⃣ Testing user registration...');
    const registerData = {
      name: 'Test Player',
      email: 'testplayer@example.com',
      password: 'password123'
    };
    
    const registerResponse = await axios.post(`${API_URL}/auth/register`, registerData);
    console.log('✅ Registration successful:', registerResponse.data.message);
    console.log('📝 User ID:', registerResponse.data.user.id);
    console.log('🔑 Token received:', !!registerResponse.data.token);
    
    const token = registerResponse.data.token;
    
    // Test 2: Login with the same credentials
    console.log('\n2️⃣ Testing login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: registerData.email,
      password: registerData.password
    });
    
    console.log('✅ Login successful:', loginResponse.data.message);
    console.log('🔑 Login token received:', !!loginResponse.data.token);
    
    // Test 3: Create player profile
    console.log('\n3️⃣ Testing player profile creation...');
    const playerData = {
      name: registerData.name,
      age: '20',
      player_level: 'college',
      college: 'Test University',
      position: '1B',
      graduation_year: '2028'
    };
    
    const playerResponse = await axios.post(`${API_URL}/players`, playerData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Player profile created:', playerResponse.data.message);
    console.log('👤 Player ID:', playerResponse.data.player.id);
    console.log('🏷️ Player Code:', playerResponse.data.player.player_code);
    
    // Test 4: Get players list
    console.log('\n4️⃣ Testing players list retrieval...');
    const playersResponse = await axios.get(`${API_URL}/players`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Players list retrieved');
    console.log('📊 Total players:', playersResponse.data.pagination.total);
    console.log('📋 Players found:', playersResponse.data.players.length);
    
    console.log('\n🎉 All tests passed! Registration flow is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📝 Error details:', error.response.data);
    }
  }
}

// Run the test
testRegistrationFlow(); 