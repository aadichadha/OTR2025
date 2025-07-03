const fs = require('fs');
const path = require('path');
const { parseHittraxCSV, getHittraxGrades } = require('../src/services/hittraxParser');

console.log('🧪 Testing HitTrax CSV Parser...\n');

// Test 1: Parse sample CSV file
console.log('📊 Test 1: Parsing sample HitTrax CSV file...');
try {
  const csvBuffer = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample_hittrax.csv'));
  const metrics = parseHittraxCSV(csvBuffer);
  
  console.log('✅ Parsing successful!');
  console.log('📈 Calculated metrics:');
  console.log(`   • Exit Velocity Avg: ${metrics.exitVelocityAvg.toFixed(2)} mph`);
  console.log(`   • Top 8% Exit Velocity: ${metrics.top8pctEV.toFixed(2)} mph`);
  console.log(`   • Avg Launch Angle (Top 8%): ${metrics.avgLaunchAngleTop8.toFixed(2)}°`);
  console.log(`   • Avg Distance (Top 8%): ${metrics.avgDistanceTop8.toFixed(2)} ft`);
  console.log(`   • Total Avg Launch Angle: ${metrics.totalAvgLaunchAngle.toFixed(2)}°`);
  console.log(`   • Raw rows processed: ${metrics.rawRows}`);
  console.log(`   • Valid rows: ${metrics.validRows}`);
  console.log(`   • Top 8% count: ${metrics.top8Count}`);
  console.log(`   • Count by zone:`, metrics.countTop8ByZone);
  console.log('');

  // Test 2: Get grades
  console.log('📊 Test 2: Calculating grades...');
  const grades = getHittraxGrades(metrics, 'High School');
  
  console.log('✅ Grading successful!');
  console.log('📊 Grades (High School level):');
  console.log(`   • Exit Velocity Grade: ${grades.exitVelocityGrade}`);
  console.log(`   • Top 8% Grade: ${grades.top8pctGrade}`);
  console.log(`   • Launch Angle Grade: ${grades.launchAngleGrade}`);
  console.log(`   • Total Launch Angle Grade: ${grades.totalLaunchAngleGrade}\n`);

  // Test 3: Test with different player level
  console.log('📊 Test 3: Testing with College level...');
  const collegeGrades = getHittraxGrades(metrics, 'College');
  
  console.log('✅ College grading successful!');
  console.log('📊 Grades (College level):');
  console.log(`   • Exit Velocity Grade: ${collegeGrades.exitVelocityGrade}`);
  console.log(`   • Top 8% Grade: ${collegeGrades.top8pctGrade}`);
  console.log(`   • Launch Angle Grade: ${collegeGrades.launchAngleGrade}`);
  console.log(`   • Total Launch Angle Grade: ${collegeGrades.totalLaunchAngleGrade}\n`);

} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

console.log('🎉 All HitTrax parser tests passed!'); 