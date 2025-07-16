const { Session, Player, BatSpeedData, ExitVelocityData } = require('../models');
const benchmarks = require('../config/benchmarks');
const MetricsCalculator = require('./metricsCalculator');

async function aggregateReportData(sessionId, options = {}) {
  const { transaction } = options;
  
  // First check if session exists
  const session = await Session.findByPk(sessionId, { include: [{ model: Player, as: 'player' }], transaction });
  if (!session) {
    console.log(`Session ${sessionId} not found, skipping report aggregation`);
    return {
      session: {
        id: sessionId,
        date: new Date(),
        type: 'unknown'
      },
      player: {
        id: null,
        name: 'Unknown Player',
        level: 'High School'
      },
      metrics: {},
      summaryText: "Session data saved but report generation skipped. Please refresh to view the complete report.",
      history: [],
      trends: {}
    };
  }

  // Get player level for benchmarks
  const playerLevel = session.player?.player_level || 'High School';

  // Calculate detailed metrics using MetricsCalculator
  let batSpeedMetrics = null;
  let exitVelocityMetrics = null;
  let summaryText = '';

  try {
    if (session.session_type === 'blast') {
      console.log('[REPORT] Calculating bat speed metrics for session', sessionId);
      batSpeedMetrics = await MetricsCalculator.calculateBatSpeedMetrics(sessionId, playerLevel, options);
      console.log('[REPORT] Bat speed metrics:', batSpeedMetrics);
      summaryText += `### Bat Speed Metrics\n`;
      summaryText += `Max Bat Speed: ${batSpeedMetrics.maxBatSpeed} mph (Benchmark: ${batSpeedMetrics.benchmark.maxBatSpeed})\n  - Grade: ${batSpeedMetrics.grades.maxBatSpeed}\n\n`;
      summaryText += `Average Bat Speed: ${batSpeedMetrics.avgBatSpeed} mph (Benchmark: ${batSpeedMetrics.benchmark.avgBatSpeed})\n  - Grade: ${batSpeedMetrics.grades.avgBatSpeed}\n\n`;
      summaryText += `Average Attack Angle: ${batSpeedMetrics.avgAttackAngle}° (Benchmark: ${batSpeedMetrics.benchmark.avgAttackAngle}°)\n  - Grade: ${batSpeedMetrics.grades.attackAngle}\n\n`;
      summaryText += `Average Time to Contact: ${batSpeedMetrics.avgTimeToContact} sec (Benchmark: ${batSpeedMetrics.benchmark.avgTimeToContact} sec)\n  - Grade: ${batSpeedMetrics.grades.timeToContact}\n`;
    }

    if (session.session_type === 'hittrax') {
      console.log('[REPORT] Calculating exit velocity metrics for session', sessionId);
      exitVelocityMetrics = await MetricsCalculator.calculateExitVelocityMetrics(sessionId, playerLevel, options);
      console.log('[REPORT] Exit velocity metrics:', exitVelocityMetrics);
      summaryText += `### Exit Velocity Metrics\n`;
      summaryText += `Max Exit Velocity: ${exitVelocityMetrics.maxExitVelocity ?? 'N/A'} mph (Benchmark: ${exitVelocityMetrics.benchmark.maxEV})\n  - Grade: ${exitVelocityMetrics.grades.maxExitVelocity ?? 'N/A'}\n\n`;
      summaryText += `Average Exit Velocity: ${exitVelocityMetrics.avgExitVelocity ?? 'N/A'} mph (Benchmark: ${exitVelocityMetrics.benchmark.avgEV})\n  - Grade: ${exitVelocityMetrics.grades.avgExitVelocity ?? 'N/A'}\n\n`;
      summaryText += `Damage Zone: ${exitVelocityMetrics.launchAngleTop5 ?? 'N/A'}° (Benchmark: ${exitVelocityMetrics.benchmark.hhbLA}°)\n  - Grade: ${exitVelocityMetrics.grades.launchAngleTop5 ?? 'N/A'}\n\n`;
      summaryText += `Average Launch Angle: ${exitVelocityMetrics.avgLaunchAngle ?? 'N/A'}° (Benchmark: ${exitVelocityMetrics.benchmark.avgLA}°)\n  - Grade: ${exitVelocityMetrics.grades.avgLaunchAngle ?? 'N/A'}\n`;
    }
  } catch (err) {
    console.error('[REPORT] Metrics calculation failed:', err);
    summaryText = 'No valid data found for this session, or metrics calculation failed.';
  }

  // Fetch session history for this player (sorted by date)
  const allSessions = await Session.findAll({
    where: { player_id: session.player_id },
    order: [['session_date', 'ASC']],
    transaction
  });
  // For each session, aggregate key metrics using MetricsCalculator for consistency
  const sessionHistory = await Promise.all(allSessions.map(async (s) => {
    let avgBatSpeed = null, topBatSpeed = null, avgExitVelocity = null, topExitVelocity = null;
    
    if (s.session_type === 'blast') {
      try {
        // Use the player's level for this specific session, fallback to current player level
        const sessionPlayerLevel = s.player?.player_level || playerLevel;
        const batSpeedMetrics = await MetricsCalculator.calculateBatSpeedMetrics(s.id, sessionPlayerLevel, options);
        avgBatSpeed = batSpeedMetrics.avgBatSpeed;
        topBatSpeed = batSpeedMetrics.maxBatSpeed;
      } catch (error) {
        console.log(`[HISTORY] Could not calculate bat speed metrics for session ${s.id}:`, error.message);
        // Fallback to simple calculation if MetricsCalculator fails
        try {
          const batSpeeds = await BatSpeedData.findAll({ 
            where: { session_id: s.id },
            attributes: ['bat_speed'],
            raw: true
          });
          const batSpeedVals = batSpeeds.map(row => parseFloat(row.bat_speed)).filter(val => !isNaN(val) && val > 0);
          if (batSpeedVals.length > 0) {
            avgBatSpeed = +(batSpeedVals.reduce((a, b) => a + b, 0) / batSpeedVals.length).toFixed(2);
            topBatSpeed = Math.max(...batSpeedVals);
          }
        } catch (fallbackError) {
          console.log(`[HISTORY] Fallback calculation also failed for session ${s.id}:`, fallbackError.message);
        }
      }
    }
    
    if (s.session_type === 'hittrax') {
      try {
        // Use the player's level for this specific session, fallback to current player level
        const sessionPlayerLevel = s.player?.player_level || playerLevel;
        const exitVelocityMetrics = await MetricsCalculator.calculateExitVelocityMetrics(s.id, sessionPlayerLevel, options);
        avgExitVelocity = exitVelocityMetrics.avgExitVelocity;
        topExitVelocity = exitVelocityMetrics.maxExitVelocity;
      } catch (error) {
        console.log(`[HISTORY] Could not calculate exit velocity metrics for session ${s.id}:`, error.message);
        // Fallback to simple calculation if MetricsCalculator fails
        try {
          const exitVelocities = await ExitVelocityData.findAll({ 
            where: { session_id: s.id },
            attributes: ['exit_velocity'],
            raw: true
          });
          const exitVelocityVals = exitVelocities.map(row => parseFloat(row.exit_velocity)).filter(val => !isNaN(val) && val > 0);
          if (exitVelocityVals.length > 0) {
            avgExitVelocity = +(exitVelocityVals.reduce((a, b) => a + b, 0) / exitVelocityVals.length).toFixed(2);
            topExitVelocity = Math.max(...exitVelocityVals);
          }
        } catch (fallbackError) {
          console.log(`[HISTORY] Fallback calculation also failed for session ${s.id}:`, fallbackError.message);
        }
      }
    }
    
    return {
      sessionId: s.id,
      sessionDate: s.session_date,
      sessionType: s.session_type,
      metrics: {
        avgBatSpeed,
        topBatSpeed,
        avgExitVelocity,
        topExitVelocity
      }
    };
  }));
  // Calculate trends
  const trends = MetricsCalculator.calculateSessionTrends(sessionHistory);

  // Structure data
  const reportData = {
    session: {
      id: session.id,
      date: session.session_date,
      type: session.session_type
    },
    player: {
      id: session.player.id,
      name: session.player.name,
      level: playerLevel
    },
    metrics: {
      batSpeed: batSpeedMetrics,
      exitVelocity: exitVelocityMetrics
    },
    summaryText,
    history: sessionHistory,
    trends
  };

  return reportData;
}

module.exports = { aggregateReportData }; 