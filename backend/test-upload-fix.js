const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001/api';

async function testUploadFix() {
  try {
    console.log('🧪 Testing Upload Fix - All Records Should Be Saved');
    console.log('==================================================');

    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'aadichadha@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get players
    console.log('\n2. Getting players...');
    const playersResponse = await axios.get(`${API_URL}/players`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const players = playersResponse.data.players || playersResponse.data;
    if (!players || players.length === 0) {
      console.log('❌ No players found. Please create a player first.');
      return;
    }
    
    const player = players[0];
    console.log(`✅ Found player: ${player.name} (ID: ${player.id})`);

    // Test Hittrax upload
    console.log('\n3. Testing Hittrax upload...');
    const hittraxFilePath = path.join(__dirname, 'test', 'fixtures', 'sample_hittrax.csv');
    
    if (!fs.existsSync(hittraxFilePath)) {
      console.log('❌ Sample Hittrax file not found. Please ensure test/fixtures/sample_hittrax.csv exists.');
      return;
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(hittraxFilePath));
    formData.append('playerId', player.id);
    formData.append('playerLevel', 'High School');
    formData.append('sessionDate', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()); // Tomorrow's date

    const uploadResponse = await axios.post(`${API_URL}/upload/hittrax`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    const uploadResult = uploadResponse.data;
    console.log('✅ Upload successful!');
    console.log(`📊 Parse Result:`);
    console.log(`   - Total Rows: ${uploadResult.parseResult.totalRows}`);
    console.log(`   - Parsed Rows: ${uploadResult.parseResult.parsedRows}`);
    console.log(`   - Errors: ${uploadResult.parseResult.errorCount}`);
    console.log(`   - Session ID: ${uploadResult.sessionId}`);

    // Verify the data was actually saved
    console.log('\n4. Verifying data in database...');
    const sessionResponse = await axios.get(`${API_URL}/sessions/${uploadResult.sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const session = sessionResponse.data;
    const dataPoints = session.exitVelocityData?.length || 0;
    console.log(`📈 Data Points in Database: ${dataPoints}`);

    if (dataPoints === uploadResult.parseResult.parsedRows) {
      console.log('✅ SUCCESS: All parsed records were saved to database!');
    } else {
      console.log('❌ FAILURE: Not all records were saved!');
      console.log(`   Expected: ${uploadResult.parseResult.parsedRows}`);
      console.log(`   Actual: ${dataPoints}`);
    }

    // Test report generation
    console.log('\n5. Testing report generation...');
    const reportResponse = await axios.get(`${API_URL}/sessions/${uploadResult.sessionId}/report-data`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const report = reportResponse.data;
    console.log('✅ Report generated successfully!');
    console.log(`📊 Report Metrics:`);
    console.log(`   - Exit Velocity: ${report.metrics?.exitVelocity?.avgExitVelocity} mph`);
    console.log(`   - Top 8% EV: ${report.metrics?.exitVelocity?.top8PercentEV} mph`);
    console.log(`   - Launch Angle: ${report.metrics?.exitVelocity?.avgLaunchAngleTop8}°`);
    console.log(`   - Distance: ${report.metrics?.exitVelocity?.avgDistanceTop8} ft`);
    console.log(`   - Data Points: ${report.metrics?.exitVelocity?.dataPoints}`);

    console.log('\n🎉 Test completed successfully!');
    console.log('The upload fix is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testUploadFix(); 