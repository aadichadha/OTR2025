const { sequelize } = require('../src/config/database');
const { Session, Player, ExitVelocityData, BatSpeedData } = require('../src/models');
const MetricsCalculator = require('../src/services/metricsCalculator');
const { aggregateReportData } = require('../src/services/reportAggregator');

/**
 * Comprehensive diagnostic script to compare local vs production behavior
 * Tests all the issues mentioned: CSV calculations, report layout, missing features, View Sessions
 */
async function runDiagnostics() {
  console.log('🔍 OTR Baseball Production vs Local Diagnostics');
  console.log('================================================\n');

  try {
    // Test 1: Database Connection
    console.log('📊 Test 1: Database Connection');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Database: ${process.env.NODE_ENV === 'production' ? 'PostgreSQL' : 'SQLite'}`);
    console.log('');

    // Test 2: Check if we have any data
    console.log('📊 Test 2: Data Availability Check');
    const playerCount = await Player.count();
    const sessionCount = await Session.count();
    const evDataCount = await ExitVelocityData.count();
    const batSpeedCount = await BatSpeedData.count();
    
    console.log(`👥 Players: ${playerCount}`);
    console.log(`📅 Sessions: ${sessionCount}`);
    console.log(`⚡ Exit Velocity Records: ${evDataCount}`);
    console.log(`🏏 Bat Speed Records: ${batSpeedCount}`);
    console.log('');

    if (sessionCount === 0) {
      console.log('⚠️  No sessions found - skipping data tests');
      return;
    }

    // Test 3: Session Retrieval (View Sessions issue)
    console.log('📊 Test 3: Session Retrieval Test');
    const testPlayer = await Player.findOne();
    if (!testPlayer) {
      console.log('⚠️  No players found - skipping session tests');
      return;
    }

    console.log(`🧪 Testing with player: ${testPlayer.name} (ID: ${testPlayer.id})`);
    
    // Test getPlayerSessions (this is what "View Sessions" uses)
    const sessions = await Session.findAll({
      where: { player_id: testPlayer.id },
      order: [['session_date', 'DESC']],
      include: [
        {
          model: BatSpeedData,
          as: 'batSpeedData',
          attributes: ['id']
        },
        {
          model: ExitVelocityData,
          as: 'exitVelocityData',
          attributes: ['id']
        }
      ]
    });

    console.log(`✅ Found ${sessions.length} sessions for player`);
    
    if (sessions.length > 0) {
      const firstSession = sessions[0];
      console.log(`📅 First session: ${firstSession.session_date} (${firstSession.session_type})`);
      console.log(`   - Bat Speed records: ${firstSession.batSpeedData?.length || 0}`);
      console.log(`   - Exit Velocity records: ${firstSession.exitVelocityData?.length || 0}`);
      
      // Test 4: Detailed Session Data Retrieval
      console.log('\n📊 Test 4: Detailed Session Data Retrieval');
      const detailedSession = await Session.findByPk(firstSession.id, {
        include: [
          {
            model: Player,
            as: 'player'
          },
          {
            model: BatSpeedData,
            as: 'batSpeedData'
          },
          {
            model: ExitVelocityData,
            as: 'exitVelocityData'
          }
        ]
      });

      if (detailedSession) {
        console.log(`✅ Detailed session retrieved successfully`);
        console.log(`   - Player: ${detailedSession.player?.name}`);
        console.log(`   - Session Type: ${detailedSession.session_type}`);
        console.log(`   - Session Category: ${detailedSession.session_category || 'None'}`);
        console.log(`   - Session Tags: ${detailedSession.session_tags || 'None'}`);
        console.log(`   - Notes: ${detailedSession.notes || 'None'}`);
        
        // Test 5: Data Type Analysis
        console.log('\n📊 Test 5: Data Type Analysis');
        if (detailedSession.exitVelocityData && detailedSession.exitVelocityData.length > 0) {
          const sampleEV = detailedSession.exitVelocityData[0];
          console.log('🔍 Sample Exit Velocity Record:');
          console.log(`   - ID: ${sampleEV.id} (type: ${typeof sampleEV.id})`);
          console.log(`   - Exit Velocity: ${sampleEV.exit_velocity} (type: ${typeof sampleEV.exit_velocity})`);
          console.log(`   - Launch Angle: ${sampleEV.launch_angle} (type: ${typeof sampleEV.launch_angle})`);
          console.log(`   - Distance: ${sampleEV.distance} (type: ${typeof sampleEV.distance})`);
          console.log(`   - Strike Zone: ${sampleEV.strike_zone} (type: ${typeof sampleEV.strike_zone})`);
          
          // Check for spray chart data
          console.log(`   - Spray Chart X: ${sampleEV.spray_chart_x} (type: ${typeof sampleEV.spray_chart_x})`);
          console.log(`   - Spray Chart Z: ${sampleEV.spray_chart_z} (type: ${typeof sampleEV.spray_chart_z})`);
          console.log(`   - Horizontal Angle: ${sampleEV.horiz_angle} (type: ${typeof sampleEV.horiz_angle})`);
        }

        if (detailedSession.batSpeedData && detailedSession.batSpeedData.length > 0) {
          const sampleBS = detailedSession.batSpeedData[0];
          console.log('🔍 Sample Bat Speed Record:');
          console.log(`   - ID: ${sampleBS.id} (type: ${typeof sampleBS.id})`);
          console.log(`   - Bat Speed: ${sampleBS.bat_speed} (type: ${typeof sampleBS.bat_speed})`);
          console.log(`   - Attack Angle: ${sampleBS.attack_angle} (type: ${typeof sampleBS.attack_angle})`);
          console.log(`   - Time to Contact: ${sampleBS.time_to_contact} (type: ${typeof sampleBS.time_to_contact})`);
        }
      }

      // Test 6: Metrics Calculation (CSV calculation issue)
      console.log('\n📊 Test 6: Metrics Calculation Test');
      try {
        const playerLevel = testPlayer.player_level || 'High School';
        console.log(`🧮 Calculating metrics for level: ${playerLevel}`);
        
        if (detailedSession.session_type === 'blast' && detailedSession.batSpeedData?.length > 0) {
          console.log('🏏 Calculating Bat Speed Metrics...');
          const batSpeedMetrics = await MetricsCalculator.calculateBatSpeedMetrics(
            detailedSession.id, 
            playerLevel
          );
          console.log('✅ Bat Speed Metrics:');
          console.log(`   - Avg Bat Speed: ${batSpeedMetrics.avgBatSpeed} mph`);
          console.log(`   - Max Bat Speed: ${batSpeedMetrics.maxBatSpeed} mph`);
          console.log(`   - Avg Attack Angle: ${batSpeedMetrics.avgAttackAngle}°`);
          console.log(`   - Avg Time to Contact: ${batSpeedMetrics.avgTimeToContact} sec`);
          console.log(`   - Data Points: ${batSpeedMetrics.dataPoints}`);
          console.log(`   - Grades:`, batSpeedMetrics.grades);
        }

        if (detailedSession.session_type === 'hittrax' && detailedSession.exitVelocityData?.length > 0) {
          console.log('⚡ Calculating Exit Velocity Metrics...');
          const evMetrics = await MetricsCalculator.calculateExitVelocityMetrics(
            detailedSession.id, 
            playerLevel
          );
          console.log('✅ Exit Velocity Metrics:');
          console.log(`   - Avg Exit Velocity: ${evMetrics.avgExitVelocity} mph`);
          console.log(`   - Max Exit Velocity: ${evMetrics.maxExitVelocity} mph`);
          console.log(`   - Launch Angle Top 5: ${evMetrics.launchAngleTop5}°`);
          console.log(`   - Avg Launch Angle: ${evMetrics.avgLaunchAngle}°`);
          console.log(`   - Avg Distance: ${evMetrics.avgDistance} ft`);
          console.log(`   - Data Points: ${evMetrics.dataPoints}`);
          console.log(`   - Grades:`, evMetrics.grades);
          console.log(`   - Hot Zone EVs:`, evMetrics.hotZoneEVs);
        }
      } catch (metricsError) {
        console.error('❌ Metrics calculation failed:', metricsError.message);
        console.error('Stack trace:', metricsError.stack);
      }

      // Test 7: Report Generation (Report layout issue)
      console.log('\n📊 Test 7: Report Generation Test');
      try {
        console.log('📄 Generating report data...');
        const reportData = await aggregateReportData(detailedSession.id);
        console.log('✅ Report data generated successfully');
        console.log('📋 Report Structure:');
        console.log(`   - Session Info: ${reportData.session ? 'Present' : 'Missing'}`);
        console.log(`   - Player Info: ${reportData.player ? 'Present' : 'Missing'}`);
        console.log(`   - Metrics: ${reportData.metrics ? 'Present' : 'Missing'}`);
        console.log(`   - Charts: ${reportData.charts ? 'Present' : 'Missing'}`);
        
        if (reportData.metrics) {
          console.log('📊 Metrics in Report:');
          console.log(`   - Bat Speed: ${reportData.metrics.batSpeed ? 'Present' : 'Missing'}`);
          console.log(`   - Exit Velocity: ${reportData.metrics.exitVelocity ? 'Present' : 'Missing'}`);
        }
      } catch (reportError) {
        console.error('❌ Report generation failed:', reportError.message);
        console.error('Stack trace:', reportError.stack);
      }

      // Test 8: API Endpoint Simulation
      console.log('\n📊 Test 8: API Endpoint Simulation');
      console.log('🔗 Testing endpoints that frontend uses:');
      
      // Simulate /api/players/:id/sessions endpoint
      console.log('   - /api/players/:id/sessions (View Sessions)');
      const playerSessions = await Session.findAll({
        where: { player_id: testPlayer.id },
        order: [['session_date', 'DESC']],
        include: [
          {
            model: BatSpeedData,
            as: 'batSpeedData',
            attributes: ['id']
          },
          {
            model: ExitVelocityData,
            as: 'exitVelocityData',
            attributes: ['id']
          }
        ]
      });
      console.log(`     ✅ Returns ${playerSessions.length} sessions`);

      // Simulate /api/sessions/:id endpoint
      console.log('   - /api/sessions/:id (Session Details)');
      const sessionDetails = await Session.findByPk(firstSession.id, {
        include: [
          {
            model: Player,
            as: 'player'
          },
          {
            model: BatSpeedData,
            as: 'batSpeedData'
          },
          {
            model: ExitVelocityData,
            as: 'exitVelocityData'
          }
        ]
      });
      console.log(`     ✅ Returns session with ${sessionDetails?.exitVelocityData?.length || 0} EV records`);

      // Simulate /api/sessions/:id/swings endpoint
      console.log('   - /api/sessions/:id/swings (Session Swings)');
      const sessionSwings = await ExitVelocityData.findAll({
        where: { session_id: firstSession.id },
        attributes: [
          'id',
          'exit_velocity',
          'launch_angle',
          'distance',
          'spray_chart_x',
          'spray_chart_z',
          'horiz_angle',
          'strike_zone'
        ],
        order: [['id', 'ASC']]
      });
      console.log(`     ✅ Returns ${sessionSwings.length} swings`);
    }

    // Test 9: Environment Variables Check
    console.log('\n📊 Test 9: Environment Variables Check');
    console.log('🔧 Critical environment variables:');
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
    console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
    console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
    console.log(`   - FRONTEND_URL: ${process.env.FRONTEND_URL || 'Not set'}`);

    console.log('\n✅ Diagnostics completed successfully!');
    console.log('\n📋 Summary of Potential Issues:');
    console.log('1. Check if data types are consistent between SQLite and PostgreSQL');
    console.log('2. Verify all environment variables are set in production');
    console.log('3. Ensure all API endpoints are working correctly');
    console.log('4. Check if calculations are using the correct data types');
    console.log('5. Verify report generation is working with production data');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run diagnostics
runDiagnostics(); 