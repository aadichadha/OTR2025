const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateReportPDF(reportData, outputFilePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      margin: 30,
      size: 'A4'
    });
    const stream = fs.createWriteStream(outputFilePath);
    doc.pipe(stream);

    // Helper function to draw a metric card
    const drawMetricCard = (x, y, width, height, value, label, unit, statusColor = '#fff', statusLabel = null) => {
      doc.save();
      doc.roundedRect(x, y, width, height, 20).fill('#2D3748');
      doc.roundedRect(x, y, width, height, 20).stroke('#23293a');
      // Value
      doc.fontSize(32).fill('white').font('Helvetica-Bold').text(value.toString(), x, y + 18, {
        align: 'center',
        width: width
      });
      // Label
      doc.fontSize(13).fill('#CBD5E1').font('Helvetica-Bold').text(label, x, y + 60, {
        align: 'center',
        width: width
      });
      // Unit
      if (unit) doc.fontSize(11).fill('#A0AEC0').font('Helvetica').text(unit, x, y + 80, {
        align: 'center',
        width: width
      });
      // Status label (performance indicator)
      if (statusLabel) {
        doc.fontSize(11).fill(statusColor).font('Helvetica-Bold').text(statusLabel, x, y + height - 24, {
          align: 'center',
          width: width
        });
      }
      doc.restore();
    };

    // Helper function to get metric color
    const getMetricColor = (value, benchmark) => {
      if (!value || !benchmark) return '#333';
      const percentage = (value / benchmark) * 100;
      if (percentage >= 110) return '#28a745'; // Green
      if (percentage >= 90) return '#ffc107'; // Yellow
      return '#dc3545'; // Red
    };

    // Helper function to format metric value
    const formatMetricValue = (value, decimals = 1) => {
      if (value === null || value === undefined) return 'N/A';
      return value.toFixed(decimals);
    };

    // Helper for status color
    const getStatusColor = (grade) => {
      if (!grade) return '#CBD5E1';
      if (grade.toLowerCase().includes('above')) return '#10B981'; // green
      if (grade.toLowerCase().includes('below')) return '#F59E0B'; // orange
      if (grade.toLowerCase().includes('complete')) return '#3B82F6'; // blue
      if (grade.toLowerCase().includes('distance')) return '#6366F1'; // indigo
      return '#CBD5E1';
    };

    // Set dark background for the whole PDF
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#23293a');
    doc.fillColor('white');

    // Header with dark navy background
    doc.rect(0, 0, 595, 120).fill('#2D3748');
    // Add OTR BASEBALL logo at the top
    const logoPath = path.resolve(__dirname, '../../frontend/public/images/otrbaseball-main.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 30, 20, { fit: [120, 40] });
    }
    // Title
    doc.fontSize(28).fill('white').text('Performance Report', 30, 70);
    doc.fontSize(16).fill('rgba(255,255,255,0.9)').text(
      `${reportData.player.name} • ${new Date(reportData.session.date).toLocaleDateString()} • ${reportData.session.type.toUpperCase()}`,
      30, 95
    );
    let currentY = 140;

    // Metrics Section
    // Draw metric cards with dark background, rounded corners, white text
    const cardWidth = 170;
    const cardHeight = 100;
    const spacing = 20;
    if (reportData.session.type === 'hittrax' && reportData.metrics?.exitVelocity) {
      const metrics = reportData.metrics.exitVelocity;
      // Row 1
      drawMetricCard(
        30, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.maxExitVelocity),
        'MAX EXIT VELOCITY',
        'MPH',
        getStatusColor(metrics.grades?.maxExitVelocity),
        metrics.grades?.maxExitVelocity
      );
      drawMetricCard(
        30 + cardWidth + spacing, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.avgExitVelocity),
        'AVG EXIT VELOCITY',
        'MPH',
        getStatusColor(metrics.grades?.avgExitVelocity),
        metrics.grades?.avgExitVelocity
      );
      drawMetricCard(
        30 + (cardWidth + spacing) * 2, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.launchAngleTop5),
        'AVG LA (TOP 5% EV)',
        '°',
        getStatusColor(metrics.grades?.launchAngleTop5),
        metrics.grades?.launchAngleTop5
      );
      currentY += cardHeight + 20;
      // Row 2
      drawMetricCard(
        30, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.avgLaunchAngle),
        'AVG LAUNCH ANGLE',
        '°',
        getStatusColor(metrics.grades?.avgLaunchAngle),
        metrics.grades?.avgLaunchAngle
      );
      drawMetricCard(
        30 + cardWidth + spacing, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.barrels || 0),
        'BARRELS',
        '',
        '#3B82F6',
        'Quality'
      );
      drawMetricCard(
        30 + (cardWidth + spacing) * 2, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.dataPoints || 0),
        'TOTAL SWINGS',
        '',
        '#3B82F6',
        'Complete'
      );
    }
    if (reportData.session.type === 'blast' && reportData.metrics?.batSpeed) {
      const metrics = reportData.metrics.batSpeed;
      // Row 1
      drawMetricCard(
        30, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.maxBatSpeed),
        'MAX BAT SPEED',
        'MPH',
        getStatusColor(metrics.grades?.maxBatSpeed),
        metrics.grades?.maxBatSpeed
      );
      drawMetricCard(
        30 + cardWidth + spacing, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.avgBatSpeed),
        'AVG BAT SPEED',
        'MPH',
        getStatusColor(metrics.grades?.avgBatSpeed),
        metrics.grades?.avgBatSpeed
      );
      drawMetricCard(
        30 + (cardWidth + spacing) * 2, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.avgAttackAngle),
        'AVG ATTACK ANGLE',
        '°',
        getStatusColor(metrics.grades?.attackAngle),
        metrics.grades?.attackAngle
      );
      currentY += cardHeight + 20;
      // Row 2
      drawMetricCard(
        30, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.avgTimeToContact, 3),
        'AVG TIME TO CONTACT',
        'SEC',
        getStatusColor(metrics.grades?.timeToContact),
        metrics.grades?.timeToContact
      );
      drawMetricCard(
        30 + cardWidth + spacing, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.dataPoints || 0),
        'TOTAL SWINGS',
        '',
        '#3B82F6',
        'Complete'
      );
    }
    currentY += cardHeight + 80;

    // Strike Zone Heat Map (5x3 grid)
    doc.fontSize(20).fill('white').text('Strike Zone Hot Zones (Avg EV)', 30, currentY);
    currentY += 30;
    const zoneCellSize = 60;
    const zoneGrid = [
      [10, null, 11],
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [12, null, 13],
    ];
    const zoneX = 30;
    const zoneY = currentY;
    for (let row = 0; row < zoneGrid.length; row++) {
      for (let col = 0; col < 3; col++) {
        const zone = zoneGrid[row][col];
        const x = zoneX + col * zoneCellSize;
        const y = zoneY + row * zoneCellSize;
        if (zone === null) {
          // Empty cell
          doc.save();
          doc.rect(x, y, zoneCellSize, zoneCellSize).fill('#23293a');
          doc.restore();
          continue;
        }
        // Get value and color
        const ev = reportData.metrics?.exitVelocity?.hotZoneEVs?.[zone] ?? null;
        let cellColor = '#6B7280'; // gray
        if (ev === null) cellColor = '#fff';
        else if (ev >= 90) cellColor = '#DC2626'; // red
        else if (ev >= 85) cellColor = '#EA580C'; // orange
        // Draw cell
        doc.save();
        doc.rect(x, y, zoneCellSize, zoneCellSize).fill(cellColor);
        doc.restore();
        // Draw zone number (small, top left)
        doc.fontSize(10).fill('white').font('Helvetica-Bold').text(zone.toString(), x + 6, y + 6);
        // Draw value (large, centered)
        if (ev !== null) {
          doc.fontSize(18).fill('white').font('Helvetica-Bold').text(ev.toFixed(1), x, y + 22, {
            align: 'center',
            width: zoneCellSize
          });
        }
      }
    }
    currentY += zoneCellSize * zoneGrid.length + 30;

    // Session History
    if (reportData.history && reportData.history.length > 1) {
      doc.fontSize(20).fill('#333').text('Session History', 30, currentY);
      currentY += 30;

      // History table
      doc.fontSize(12).fill('#333');
      doc.text('Date', 30, currentY);
      doc.text('Type', 120, currentY);
      doc.text('Avg Bat Speed', 200, currentY);
      doc.text('Top Bat Speed', 300, currentY);
      doc.text('Avg Exit Velo', 400, currentY);
      doc.text('Top Exit Velo', 500, currentY);
      currentY += 20;

      // Table rows
      reportData.history.slice(-5).forEach(session => {
        doc.fontSize(10).fill('#666');
        doc.text(new Date(session.sessionDate).toLocaleDateString(), 30, currentY);
        doc.text(session.sessionType.toUpperCase(), 120, currentY);
        doc.text(session.metrics.avgBatSpeed ? session.metrics.avgBatSpeed.toFixed(1) : 'N/A', 200, currentY);
        doc.text(session.metrics.topBatSpeed ? session.metrics.topBatSpeed.toFixed(1) : 'N/A', 300, currentY);
        doc.text(session.metrics.avgExitVelocity ? session.metrics.avgExitVelocity.toFixed(1) : 'N/A', 400, currentY);
        doc.text(session.metrics.topExitVelocity ? session.metrics.topExitVelocity.toFixed(1) : 'N/A', 500, currentY);
        currentY += 15;
      });
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).fillColor('gray').text('Generated by OTR Baseball Analytics Platform', { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(outputFilePath));
    stream.on('error', reject);
  });
}

module.exports = { generateReportPDF }; 