const { Session, Player } = require('./src/models');
const { initDatabase } = require('./src/config/init-db');

async function fixSessionDates() {
  try {
    console.log('🔧 Starting session date fix...');
    
    // Initialize database
    await initDatabase();
    
    // Get all sessions with their current dates
    const sessions = await Session.findAll({
      include: [{
        model: Player,
        as: 'player',
        attributes: ['id', 'name']
      }],
      order: [['created_at', 'ASC']]
    });
    
    console.log(`📊 Found ${sessions.length} sessions to update`);
    
    if (sessions.length === 0) {
      console.log('✅ No sessions found to update');
      return;
    }
    
    // Show current state
    console.log('\n📅 Current session dates:');
    sessions.forEach(session => {
      console.log(`  - ${session.player.name}: ${session.session_date} (uploaded: ${session.created_at.toDateString()})`);
    });
    
    // Update each session to use created_at as session_date
    let updatedCount = 0;
    for (const session of sessions) {
      const oldDate = session.session_date; // This is a string (YYYY-MM-DD)
      const newDate = session.created_at; // This is a Date object
      
      // Convert both to comparable format
      const oldDateStr = oldDate;
      const newDateStr = newDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Only update if the dates are different
      if (oldDateStr !== newDateStr) {
        await session.update({
          session_date: newDate
        });
        
        console.log(`✅ Updated ${session.player.name}: ${oldDateStr} → ${newDateStr}`);
        updatedCount++;
      } else {
        console.log(`⏭️  Skipped ${session.player.name}: dates already match (${oldDateStr})`);
      }
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} out of ${sessions.length} sessions`);
    
    // Show final state
    console.log('\n📅 Final session dates:');
    const updatedSessions = await Session.findAll({
      include: [{
        model: Player,
        as: 'player',
        attributes: ['id', 'name']
      }],
      order: [['created_at', 'ASC']]
    });
    
    updatedSessions.forEach(session => {
      console.log(`  - ${session.player.name}: ${session.session_date} (uploaded: ${session.created_at.toDateString()})`);
    });
    
    console.log('\n✅ Session date fix completed!');
    console.log('💡 Now when you click "View Sessions" in Player Management, you will see the actual upload dates.');
    
  } catch (error) {
    console.error('❌ Error fixing session dates:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the fix
fixSessionDates()
  .then(() => {
    console.log('🏁 Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 