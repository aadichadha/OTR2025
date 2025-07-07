const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function debugToken() {
  console.log('🔍 Debugging JWT Token...\n');
  
  try {
    // Register a new user
    console.log('1️⃣ Registering user...');
    const registerData = {
      name: 'Debug Player',
      email: 'debugplayer@example.com',
      password: 'password123'
    };
    
    const registerResponse = await axios.post(`${API_URL}/auth/register`, registerData);
    const registerToken = registerResponse.data.token;
    
    console.log('📝 Registration token:', registerToken.substring(0, 50) + '...');
    
    // Decode registration token
    try {
      const registerPayload = jwt.decode(registerToken);
      console.log('🔍 Registration token payload:', registerPayload);
    } catch (e) {
      console.log('❌ Could not decode registration token:', e.message);
    }
    
    // Login with the same credentials
    console.log('\n2️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: registerData.email,
      password: registerData.password
    });
    
    const loginToken = loginResponse.data.token;
    console.log('📝 Login token:', loginToken.substring(0, 50) + '...');
    
    // Decode login token
    try {
      const loginPayload = jwt.decode(loginToken);
      console.log('🔍 Login token payload:', loginPayload);
    } catch (e) {
      console.log('❌ Could not decode login token:', e.message);
    }
    
    // Compare tokens
    console.log('\n3️⃣ Comparing tokens...');
    console.log('🔍 Tokens are identical:', registerToken === loginToken);
    
    // Test both tokens with player creation
    console.log('\n4️⃣ Testing registration token with player creation...');
    try {
      const playerData = {
        name: registerData.name,
        age: '20',
        player_level: 'college',
        college: 'Debug University',
        position: '1B',
        graduation_year: '2028'
      };
      
      const playerResponse = await axios.post(`${API_URL}/players`, playerData, {
        headers: { Authorization: `Bearer ${registerToken}` }
      });
      
      console.log('✅ Registration token works for player creation');
    } catch (error) {
      console.log('❌ Registration token failed for player creation:', error.response?.data?.error);
    }
    
    console.log('\n5️⃣ Testing login token with player creation...');
    try {
      const playerData = {
        name: registerData.name,
        age: '20',
        player_level: 'college',
        college: 'Debug University',
        position: '1B',
        graduation_year: '2028'
      };
      
      const playerResponse = await axios.post(`${API_URL}/players`, playerData, {
        headers: { Authorization: `Bearer ${loginToken}` }
      });
      
      console.log('✅ Login token works for player creation');
    } catch (error) {
      console.log('❌ Login token failed for player creation:', error.response?.data?.error);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugToken(); 