const fs = require('fs');
const path = require('path');
const { parseBlastCSV, getBlastGrades } = require('../src/services/blastParser');

console.log('🧪 Testing Blast Motion CSV Parser...\n');

// Test 1: Parse sample CSV file
console.log('📊 Test 1: Parsing sample Blast CSV file...');
try {
  const csvBuffer = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample_blast.csv'));
  const metrics = parseBlastCSV(csvBuffer);
  
  console.log('✅ Parsing successful!');
  console.log('📈 Calculated metrics:');
  console.log(`   • Player Avg Bat Speed: ${metrics.playerAvgBatSpeed.toFixed(2)} mph`);
  console.log(`   • Top 10% Bat Speed: ${metrics.top10pctBatSpeed.toFixed(2)} mph`);
  console.log(`   • Avg Attack Angle (Top 10%): ${metrics.avgAttackAngleTop10.toFixed(2)}°`);
  console.log(`   • Avg Time to Contact: ${metrics.avgTimeToContact.toFixed(3)}s`);
  console.log(`   • Raw rows processed: ${metrics.rawRows}`);
  console.log(`   • Valid bat speed rows: ${metrics.validBatSpeedRows}`);
  console.log(`   • Valid attack angle rows: ${metrics.validAttackAngleRows}`);
  console.log(`   • Valid time to contact rows: ${metrics.validTimeToContactRows}\n`);

  // Test 2: Get grades
  console.log('📊 Test 2: Calculating grades...');
  const grades = getBlastGrades(metrics, 'High School');
  
  console.log('✅ Grading successful!');
  console.log('📊 Grades (High School level):');
  console.log(`   • Bat Speed Grade: ${grades.batSpeedGrade}`);
  console.log(`   • Top 10% Grade: ${grades.top10pctGrade}`);
  console.log(`   • Attack Angle Grade: ${grades.attackAngleGrade}`);
  console.log(`   • Time to Contact Grade: ${grades.timeToContactGrade}\n`);

  // Test 3: Test with different player level
  console.log('📊 Test 3: Testing with College level...');
  const collegeGrades = getBlastGrades(metrics, 'College');
  
  console.log('✅ College grading successful!');
  console.log('📊 Grades (College level):');
  console.log(`   • Bat Speed Grade: ${collegeGrades.batSpeedGrade}`);
  console.log(`   • Top 10% Grade: ${collegeGrades.top10pctGrade}`);
  console.log(`   • Attack Angle Grade: ${collegeGrades.attackAngleGrade}`);
  console.log(`   • Time to Contact Grade: ${collegeGrades.timeToContactGrade}\n`);

} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

console.log('🎉 All Blast parser tests passed!'); 