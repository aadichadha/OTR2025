const { Session, Player, ExitVelocityData, BatSpeedData } = require('./src/models');

async function debugSessions() {
  try {
    console.log('🔧 Checking all players and their sessions...');
    
    // Get all players
    const players = await Player.findAll({
      order: [['id', 'ASC']]
    });
    
    console.log(`📊 Found ${players.length} total players`);
    
    for (const player of players) {
      console.log(`\n👤 Player ${player.id}: ${player.name} (${player.position})`);
      
      // Get sessions for this player
      const sessions = await Session.findAll({
        where: { player_id: player.id },
        include: [
          {
            model: ExitVelocityData,
            as: 'exitVelocityData'
          },
          {
            model: BatSpeedData,
            as: 'batSpeedData'
          }
        ]
      });
      
      console.log(`   📅 Sessions: ${sessions.length}`);
      
      if (sessions.length > 0) {
        let totalExitVelocitySwings = 0;
        let totalBatSpeedSwings = 0;
        
        for (const session of sessions) {
          const exitVelocityCount = session.exitVelocityData ? session.exitVelocityData.length : 0;
          const batSpeedCount = session.batSpeedData ? session.batSpeedData.length : 0;
          
          totalExitVelocitySwings += exitVelocityCount;
          totalBatSpeedSwings += batSpeedCount;
          
          console.log(`   📊 Session ${session.id}: ${exitVelocityCount} exit velocity swings, ${batSpeedCount} bat speed swings`);
        }
        
        console.log(`   📈 Total: ${totalExitVelocitySwings} exit velocity swings, ${totalBatSpeedSwings} bat speed swings`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging sessions:', error);
  }
}

debugSessions().then(() => {
  console.log('\n🏁 Debug complete');
  process.exit(0);
}).catch(console.error); 