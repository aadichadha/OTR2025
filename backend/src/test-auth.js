const axios = require('axios');
const { initDatabase } = require('./config/init-db');

const BASE_URL = 'http://localhost:3001/api';

async function testAuthentication() {
  try {
    console.log('🚀 Testing Authentication System...\n');
    
    // Initialize database
    await initDatabase();
    
    // Test 1: Register a new user
    console.log('📝 Test 1: User Registration...');
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
      console.log('✅ Registration successful:');
      console.log('   - User ID:', registerResponse.data.user.id);
      console.log('   - Email:', registerResponse.data.user.email);
      console.log('   - Token received:', !!registerResponse.data.token);
      
      const token = registerResponse.data.token;
      
      // Test 2: Login with the same user
      console.log('\n📝 Test 2: User Login...');
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
      console.log('✅ Login successful:');
      console.log('   - User ID:', loginResponse.data.user.id);
      console.log('   - Token received:', !!loginResponse.data.token);
      
      // Test 3: Access protected profile route
      console.log('\n📝 Test 3: Access Protected Profile Route...');
      const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Profile access successful:');
      console.log('   - User name:', profileResponse.data.user.name);
      console.log('   - User email:', profileResponse.data.user.email);
      
      // Test 4: Try to access protected route without token
      console.log('\n📝 Test 4: Access Protected Route Without Token...');
      try {
        await axios.get(`${BASE_URL}/auth/profile`);
        console.log('❌ Should have failed - no token provided');
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('✅ Correctly blocked access without token');
        } else {
          console.log('❌ Unexpected error:', error.response?.data);
        }
      }
      
      // Test 5: Try to access protected route with invalid token
      console.log('\n📝 Test 5: Access Protected Route With Invalid Token...');
      try {
        await axios.get(`${BASE_URL}/auth/profile`, {
          headers: { Authorization: 'Bearer invalid-token' }
        });
        console.log('❌ Should have failed - invalid token');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ Correctly blocked access with invalid token');
        } else {
          console.log('❌ Unexpected error:', error.response?.data);
        }
      }
      
      // Test 6: Try to register with existing email
      console.log('\n📝 Test 6: Register With Existing Email...');
      try {
        await axios.post(`${BASE_URL}/auth/register`, registerData);
        console.log('❌ Should have failed - email already exists');
      } catch (error) {
        if (error.response?.status === 400) {
          console.log('✅ Correctly prevented duplicate registration');
        } else {
          console.log('❌ Unexpected error:', error.response?.data);
        }
      }
      
      // Test 7: Try to login with wrong password
      console.log('\n📝 Test 7: Login With Wrong Password...');
      try {
        await axios.post(`${BASE_URL}/auth/login`, {
          email: 'test@example.com',
          password: 'wrongpassword'
        });
        console.log('❌ Should have failed - wrong password');
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('✅ Correctly rejected wrong password');
        } else {
          console.log('❌ Unexpected error:', error.response?.data);
        }
      }
      
      console.log('\n🎉 All authentication tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Test failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Authentication test setup failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAuthentication();
}

module.exports = { testAuthentication }; 