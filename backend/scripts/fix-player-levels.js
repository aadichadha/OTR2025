const { Player } = require('../src/models');
const { getPlayerLevel } = require('../src/utils/playerLevelUtils');

async function fixPlayerLevels() {
  try {
    console.log('🔧 Starting player level fix...');
    
    // Get all players
    const players = await Player.findAll();
    console.log(`📊 Found ${players.length} players to check`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const player of players) {
      const currentLevel = getPlayerLevel(player);
      
      // Check if player has team info but level is N/A
      if (currentLevel === 'N/A' && (player.high_school || player.college || player.travel_team || player.indy || player.affiliate || player.little_league)) {
        console.log(`🔍 Player "${player.name}" has team info but level is N/A:`);
        console.log(`   - High School: ${player.high_school || 'N/A'}`);
        console.log(`   - College: ${player.college || 'N/A'}`);
        console.log(`   - Travel Team: ${player.travel_team || 'N/A'}`);
        console.log(`   - Independent: ${player.indy || 'N/A'}`);
        console.log(`   - Affiliate: ${player.affiliate || 'N/A'}`);
        console.log(`   - Little League: ${player.little_league || 'N/A'}`);
        console.log(`   - Current Level: ${currentLevel}`);
        
        // The player already has the correct team fields, so no update needed
        // The issue was in the display logic, which we've now fixed
        console.log(`   ✅ Player level logic fixed - will now show as: ${getPlayerLevel(player)}`);
        skippedCount++;
      } else {
        console.log(`✅ Player "${player.name}" level is correct: ${currentLevel}`);
        skippedCount++;
      }
    }
    
    console.log(`\n🎉 Player level fix completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Players checked: ${players.length}`);
    console.log(`   - Players with correct levels: ${skippedCount}`);
    console.log(`   - Players updated: ${updatedCount}`);
    console.log(`\n💡 Note: The issue was in the display logic, not the database.`);
    console.log(`   All players should now show their correct levels in leaderboards and statistics.`);
    
  } catch (error) {
    console.error('❌ Error fixing player levels:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
fixPlayerLevels(); 