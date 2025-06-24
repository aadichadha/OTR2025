const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateReportPDF(reportData, outputFilePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(outputFilePath);
    doc.pipe(stream);

    // Title
    doc.fontSize(22).text('Baseball Analytics Report', { align: 'center' });
    doc.moveDown();

    // Player & Session Info
    doc.fontSize(14).text(`Player: ${reportData.player.name}`);
    doc.text(`Level: ${reportData.player.level}`);
    doc.text(`Session Date: ${new Date(reportData.session.date).toLocaleDateString()}`);
    doc.text(`Session Type: ${reportData.session.type}`);
    doc.moveDown();

    // Metrics Table
    doc.fontSize(16).text('Metrics', { underline: true });
    doc.moveDown(0.5);
    const metrics = reportData.metrics;
    const rows = [
      ['Metric', 'Average', 'Benchmark', 'Above Benchmark?'],
      ['Bat Speed',
        metrics.batSpeed.average?.toFixed(2) ?? '-',
        metrics.batSpeed.benchmark ?? '-',
        metrics.batSpeed.aboveBenchmark === null ? '-' : metrics.batSpeed.aboveBenchmark ? 'Yes' : 'No'],
      ['Attack Angle',
        metrics.attackAngle.average?.toFixed(2) ?? '-',
        metrics.attackAngle.benchmark ?? '-',
        metrics.attackAngle.aboveBenchmark === null ? '-' : metrics.attackAngle.aboveBenchmark ? 'Yes' : 'No'],
      ['Time To Contact',
        metrics.timeToContact.average?.toFixed(3) ?? '-',
        metrics.timeToContact.benchmark ?? '-',
        metrics.timeToContact.aboveBenchmark === null ? '-' : metrics.timeToContact.aboveBenchmark ? 'Yes' : 'No'],
      ['Exit Velocity',
        metrics.exitVelocity.average?.toFixed(2) ?? '-',
        metrics.exitVelocity.benchmark ?? '-',
        metrics.exitVelocity.aboveBenchmark === null ? '-' : metrics.exitVelocity.aboveBenchmark ? 'Yes' : 'No'],
      ['Launch Angle',
        metrics.launchAngle.average?.toFixed(2) ?? '-',
        metrics.launchAngle.benchmark ?? '-',
        metrics.launchAngle.aboveBenchmark === null ? '-' : metrics.launchAngle.aboveBenchmark ? 'Yes' : 'No'],
      ['Distance',
        metrics.distance.average?.toFixed(2) ?? '-',
        metrics.distance.benchmark ?? '-',
        metrics.distance.aboveBenchmark === null ? '-' : metrics.distance.aboveBenchmark ? 'Yes' : 'No']
    ];
    // Draw table
    rows.forEach((row, i) => {
      doc.font(i === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(12);
      doc.text(row.join('   |   '));
      doc.moveDown(0.2);
    });
    doc.moveDown();

    // Historical Session Table
    if (reportData.history && reportData.history.length > 1) {
      doc.fontSize(16).text('Session History', { underline: true });
      doc.moveDown(0.5);
      // Table header
      doc.font('Helvetica-Bold').fontSize(12).text('Date      | Type     | Avg BatSpeed | Top BatSpeed | Avg EV | Top EV');
      doc.moveDown(0.2);
      // Table rows
      reportData.history.forEach(s => {
        doc.font('Helvetica').fontSize(12).text(
          `${s.sessionDate} | ${s.sessionType.padEnd(8)} | ` +
          `${s.metrics.avgBatSpeed !== null ? s.metrics.avgBatSpeed.toFixed(2) : '-'}         | ` +
          `${s.metrics.topBatSpeed !== null ? s.metrics.topBatSpeed.toFixed(2) : '-'}        | ` +
          `${s.metrics.avgExitVelocity !== null ? s.metrics.avgExitVelocity.toFixed(2) : '-'}   | ` +
          `${s.metrics.topExitVelocity !== null ? s.metrics.topExitVelocity.toFixed(2) : '-'}`
        );
        doc.moveDown(0.1);
      });
      doc.moveDown();
    }

    // Trends Table
    if (reportData.trends && reportData.trends.length > 0) {
      doc.fontSize(16).text('Session-over-Session Trends', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(12).text('Date      | ΔAvg BatSpeed | ΔTop BatSpeed | ΔAvg EV | ΔTop EV');
      doc.moveDown(0.2);
      reportData.trends.forEach(t => {
        doc.font('Helvetica').fontSize(12).text(
          `${t.sessionDate} | ` +
          `${t.trends.avgBatSpeed !== null ? (t.trends.avgBatSpeed > 0 ? '+' : '') + t.trends.avgBatSpeed.toFixed(2) : '-'}         | ` +
          `${t.trends.topBatSpeed !== null ? (t.trends.topBatSpeed > 0 ? '+' : '') + t.trends.topBatSpeed.toFixed(2) : '-'}        | ` +
          `${t.trends.avgExitVelocity !== null ? (t.trends.avgExitVelocity > 0 ? '+' : '') + t.trends.avgExitVelocity.toFixed(2) : '-'}   | ` +
          `${t.trends.topExitVelocity !== null ? (t.trends.topExitVelocity > 0 ? '+' : '') + t.trends.topExitVelocity.toFixed(2) : '-'}`
        );
        doc.moveDown(0.1);
      });
      doc.moveDown();
    }

    // Strike Zone Heatmap Placeholder
    doc.fontSize(14).text('Strike Zone Heatmap:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text('(Heatmap visualization coming soon)', { align: 'center' });
    doc.moveDown();

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).fillColor('gray').text('Generated by OTR Baseball Analytics Platform', { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(outputFilePath));
    stream.on('error', reject);
  });
}

module.exports = { generateReportPDF }; 