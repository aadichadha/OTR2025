const fs = require('fs');
const path = require('path');
const CSVParser = require('./src/services/csvParser');
const { sequelize } = require('./src/config/database');
const { Session, Player, BatSpeedData } = require('./src/models');

async function testBlastParsingFix() {
  try {
    console.log('🧪 Testing Fixed Blast CSV Parsing');
    console.log('===================================');

    // Create sample Blast CSV data with correct structure
    const sampleBlastData = [
      // Rows 1-9: Header noise (should be skipped)
      'Device Info,Blast Motion,Version 2.0',
      'Session Date,2025-01-15',
      'Player Name,Test Player',
      'Device ID,BM12345',
      'Calibration,Complete',
      'Settings,Default',
      'Notes,Test session',
      'Header Row 8,Data',
      'Header Row 9,More Data',
      // Row 10: Actual data starts here (index 9)
      'Row,Data,Type,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact,Col17',
      '1,Data,Real,Info,Col5,Col6,Col7,75.5,Col9,Col10,12.3,Col12,Col13,Col14,Col15,0.145,Col17',
      '2,Data,Real,Info,Col5,Col6,Col7,78.2,Col9,Col10,14.7,Col12,Col13,Col14,Col15,0.138,Col17',
      '3,Data,Real,Info,Col5,Col6,Col7,72.8,Col9,Col10,11.9,Col12,Col13,Col14,Col15,0.152,Col17',
      '4,Data,Real,Info,Col5,Col6,Col7,80.1,Col9,Col10,15.2,Col12,Col13,Col14,Col15,0.132,Col17',
      '5,Data,Real,Info,Col5,Col6,Col7,76.9,Col9,Col10,13.1,Col12,Col13,Col14,Col15,0.141,Col17'
    ];

    const blastCSVPath = path.join(__dirname, 'test_blast_fixed.csv');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(path.dirname(blastCSVPath))) {
      fs.mkdirSync(path.dirname(blastCSVPath), { recursive: true });
    }
    
    fs.writeFileSync(blastCSVPath, sampleBlastData.join('\n'));
    console.log('✅ Sample Blast CSV file created');

    // Test 1: Parse without saving to database
    console.log('\n📝 Test 1: Parsing Blast CSV (no database save)...');
    const parseResult = await CSVParser.parseBlastCSV(blastCSVPath, null, null);
    
    console.log('✅ Blast CSV parsed successfully:');
    console.log(`   - Total rows: ${parseResult.totalRows}`);
    console.log(`   - Skipped rows: ${parseResult.skippedRows}`);
    console.log(`   - Parsed rows: ${parseResult.parsedRows}`);
    console.log(`   - Error count: ${parseResult.errorCount}`);
    console.log(`   - Sample data:`, parseResult.data[0]);

    // Test 2: Create test player and session
    console.log('\n📝 Test 2: Creating test player and session...');
    
    // Create test player
    const testPlayer = await Player.create({
      name: 'Test Player - Blast Fix',
      position: 'INF',
      player_level: 'High School',
      player_code: 'TEST_BLAST_FIX'
    });
    console.log(`✅ Created test player: ${testPlayer.name} (ID: ${testPlayer.id})`);

    // Test 3: Parse and save to database
    console.log('\n📝 Test 3: Parsing and saving to database...');
    
    await sequelize.transaction(async t => {
      // Create session
      const session = await Session.create({
        player_id: testPlayer.id,
        session_date: new Date(),
        session_type: 'blast',
        player_level: 'High School'
      }, { transaction: t });
      
      console.log(`✅ Created session: ${session.id}`);
      
      // Parse and save data
      const fullParseResult = await CSVParser.parseBlastCSV(blastCSVPath, session.id, t);
      console.log('✅ Data saved:', {
        parsedRows: fullParseResult.parsedRows,
        totalRows: fullParseResult.totalRows
      });
      
      // Verify data was saved
      const savedCount = await BatSpeedData.count({ 
        where: { session_id: session.id }, 
        transaction: t 
      });
      console.log('✅ Verified saved records:', savedCount);
      
      if (savedCount !== fullParseResult.parsedRows) {
        console.error('⚠️ MISMATCH! Parsed vs saved:', fullParseResult.parsedRows, 'vs', savedCount);
      }
      
      // Show sample saved data
      const sampleData = await BatSpeedData.findAll({ 
        where: { session_id: session.id }, 
        transaction: t,
        limit: 3
      });
      console.log('📋 Sample saved data:', sampleData.map(d => d.toJSON()));
    });
    
    console.log('\n✅ Blast parsing fix test completed successfully!');
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await testPlayer.destroy();
    
    // Remove test file
    if (fs.existsSync(blastCSVPath)) fs.unlinkSync(blastCSVPath);
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Blast parsing fix test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit();
  }
}

testBlastParsingFix(); 