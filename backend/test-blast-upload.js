const fs = require('fs');
const path = require('path');
const CSVParser = require('./src/services/csvParser');
const { Session, Player, BatSpeedData } = require('./src/models');
const { sequelize } = require('./src/config/database');

const testBlastUpload = async () => {
  try {
    console.log('🧪 Testing Blast Upload Process...\n');
    
    // 1. Create sample Blast CSV data
    console.log('📝 Step 1: Creating sample Blast CSV...');
    const sampleBlastData = [
      'Row,Data,Type,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '1,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '2,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '3,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '4,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '5,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '6,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '7,Header,Data,Info,Col5,Col6,Col7,BatSpeed,Col9,Col10,AttackAngle,Col12,Col13,Col14,Col15,TimeToContact',
      '8,Data,Real,Info,Col5,Col6,Col7,65.2,Col9,Col10,12.5,Col12,Col13,Col14,Col15,0.165',
      '9,Data,Real,Info,Col5,Col6,Col7,67.8,Col9,Col10,11.2,Col12,Col13,Col14,Col15,0.158',
      '10,Data,Real,Info,Col5,Col6,Col7,64.1,Col9,Col10,13.8,Col12,Col13,Col14,Col15,0.172',
      '11,Data,Real,Info,Col5,Col6,Col7,69.3,Col9,Col10,10.9,Col12,Col13,Col14,Col15,0.151',
      '12,Data,Real,Info,Col5,Col6,Col7,66.7,Col9,Col10,12.1,Col12,Col13,Col14,Col15,0.163'
    ];
    
    const blastCSVPath = path.join(__dirname, 'test_blast.csv');
    fs.writeFileSync(blastCSVPath, sampleBlastData.join('\n'));
    console.log('✅ Sample Blast CSV created at:', blastCSVPath);
    
    // 2. Test CSV parsing without session ID
    console.log('\n📊 Step 2: Testing CSV parsing (without session ID)...');
    const parseResult = await CSVParser.parseBlastCSV(blastCSVPath, null, null);
    console.log('✅ Parse result:', {
      totalRows: parseResult.totalRows,
      parsedRows: parseResult.parsedRows,
      skippedRows: parseResult.skippedRows,
      errorCount: parseResult.errorCount
    });
    
    if (parseResult.data && parseResult.data.length > 0) {
      console.log('📋 Sample parsed data:', parseResult.data[0]);
    }
    
    // 3. Create a test player
    console.log('\n👤 Step 3: Creating test player...');
    const testPlayer = await Player.create({
      name: 'Blast Test Player',
      age: 16,
      travel_team: 'Test Team',
      high_school: 'Test High School',
      player_code: 'BLAST_TEST_001'
    });
    console.log('✅ Test player created with ID:', testPlayer.id);
    
    // 4. Test full upload process with transaction
    console.log('\n🔄 Step 4: Testing full upload process...');
    await sequelize.transaction(async t => {
      // Create session
      const session = await Session.create({
        player_id: testPlayer.id,
        session_date: new Date(),
        session_type: 'blast',
        player_level: 'High School'
      }, { transaction: t });
      
      console.log('✅ Session created with ID:', session.id);
      
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
    
    console.log('\n✅ Blast upload test completed successfully!');
    
    // Cleanup
    fs.unlinkSync(blastCSVPath);
    console.log('🧹 Cleaned up test file');
    
  } catch (error) {
    console.error('❌ Blast upload test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit();
  }
};

testBlastUpload(); 