const { Session, Player, BatSpeedData, ExitVelocityData } = require('../models');
const benchmarks = require('../config/benchmarks');
const MetricsCalculator = require('./metricsCalculator');

async function aggregateReportData(sessionId) {
  // Fetch session
  const session = await Session.findByPk(sessionId, { include: [Player] });
  if (!session) throw new Error('Session not found');

  // Fetch all bat speed and exit velocity data for this session
  const batSpeedRows = await BatSpeedData.findAll({ where: { session_id: sessionId } });
  const exitVelocityRows = await ExitVelocityData.findAll({ where: { session_id: sessionId } });

  // Calculate metrics
  const batSpeeds = batSpeedRows.map(row => row.bat_speed).filter(Number.isFinite);
  const attackAngles = batSpeedRows.map(row => row.attack_angle).filter(Number.isFinite);
  const timeToContacts = batSpeedRows.map(row => row.time_to_contact).filter(Number.isFinite);

  const exitVelocities = exitVelocityRows.map(row => row.exit_velocity).filter(Number.isFinite);
  const launchAngles = exitVelocityRows.map(row => row.launch_angle).filter(Number.isFinite);
  const distances = exitVelocityRows.map(row => row.distance).filter(Number.isFinite);
  const strikeZones = exitVelocityRows.map(row => row.strike_zone).filter(Number.isFinite);

  // Helper for average
  const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  // Get player level for benchmarks
  const playerLevel = session.player_level || 'High School';
  const bm = benchmarks[playerLevel] || benchmarks['High School'];

  // Fetch session history for this player (sorted by date)
  const allSessions = await Session.findAll({
    where: { player_id: session.player_id },
    order: [['session_date', 'ASC']],
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
      id: session.Player.id,
      name: session.Player.name,
      level: playerLevel
    },
    metrics: {
      batSpeed: {
        values: batSpeeds,
        average: avg(batSpeeds),
        benchmark: bm.batSpeed,
        aboveBenchmark: avg(batSpeeds) && bm.batSpeed ? avg(batSpeeds) >= bm.batSpeed : null
      },
      attackAngle: {
        values: attackAngles,
        average: avg(attackAngles),
        benchmark: bm.attackAngle,
        aboveBenchmark: avg(attackAngles) && bm.attackAngle ? avg(attackAngles) >= bm.attackAngle : null
      },
      timeToContact: {
        values: timeToContacts,
        average: avg(timeToContacts),
        benchmark: bm.timeToContact,
        aboveBenchmark: avg(timeToContacts) && bm.timeToContact ? avg(timeToContacts) <= bm.timeToContact : null // lower is better
      },
      exitVelocity: {
        values: exitVelocities,
        average: avg(exitVelocities),
        benchmark: bm.exitVelocity,
        aboveBenchmark: avg(exitVelocities) && bm.exitVelocity ? avg(exitVelocities) >= bm.exitVelocity : null
      },
      launchAngle: {
        values: launchAngles,
        average: avg(launchAngles),
        benchmark: bm.launchAngle,
        aboveBenchmark: avg(launchAngles) && bm.launchAngle ? avg(launchAngles) >= bm.launchAngle : null
      },
      distance: {
        values: distances,
        average: avg(distances),
        benchmark: bm.distance,
        aboveBenchmark: avg(distances) && bm.distance ? avg(distances) >= bm.distance : null
      },
      strikeZone: {
        values: strikeZones
      }
    },
    history: sessionHistory,
    trends
  };

  return reportData;
}

module.exports = { aggregateReportData }; 