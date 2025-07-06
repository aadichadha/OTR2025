const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// PDF page setup
const pageWidth = 612;  // US Letter portrait
const pageHeight = 792;
const margin = 36;
const contentWidth = pageWidth - 2 * margin;
const contentHeight = pageHeight - 2 * margin;

// Color constants (same as web)
const NAVY = '#1a2340';
const PANEL_BG = '#fff';
const CARD_BG = NAVY;
const CARD_TEXT = '#fff';
const METRIC_LABEL = '#7ecbff';
const METRIC_UNIT = '#b3c6e0';

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
    doc.roundedRect(panelX, panelY, panelWidth, panelHeight, 18).fill(PANEL_BG);

    // Header (centered)
    const logoPath = path.resolve(__dirname, '../../frontend/public/images/otrbaseball-main.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, panelX + 12, panelY + 18, { fit: [90, 32] });
    }
    doc.fontSize(28).fill(NAVY).font('Helvetica-Bold').text('Performance Report', panelX, panelY + 18, {
      align: 'center',
      width: panelWidth
    });
    doc.fontSize(13).fill(METRIC_UNIT).font('Helvetica-Bold').text(
      `${reportData.player.name} • ${new Date(reportData.session.date).toLocaleDateString()} • ${reportData.session.type.toUpperCase()}`,
      panelX, panelY + 52, {
        align: 'center',
        width: panelWidth
      }
    );

    // --- Layout calculations ---
    let y = panelY + 90;
    // Metric cards: 2 rows of 3, smaller size
    const cardWidth = 110;
    const cardHeight = 70;
    const cardSpacingX = 18;
    const cardSpacingY = 18;
    const cardsPerRow = 3;
    const totalCardsWidth = (cardWidth * cardsPerRow) + (cardSpacingX * (cardsPerRow - 1));
    const cardsStartX = panelX + (panelWidth - totalCardsWidth) / 2;

    // Draw metric cards
    const drawMetricCard = (x, y, value, label, unit, grade) => {
      doc.save();
      doc.roundedRect(x, y, cardWidth, cardHeight, 12).fill(CARD_BG);
      doc.roundedRect(x, y, cardWidth, cardHeight, 12).stroke(NAVY);
      // Value
      const valueText = value !== null && value !== undefined ? Number(value).toFixed(1) : 'N/A';
      doc.fontSize(24).fill(CARD_TEXT).font('Helvetica-Bold').text(valueText, x, y + 10, {
        align: 'center', width: cardWidth
      });
      // Unit
      if (unit) {
        doc.fontSize(13).fill(METRIC_UNIT).font('Helvetica').text(unit, x + cardWidth - 32, y + 10, {
          align: 'left', width: 28
        });
      }
      // Label
      doc.fontSize(10).fill(METRIC_LABEL).font('Helvetica-Bold').text(label, x, y + 38, {
        align: 'center', width: cardWidth
      });
      // Grade
      if (grade) {
        const gradeColor = getGradeColor(grade);
        doc.fontSize(9).fill(gradeColor).font('Helvetica-Bold').text(grade, x, y + cardHeight - 16, {
          align: 'center', width: cardWidth
        });
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
          { value: metrics.barrels || 0, label: 'BARRELS', unit: '', grade: 'Quality' },
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
      y += 2 * cardHeight + cardSpacingY + 24; // Move y below cards
    }

    // Strike Zone Heat Map (scaled to fit)
    const zonePanelWidth = 340;
    const zonePanelHeight = 260;
    const zonePanelX = panelX + (panelWidth - zonePanelWidth) / 2;
    doc.roundedRect(zonePanelX, y, zonePanelWidth, zonePanelHeight, 12).fill(NAVY);
    y += 18;
    // Title
    doc.fontSize(15).fill('white').font('Helvetica-Bold').text('STRIKE ZONE HOT ZONES (Avg EV)', zonePanelX, y, {
      align: 'center', width: zonePanelWidth
    });
    y += 28;
    // Grid
    const zoneCellSize = 38;
    const zoneGrid = [
      [10, null, 11],
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [12, null, 13],
    ];
    const gridWidth = 3 * zoneCellSize + 2 * 6;
    const gridHeight = 5 * zoneCellSize + 4 * 6;
    const zoneX = zonePanelX + (zonePanelWidth - gridWidth) / 2;
    const zoneY = y;
    for (let row = 0; row < zoneGrid.length; row++) {
      for (let col = 0; col < 3; col++) {
        const zone = zoneGrid[row][col];
        const x = zoneX + col * (zoneCellSize + 6);
        const zY = zoneY + row * (zoneCellSize + 6);
        if (zone === null) continue;
        const ev = reportData.metrics?.exitVelocity?.hotZoneEVs?.[zone] ?? null;
        const cellColor = getZoneColor(ev);
        doc.save();
        doc.roundedRect(x, zY, zoneCellSize, zoneCellSize, 4).fill(cellColor);
        doc.roundedRect(x, zY, zoneCellSize, zoneCellSize, 4).stroke('white');
        doc.lineWidth(1.5);
        doc.restore();
        doc.fontSize(11).fill(ev !== null && ev !== undefined && ev > 85 ? 'white' : NAVY).font('Helvetica-Bold').text(zone.toString(), x, zY + 5, { align: 'center', width: zoneCellSize });
        if (ev !== null && ev !== undefined) {
          doc.fontSize(10).fill(ev > 85 ? 'white' : NAVY).font('Helvetica-Bold').text(ev.toFixed(1), x, zY + 20, { align: 'center', width: zoneCellSize });
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
module.exports = { generateReportPDF }; 