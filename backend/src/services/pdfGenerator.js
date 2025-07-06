const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Match web interface color constants exactly
const NAVY = '#1a2340';
const PANEL_BG = '#fff';
const CARD_BG = NAVY;
const CARD_TEXT = '#fff';
const METRIC_LABEL = '#7ecbff';
const METRIC_UNIT = '#b3c6e0';

// Match web interface zone color logic exactly
const getZoneColor = (avgEV) => {
  if (avgEV === null || avgEV === undefined) return '#ffffff';
  if (avgEV >= 90) return '#ff0000';
  if (avgEV >= 85) return '#ff8c00';
  if (avgEV >= 80) return '#ffd700';
  return '#808080';
};

function generateReportPDF(reportData, outputFilePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      margin: 30,
      size: 'A4'
    });
    const stream = fs.createWriteStream(outputFilePath);
    doc.pipe(stream);

    // Helper function to format metric value
    const formatMetricValue = (value, decimals = 1) => {
      if (value === null || value === undefined) return 'N/A';
      return value.toFixed(decimals);
    };

    // Helper for grade color - match web interface exactly
    const getGradeColor = (grade) => {
      if (!grade) return METRIC_LABEL;
      if (grade === 'Above Average' || grade === 'Complete' || grade === 'Distance') return '#3ecb7e';
      if (grade === 'Below Average') return '#ff8c00';
      return METRIC_LABEL;
    };

    // Set dark background for the whole PDF
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(NAVY);
    doc.fillColor('white');

    // Header with dark navy background - match web interface
    doc.rect(0, 0, 595, 120).fill(NAVY);
    // Add OTR BASEBALL logo at the top
    const logoPath = path.resolve(__dirname, '../../frontend/public/images/otrbaseball-main.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 30, 20, { fit: [120, 44] });
    }
    // Title - match web interface typography
    doc.fontSize(32).fill('white').font('Helvetica-Bold').text('Performance Report', 170, 70);
    doc.fontSize(16).fill(METRIC_UNIT).text(
      `${reportData.player.name} • ${new Date(reportData.session.date).toLocaleDateString()} • ${reportData.session.type.toUpperCase()}`,
      170, 95
    );
    let currentY = 140;

    // White panel background - match web interface
    doc.rect(30, currentY, 535, 600).fill(PANEL_BG);
    currentY += 40;

    // Draw metric cards - match web interface exactly
    const drawMetricCard = (x, y, width, height, value, label, unit, grade) => {
      doc.save();
      // Card background - match web interface (rounded, navy background)
      doc.roundedRect(x, y, width, height, 16).fill(CARD_BG);
      doc.roundedRect(x, y, width, height, 16).stroke(NAVY);
      
      // Value - match web interface typography (h3, 2.2rem equivalent, bold)
      const valueText = value !== null && value !== undefined ? Number(value).toFixed(1) : 'N/A';
      doc.fontSize(44).fill(CARD_TEXT).font('Helvetica-Bold').text(valueText, x, y + 15, {
        align: 'center',
        width: width
      });
      
      // Unit - match web interface (smaller, lighter color)
      if (unit) {
        doc.fontSize(24).fill(METRIC_UNIT).font('Helvetica').text(unit, x + width - 60, y + 15, {
          align: 'left',
          width: 50
        });
      }
      
      // Label - match web interface typography (subtitle2, 1.05rem equivalent)
      doc.fontSize(21).fill(METRIC_LABEL).font('Helvetica-Bold').text(label, x, y + 65, {
        align: 'center',
        width: width
      });
      
      // Grade - match web interface (caption, colored)
      if (grade) {
        const gradeColor = getGradeColor(grade);
        doc.fontSize(14).fill(gradeColor).font('Helvetica-Bold').text(grade, x, y + height - 25, {
          align: 'center',
          width: width
        });
      }
      doc.restore();
    };

    // Draw metric cards based on session type - match web interface layout
    const cardWidth = 160;
    const cardHeight = 100;
    const spacing = 20;
    if (reportData.session.type === 'hittrax' && reportData.metrics?.exitVelocity) {
      const metrics = reportData.metrics.exitVelocity;
      // Row 1
      drawMetricCard(
        50, currentY, cardWidth, cardHeight,
        metrics.maxExitVelocity,
        'MAX EXIT VELOCITY',
        'MPH',
        metrics.grades?.maxExitVelocity
      );
      drawMetricCard(
        50 + cardWidth + spacing, currentY, cardWidth, cardHeight,
        metrics.avgExitVelocity,
        'AVG EXIT VELOCITY',
        'MPH',
        metrics.grades?.avgExitVelocity
      );
      drawMetricCard(
        50 + (cardWidth + spacing) * 2, currentY, cardWidth, cardHeight,
        metrics.launchAngleTop5,
        'AVG LA (TOP 5% EV)',
        '°',
        metrics.grades?.launchAngleTop5
      );
      currentY += cardHeight + 20;
      // Row 2
      drawMetricCard(
        50, currentY, cardWidth, cardHeight,
        metrics.avgLaunchAngle,
        'AVG LAUNCH ANGLE',
        '°',
        metrics.grades?.avgLaunchAngle
      );
      drawMetricCard(
        50 + cardWidth + spacing, currentY, cardWidth, cardHeight,
        metrics.barrels || 0,
        'BARRELS',
        '',
        'Quality'
      );
      drawMetricCard(
        50 + (cardWidth + spacing) * 2, currentY, cardWidth, cardHeight,
        metrics.dataPoints || 0,
        'TOTAL SWINGS',
        '',
        'Complete'
      );
    }
    if (reportData.session.type === 'blast' && reportData.metrics?.batSpeed) {
      const metrics = reportData.metrics.batSpeed;
      // Row 1
      drawMetricCard(
        50, currentY, cardWidth, cardHeight,
        metrics.maxBatSpeed,
        'MAX BAT SPEED',
        'MPH',
        metrics.grades?.maxBatSpeed
      );
      drawMetricCard(
        50 + cardWidth + spacing, currentY, cardWidth, cardHeight,
        metrics.avgBatSpeed,
        'AVG BAT SPEED',
        'MPH',
        metrics.grades?.avgBatSpeed
      );
      drawMetricCard(
        50 + (cardWidth + spacing) * 2, currentY, cardWidth, cardHeight,
        metrics.avgAttackAngle,
        'AVG ATTACK ANGLE',
        '°',
        metrics.grades?.attackAngle
      );
      currentY += cardHeight + 20;
      // Row 2
      drawMetricCard(
        50, currentY, cardWidth, cardHeight,
        metrics.avgTimeToContact,
        'AVG TIME TO CONTACT',
        'SEC',
        metrics.grades?.timeToContact
      );
      drawMetricCard(
        50 + cardWidth + spacing, currentY, cardWidth, cardHeight,
        metrics.dataPoints || 0,
        'TOTAL SWINGS',
        '',
        'Complete'
      );
    }
    currentY += cardHeight + 60;

    // Strike Zone Heat Map - match web interface exactly
    // Navy background panel
    doc.roundedRect(50, currentY, 495, 400, 16).fill(NAVY);
    currentY += 30;
    
    // Title - match web interface typography
    doc.fontSize(24).fill('white').font('Helvetica-Bold').text('STRIKE ZONE HOT ZONES (Avg EV)', 70, currentY);
    currentY += 50;
    
    const zoneCellSize = 60;
    const zoneGrid = [
      [10, null, 11],
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [12, null, 13],
    ];
    const zoneX = 70;
    const zoneY = currentY;
    
    for (let row = 0; row < zoneGrid.length; row++) {
      for (let col = 0; col < 3; col++) {
        const zone = zoneGrid[row][col];
        const x = zoneX + col * (zoneCellSize + 8); // 8px gap like web
        const y = zoneY + row * (zoneCellSize + 8);
        
        if (zone === null) {
          // Empty cell - transparent
          continue;
        }
        
        // Get value and color using exact web logic
        const ev = reportData.metrics?.exitVelocity?.hotZoneEVs?.[zone] ?? null;
        const cellColor = getZoneColor(ev);
        
        // Draw cell - match web interface styling
        doc.save();
        doc.roundedRect(x, y, zoneCellSize, zoneCellSize, 4).fill(cellColor);
        doc.roundedRect(x, y, zoneCellSize, zoneCellSize, 4).stroke('white');
        doc.lineWidth(2);
        doc.restore();
        
        // Zone number - match web interface (1rem, opacity 0.8, fontWeight 600)
        doc.fontSize(16).fill(ev !== null && ev !== undefined && ev > 85 ? 'white' : NAVY).font('Helvetica-Bold').text(zone.toString(), x, y + 8, {
          align: 'center',
          width: zoneCellSize
        });
        
        // Value - match web interface (0.85rem)
        if (ev !== null && ev !== undefined) {
          doc.fontSize(14).fill(ev > 85 ? 'white' : NAVY).font('Helvetica-Bold').text(ev.toFixed(1), x, y + 30, {
            align: 'center',
            width: zoneCellSize
          });
        }
      }
    }
    currentY += zoneCellSize * zoneGrid.length + 100;

    // Session History
    if (reportData.history && reportData.history.length > 1) {
      doc.fontSize(20).fill('#333').text('Session History', 50, currentY);
      currentY += 30;

      // History table
      doc.fontSize(12).fill('#333');
      doc.text('Date', 50, currentY);
      doc.text('Type', 140, currentY);
      doc.text('Avg Bat Speed', 220, currentY);
      doc.text('Top Bat Speed', 300, currentY);
      doc.text('Avg Exit Velo', 380, currentY);
      doc.text('Top Exit Velo', 460, currentY);
      currentY += 20;

      // Table rows
      reportData.history.slice(-5).forEach(session => {
        doc.fontSize(10).fill('#666');
        doc.text(new Date(session.sessionDate).toLocaleDateString(), 50, currentY);
        doc.text(session.type.toUpperCase(), 140, currentY);
        doc.text(session.avgBatSpeed ? session.avgBatSpeed.toFixed(1) : 'N/A', 220, currentY);
        doc.text(session.topBatSpeed ? session.topBatSpeed.toFixed(1) : 'N/A', 300, currentY);
        doc.text(session.avgExitVelocity ? session.avgExitVelocity.toFixed(1) : 'N/A', 380, currentY);
        doc.text(session.topExitVelocity ? session.topExitVelocity.toFixed(1) : 'N/A', 460, currentY);
        currentY += 15;
      });
    }

    doc.end();
    stream.on('finish', () => resolve(outputFilePath));
    stream.on('error', reject);
  });
}

module.exports = { generateReportPDF }; 