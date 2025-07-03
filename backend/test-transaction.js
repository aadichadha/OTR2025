const { sequelize } = require('./src/config/database');
const { Session, Player, ExitVelocityData } = require('./src/models');

async function testTransaction() {
  try {
    console.log('🧪 Testing minimal transaction...');
    
    // First, ensure we have a player
    const player = await Player.findByPk(2);
    if (!player) {
      console.log('❌ Player 2 not found, creating test player...');
      await Player.create({
        id: 2,
        name: 'Test Player',
        position: '3B',
        player_code: '1234'
      });
    }
    
    await sequelize.transaction(async tx => {
      console.log('🔍 FK enforcement at start:', await sequelize.query('PRAGMA foreign_keys', { transaction: tx }));
      
      // Create session
      const session = await Session.create({
        player_id: 2,
        session_date: new Date(),
        session_type: 'hittrax',
        player_level: 'High School'
      }, { transaction: tx });
      
      console.log('✅ Session created with ID:', session.id);
      
      // Verify session exists in transaction
      const [sessionCheck] = await sequelize.query(
        `SELECT id FROM sessions WHERE id = ${session.id}`,
        { transaction: tx }
      );
      console.log('🔍 Session visibility:', sessionCheck);
      
      // Try minimal bulk insert
      const testData = [{
        session_id: session.id,
        strike_zone: 8,
        exit_velocity: 95.9,
        launch_angle: 16.2,
        distance: 286
      }];
      
      console.log('📝 Attempting bulk insert with data:', testData);
      
      await ExitVelocityData.bulkCreate(testData, { transaction: tx });
      
      console.log('✅ Bulk insert successful');
      
      // Check what was inserted
      const [insertedCheck] = await sequelize.query(
        `SELECT COUNT(*) as count FROM exit_velocity_data WHERE session_id = ${session.id}`,
        { transaction: tx }
      );
      console.log('🔍 Records in transaction:', insertedCheck);
    });
    
    console.log('🎉 Transaction completed successfully!');
    
  } catch (error) {
    console.error('❌ Transaction failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      sql: error.sql,
      parameters: error.parameters
    });
  } finally {
    await sequelize.close();
  }
}

testTransaction(); 