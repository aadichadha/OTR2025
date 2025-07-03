const CSVParser = require('./services/csvParser');
const MetricsCalculator = require('./services/metricsCalculator');
const { Session, Player } = require('./models');
const { initDatabase } = require('./config/init-db');
const path = require('path');

const testCSVProcessing = async () => {
  try {
    console.log('🚀 Testing CSV Processing Engine...\n');
    
    // Initialize database
    await initDatabase();
    
    // Create a test player
    const testPlayer = await Player.create({
      name: 'Test Player',
      age: 16,
      travel_team: 'Test Team',
      high_school: 'Test High School',
      player_code: Math.floor(1000 + Math.random() * 9000).toString()
    });
    
    // Create a test session
    const testSession = await Session.create({
      player_id: testPlayer.id,
      session_date: new Date(),
      session_type: 'blast'
    });
    
    console.log('✅ Test player and session created');
    
    // Test 1: Create sample Blast CSV data
    console.log('\n📝 Test 1: Creating sample Blast CSV data...');
    
    const sampleBlastData = [
      // Header rows (will be skipped)
      'Row,Data,Type,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '1,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '2,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '3,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '4,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '5,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '6,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '7,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      // Data rows (will be processed)
      '8,Data,Real,Info,Col5,Col6,Col7,65.2,Col9,Col10,12.5,Col12,Col13,Col14,Col15,0.165',
      '9,Data,Real,Info,Col5,Col6,Col7,67.8,Col9,Col10,11.2,Col12,Col13,Col14,Col15,0.158',
      '10,Data,Real,Info,Col5,Col6,Col7,64.1,Col9,Col10,13.8,Col12,Col13,Col14,Col15,0.172',
      '11,Data,Real,Info,Col5,Col6,Col7,69.3,Col9,Col10,10.9,Col12,Col13,Col14,Col15,0.151',
      '12,Data,Real,Info,Col5,Col6,Col7,66.7,Col9,Col10,12.1,Col12,Col13,Col14,Col15,0.163'
    ];
    
    const blastCSVPath = path.join(__dirname, '../uploads/sample_blast.csv');
    const fs = require('fs');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(path.dirname(blastCSVPath))) {
      fs.mkdirSync(path.dirname(blastCSVPath), { recursive: true });
    }
    
    fs.writeFileSync(blastCSVPath, sampleBlastData.join('\n'));
    console.log('✅ Sample Blast CSV created');
    
    // Test 2: Parse Blast CSV
    console.log('\n📝 Test 2: Parsing Blast CSV...');
    const blastResult = await CSVParser.parseBlastCSV(blastCSVPath, testSession.id);
    console.log('✅ Blast CSV parsed successfully:');
    console.log(`   - Total rows: ${blastResult.totalRows}`);
    console.log(`   - Skipped rows: ${blastResult.skippedRows}`);
    console.log(`   - Parsed rows: ${blastResult.parsedRows}`);
    console.log(`   - Error count: ${blastResult.errorCount}`);
    console.log(`   - Sample data:`, blastResult.data[0]);
    
    // Test 3: Calculate Bat Speed Metrics
    console.log('\n📝 Test 3: Calculating Bat Speed Metrics...');
    const batSpeedMetrics = await MetricsCalculator.calculateBatSpeedMetrics(testSession.id, 'High School');
    console.log('✅ Bat Speed metrics calculated:');
    console.log(`   - Avg Bat Speed: ${batSpeedMetrics.avgBatSpeed} mph`);
    console.log(`   - Top 10% Bat Speed: ${batSpeedMetrics.top10PercentBatSpeed} mph`);
    console.log(`   - Avg Attack Angle (Top 10%): ${batSpeedMetrics.avgAttackAngleTop10}°`);
    console.log(`   - Avg Time to Contact: ${batSpeedMetrics.avgTimeToContact} sec`);
    console.log(`   - Grades:`, batSpeedMetrics.grades);
    
    // Test 4: Create sample Hittrax CSV data
    console.log('\n📝 Test 4: Creating sample Hittrax CSV data...');
    
    const sampleHittraxData = [
      // Header row
      'Row,Data,Type,Info,Col5,StrikeZone,Col7,ExitVelocity,LaunchAngle,Distance,Col11',
      // Data rows
      '1,Data,Real,Info,Col5,5,Col7,78.5,12.3,245.6,Col11',
      '2,Data,Real,Info,Col5,3,Col7,82.1,15.7,268.9,Col11',
      '3,Data,Real,Info,Col5,7,Col7,75.9,11.8,231.2,Col11',
      '4,Data,Real,Info,Col5,2,Col7,85.3,16.2,289.4,Col11',
      '5,Data,Real,Info,Col5,6,Col7,79.8,13.1,252.7,Col11',
      '6,Data,Real,Info,Col5,4,Col7,81.2,14.5,261.3,Col11',
      '7,Data,Real,Info,Col5,8,Col7,77.4,12.9,248.1,Col11',
      '8,Data,Real,Info,Col5,1,Col7,83.7,15.3,275.8,Col11'
    ];
    
    const hittraxCSVPath = path.join(__dirname, '../uploads/sample_hittrax.csv');
    fs.writeFileSync(hittraxCSVPath, sampleHittraxData.join('\n'));
    console.log('✅ Sample Hittrax CSV created');
    
    // Create a new session for Hittrax data
    const hittraxSession = await Session.create({
      player_id: testPlayer.id,
      session_date: new Date(),
      session_type: 'hittrax'
    });
    
    // Test 5: Parse Hittrax CSV
    console.log('\n📝 Test 5: Parsing Hittrax CSV...');
    const hittraxResult = await CSVParser.parseHittraxCSV(hittraxCSVPath, hittraxSession.id);
    console.log('✅ Hittrax CSV parsed successfully:');
    console.log(`   - Total rows: ${hittraxResult.totalRows}`);
    console.log(`   - Parsed rows: ${hittraxResult.parsedRows}`);
    console.log(`   - Error count: ${hittraxResult.errorCount}`);
    console.log(`   - Sample data:`, hittraxResult.data[0]);
    
    // Test 6: Calculate Exit Velocity Metrics
    console.log('\n📝 Test 6: Calculating Exit Velocity Metrics...');
    const evMetrics = await MetricsCalculator.calculateExitVelocityMetrics(hittraxSession.id, 'High School');
    console.log('✅ Exit Velocity metrics calculated:');
    console.log(`   - Avg EV: ${evMetrics.avgExitVelocity} mph`);
    console.log(`   - Top 8% EV: ${evMetrics.top8PercentEV} mph`);
    console.log(`   - Avg LA (Top 8%): ${evMetrics.avgLaunchAngleTop8}°`);
    console.log(`   - Total Avg LA: ${evMetrics.totalAvgLaunchAngle}°`);
    console.log(`   - Avg Distance (Top 8%): ${evMetrics.avgDistanceTop8} ft`);
    console.log(`   - Strike Zone Counts:`, evMetrics.strikeZoneCounts);
    console.log(`   - Grades:`, evMetrics.grades);
    
    // Test 7: Get available levels
    console.log('\n📝 Test 7: Available Player Levels...');
    const levels = MetricsCalculator.getAvailableLevels();
    console.log('✅ Available levels:', levels);
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await testPlayer.destroy();
    await testSession.destroy();
    await hittraxSession.destroy();
    
    // Remove test files
    if (fs.existsSync(blastCSVPath)) fs.unlinkSync(blastCSVPath);
    if (fs.existsSync(hittraxCSVPath)) fs.unlinkSync(hittraxCSVPath);
    
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All CSV Processing Engine tests passed successfully!');
    
  } catch (error) {
    console.error('❌ CSV Processing Engine test failed:', error);
    process.exit(1);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testCSVProcessing();
}

module.exports = { testCSVProcessing }; 