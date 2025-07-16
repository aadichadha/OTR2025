const { aggregateReportData } = require('./src/services/reportAggregator');

async function testReportStructure() {
  try {
    console.log('🔍 Testing report data structure for session 13...');
    
    const data = await aggregateReportData(13);
    
    console.log('\n=== REPORT DATA STRUCTURE ===');
    console.log('Session type:', data.session.type);
    console.log('Metrics keys:', Object.keys(data.metrics || {}));
    console.log('BatSpeed object:', data.metrics?.batSpeed);
    console.log('ExitVelocity object:', data.metrics?.exitVelocity);
    
    console.log('\n=== FRONTEND LOGIC TEST ===');
    const metrics = data.metrics?.exitVelocity || data.metrics?.batSpeed;
    const isHittrax = !!data.metrics?.exitVelocity;
    console.log('isHittrax:', isHittrax);
    console.log('Final metrics object:', metrics);
    
    console.log('\n=== METRIC VALUES ===');
    if (metrics) {
      console.log('maxBatSpeed:', metrics.maxBatSpeed);
      console.log('avgBatSpeed:', metrics.avgBatSpeed);
      console.log('avgAttackAngle:', metrics.avgAttackAngle);
      console.log('avgTimeToContact:', metrics.avgTimeToContact);
      console.log('dataPoints:', metrics.dataPoints);
    }
    
    console.log('\n=== FRONTEND CONDITIONAL LOGIC ===');
    console.log('isHittrax condition:', isHittrax);
    console.log('!isHittrax && metrics condition:', !isHittrax && metrics);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testReportStructure(); 