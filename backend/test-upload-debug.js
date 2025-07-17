const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001/api';

async function testUploadDebug() {
  try {
    console.log('🔍 Testing upload debug...');
    
    // 1. Login to get token
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@otr.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // 2. Get players
    console.log('\n2. Getting players...');
    const playersResponse = await axios.get(`${API_URL}/players`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const players = playersResponse.data.players;
    if (players.length === 0) {
      console.log('❌ No players found');
      return;
    }
    
    const playerId = players[0].id;
    console.log(`✅ Using player: ${players[0].name} (ID: ${playerId})`);

    // 3. Create a test blast file with unique data
    console.log('\n3. Creating test blast file...');
    const testData = [
      'Device Header Line 1',
      'Device Header Line 2', 
      'Device Header Line 3',
      'Device Header Line 4',
      'Device Header Line 5',
      'Device Header Line 6',
      'Device Header Line 7',
      'Device Header Line 8',
      'Swing,1,2,3,4,5,6,75.5,8,9,15.2,11,12,13,14,0.12,16,17',  // Unique bat speed: 75.5
      'Swing,1,2,3,4,5,6,78.3,8,9,16.8,11,12,13,14,0.11,16,17',  // Unique bat speed: 78.3
      'Swing,1,2,3,4,5,6,82.1,8,9,17.5,11,12,13,14,0.10,16,17',  // Unique bat speed: 82.1
      'Swing,1,2,3,4,5,6,76.8,8,9,14.9,11,12,13,14,0.13,16,17',  // Unique bat speed: 76.8
      'Swing,1,2,3,4,5,6,79.2,8,9,16.2,11,12,13,14,0.12,16,17'   // Unique bat speed: 79.2
    ];
    
    const testFilePath = path.join(__dirname, 'test_blast_debug.csv');
    fs.writeFileSync(testFilePath, testData.join('\n'));
    console.log(`✅ Created test file: ${testFilePath}`);

    // 4. Upload the test file
    console.log('\n4. Uploading test file...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('playerId', playerId);

    const uploadResponse = await axios.post(`${API_URL}/upload/blast`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    const uploadResult = uploadResponse.data;
    console.log('✅ Upload successful!');
    console.log(`📊 Upload Result:`);
    console.log(`   - Session ID: ${uploadResult.sessionId}`);
    console.log(`   - Parse Result: ${uploadResult.parseResult.parsedRows} records`);
    console.log(`   - Report Data:`, JSON.stringify(uploadResult.report, null, 2));

    // 5. Verify the data in the database
    console.log('\n5. Verifying database data...');
    const sessionResponse = await axios.get(`${API_URL}/sessions/${uploadResult.sessionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const session = sessionResponse.data;
    console.log(`📈 Session Data:`);
    console.log(`   - Session Type: ${session.session_type}`);
    console.log(`   - Bat Speed Records: ${session.batSpeedData?.length || 0}`);
    
    if (session.batSpeedData && session.batSpeedData.length > 0) {
      console.log(`   - Sample Bat Speed Data:`, session.batSpeedData.slice(0, 3).map(record => ({
        bat_speed: record.bat_speed,
        attack_angle: record.attack_angle,
        time_to_contact: record.time_to_contact
      })));
    }

    // 6. Clean up
    console.log('\n6. Cleaning up...');
    fs.unlinkSync(testFilePath);
    console.log('✅ Test file cleaned up');

    // 7. Summary
    console.log('\n📋 SUMMARY:');
    console.log(`   - Expected unique bat speeds: [75.5, 78.3, 82.1, 76.8, 79.2]`);
    console.log(`   - Max expected: 82.1`);
    console.log(`   - Actual max in report: ${uploadResult.report?.metrics?.batSpeed?.maxBatSpeed}`);
    console.log(`   - Actual avg in report: ${uploadResult.report?.metrics?.batSpeed?.avgBatSpeed}`);
    
    if (uploadResult.report?.metrics?.batSpeed?.maxBatSpeed === 82.1) {
      console.log('✅ SUCCESS: Report shows correct data from uploaded file!');
    } else {
      console.log('❌ FAILURE: Report shows incorrect data - might be using cached/sample data');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testUploadDebug(); 