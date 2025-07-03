const { parse } = require('csv-parse/sync');
const { calculateMean, calculateQuantile, grade, getBenchmarksForLevel } = require('./metricsUtils');

/**
 * Pure function to parse Blast Motion CSV and calculate bat speed metrics
 * @param {Buffer} csvBuffer - Raw CSV file buffer
 * @returns {Object} Calculated metrics
 */
function parseBlastCSV(csvBuffer) {
  try {
    // Convert buffer to string and skip first 8 lines (device header noise)
    const csvString = csvBuffer.toString('utf-8');
    const lines = csvString.split('\n');
    const dataLines = lines.slice(8); // Skip first 8 lines
    const csvData = dataLines.join('\n');

    // Parse CSV
    const records = parse(csvData, {
      columns: false,
      skip_empty_lines: true,
      trim: true
    });

    // Extract relevant columns (0-based index)
    const batSpeedData = [];
    const attackAngleData = [];
    const timeToContactData = [];

    records.forEach(row => {
      // Column 7: batSpeed_mph
      const batSpeed = parseFloat(row[7]);
      if (!isNaN(batSpeed) && batSpeed > 0) {
        batSpeedData.push(batSpeed);
      }

      // Column 10: attackAngle_deg
      const attackAngle = parseFloat(row[10]);
      if (!isNaN(attackAngle)) {
        attackAngleData.push(attackAngle);
      }

      // Column 15: timeToContact_s
      const timeToContact = parseFloat(row[15]);
      if (!isNaN(timeToContact) && timeToContact > 0) {
        timeToContactData.push(timeToContact);
      }
    });

    // Calculate metrics
    const playerAvgBatSpeed = calculateMean(batSpeedData);
    const top10pctBatSpeed = calculateQuantile(batSpeedData, 0.90);
    
    // Calculate avgAttackAngleTop10 (mean of attack angles where bat speed >= top10pct)
    const top10BatSpeedIndices = batSpeedData
      .map((speed, index) => ({ speed, index }))
      .filter(item => item.speed >= top10pctBatSpeed)
      .map(item => item.index);
    
    const top10AttackAngles = top10BatSpeedIndices
      .map(index => attackAngleData[index])
      .filter(angle => !isNaN(angle));
    
    const avgAttackAngleTop10 = calculateMean(top10AttackAngles);
    const avgTimeToContact = calculateMean(timeToContactData);

    return {
      playerAvgBatSpeed,
      top10pctBatSpeed,
      avgAttackAngleTop10,
      avgTimeToContact,
      rawRows: records.length,
      validBatSpeedRows: batSpeedData.length,
      validAttackAngleRows: attackAngleData.length,
      validTimeToContactRows: timeToContactData.length
    };

  } catch (error) {
    throw new Error(`Failed to parse Blast CSV: ${error.message}`);
  }
}

/**
 * Get grades for all bat speed metrics
 */
function getBlastGrades(metrics, playerLevel = 'High School') {
  const levelBenchmarks = getBenchmarksForLevel(playerLevel);
  
  return {
    batSpeedGrade: grade(metrics.playerAvgBatSpeed, levelBenchmarks['Avg BatSpeed']),
    top10pctGrade: grade(metrics.top10pctBatSpeed, levelBenchmarks['90th% BatSpeed']),
    attackAngleGrade: grade(metrics.avgAttackAngleTop10, levelBenchmarks['Avg AttackAngle']),
    timeToContactGrade: grade(metrics.avgTimeToContact, levelBenchmarks['Avg TimeToContact'], { lowerIsBetter: true })
  };
}

module.exports = {
  parseBlastCSV,
  getBlastGrades
}; 