const { 
  calculateMean, 
  calculateQuantile, 
  grade, 
  getAvailableLevels, 
  isValidLevel, 
  getBenchmarksForLevel 
} = require('../src/services/metricsUtils');

console.log('🧪 Testing Metrics Utilities...\n');

// Test 1: Calculate mean
console.log('📊 Test 1: Testing calculateMean function...');
const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const mean = calculateMean(testData);
console.log(`   • Test data: [${testData.join(', ')}]`);
console.log(`   • Calculated mean: ${mean}`);
console.log(`   • Expected mean: 5.5`);
console.log(`   • Test ${Math.abs(mean - 5.5) < 0.01 ? '✅ PASSED' : '❌ FAILED'}\n`);

// Test 2: Calculate quantile
console.log('📊 Test 2: Testing calculateQuantile function...');
const quantile90 = calculateQuantile(testData, 0.9);
const quantile50 = calculateQuantile(testData, 0.5);
console.log(`   • Test data: [${testData.join(', ')}]`);
console.log(`   • 90th percentile: ${quantile90}`);
console.log(`   • 50th percentile (median): ${quantile50}`);
console.log(`   • Expected 90th percentile: 9`);
console.log(`   • Expected 50th percentile: 5.5`);
console.log(`   • Test ${quantile90 === 9 && Math.abs(quantile50 - 5.5) < 0.01 ? '✅ PASSED' : '❌ FAILED'}\n`);

// Test 3: Grade function
console.log('📊 Test 3: Testing grade function...');
const testCases = [
  { metric: 100, benchmark: 100, expected: 'A-', desc: 'Exact benchmark' },
  { metric: 110, benchmark: 100, expected: 'A+', desc: '10% above benchmark' },
  { metric: 95, benchmark: 100, expected: 'B+', desc: '5% below benchmark' },
  { metric: 70, benchmark: 100, expected: 'C-', desc: '30% below benchmark' },
  { metric: 0, benchmark: 100, expected: 'N/A', desc: 'Zero metric' },
  { metric: 100, benchmark: 0, expected: 'N/A', desc: 'Zero benchmark' }
];

testCases.forEach((testCase, index) => {
  const result = grade(testCase.metric, testCase.benchmark);
  const passed = result === testCase.expected;
  console.log(`   • Test ${index + 1} (${testCase.desc}): ${result} ${passed ? '✅' : '❌'} (expected: ${testCase.expected})`);
});
console.log('');

// Test 4: Grade function with special EV
console.log('📊 Test 4: Testing grade function with special EV...');
const evTestCases = [
  { metric: 100, benchmark: 100, expected: 'A-', desc: 'Exact benchmark (EV)' },
  { metric: 110, benchmark: 100, expected: 'A+', desc: '10% above benchmark (EV)' },
  { metric: 95, benchmark: 100, expected: 'B+', desc: '5% below benchmark (EV)' }
];

evTestCases.forEach((testCase, index) => {
  const result = grade(testCase.metric, testCase.benchmark, { specialEV: true });
  const passed = result === testCase.expected;
  console.log(`   • Test ${index + 1} (${testCase.desc}): ${result} ${passed ? '✅' : '❌'} (expected: ${testCase.expected})`);
});
console.log('');

// Test 5: Grade function with lowerIsBetter
console.log('📊 Test 5: Testing grade function with lowerIsBetter...');
const lowerTestCases = [
  { metric: 0.15, benchmark: 0.16, expected: 'A+', desc: 'Better time to contact' },
  { metric: 0.16, benchmark: 0.16, expected: 'A-', desc: 'Exact benchmark time' },
  { metric: 0.20, benchmark: 0.16, expected: 'C+', desc: 'Worse time to contact' }
];

lowerTestCases.forEach((testCase, index) => {
  const result = grade(testCase.metric, testCase.benchmark, { lowerIsBetter: true });
  const passed = result === testCase.expected;
  console.log(`   • Test ${index + 1} (${testCase.desc}): ${result} ${passed ? '✅' : '❌'} (expected: ${testCase.expected})`);
});
console.log('');

// Test 6: Available levels
console.log('📊 Test 6: Testing getAvailableLevels function...');
const levels = getAvailableLevels();
console.log(`   • Available levels: ${levels.join(', ')}`);
console.log(`   • Total levels: ${levels.length}`);
console.log(`   • Test ${levels.includes('High School') && levels.includes('College') ? '✅ PASSED' : '❌ FAILED'}\n`);

// Test 7: Level validation
console.log('📊 Test 7: Testing isValidLevel function...');
const validLevels = ['High School', 'College', 'Youth'];
const invalidLevels = ['Invalid Level', 'Test Level', ''];

validLevels.forEach(level => {
  const isValid = isValidLevel(level);
  console.log(`   • "${level}": ${isValid ? '✅ Valid' : '❌ Invalid'}`);
});

invalidLevels.forEach(level => {
  const isValid = isValidLevel(level);
  console.log(`   • "${level}": ${isValid ? '❌ Should be invalid' : '✅ Correctly invalid'}`);
});
console.log('');

// Test 8: Get benchmarks for level
console.log('📊 Test 8: Testing getBenchmarksForLevel function...');
const highSchoolBenchmarks = getBenchmarksForLevel('High School');
const defaultBenchmarks = getBenchmarksForLevel('Invalid Level');

console.log(`   • High School benchmarks:`, highSchoolBenchmarks);
console.log(`   • Invalid level defaults to:`, defaultBenchmarks);
console.log(`   • Test ${highSchoolBenchmarks['Avg EV'] === 74.54 ? '✅ PASSED' : '❌ FAILED'}\n`);

console.log('🎉 All metrics utilities tests completed!'); 