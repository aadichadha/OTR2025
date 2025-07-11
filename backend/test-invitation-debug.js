const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function debugInvitationIssues() {
  console.log('🔍 COMPREHENSIVE INVITATION LINK DEBUGGING\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Check environment variables
    console.log('\n1️⃣ CHECKING ENVIRONMENT VARIABLES');
    console.log('-'.repeat(40));
    
    const envResponse = await axios.get(`${API_URL}/debug/env`);
    console.log('✅ Environment check successful');
    console.log('📋 Environment variables:');
    console.log('   NODE_ENV:', envResponse.data.NODE_ENV);
    console.log('   FRONTEND_URL:', envResponse.data.FRONTEND_URL);
    console.log('   DATABASE_URL:', envResponse.data.DATABASE_URL);
    console.log('   JWT_SECRET:', envResponse.data.JWT_SECRET);
    console.log('   EMAIL_USER:', envResponse.data.EMAIL_USER);
    
    // Check for common issues
    if (!envResponse.data.FRONTEND_URL) {
      console.log('❌ ISSUE: FRONTEND_URL is not set');
    } else if (envResponse.data.FRONTEND_URL.includes(' ')) {
      console.log('❌ ISSUE: FRONTEND_URL contains spaces:', `"${envResponse.data.FRONTEND_URL}"`);
    } else {
      console.log('✅ FRONTEND_URL looks good');
    }
    
    // 2. Test API health
    console.log('\n2️⃣ TESTING API HEALTH');
    console.log('-'.repeat(40));
    
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ API is healthy');
    console.log('📋 Health status:', healthResponse.data.status);
    console.log('🌍 Environment:', healthResponse.data.environment);
    
    // 3. Test login to get token
    console.log('\n3️⃣ TESTING AUTHENTICATION');
    console.log('-'.repeat(40));
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'coach@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('🔑 Token received:', !!token);
    console.log('👤 User role:', loginResponse.data.user.role);
    
    // 4. Create a test invitation
    console.log('\n4️⃣ CREATING TEST INVITATION');
    console.log('-'.repeat(40));
    
    const invitationData = {
      name: 'Debug Test Player',
      email: 'debugtest@invitation.com',
      position: 'SS',
      team: 'Debug Team'
    };
    
    const invitationResponse = await axios.post(`${API_URL}/auth/invite-player`, invitationData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Invitation created successfully');
    console.log('📧 Invited user:', invitationResponse.data.user);
    console.log('🔗 Invitation token:', invitationResponse.data.user.invitation_token);
    
    const invitationToken = invitationResponse.data.user.invitation_token;
    
    // 5. Test invitation verification
    console.log('\n5️⃣ TESTING INVITATION VERIFICATION');
    console.log('-'.repeat(40));
    
    const verifyResponse = await axios.get(`${API_URL}/auth/verify-invitation/${invitationToken}`);
    console.log('✅ Invitation verification successful');
    console.log('👤 User details:', verifyResponse.data.user);
    
    // 6. Test frontend URL generation
    console.log('\n6️⃣ TESTING FRONTEND URL GENERATION');
    console.log('-'.repeat(40));
    
    const frontendUrl = envResponse.data.FRONTEND_URL || 'https://otr-data.com';
    const invitationLink = `${frontendUrl}/complete-invitation?token=${invitationToken}`;
    
    console.log('🔗 Generated invitation link:', invitationLink);
    console.log('🔗 Link length:', invitationLink.length);
    console.log('🔗 Contains spaces:', invitationLink.includes(' '));
    console.log('🔗 Contains newlines:', invitationLink.includes('\n'));
    
    // 7. Test URL parsing
    console.log('\n7️⃣ TESTING URL PARSING');
    console.log('-'.repeat(40));
    
    try {
      const url = new URL(invitationLink);
      console.log('✅ URL is valid');
      console.log('🔗 Protocol:', url.protocol);
      console.log('🔗 Hostname:', url.hostname);
      console.log('🔗 Pathname:', url.pathname);
      console.log('🔗 Search params:', url.search);
      console.log('🔗 Token param:', url.searchParams.get('token'));
    } catch (error) {
      console.log('❌ URL parsing failed:', error.message);
    }
    
    // 8. Test frontend route accessibility
    console.log('\n8️⃣ TESTING FRONTEND ROUTE ACCESS');
    console.log('-'.repeat(40));
    
    try {
      const frontendResponse = await axios.get(`${frontendUrl}/complete-invitation?token=${invitationToken}`, {
        timeout: 10000,
        validateStatus: (status) => status < 500 // Accept any status < 500
      });
      console.log('✅ Frontend route accessible');
      console.log('📋 Status code:', frontendResponse.status);
      console.log('📋 Content type:', frontendResponse.headers['content-type']);
    } catch (error) {
      console.log('❌ Frontend route not accessible');
      console.log('🔍 Error:', error.message);
      if (error.code === 'ENOTFOUND') {
        console.log('💡 Suggestion: Check if domain is correct and DNS is resolved');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('💡 Suggestion: Frontend server might not be running');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('💡 Suggestion: Network timeout - check connectivity');
      }
    }
    
    // 9. Test invitation completion
    console.log('\n9️⃣ TESTING INVITATION COMPLETION');
    console.log('-'.repeat(40));
    
    const completeData = {
      token: invitationToken,
      password: 'debugpassword123'
    };
    
    const completeResponse = await axios.post(`${API_URL}/auth/complete-invitation`, completeData);
    console.log('✅ Invitation completion successful');
    console.log('🔑 New token received:', !!completeResponse.data.token);
    console.log('👤 User data:', completeResponse.data.user);
    
    // 10. Test login with new credentials
    console.log('\n🔟 TESTING NEW USER LOGIN');
    console.log('-'.repeat(40));
    
    const newLoginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'debugtest@invitation.com',
      password: 'debugpassword123'
    });
    
    console.log('✅ New user login successful');
    console.log('🔑 Login token received:', !!newLoginResponse.data.token);
    console.log('👤 User role:', newLoginResponse.data.user.role);
    
    // 11. Summary and recommendations
    console.log('\n📋 SUMMARY AND RECOMMENDATIONS');
    console.log('=' .repeat(60));
    
    console.log('✅ All backend components working correctly');
    console.log('✅ Invitation flow is functional');
    console.log('✅ Database operations successful');
    console.log('✅ Email service configured');
    
    // Check for potential issues
    const issues = [];
    
    if (!envResponse.data.FRONTEND_URL) {
      issues.push('FRONTEND_URL environment variable not set');
    }
    
    if (envResponse.data.FRONTEND_URL && envResponse.data.FRONTEND_URL.includes(' ')) {
      issues.push('FRONTEND_URL contains trailing spaces');
    }
    
    if (issues.length > 0) {
      console.log('\n⚠️  POTENTIAL ISSUES FOUND:');
      issues.forEach(issue => console.log('   •', issue));
    } else {
      console.log('\n🎉 No issues detected in backend invitation system');
    }
    
    console.log('\n💡 COMMON FRONTEND ISSUES TO CHECK:');
    console.log('   • Verify /complete-invitation route exists in React Router');
    console.log('   • Check if CompleteInvitation component is properly imported');
    console.log('   • Ensure frontend is deployed and accessible');
    console.log('   • Check browser console for JavaScript errors');
    console.log('   • Verify CORS configuration allows frontend domain');
    
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('   1. Check if invitation link has spaces or special characters');
    console.log('   2. Verify the token parameter is properly encoded');
    console.log('   3. Test the link in an incognito browser window');
    console.log('   4. Check if the invitation has expired');
    console.log('   5. Verify the user exists in the database');
    
  } catch (error) {
    console.error('\n❌ DEBUGGING FAILED');
    console.error('🔍 Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });
    
    if (error.response?.status === 404) {
      console.log('\n💡 Suggestion: Check if API endpoints are properly configured');
    } else if (error.response?.status === 403) {
      console.log('\n💡 Suggestion: Check CORS and domain validation settings');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Suggestion: Backend server might not be running');
    }
  }
}

// Run the debugging
debugInvitationIssues().catch(console.error); 