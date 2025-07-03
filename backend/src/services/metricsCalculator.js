const { BatSpeedData, ExitVelocityData } = require('../models');
const benchmarks = require('../config/benchmarks');

class MetricsCalculator {
  /**
   * Calculate bat speed metrics for a session
   * @param {number} sessionId - Database session ID
   * @param {string} playerLevel - Player level for benchmarks
   * @param {Object} options - Options object that may contain transaction
   * @returns {Promise<Object>} - Calculated metrics
   */
  static async calculateBatSpeedMetrics(sessionId, playerLevel, options = {}) {
    try {
      // Get all bat speed data for the session
      const batSpeedData = await BatSpeedData.findAll({
        where: { session_id: sessionId },
        attributes: ['bat_speed', 'attack_angle', 'time_to_contact'],
        ...options
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
      const maxBatSpeed = Math.max(...batSpeeds);
      const avgBatSpeed = this.calculateAverage(batSpeeds);
      const avgAttackAngle = this.calculateAverage(attackAngles);
      const avgTimeToContact = this.calculateAverage(timeToContacts);

      // Get benchmarks
      const benchmark = benchmarks[playerLevel];
      if (!benchmark) {
        throw new Error(`No benchmarks found for player level: ${playerLevel}`);
      }

      // Evaluate performance
      const maxBatSpeedGrade = this.evaluatePerformance(maxBatSpeed, benchmark['90th% BatSpeed']);
      const avgBatSpeedGrade = this.evaluatePerformance(avgBatSpeed, benchmark['Avg BatSpeed']);
      const attackAngleGrade = this.evaluatePerformance(avgAttackAngle, benchmark['Avg AttackAngle']);
      const timeToContactGrade = this.evaluatePerformance(avgTimeToContact, benchmark['Avg TimeToContact'], true);

      return {
        maxBatSpeed: parseFloat(maxBatSpeed.toFixed(2)),
        avgBatSpeed: parseFloat(avgBatSpeed.toFixed(2)),
        avgAttackAngle: parseFloat(avgAttackAngle.toFixed(2)),
        avgTimeToContact: parseFloat(avgTimeToContact.toFixed(3)),
        benchmark: {
          maxBatSpeed: benchmark['90th% BatSpeed'],
          avgBatSpeed: benchmark['Avg BatSpeed'],
          avgAttackAngle: benchmark['Avg AttackAngle'],
          avgTimeToContact: benchmark['Avg TimeToContact']
        },
        grades: {
          maxBatSpeed: maxBatSpeedGrade,
          avgBatSpeed: avgBatSpeedGrade,
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
   * @param {Object} options - Options object that may contain transaction
   * @returns {Promise<Object>} - Calculated metrics
   */
  static async calculateExitVelocityMetrics(sessionId, playerLevel, options = {}) {
    try {
      // Get all exit velocity data for the session
      const evData = await ExitVelocityData.findAll({
        where: { session_id: sessionId },
        attributes: ['exit_velocity', 'launch_angle', 'distance', 'strike_zone'],
        ...options
      });

      if (evData.length === 0) {
        throw new Error('No exit velocity data found for this session');
      }

      // Extract arrays of values with proper type normalization for PostgreSQL/SQLite compatibility
      const exitVelocities = evData.map(row => {
        const val = parseFloat(row.exit_velocity);
        return isNaN(val) || val <= 0 ? null : val;
      }).filter(val => val !== null);
      
      const launchAngles = evData.map(row => {
        const val = parseFloat(row.launch_angle);
        return isNaN(val) || Math.abs(val) <= 0.01 ? null : val;
      }).filter(val => val !== null);
      
      const distances = evData.map(row => {
        const val = parseFloat(row.distance);
        return isNaN(val) || val <= 0 ? null : val;
      }).filter(val => val !== null);
      
      const strikeZones = evData.map(row => {
        const val = parseInt(row.strike_zone);
        return isNaN(val) ? null : val;
      }).filter(val => val !== null);

      // Calculate metrics only if there is valid data
      const maxExitVelocity = exitVelocities.length ? Math.max(...exitVelocities) : null;
      const avgExitVelocity = exitVelocities.length ? (exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length) : null;
      const avgLaunchAngle = launchAngles.length ? (launchAngles.reduce((a, b) => a + b, 0) / launchAngles.length) : null;
      const avgDistance = distances.length ? (distances.reduce((a, b) => a + b, 0) / distances.length) : null;

      // Calculate top 5% launch angle (by EV)
      let launchAngleTop5 = null;
      if (exitVelocities.length > 0 && launchAngles.length > 0) {
        const paired = evData
          .map(row => ({
            ev: parseFloat(row.exit_velocity),
            la: parseFloat(row.launch_angle)
          }))
          .filter(row => row.ev > 0 && !isNaN(row.la));
        const top5Count = Math.ceil(paired.length * 0.05);
        const top5 = paired.sort((a, b) => b.ev - a.ev).slice(0, top5Count);
        const top5LAs = top5.map(row => row.la).filter(la => la && Math.abs(la) > 0.01);
        launchAngleTop5 = top5LAs.length ? (top5LAs.reduce((a, b) => a + b, 0) / top5LAs.length) : null;
      }

      // Calculate average EV per strike zone (1-13) with proper type handling
      const hotZoneEVs = {};
      for (let zone = 1; zone <= 13; zone++) {
        const zoneEVs = evData
          .filter(row => {
            const sz = parseInt(row.strike_zone);
            const ev = parseFloat(row.exit_velocity);
            return sz === zone && ev > 0 && !isNaN(ev);
          })
          .map(row => parseFloat(row.exit_velocity));
        hotZoneEVs[zone] = zoneEVs.length ? +(zoneEVs.reduce((a, b) => a + b, 0) / zoneEVs.length).toFixed(1) : null;
      }

      // Get benchmarks
      const benchmark = benchmarks[playerLevel];
      if (!benchmark) {
        throw new Error(`No benchmarks found for player level: ${playerLevel}`);
      }

      // Evaluate performance
      const maxEVGrade = maxExitVelocity !== null ? this.evaluatePerformance(maxExitVelocity, benchmark['Top 8th EV'], false, true) : null;
      const avgEVGrade = avgExitVelocity !== null ? this.evaluatePerformance(avgExitVelocity, benchmark['Avg EV'], false, true) : null;
      const laTop5Grade = launchAngleTop5 !== null ? this.evaluatePerformance(launchAngleTop5, benchmark['HHB LA']) : null;
      const laAvgGrade = avgLaunchAngle !== null ? this.evaluatePerformance(avgLaunchAngle, benchmark['Avg LA']) : null;

      // Before returning, log avgDistance and hotZoneEVs for debugging
      console.log('[DEBUG] calculateExitVelocityMetrics:', { avgDistance, hotZoneEVs });
      const result = {
        maxExitVelocity,
        avgExitVelocity,
        launchAngleTop5,
        avgLaunchAngle,
        avgDistance: avgDistance !== undefined ? avgDistance : null,
        hotZoneEVs: hotZoneEVs || {},
        benchmark: {
          maxEV: benchmark['Top 8th EV'],
          avgEV: benchmark['Avg EV'],
          avgLA: benchmark['Avg LA'],
          hhbLA: benchmark['HHB LA']
        },
        grades: {
          maxExitVelocity: maxEVGrade,
          avgExitVelocity: avgEVGrade,
          launchAngleTop5: laTop5Grade,
          avgLaunchAngle: laAvgGrade
        },
        dataPoints: exitVelocities.length
      };
      console.log('[DEBUG] Returning exit velocity metrics:', result);
      return result;
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