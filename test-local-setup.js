#!/usr/bin/env node

/**
 * Local Development Environment Test Script
 * Tests both backend and frontend are working correctly
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';

async function testBackend() {
  console.log('🔍 Testing Backend...');
  
  try {
    // Test health endpoint
    const healthResponse = await axios.get(`${BACKEND_URL}/api/health`);
    console.log('✅ Backend Health:', healthResponse.data.status);
    
    // Test CORS configuration
    const corsResponse = await axios.get(`${BACKEND_URL}/api/health`, {
      headers: { 'Origin': 'http://localhost:5173' }
    });
    console.log('✅ CORS working for localhost:5173');
    
    // Test environment variables
    const envResponse = await axios.get(`${BACKEND_URL}/api/debug/env`);
    console.log('✅ Environment Debug:', envResponse.data);
    
    return true;
  } catch (error) {
    console.error('❌ Backend Test Failed:', error.message);
    return false;
  }
}

async function testFrontend() {
  console.log('\n🔍 Testing Frontend...');
  
  try {
    const response = await axios.get(FRONTEND_URL);
    console.log('✅ Frontend responding (status:', response.status, ')');
    return true;
  } catch (error) {
    console.error('❌ Frontend Test Failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 OTR Baseball Analytics - Local Development Test');
  console.log('=' .repeat(50));
  
  const backendOk = await testBackend();
  const frontendOk = await testFrontend();
  
  console.log('\n📊 Test Results:');
  console.log('Backend:', backendOk ? '✅ PASS' : '❌ FAIL');
  console.log('Frontend:', frontendOk ? '✅ PASS' : '❌ FAIL');
  
  if (backendOk && frontendOk) {
    console.log('\n🎉 Local development environment is ready!');
    console.log('🌐 Frontend: http://localhost:5173');
    console.log('🔧 Backend: http://localhost:3001');
    console.log('\n💡 You can now test changes locally without affecting production.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above.');
  }
}

runTests().catch(console.error); 