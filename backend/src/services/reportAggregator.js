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
  const playerLevel = session.player_level || 'High School';

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
      summaryText += `Launch Angle of Top 5% EV: ${exitVelocityMetrics.launchAngleTop5 ?? 'N/A'}° (Benchmark: ${exitVelocityMetrics.benchmark.hhbLA}°)\n  - Grade: ${exitVelocityMetrics.grades.launchAngleTop5 ?? 'N/A'}\n\n`;
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
  // For each session, aggregate key metrics (reuse logic from playerController)
  const sessionHistory = await Promise.all(allSessions.map(async (s) => {
    let avgBatSpeed = null, topBatSpeed = null, avgExitVelocity = null, topExitVelocity = null;
    if (s.session_type === 'blast') {
      const batSpeeds = await BatSpeedData.findAll({ where: { session_id: s.id } });
      const batSpeedVals = batSpeeds.map(row => parseFloat(row.bat_speed)).filter(Number.isFinite);
      avgBatSpeed = batSpeedVals.length ? (batSpeedVals.reduce((a, b) => a + b, 0) / batSpeedVals.length) : null;
      topBatSpeed = batSpeedVals.length ? Math.max(...batSpeedVals) : null;
    }
    if (s.session_type === 'hittrax') {
      const exitVelocities = await ExitVelocityData.findAll({ where: { session_id: s.id } });
      const exitVelocityVals = exitVelocities.map(row => parseFloat(row.exit_velocity)).filter(Number.isFinite);
      avgExitVelocity = exitVelocityVals.length ? (exitVelocityVals.reduce((a, b) => a + b, 0) / exitVelocityVals.length) : null;
      topExitVelocity = exitVelocityVals.length ? Math.max(...exitVelocityVals) : null;
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