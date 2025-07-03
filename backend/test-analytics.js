const { User, Player, Session, ExitVelocityData } = require('./src/models');
const { sequelize } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function populateTestData() {
  try {
    console.log('🔄 Starting test data population...');

    // Create a test user with unique email
    const timestamp = Date.now();
    const user = await User.create({
      username: `testuser_${timestamp}`,
      email: `test_${timestamp}@example.com`,
      password: 'password123'
    });
    console.log('✅ Created test user');

    // Create a test player
    const player = await Player.create({
      name: 'Test Player',
      position: 'SS',
      graduation_year: '2025',
      player_code: `TP${timestamp}`
    });
    console.log('✅ Created test player');

    // Create test sessions
    const session1 = await Session.create({
      player_id: player.id,
      session_date: '2024-01-15',
      session_type: 'hittrax',
      session_category: 'Practice'
    });

    const session2 = await Session.create({
      player_id: player.id,
      session_date: '2024-01-16',
      session_type: 'hittrax',
      session_category: 'Live ABs'
    });

    const session3 = await Session.create({
      player_id: player.id,
      session_date: '2024-01-17',
      session_type: 'hittrax',
      session_category: 'Cage Work'
    });

    console.log('✅ Created test sessions');

    // Sample swing data for session 1
    const session1Swings = [
      { session_id: session1.id, strike_zone: 1, exit_velocity: 75.2, launch_angle: 12.5, distance: 280, swing_number: 1 },
      { session_id: session1.id, strike_zone: 2, exit_velocity: 82.1, launch_angle: 15.2, distance: 310, swing_number: 2 },
      { session_id: session1.id, strike_zone: 3, exit_velocity: 78.9, launch_angle: 13.8, distance: 295, swing_number: 3 },
      { session_id: session1.id, strike_zone: 4, exit_velocity: 85.3, launch_angle: 16.1, distance: 320, swing_number: 4 },
      { session_id: session1.id, strike_zone: 5, exit_velocity: 79.6, launch_angle: 14.2, distance: 300, swing_number: 5 },
      { session_id: session1.id, strike_zone: 6, exit_velocity: 88.7, launch_angle: 17.5, distance: 335, swing_number: 6 },
      { session_id: session1.id, strike_zone: 7, exit_velocity: 76.4, launch_angle: 12.8, distance: 285, swing_number: 7 },
      { session_id: session1.id, strike_zone: 8, exit_velocity: 83.2, launch_angle: 15.8, distance: 315, swing_number: 8 },
      { session_id: session1.id, strike_zone: 9, exit_velocity: 81.5, launch_angle: 14.9, distance: 305, swing_number: 9 },
      { session_id: session1.id, strike_zone: 10, exit_velocity: 87.1, launch_angle: 16.8, distance: 325, swing_number: 10 }
    ];

    // Sample swing data for session 2 (better performance)
    const session2Swings = [
      { session_id: session2.id, strike_zone: 1, exit_velocity: 92.1, launch_angle: 25.2, distance: 380, swing_number: 1, swing_tags: ['sweet_spot', 'hard_hit'] },
      { session_id: session2.id, strike_zone: 2, exit_velocity: 89.5, launch_angle: 28.1, distance: 365, swing_number: 2, swing_tags: ['sweet_spot'] },
      { session_id: session2.id, strike_zone: 3, exit_velocity: 95.3, launch_angle: 30.5, distance: 395, swing_number: 3, swing_tags: ['sweet_spot', 'hard_hit', 'best_swing'] },
      { session_id: session2.id, strike_zone: 4, exit_velocity: 87.8, launch_angle: 26.8, distance: 355, swing_number: 4, swing_tags: ['sweet_spot'] },
      { session_id: session2.id, strike_zone: 5, exit_velocity: 91.2, launch_angle: 27.3, distance: 370, swing_number: 5, swing_tags: ['sweet_spot', 'hard_hit'] },
      { session_id: session2.id, strike_zone: 6, exit_velocity: 88.9, launch_angle: 24.9, distance: 360, swing_number: 6, swing_tags: ['sweet_spot'] },
      { session_id: session2.id, strike_zone: 7, exit_velocity: 93.7, launch_angle: 29.1, distance: 385, swing_number: 7, swing_tags: ['sweet_spot', 'hard_hit'] },
      { session_id: session2.id, strike_zone: 8, exit_velocity: 86.4, launch_angle: 23.5, distance: 350, swing_number: 8 },
      { session_id: session2.id, strike_zone: 9, exit_velocity: 90.1, launch_angle: 26.2, distance: 375, swing_number: 9, swing_tags: ['sweet_spot'] },
      { session_id: session2.id, strike_zone: 10, exit_velocity: 94.2, launch_angle: 31.2, distance: 390, swing_number: 10, swing_tags: ['sweet_spot', 'hard_hit', 'best_swing'] }
    ];

    // Sample swing data for session 3 (mixed performance)
    const session3Swings = [
      { session_id: session3.id, strike_zone: 1, exit_velocity: 78.5, launch_angle: 18.2, distance: 320, swing_number: 1 },
      { session_id: session3.id, strike_zone: 2, exit_velocity: 85.1, launch_angle: 22.5, distance: 340, swing_number: 2, swing_tags: ['improving'] },
      { session_id: session3.id, strike_zone: 3, exit_velocity: 91.8, launch_angle: 27.8, distance: 375, swing_number: 3, swing_tags: ['sweet_spot', 'hard_hit'] },
      { session_id: session3.id, strike_zone: 4, exit_velocity: 76.3, launch_angle: 16.9, distance: 310, swing_number: 4 },
      { session_id: session3.id, strike_zone: 5, exit_velocity: 88.7, launch_angle: 25.1, distance: 355, swing_number: 5, swing_tags: ['sweet_spot'] },
      { session_id: session3.id, strike_zone: 6, exit_velocity: 82.4, launch_angle: 20.3, distance: 330, swing_number: 6 },
      { session_id: session3.id, strike_zone: 7, exit_velocity: 89.9, launch_angle: 26.7, distance: 365, swing_number: 7, swing_tags: ['sweet_spot', 'hard_hit'] },
      { session_id: session3.id, strike_zone: 8, exit_velocity: 79.2, launch_angle: 17.8, distance: 315, swing_number: 8 },
      { session_id: session3.id, strike_zone: 9, exit_velocity: 86.5, launch_angle: 23.4, distance: 345, swing_number: 9, swing_tags: ['improving'] },
      { session_id: session3.id, strike_zone: 10, exit_velocity: 92.3, launch_angle: 28.9, distance: 380, swing_number: 10, swing_tags: ['sweet_spot', 'hard_hit'] }
    ];

    // Insert all swings
    await ExitVelocityData.bulkCreate([...session1Swings, ...session2Swings, ...session3Swings]);
    console.log('✅ Created test swing data');

    console.log('\n📊 Test Data Summary:');
    console.log(`- User: ${user.username} (ID: ${user.id})`);
    console.log(`- Player: ${player.name} (ID: ${player.id})`);
    console.log(`- Sessions: 3 sessions created`);
    console.log(`- Swings: 30 total swings across all sessions`);
    console.log('\n🎯 Ready to test analytics functionality!');

  } catch (error) {
    console.error('❌ Error populating test data:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the population script
populateTestData(); 