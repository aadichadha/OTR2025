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
    const drawMetricCard = (x, y, width, height, value, label, unit, color = '#333') => {
      // Card background
      doc.rect(x, y, width, height).fill('#f8f9fa');
      doc.rect(x, y, width, height).stroke('#e9ecef');
      
      // Value (large number)
      doc.fontSize(32).fill(color).text(value.toString(), x + width/2, y + 20, {
        align: 'center',
        width: width
      });
      
      // Label
      doc.fontSize(14).fill('#495057').text(label, x + width/2, y + 60, {
        align: 'center',
        width: width
      });
      
      // Unit
      doc.fontSize(10).fill('#6c757d').text(unit, x + width/2, y + 80, {
        align: 'center',
        width: width
      });
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

    // Header with gradient background effect
    doc.rect(0, 0, 595, 120).fill('#667eea');
    
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
    doc.fontSize(20).fill('#333').text('Performance Metrics', 30, currentY);
    currentY += 30;

    // Draw metric cards based on session type
    if (reportData.session.type === 'blast' && reportData.metrics?.batSpeed) {
      const metrics = reportData.metrics.batSpeed;
      const cardWidth = 170;
      const cardHeight = 100;
      const cardsPerRow = 3;
      const spacing = 20;

      // Row 1
      drawMetricCard(
        30, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.avgBatSpeed),
        'BAT SPEED',
        'Mph',
        getMetricColor(metrics.avgBatSpeed, metrics.benchmark?.avgBatSpeed)
      );

      drawMetricCard(
        30 + cardWidth + spacing, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.top10PercentBatSpeed),
        'TOP 10% SPEED',
        'Mph',
        getMetricColor(metrics.top10PercentBatSpeed, metrics.benchmark?.top90BatSpeed)
      );

      drawMetricCard(
        30 + (cardWidth + spacing) * 2, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.avgAttackAngleTop10),
        'ATTACK ANGLE',
        'Degrees',
        getMetricColor(metrics.avgAttackAngleTop10, metrics.benchmark?.avgAttackAngle)
      );

      currentY += cardHeight + 20;

      // Row 2
      drawMetricCard(
        30, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.avgTimeToContact, 3),
        'TIME TO CONTACT',
        'Seconds',
        getMetricColor(metrics.avgTimeToContact, metrics.benchmark?.avgTimeToContact)
      );

      drawMetricCard(
        30 + cardWidth + spacing, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.dataPoints || 0),
        'TOTAL SWINGS',
        'Data Points',
        '#1976d2'
      );
    }

    if (reportData.session.type === 'hittrax' && reportData.metrics?.exitVelocity) {
      const metrics = reportData.metrics.exitVelocity;
      const cardWidth = 170;
      const cardHeight = 100;
      const cardsPerRow = 3;
      const spacing = 20;

      // Row 1
      drawMetricCard(
        30, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.avgExitVelocity),
        'EXIT VELOCITY',
        'Mph',
        getMetricColor(metrics.avgExitVelocity, metrics.benchmark?.avgEV)
      );

      drawMetricCard(
        30 + cardWidth + spacing, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.avgLaunchAngleTop8),
        'LAUNCH ANGLE',
        'Degrees',
        getMetricColor(metrics.avgLaunchAngleTop8, metrics.benchmark?.hhbLA)
      );

      drawMetricCard(
        30 + (cardWidth + spacing) * 2, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.avgDistanceTop8),
        'DISTANCE',
        'Feet',
        '#1976d2'
      );

      currentY += cardHeight + 20;

      // Row 2
      drawMetricCard(
        30, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.top8PercentEV),
        'TOP 8% EV',
        'Mph',
        getMetricColor(metrics.top8PercentEV, metrics.benchmark?.top8EV)
      );

      drawMetricCard(
        30 + cardWidth + spacing, currentY, cardWidth, cardHeight,
        formatMetricValue(metrics.dataPoints || 0),
        'TOTAL SWINGS',
        'Data Points',
        '#1976d2'
      );
    }

    currentY += 140;

    // Strike Zone Visualization
    doc.fontSize(20).fill('#333').text('Strike Zone Analysis', 30, currentY);
    currentY += 30;

    // Draw strike zone grid
    const zoneWidth = 200;
    const zoneHeight = 150;
    const zoneX = 30;
    const zoneY = currentY;

    // Strike zone outline
    doc.rect(zoneX, zoneY, zoneWidth, zoneHeight).stroke('#333');
    
    // Grid lines
    for (let i = 1; i < 3; i++) {
      doc.moveTo(zoneX + (zoneWidth / 3) * i, zoneY)
        .lineTo(zoneX + (zoneWidth / 3) * i, zoneY + zoneHeight)
        .stroke('#ccc');
    }
    for (let i = 1; i < 3; i++) {
      doc.moveTo(zoneX, zoneY + (zoneHeight / 3) * i)
        .lineTo(zoneX + zoneWidth, zoneY + (zoneHeight / 3) * i)
        .stroke('#ccc');
    }

    // Zone labels
    doc.fontSize(12).fill('#666').text('Strike Zone Heatmap', zoneX + zoneWidth/2, zoneY + zoneHeight + 10, {
      align: 'center',
      width: zoneWidth
    });

    currentY += zoneHeight + 50;

    // Detailed Analysis
    if (reportData.summaryText) {
      doc.fontSize(20).fill('#333').text('Detailed Analysis', 30, currentY);
      currentY += 30;

      // Analysis background
      doc.rect(30, currentY, 535, 200).fill('#f8f9fa');
      doc.rect(30, currentY, 535, 200).stroke('#e9ecef');

      // Analysis text
      doc.fontSize(11).fill('#333').text(reportData.summaryText, 40, currentY + 10, {
        width: 515,
        align: 'left'
      });

      currentY += 220;
    }

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