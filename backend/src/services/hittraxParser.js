const { parse } = require('csv-parse/sync');
const { calculateMean, calculateQuantile, grade, getBenchmarksForLevel } = require('./metricsUtils');

/**
 * Pure function to parse HitTrax CSV and calculate exit velocity metrics
 * @param {Buffer} csvBuffer - Raw CSV file buffer
 * @returns {Object} Calculated metrics
 */
function parseHittraxCSV(csvBuffer) {
  try {
    // Convert buffer to string (no skip rows for HitTrax)
    const csvString = csvBuffer.toString('utf-8');

    // Parse CSV
    const records = parse(csvString, {
      columns: false,
      skip_empty_lines: true,
      trim: true
    });

    // Extract relevant columns (0-based index)
    const validRows = [];
    
    records.forEach(row => {
      // Column 5: strikeZone (int 1-13 or blank)
      const strikeZone = parseInt(row[5]);
      
      // Column 7: exitVelocity_mph
      const exitVelocity = parseFloat(row[7]);
      
      // Column 8: launchAngle_deg
      const launchAngle = parseFloat(row[8]);
      
      // Column 9: distance_ft
      const distance = parseFloat(row[9]);

      // Keep rows where exitVelocity > 0 (drop warm-ups / fouls)
      if (!isNaN(exitVelocity) && exitVelocity > 0) {
        validRows.push({
          strikeZone: isNaN(strikeZone) ? null : strikeZone,
          exitVelocity,
          launchAngle: isNaN(launchAngle) ? null : launchAngle,
          distance: isNaN(distance) ? null : distance
        });
      }
    });

    if (validRows.length === 0) {
      return {
        exitVelocityAvg: 0,
        top8pctEV: 0,
        avgLaunchAngleTop8: 0,
        avgDistanceTop8: 0,
        totalAvgLaunchAngle: 0,
        countTop8ByZone: {},
        rawRows: records.length,
        validRows: 0
      };
    }

    // Extract arrays for calculations
    const exitVelocities = validRows.map(row => row.exitVelocity);
    const launchAngles = validRows.map(row => row.launchAngle).filter(angle => angle !== null);
    const distances = validRows.map(row => row.distance).filter(dist => dist !== null);

    // Calculate metrics
    const exitVelocityAvg = calculateMean(exitVelocities);
    const top8pctEV = calculateQuantile(exitVelocities, 0.92); // 8% ≈ 92nd percentile
    
    // Create mask for top 8% exit velocity
    const maskTop8 = exitVelocities.map(ev => ev >= top8pctEV);
    
    // Calculate averages for top 8% performers
    const top8LaunchAngles = validRows
      .filter((row, index) => maskTop8[index] && row.launchAngle !== null)
      .map(row => row.launchAngle);
    
    const top8Distances = validRows
      .filter((row, index) => maskTop8[index] && row.distance !== null)
      .map(row => row.distance);
    
    const avgLaunchAngleTop8 = calculateMean(top8LaunchAngles);
    const avgDistanceTop8 = calculateMean(top8Distances);
    
    // Calculate total average launch angle (only positive angles)
    const positiveLaunchAngles = launchAngles.filter(angle => angle > 0);
    const totalAvgLaunchAngle = calculateMean(positiveLaunchAngles);

    // Calculate count by zone for top 8% performers
    const countTop8ByZone = {};
    validRows.forEach((row, index) => {
      if (maskTop8[index] && row.strikeZone !== null && row.strikeZone >= 1 && row.strikeZone <= 13) {
        countTop8ByZone[row.strikeZone] = (countTop8ByZone[row.strikeZone] || 0) + 1;
      }
    });

    // Only include zones that have counts > 0
    const filteredCountTop8ByZone = {};
    Object.keys(countTop8ByZone).forEach(zone => {
      if (countTop8ByZone[zone] > 0) {
        filteredCountTop8ByZone[zone] = countTop8ByZone[zone];
      }
    });

    return {
      exitVelocityAvg,
      top8pctEV,
      avgLaunchAngleTop8,
      avgDistanceTop8,
      totalAvgLaunchAngle,
      countTop8ByZone: filteredCountTop8ByZone,
      rawRows: records.length,
      validRows: validRows.length,
      top8Count: maskTop8.filter(Boolean).length
    };

  } catch (error) {
    throw new Error(`Failed to parse HitTrax CSV: ${error.message}`);
  }
}

/**
 * Get grades for all exit velocity metrics
 */
function getHittraxGrades(metrics, playerLevel = 'High School') {
  const levelBenchmarks = getBenchmarksForLevel(playerLevel);
  
  return {
    exitVelocityGrade: grade(metrics.exitVelocityAvg, levelBenchmarks['Avg EV'], { specialEV: true }),
    top8pctGrade: grade(metrics.top8pctEV, levelBenchmarks['Top 8th EV'], { specialEV: true }),
    launchAngleGrade: grade(metrics.avgLaunchAngleTop8, levelBenchmarks['HHB LA']),
    totalLaunchAngleGrade: grade(metrics.totalAvgLaunchAngle, levelBenchmarks['Avg LA'])
  };
}

module.exports = {
  parseHittraxCSV,
  getHittraxGrades
}; 