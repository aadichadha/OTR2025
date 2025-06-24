const { aggregateReportData } = require('./services/reportAggregator');
const { initDatabase } = require('./config/init-db');

async function testReportAggregator(sessionId) {
  try {
    await initDatabase();
    const reportData = await aggregateReportData(sessionId);
    console.log('🎯 Aggregated Report Data:');
    console.dir(reportData, { depth: 5 });
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

// Usage: node src/test-report-aggregator.js <sessionId>
if (require.main === module) {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.error('Usage: node src/test-report-aggregator.js <sessionId>');
    process.exit(1);
  }
  testReportAggregator(sessionId);
}

module.exports = { testReportAggregator }; 