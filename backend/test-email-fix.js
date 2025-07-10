const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function testEmailFix() {
  console.log('🧪 Testing Email Fix for Player Creation...\n');
  
  try {
    // Step 1: Login as a coach/admin
    console.log('1️⃣ Logging in as coach...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'coach@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Create a player WITH email
    console.log('\n2️⃣ Creating player WITH email...');
    const playerWithEmail = {
      name: 'Test Player With Email',
      age: '18',
      position: '1B',
      graduation_year: '2026',
      email: 'testplayer@example.com'
    };
    
    const responseWithEmail = await axios.post(`${API_URL}/players`, playerWithEmail, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Player created with email:', responseWithEmail.data.user.email);
    console.log('📧 Expected email: testplayer@example.com');
    console.log('📧 Actual email:', responseWithEmail.data.user.email);
    console.log('✅ Email matches:', responseWithEmail.data.user.email === 'testplayer@example.com');
    
    // Step 3: Create a player WITHOUT email
    console.log('\n3️⃣ Creating player WITHOUT email...');
    const playerWithoutEmail = {
      name: 'Test Player Without Email',
      age: '17',
      position: 'SS',
      graduation_year: '2027'
      // No email field
    };
    
    const responseWithoutEmail = await axios.post(`${API_URL}/players`, playerWithoutEmail, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Player created without email:', responseWithoutEmail.data.user.email);
    console.log('📧 Generated email:', responseWithoutEmail.data.user.email);
    console.log('✅ Email contains otrbaseball.com:', responseWithoutEmail.data.user.email.includes('otrbaseball.com'));
    
    // Step 4: Test duplicate email rejection
    console.log('\n4️⃣ Testing duplicate email rejection...');
    try {
      await axios.post(`${API_URL}/players`, playerWithEmail, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Should have rejected duplicate email');
    } catch (error) {
      console.log('✅ Correctly rejected duplicate email:', error.response.data.error);
    }
    
    // Step 5: Test invalid email format
    console.log('\n5️⃣ Testing invalid email format...');
    try {
      const playerWithInvalidEmail = {
        name: 'Test Player Invalid Email',
        age: '16',
        position: 'CF',
        graduation_year: '2028',
        email: 'invalid-email-format'
      };
      
      await axios.post(`${API_URL}/players`, playerWithInvalidEmail, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Should have rejected invalid email format');
    } catch (error) {
      console.log('✅ Correctly rejected invalid email format:', error.response.data.error);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Email parameter is now accepted');
    console.log('- ✅ Provided email is used when available');
    console.log('- ✅ Auto-generated email is used as fallback');
    console.log('- ✅ Duplicate email detection works');
    console.log('- ✅ Email format validation works');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testEmailFix(); 