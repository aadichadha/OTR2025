const path = require('path');
const fs = require('fs');
const { initDatabase } = require('./config/init-db');
const { aggregateReportData } = require('./services/reportAggregator');
const { generateReportPDF } = require('./services/pdfGenerator');

async function testGeneratePDF(sessionId) {
  try {
    await initDatabase();
    const reportData = await aggregateReportData(sessionId);
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    const filePath = path.join(reportsDir, `report_session_${sessionId}.pdf`);
    await generateReportPDF(reportData, filePath);
    console.log(`✅ PDF generated: ${filePath}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

// Usage: node src/test-generate-pdf.js <sessionId>
if (require.main === module) {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.error('Usage: node src/test-generate-pdf.js <sessionId>');
    process.exit(1);
  }
  testGeneratePDF(sessionId);
}

module.exports = { testGeneratePDF }; 