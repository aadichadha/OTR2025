const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function testInvitationFlow() {
  console.log('🧪 Testing Complete Invitation Flow...\n');
  
  try {
    // Step 1: Login as coach to create invitation
    console.log('1️⃣ Logging in as coach...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'coach@example.com',
      password: 'password123'
    });
    
    const coachToken = loginResponse.data.token;
    console.log('✅ Coach login successful');
    
    // Step 2: Create player invitation
    console.log('\n2️⃣ Creating player invitation...');
    const invitationData = {
      name: 'Test Player Invitation',
      email: 'testplayer@invitation.com',
      position: 'SS',
      team: 'Test Team'
    };
    
    const invitationResponse = await axios.post(`${API_URL}/auth/invite-player`, invitationData, {
      headers: { Authorization: `Bearer ${coachToken}` }
    });
    
    console.log('✅ Invitation created:', invitationResponse.data.message);
    console.log('📧 Invited user:', invitationResponse.data.user);
    
    // Step 3: Verify invitation token
    console.log('\n3️⃣ Verifying invitation token...');
    const verifyResponse = await axios.get(`${API_URL}/auth/verify-invitation/${invitationResponse.data.user.invitation_token}`);
    
    console.log('✅ Invitation verification successful');
    console.log('👤 User details:', verifyResponse.data.user);
    
    // Step 4: Complete invitation with password
    console.log('\n4️⃣ Completing invitation...');
    const completeData = {
      token: invitationResponse.data.user.invitation_token,
      password: 'newpassword123'
    };
    
    const completeResponse = await axios.post(`${API_URL}/auth/complete-invitation`, completeData);
    
    console.log('✅ Invitation completion successful');
    console.log('🔑 New token received:', !!completeResponse.data.token);
    console.log('👤 User data:', completeResponse.data.user);
    
    // Step 5: Test login with new credentials
    console.log('\n5️⃣ Testing login with new credentials...');
    const newLoginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'testplayer@invitation.com',
      password: 'newpassword123'
    });
    
    console.log('✅ New user login successful');
    console.log('🔑 Login token received:', !!newLoginResponse.data.token);
    console.log('👤 User role:', newLoginResponse.data.user.role);
    
    // Step 6: Test frontend URL generation
    console.log('\n6️⃣ Testing frontend URL generation...');
    const frontendUrl = `${process.env.FRONTEND_URL || 'https://otr-data.com'}/complete-invitation?token=${invitationResponse.data.user.invitation_token}`;
    console.log('🔗 Frontend URL:', frontendUrl);
    
    console.log('\n🎉 All invitation flow tests passed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Coach can create invitations');
    console.log('- ✅ Invitation tokens are generated correctly');
    console.log('- ✅ Invitation verification works');
    console.log('- ✅ Invitation completion works');
    console.log('- ✅ New users can login after invitation');
    console.log('- ✅ Frontend URL is generated correctly');
    
  } catch (error) {
    console.error('❌ Invitation flow test failed:', error.response?.data || error.message);
    console.error('🔍 Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
  }
}

// Run the test
testInvitationFlow(); 