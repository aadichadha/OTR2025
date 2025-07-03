const bcrypt = require('bcryptjs');
const { User, Player, Session, ExitVelocityData } = require('../src/models');
const { sequelize } = require('../src/config/database');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create demo admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@otrbaseball.com',
      password_hash: adminPassword,
      role: 'admin'
    });
    console.log('✅ Created admin user');

    // Create demo coach user
    const coachPassword = await bcrypt.hash('coach123', 10);
    const coachUser = await User.create({
      username: 'coach',
      email: 'coach@otrbaseball.com',
      password_hash: coachPassword,
      role: 'coach'
    });
    console.log('✅ Created coach user');

    // Create demo players
    const players = await Player.bulkCreate([
      {
        name: 'Mike Johnson',
        age: 16,
        position: 'SS',
        travel_team: 'Elite Prospects',
        high_school: 'Central High',
        graduation_year: 2026,
        player_code: 'MJ001'
      },
      {
        name: 'Sarah Williams',
        age: 15,
        position: 'P',
        travel_team: 'Diamond Elite',
        high_school: 'West High',
        graduation_year: 2027,
        player_code: 'SW002'
      },
      {
        name: 'Alex Rodriguez',
        age: 17,
        position: '3B',
        travel_team: 'Future Stars',
        high_school: 'East High',
        graduation_year: 2025,
        player_code: 'AR003'
      }
    ]);
    console.log(`✅ Created ${players.length} demo players`);

    // Create demo sessions
    const sessions = [];
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      
      // Create 3 sessions per player
      for (let j = 1; j <= 3; j++) {
        const session = await Session.create({
          player_id: player.id,
          session_date: new Date(Date.now() - (j * 7 * 24 * 60 * 60 * 1000)), // j weeks ago
          session_type: j === 1 ? 'Live BP' : j === 2 ? 'Machine' : 'Soft Toss',
          session_category: 'Practice',
          notes: `Session ${j} - ${session.session_type}`,
          session_tags: 'demo,training'
        });
        sessions.push(session);
      }
    }
    console.log(`✅ Created ${sessions.length} demo sessions`);

    // Create demo swing data
    const swingData = [];
    for (const session of sessions) {
      // Create 10-20 swings per session
      const numSwings = Math.floor(Math.random() * 11) + 10;
      
      for (let i = 0; i < numSwings; i++) {
        const exitVelocity = Math.floor(Math.random() * 30) + 70; // 70-100 MPH
        const launchAngle = Math.floor(Math.random() * 30) + 10; // 10-40 degrees
        const distance = Math.floor(Math.random() * 150) + 200; // 200-350 feet
        
        swingData.push({
          session_id: session.id,
          exit_velocity: exitVelocity,
          launch_angle: launchAngle,
          distance: distance,
          horiz_angle: (Math.random() - 0.5) * 20, // -10 to +10 degrees
          strike_zone: ['high', 'middle', 'low'][Math.floor(Math.random() * 3)]
        });
      }
    }
    
    await ExitVelocityData.bulkCreate(swingData);
    console.log(`✅ Created ${swingData.length} demo swing records`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Demo Data Summary:');
    console.log(`   - Users: 2 (admin, coach)`);
    console.log(`   - Players: ${players.length}`);
    console.log(`   - Sessions: ${sessions.length}`);
    console.log(`   - Swing Records: ${swingData.length}`);
    console.log('');
    console.log('🔑 Demo Login Credentials:');
    console.log('   Admin: admin@otrbaseball.com / admin123');
    console.log('   Coach: coach@otrbaseball.com / coach123');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase; 