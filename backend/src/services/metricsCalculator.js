const { BatSpeedData, ExitVelocityData } = require('../models');
const benchmarks = require('../config/benchmarks');

class MetricsCalculator {
  /**
   * Calculate bat speed metrics for a session
   * @param {number} sessionId - Database session ID
   * @param {string} playerLevel - Player level for benchmarks
   * @returns {Promise<Object>} - Calculated metrics
   */
  static async calculateBatSpeedMetrics(sessionId, playerLevel) {
    try {
      // Get all bat speed data for the session
      const batSpeedData = await BatSpeedData.findAll({
        where: { session_id: sessionId },
        attributes: ['bat_speed', 'attack_angle', 'time_to_contact']
      });

      if (batSpeedData.length === 0) {
        throw new Error('No bat speed data found for this session');
      }

      // Extract arrays of values
      const batSpeeds = batSpeedData.map(row => row.bat_speed).filter(val => val !== null);
      const attackAngles = batSpeedData.map(row => row.attack_angle).filter(val => val !== null);
      const timeToContacts = batSpeedData.map(row => row.time_to_contact).filter(val => val !== null);

      if (batSpeeds.length === 0) {
        throw new Error('No valid bat speed data found');
      }

      // Calculate metrics
      const avgBatSpeed = this.calculateAverage(batSpeeds);
      let top10PercentBatSpeed = this.calculatePercentile(batSpeeds, 90);
      if (typeof top10PercentBatSpeed !== 'number' || isNaN(top10PercentBatSpeed)) top10PercentBatSpeed = 0;

      // Get attack angle for top 10% bat speed swings
      const top10BatSpeedThreshold = top10PercentBatSpeed;
      const top10AttackAngles = attackAngles.filter((_, index) => batSpeeds[index] >= top10BatSpeedThreshold);
      let avgAttackAngleTop10 = this.calculateAverage(top10AttackAngles);
      if (typeof avgAttackAngleTop10 !== 'number' || isNaN(avgAttackAngleTop10)) avgAttackAngleTop10 = 0;

      let avgTimeToContact = this.calculateAverage(timeToContacts);
      if (typeof avgTimeToContact !== 'number' || isNaN(avgTimeToContact)) avgTimeToContact = 0;

      // Get benchmarks
      const benchmark = benchmarks[playerLevel];
      if (!benchmark) {
        throw new Error(`No benchmarks found for player level: ${playerLevel}`);
      }

      // Evaluate performance
      const batSpeedGrade = this.evaluatePerformance(avgBatSpeed, benchmark['Avg BatSpeed']);
      const top10Grade = this.evaluatePerformance(top10PercentBatSpeed, benchmark['90th% BatSpeed']);
      const attackAngleGrade = this.evaluatePerformance(avgAttackAngleTop10, benchmark['Avg AttackAngle']);
      const timeToContactGrade = this.evaluatePerformance(avgTimeToContact, benchmark['Avg TimeToContact'], true);

      return {
        avgBatSpeed: parseFloat(avgBatSpeed.toFixed(2)),
        top10PercentBatSpeed: parseFloat(top10PercentBatSpeed.toFixed(2)),
        avgAttackAngleTop10: parseFloat(avgAttackAngleTop10.toFixed(2)),
        avgTimeToContact: parseFloat(avgTimeToContact.toFixed(3)),
        benchmark: {
          avgBatSpeed: benchmark['Avg BatSpeed'],
          top90BatSpeed: benchmark['90th% BatSpeed'],
          avgAttackAngle: benchmark['Avg AttackAngle'],
          avgTimeToContact: benchmark['Avg TimeToContact']
        },
        grades: {
          batSpeed: batSpeedGrade,
          top10: top10Grade,
          attackAngle: attackAngleGrade,
          timeToContact: timeToContactGrade
        },
        dataPoints: batSpeeds.length
      };
    } catch (error) {
      throw new Error(`Bat speed metrics calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate exit velocity metrics for a session
   * @param {number} sessionId - Database session ID
   * @param {string} playerLevel - Player level for benchmarks
   * @returns {Promise<Object>} - Calculated metrics
   */
  static async calculateExitVelocityMetrics(sessionId, playerLevel) {
    try {
      // Get all exit velocity data for the session
      const evData = await ExitVelocityData.findAll({
        where: { session_id: sessionId },
        attributes: ['exit_velocity', 'launch_angle', 'distance', 'strike_zone']
      });

      if (evData.length === 0) {
        throw new Error('No exit velocity data found for this session');
      }

      // Extract arrays of values
      const exitVelocities = evData.map(row => row.exit_velocity).filter(val => val !== null && val > 0);
      const launchAngles = evData.map(row => row.launch_angle).filter(val => val !== null);
      const distances = evData.map(row => row.distance).filter(val => val !== null);
      const strikeZones = evData.map(row => row.strike_zone).filter(val => val !== null);

      if (exitVelocities.length === 0) {
        throw new Error('No valid (non-zero) exit velocity data found');
      }

      // Calculate metrics
      const avgExitVelocity = this.calculateAverage(exitVelocities);
      let top8PercentEV = this.calculatePercentile(exitVelocities, 92); // Top 8% = 92nd percentile
      if (typeof top8PercentEV !== 'number' || isNaN(top8PercentEV)) top8PercentEV = 0;

      // Get launch angle and distance for top 8% EV swings
      const top8Mask = exitVelocities.map(ev => ev >= top8PercentEV);
      let top8LaunchAngles = launchAngles.filter((_, index) => top8Mask[index]);
      let top8Distances = distances.filter((_, index) => top8Mask[index]);

      let avgLaunchAngleTop8 = this.calculateAverage(top8LaunchAngles);
      if (typeof avgLaunchAngleTop8 !== 'number' || isNaN(avgLaunchAngleTop8)) avgLaunchAngleTop8 = 0;
      let avgDistanceTop8 = this.calculateAverage(top8Distances);
      if (typeof avgDistanceTop8 !== 'number' || isNaN(avgDistanceTop8)) avgDistanceTop8 = 0;
      let totalAvgLaunchAngle = this.calculateAverage(launchAngles.filter(la => la > 0));
      if (typeof totalAvgLaunchAngle !== 'number' || isNaN(totalAvgLaunchAngle)) totalAvgLaunchAngle = 0;

      // Calculate strike zone distribution for top 8% EV
      const top8StrikeZones = strikeZones.filter((_, index) => top8Mask[index]);
      const strikeZoneCounts = this.aggregateStrikeZones(top8StrikeZones);

      // Get benchmarks
      const benchmark = benchmarks[playerLevel];
      if (!benchmark) {
        throw new Error(`No benchmarks found for player level: ${playerLevel}`);
      }

      // Evaluate performance
      const evGrade = this.evaluatePerformance(avgExitVelocity, benchmark['Avg EV'], false, true);
      const top8Grade = this.evaluatePerformance(top8PercentEV, benchmark['Top 8th EV'], false, true);
      const laTop8Grade = this.evaluatePerformance(avgLaunchAngleTop8, benchmark['HHB LA']);
      const laTotalGrade = this.evaluatePerformance(totalAvgLaunchAngle, benchmark['Avg LA']);

      return {
        avgExitVelocity: parseFloat(avgExitVelocity.toFixed(2)),
        top8PercentEV: parseFloat(top8PercentEV.toFixed(2)),
        avgLaunchAngleTop8: parseFloat(avgLaunchAngleTop8.toFixed(2)),
        avgDistanceTop8: parseFloat(avgDistanceTop8.toFixed(2)),
        totalAvgLaunchAngle: parseFloat(totalAvgLaunchAngle.toFixed(2)),
        strikeZoneCounts: strikeZoneCounts,
        benchmark: {
          avgEV: benchmark['Avg EV'],
          top8EV: benchmark['Top 8th EV'],
          avgLA: benchmark['Avg LA'],
          hhbLA: benchmark['HHB LA']
        },
        grades: {
          exitVelocity: evGrade,
          top8EV: top8Grade,
          launchAngleTop8: laTop8Grade,
          launchAngleTotal: laTotalGrade
        },
        dataPoints: exitVelocities.length
      };
    } catch (error) {
      throw new Error(`Exit velocity metrics calculation failed: ${error.message}`);
    }
  }

  /**
   * Evaluate performance against benchmark (ported from Python code)
   * @param {number} metric - Actual metric value
   * @param {number} benchmark - Benchmark value
   * @param {boolean} lowerIsBetter - Whether lower values are better
   * @param {boolean} specialMetric - Special handling for EV metrics
   * @returns {string} - Performance grade
   */
  static evaluatePerformance(metric, benchmark, lowerIsBetter = false, specialMetric = false) {
    if (specialMetric) {
      // For EV: "Average" if metric in [benchmark-3, benchmark]
      if (benchmark - 3 <= metric && metric <= benchmark) {
        return "Average";
      } else if (metric < benchmark - 3) {
        return "Below Average";
      } else {
        return "Above Average";
      }
    } else {
      if (lowerIsBetter) {
        if (metric < benchmark) {
          return "Above Average";
        } else if (metric <= benchmark * 1.1) {
          return "Average";
        } else {
          return "Below Average";
        }
      } else {
        if (metric > benchmark) {
          return "Above Average";
        } else if (metric >= benchmark * 0.9) {
          return "Average";
        } else {
          return "Below Average";
        }
      }
    }
  }

  /**
   * Calculate average of array
   * @param {Array<number>} values - Array of numbers
   * @returns {number} - Average value
   */
  static calculateAverage(values) {
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate percentile of array
   * @param {Array<number>} values - Array of numbers
   * @param {number} percentile - Percentile (0-100)
   * @returns {number} - Percentile value
   */
  static calculatePercentile(values, percentile) {
    if (!values || values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    
    if (index === Math.floor(index)) {
      return sorted[index];
    } else {
      const lower = sorted[Math.floor(index)];
      const upper = sorted[Math.ceil(index)];
      return lower + (upper - lower) * (index - Math.floor(index));
    }
  }

  /**
   * Aggregate strike zone data
   * @param {Array<number>} strikeZones - Array of strike zone numbers
   * @returns {Object} - Strike zone counts
   */
  static aggregateStrikeZones(strikeZones) {
    const counts = {};
    strikeZones.forEach(zone => {
      if (zone !== null && zone !== undefined) {
        counts[zone] = (counts[zone] || 0) + 1;
      }
    });
    return counts;
  }

  /**
   * Get available player levels
   * @returns {Array<string>} - Available player levels
   */
  static getAvailableLevels() {
    return Object.keys(benchmarks);
  }

  /**
   * Calculate trends between sessions for a player
   * @param {Array<Object>} sessions - Array of session objects sorted by date, each with metrics
   * @returns {Array<Object>} - Array of trend objects for each session after the first
   */
  static calculateSessionTrends(sessions) {
    const trends = [];
    for (let i = 1; i < sessions.length; i++) {
      const prev = sessions[i - 1].metrics;
      const curr = sessions[i].metrics;
      trends.push({
        sessionId: sessions[i].sessionId,
        sessionDate: sessions[i].sessionDate,
        trends: {
          avgBatSpeed: (curr.avgBatSpeed != null && prev.avgBatSpeed != null) ? +(curr.avgBatSpeed - prev.avgBatSpeed).toFixed(2) : null,
          topBatSpeed: (curr.topBatSpeed != null && prev.topBatSpeed != null) ? +(curr.topBatSpeed - prev.topBatSpeed).toFixed(2) : null,
          avgExitVelocity: (curr.avgExitVelocity != null && prev.avgExitVelocity != null) ? +(curr.avgExitVelocity - prev.avgExitVelocity).toFixed(2) : null,
          topExitVelocity: (curr.topExitVelocity != null && prev.topExitVelocity != null) ? +(curr.topExitVelocity - prev.topExitVelocity).toFixed(2) : null
        }
      });
    }
    return trends;
  }
}

module.exports = MetricsCalculator; 