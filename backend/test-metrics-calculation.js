const { BatSpeedData, Session, Player } = require('./src/models');
const { sequelize } = require('./src/config/database');
const MetricsCalculator = require('./src/services/metricsCalculator');

async function testMetricsCalculation() {
  try {
    console.log('🧮 Testing Metrics Calculation...');
    
    // Find the most recent blast session
    const latestSession = await Session.findOne({
      where: { session_type: 'blast' },
      order: [['created_at', 'DESC']],
      include: [{ model: Player, as: 'player' }]
    });
    
    if (!latestSession) {
      console.log('❌ No blast sessions found');
      return;
    }
    
    console.log(`📊 Found session ID: ${latestSession.id}`);
    console.log(`👤 Player: ${latestSession.player.name}`);
    console.log(`🏷️ Level: ${latestSession.player?.player_level || 'High School'}`);
    
    // Test metrics calculation
    const playerLevel = latestSession.player?.player_level || 'High School';
    console.log(`🧮 Calculating metrics for player level: ${playerLevel}`);
    
    const metrics = await MetricsCalculator.calculateBatSpeedMetrics(latestSession.id, playerLevel);
    
    console.log('✅ Metrics calculation result:');
    console.log(JSON.stringify(metrics, null, 2));
    
    // Test report aggregator
    console.log('\n📄 Testing Report Aggregator...');
    const { aggregateReportData } = require('./src/services/reportAggregator');
    const reportData = await aggregateReportData(latestSession.id);
    
    console.log('✅ Report aggregator result:');
    if (reportData && reportData.metrics && reportData.metrics.batSpeed) {
      console.log('📊 Bat Speed Metrics:');
      console.log(JSON.stringify(reportData.metrics.batSpeed, null, 2));
    } else {
      console.log('❌ No bat speed metrics in report');
    }
    
  } catch (error) {
    console.error('💥 Error testing metrics calculation:', error);
  } finally {
    await sequelize.close();
  }
}

testMetricsCalculation(); 