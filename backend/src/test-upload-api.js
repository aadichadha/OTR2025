const fs = require('fs');
const path = require('path');
const { initDatabase } = require('./config/init-db');
const { Player } = require('./models');

const testUploadAPI = async () => {
  try {
    console.log('🚀 Testing Upload API Endpoints...\n');
    
    // Initialize database
    await initDatabase();
    
    // Create a test player
    const testPlayer = await Player.create({
      name: 'API Test Player',
      age: 16,
      travel_team: 'Test Team',
      high_school: 'Test High School'
    });
    
    console.log('✅ Test player created with ID:', testPlayer.id);
    
    // Create sample CSV files
    const sampleBlastData = [
      'Row,Data,Type,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '1,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '2,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '3,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '4,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '5,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '6,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '7,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '8,Data,Real,Info,Col5,Col6,Col7,65.2,Col9,Col10,12.5,Col12,Col13,Col14,Col15,0.165',
      '9,Data,Real,Info,Col5,Col6,Col7,67.8,Col9,Col10,11.2,Col12,Col13,Col14,Col15,0.158',
      '10,Data,Real,Info,Col5,Col6,Col7,64.1,Col9,Col10,13.8,Col12,Col13,Col14,Col15,0.172'
    ];
    
    const sampleHittraxData = [
      'Row,Data,Type,Info,Col5,StrikeZone,Col7,ExitVelocity,LaunchAngle,Distance,Col11',
      '1,Data,Real,Info,Col5,5,Col7,78.5,12.3,245.6,Col11',
      '2,Data,Real,Info,Col5,3,Col7,82.1,15.7,268.9,Col11',
      '3,Data,Real,Info,Col5,7,Col7,75.9,11.8,231.2,Col11',
      '4,Data,Real,Info,Col5,2,Col7,85.3,16.2,289.4,Col11',
      '5,Data,Real,Info,Col5,6,Col7,79.8,13.1,252.7,Col11'
    ];
    
    const blastCSVPath = path.join(__dirname, '../uploads/test_blast.csv');
    const hittraxCSVPath = path.join(__dirname, '../uploads/test_hittrax.csv');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(path.dirname(blastCSVPath))) {
      fs.mkdirSync(path.dirname(blastCSVPath), { recursive: true });
    }
    
    fs.writeFileSync(blastCSVPath, sampleBlastData.join('\n'));
    fs.writeFileSync(hittraxCSVPath, sampleHittraxData.join('\n'));
    
    console.log('✅ Sample CSV files created');
    
    // Test 1: Test Blast upload endpoint
    console.log('\n📝 Test 1: Testing Blast upload endpoint...');
    
    const FormData = require('form-data');
    const axios = require('axios');
    
    const blastForm = new FormData();
    blastForm.append('file', fs.createReadStream(blastCSVPath));
    blastForm.append('playerId', testPlayer.id);
    blastForm.append('playerLevel', 'High School');
    
    try {
      const blastResponse = await axios.post('http://localhost:3001/api/upload/blast', blastForm, {
        headers: blastForm.getHeaders()
      });
      
      console.log('✅ Blast upload successful:');
      console.log('   - Session ID:', blastResponse.data.sessionId);
      console.log('   - Player Name:', blastResponse.data.playerName);
      console.log('   - Parsed Rows:', blastResponse.data.parseResult.parsedRows);
      
    } catch (error) {
      console.error('❌ Blast upload failed:', error.response?.data || error.message);
    }
    
    // Test 2: Test Hittrax upload endpoint
    console.log('\n📝 Test 2: Testing Hittrax upload endpoint...');
    
    const hittraxForm = new FormData();
    hittraxForm.append('file', fs.createReadStream(hittraxCSVPath));
    hittraxForm.append('playerId', testPlayer.id);
    hittraxForm.append('playerLevel', 'High School');
    
    try {
      const hittraxResponse = await axios.post('http://localhost:3001/api/upload/hittrax', hittraxForm, {
        headers: hittraxForm.getHeaders()
      });
      
      console.log('✅ Hittrax upload successful:');
      console.log('   - Session ID:', hittraxResponse.data.sessionId);
      console.log('   - Player Name:', hittraxResponse.data.playerName);
      console.log('   - Parsed Rows:', hittraxResponse.data.parseResult.parsedRows);
      
    } catch (error) {
      console.error('❌ Hittrax upload failed:', error.response?.data || error.message);
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await testPlayer.destroy();
    
    // Remove test files
    if (fs.existsSync(blastCSVPath)) fs.unlinkSync(blastCSVPath);
    if (fs.existsSync(hittraxCSVPath)) fs.unlinkSync(hittraxCSVPath);
    
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Upload API tests completed!');
    
  } catch (error) {
    console.error('❌ Upload API test failed:', error);
    process.exit(1);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testUploadAPI();
}

module.exports = { testUploadAPI }; 