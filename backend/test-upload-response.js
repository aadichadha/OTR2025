const { BatSpeedData, Session, Player } = require('./src/models');
const { sequelize } = require('./src/config/database');
const { aggregateReportData } = require('./src/services/reportAggregator');

async function testUploadResponse() {
  try {
    console.log('🧪 Testing Upload Response...');
    
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
    
    // Generate the exact response that the upload endpoint would return
    const reportData = await aggregateReportData(latestSession.id);
    
    const uploadResponse = {
      message: 'Blast data uploaded successfully',
      sessionId: latestSession.id,
      playerName: latestSession.player.name,
      playerCode: latestSession.player.player_code,
      sessionDate: new Date(latestSession.session_date).toDateString(),
      report: reportData,
      parseResult: {
        totalRows: 374,
        parsedRows: 4,
        errorCount: 0
      }
    };
    
    console.log('✅ Upload Response (exactly what frontend receives):');
    console.log(JSON.stringify(uploadResponse, null, 2));
    
    // Specifically check the bat speed metrics
    if (uploadResponse.report && uploadResponse.report.metrics && uploadResponse.report.metrics.batSpeed) {
      console.log('\n📊 Bat Speed Metrics in Response:');
      console.log(JSON.stringify(uploadResponse.report.metrics.batSpeed, null, 2));
    } else {
      console.log('\n❌ No bat speed metrics found in response');
    }
    
  } catch (error) {
    console.error('💥 Error testing upload response:', error);
  } finally {
    await sequelize.close();
  }
}

testUploadResponse(); 