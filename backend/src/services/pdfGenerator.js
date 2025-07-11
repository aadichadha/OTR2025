// PDFKit Inter Font Setup: Uses Inter if present in frontend/public/fonts, else falls back to Helvetica.
// Numbers: Inter-Bold, Labels: Inter-Medium, Status: Inter-SemiBold, Body: Inter-Regular

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const margin = 35;
const pageWidth = 612;
const pageHeight = 792;
const contentWidth = pageWidth - 2 * margin;
const contentHeight = pageHeight - 2 * margin;

const NAVY = '#1a2340';
const PANEL_BG = '#fff';
const CARD_BG = NAVY;
const CARD_TEXT = '#fff';
const METRIC_LABEL = '#7ecbff';
const METRIC_UNIT = '#b3c6e0';

// Inter font paths
const fontDir = path.resolve(__dirname, '../../frontend/public/fonts');
const interFontPath = path.join(fontDir, 'Inter-Regular.ttf');
const interBoldFontPath = path.join(fontDir, 'Inter-Bold.ttf');
const interMediumFontPath = path.join(fontDir, 'Inter-Medium.ttf');
const interSemiBoldFontPath = path.join(fontDir, 'Inter-SemiBold.ttf');
const hasInter = fs.existsSync(interFontPath) && fs.existsSync(interBoldFontPath) && fs.existsSync(interMediumFontPath) && fs.existsSync(interSemiBoldFontPath);

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
      margin: 0,
      size: [pageWidth, pageHeight]
    });
    const stream = fs.createWriteStream(outputFilePath);
    doc.pipe(stream);

    // Register Inter font family if available
    if (hasInter) {
      doc.registerFont('Inter', interFontPath);
      doc.registerFont('Inter-Bold', interBoldFontPath);
      doc.registerFont('Inter-Medium', interMediumFontPath);
      doc.registerFont('Inter-SemiBold', interSemiBoldFontPath);
    }

    // Helper for grade color
    const getGradeColor = (grade) => {
      if (!grade) return METRIC_LABEL;
      if (grade === 'Above Average' || grade === 'Complete' || grade === 'Distance') return '#3ecb7e';
      if (grade === 'Below Average') return '#ff8c00';
      return METRIC_LABEL;
    };

    // Draw background
    doc.rect(0, 0, pageWidth, pageHeight).fill(NAVY);
    doc.fillColor('white');

    // White panel background (centered, with margin)
    const panelX = margin;
    const panelY = margin;
    const panelWidth = contentWidth;
    const panelHeight = contentHeight;
    doc.roundedRect(panelX, panelY, panelWidth, panelHeight, 16).fill(PANEL_BG);

    // Header (centered, Inter font)
    const logoPath = path.resolve(__dirname, '../../frontend/public/images/otrbaseball-main.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, panelX + 10, panelY + 16, { fit: [80, 28] });
    }
    doc.fontSize(25)
      .fill(NAVY)
      .font(hasInter ? 'Inter-Bold' : 'Helvetica-Bold')
      .text('Performance Report', panelX, panelY + 16, { align: 'center', width: panelWidth });
    
    // Handle multi-session reports
    const isMultiSession = reportData.session.sessionIds && reportData.session.sessionIds.length > 1;
    const sessionText = isMultiSession ? 
      `${reportData.player.name} • ${reportData.sessionCount} Sessions • ${reportData.totalSwings} Total Swings` :
      `${reportData.player.name} • ${new Date(reportData.session.date).toLocaleDateString()} • ${reportData.session.type.toUpperCase()}`;
    
    doc.fontSize(13)
      .fill(METRIC_UNIT)
      .font(hasInter ? 'Inter-Medium' : 'Helvetica')
      .text(sessionText, panelX, panelY + 46, { align: 'center', width: panelWidth });

    // --- Layout calculations ---
    let y = panelY + 60; // Header: 60px
    y += 25; // Space after header
    // Metric cards: 2 rows of 3, slightly smaller
    const cardWidth = 160;
    const cardHeight = 105;
    const cardSpacingX = 35;
    const cardSpacingY = 35;
    const cardsPerRow = 3;
    const totalCardsWidth = (cardWidth * cardsPerRow) + (cardSpacingX * (cardsPerRow - 1));
    const cardsStartX = panelX + (panelWidth - totalCardsWidth) / 2;

    // Draw metric cards
    const drawMetricCard = (x, y, value, label, unit, grade) => {
      doc.save();
      doc.roundedRect(x, y, cardWidth, cardHeight, 12).fill(CARD_BG);
      doc.roundedRect(x, y, cardWidth, cardHeight, 12).stroke(NAVY);
      // Value (number)
      const valueText = value !== null && value !== undefined ? Number(value).toFixed(1) : 'N/A';
      doc.fontSize(21)
        .fill(CARD_TEXT)
        .font(hasInter ? 'Inter-Bold' : 'Helvetica-Bold')
        .text(valueText, x, y + 18, { align: 'center', width: cardWidth });
      // Unit
      if (unit) {
        doc.fontSize(13)
          .fill(METRIC_UNIT)
          .font(hasInter ? 'Inter-Medium' : 'Helvetica')
          .text(unit, x + cardWidth - 28, y + 18, { align: 'left', width: 24 });
      }
      // Label
      doc.fontSize(13)
        .fill(METRIC_LABEL)
        .font(hasInter ? 'Inter-Medium' : 'Helvetica')
        .text(label, x, y + 54, { align: 'center', width: cardWidth });
      // Grade (status)
      if (grade) {
        const gradeColor = getGradeColor(grade);
        doc.fontSize(15)
          .fill(gradeColor)
          .font(hasInter ? 'Inter-SemiBold' : 'Helvetica-Bold')
          .text(grade, x, y + cardHeight - 22, { align: 'center', width: cardWidth });
      }
      doc.restore();
    };

    // Prepare metrics
    let metrics, isHittrax = false;
    if (reportData.session.type === 'hittrax' && reportData.metrics?.exitVelocity) {
      metrics = reportData.metrics.exitVelocity;
      isHittrax = true;
    } else if (reportData.session.type === 'blast' && reportData.metrics?.batSpeed) {
      metrics = reportData.metrics.batSpeed;
    }
    if (metrics) {
      let row1Metrics, row2Metrics;
      if (isHittrax) {
        row1Metrics = [
          { value: metrics.maxExitVelocity, label: 'MAX EXIT VELOCITY', unit: 'MPH', grade: metrics.grades?.maxExitVelocity },
          { value: metrics.avgExitVelocity, label: 'AVG EXIT VELOCITY', unit: 'MPH', grade: metrics.grades?.avgExitVelocity },
          { value: metrics.launchAngleTop5, label: 'AVG LA (TOP 5% EV)', unit: '°', grade: metrics.grades?.launchAngleTop5 }
        ];
        row2Metrics = [
          { value: metrics.avgLaunchAngle, label: 'AVG LAUNCH ANGLE', unit: '°', grade: metrics.grades?.avgLaunchAngle },
          { value: metrics.barrelPercentage || 0, label: 'BARREL %', unit: '%', grade: 'Quality' },
          { value: metrics.dataPoints || 0, label: 'TOTAL SWINGS', unit: '', grade: 'Complete' }
        ];
      } else {
        row1Metrics = [
          { value: metrics.maxBatSpeed, label: 'MAX BAT SPEED', unit: 'MPH', grade: metrics.grades?.maxBatSpeed },
          { value: metrics.avgBatSpeed, label: 'AVG BAT SPEED', unit: 'MPH', grade: metrics.grades?.avgBatSpeed },
          { value: metrics.avgAttackAngle, label: 'AVG ATTACK ANGLE', unit: '°', grade: metrics.grades?.attackAngle }
        ];
        row2Metrics = [
          { value: metrics.avgTimeToContact, label: 'AVG TIME TO CONTACT', unit: 'SEC', grade: metrics.grades?.timeToContact },
          { value: metrics.dataPoints || 0, label: 'TOTAL SWINGS', unit: '', grade: 'Complete' },
          { value: null, label: '', unit: '', grade: '' }
        ];
      }
      // Draw row 1
      for (let i = 0; i < row1Metrics.length; i++) {
        drawMetricCard(cardsStartX + i * (cardWidth + cardSpacingX), y, row1Metrics[i].value, row1Metrics[i].label, row1Metrics[i].unit, row1Metrics[i].grade);
      }
      // Draw row 2
      for (let i = 0; i < row2Metrics.length; i++) {
        if (row2Metrics[i].label) {
          drawMetricCard(cardsStartX + i * (cardWidth + cardSpacingX), y + cardHeight + cardSpacingY, row2Metrics[i].value, row2Metrics[i].label, row2Metrics[i].unit, row2Metrics[i].grade);
        }
      }
      y += 2 * cardHeight + cardSpacingY; // Move y below cards
    }
    y += 35; // More space before strike zone

    // Strike Zone Heat Map (scaled)
    const zonePanelWidth = 220;
    const zonePanelHeight = 340;
    const zonePanelX = panelX + (panelWidth - zonePanelWidth) / 2;
    doc.roundedRect(zonePanelX, y, zonePanelWidth, zonePanelHeight, 10).fill(NAVY);
    y += 18;
    // Title
    doc.fontSize(15)
      .fill('white')
      .font(hasInter ? 'Inter-Bold' : 'Helvetica-Bold')
      .text('STRIKE ZONE HOT ZONES (Avg EV)', zonePanelX, y, { align: 'center', width: zonePanelWidth });
    y += 28;
    // Grid
    const zoneCellSize = 40;
    const zoneGrid = [
      [10, null, 11],
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [12, null, 13],
    ];
    const gridWidth = 3 * zoneCellSize + 2 * 7;
    const gridHeight = 5 * zoneCellSize + 4 * 7;
    const zoneX = zonePanelX + (zonePanelWidth - gridWidth) / 2;
    const zoneY = y;
    for (let row = 0; row < zoneGrid.length; row++) {
      for (let col = 0; col < 3; col++) {
        const zone = zoneGrid[row][col];
        const x = zoneX + col * (zoneCellSize + 7);
        const zY = zoneY + row * (zoneCellSize + 7);
        if (zone === null) continue;
        const ev = reportData.metrics?.exitVelocity?.hotZoneEVs?.[zone] ?? null;
        const cellColor = getZoneColor(ev);
        doc.save();
        doc.roundedRect(x, zY, zoneCellSize, zoneCellSize, 3).fill(cellColor);
        doc.roundedRect(x, zY, zoneCellSize, zoneCellSize, 3).stroke('white');
        doc.lineWidth(1.5);
        doc.restore();
        doc.fontSize(13)
          .fill(ev !== null && ev !== undefined && ev > 85 ? 'white' : NAVY)
          .font(hasInter ? 'Inter-Bold' : 'Helvetica-Bold')
          .text(zone.toString(), x, zY + 6, { align: 'center', width: zoneCellSize });
        if (ev !== null && ev !== undefined) {
          doc.fontSize(11)
            .fill(ev > 85 ? 'white' : NAVY)
            .font(hasInter ? 'Inter-Medium' : 'Helvetica')
            .text(ev.toFixed(1), x, zY + 22, { align: 'center', width: zoneCellSize });
        }
      }
    }
    // All done on one page
    doc.end();
    stream.on('finish', () => resolve(outputFilePath));
    stream.on('error', reject);
  });
}

module.exports = { generateReportPDF }; 