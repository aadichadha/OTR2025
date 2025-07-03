const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// SQLite connection for reading existing data
const sqliteDb = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database/otrbaseball.db'),
  logging: false
});

// PostgreSQL connection for writing new data
const postgresDb = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// Import models
const User = require('../src/models/User');
const Player = require('../src/models/Player');
const Session = require('../src/models/Session');
const ExitVelocityData = require('../src/models/ExitVelocityData');
const BatSpeedData = require('../src/models/BatSpeedData');
const Report = require('../src/models/Report');

async function migrateToPostgres() {
  try {
    console.log('🔄 Starting migration from SQLite to PostgreSQL...');

    // Test connections
    await sqliteDb.authenticate();
    console.log('✅ SQLite connection established');

    await postgresDb.authenticate();
    console.log('✅ PostgreSQL connection established');

    // Sync PostgreSQL database (create tables)
    await postgresDb.sync({ force: true });
    console.log('✅ PostgreSQL tables created');

    // Migrate Users
    console.log('📦 Migrating users...');
    const users = await sqliteDb.query('SELECT * FROM users', { type: Sequelize.QueryTypes.SELECT });
    for (const user of users) {
      await User.create({
        id: user.id,
        username: user.username,
        email: user.email,
        password_hash: user.password_hash,
        role: user.role || 'user',
        created_at: user.created_at,
        updated_at: user.updated_at
      });
    }
    console.log(`✅ Migrated ${users.length} users`);

    // Migrate Players
    console.log('📦 Migrating players...');
    const players = await sqliteDb.query('SELECT * FROM players', { type: Sequelize.QueryTypes.SELECT });
    for (const player of players) {
      await Player.create({
        id: player.id,
        name: player.name,
        age: player.age,
        position: player.position,
        travel_team: player.travel_team,
        high_school: player.high_school,
        graduation_year: player.graduation_year,
        player_code: player.player_code,
        created_at: player.created_at,
        updated_at: player.updated_at
      });
    }
    console.log(`✅ Migrated ${players.length} players`);

    // Migrate Sessions
    console.log('📦 Migrating sessions...');
    const sessions = await sqliteDb.query('SELECT * FROM sessions', { type: Sequelize.QueryTypes.SELECT });
    for (const session of sessions) {
      await Session.create({
        id: session.id,
        player_id: session.player_id,
        session_date: session.session_date,
        session_type: session.session_type,
        session_category: session.session_category,
        notes: session.notes,
        session_tags: session.session_tags,
        created_at: session.created_at,
        updated_at: session.updated_at
      });
    }
    console.log(`✅ Migrated ${sessions.length} sessions`);

    // Migrate Exit Velocity Data
    console.log('📦 Migrating exit velocity data...');
    const exitVelocityData = await sqliteDb.query('SELECT * FROM exit_velocity_data', { type: Sequelize.QueryTypes.SELECT });
    for (const data of exitVelocityData) {
      await ExitVelocityData.create({
        id: data.id,
        session_id: data.session_id,
        exit_velocity: data.exit_velocity,
        launch_angle: data.launch_angle,
        distance: data.distance,
        horiz_angle: data.horiz_angle,
        strike_zone: data.strike_zone,
        created_at: data.created_at,
        updated_at: data.updated_at
      });
    }
    console.log(`✅ Migrated ${exitVelocityData.length} exit velocity records`);

    // Migrate Bat Speed Data
    console.log('📦 Migrating bat speed data...');
    const batSpeedData = await sqliteDb.query('SELECT * FROM bat_speed_data', { type: Sequelize.QueryTypes.SELECT });
    for (const data of batSpeedData) {
      await BatSpeedData.create({
        id: data.id,
        session_id: data.session_id,
        bat_speed: data.bat_speed,
        attack_angle: data.attack_angle,
        time_to_contact: data.time_to_contact,
        created_at: data.created_at,
        updated_at: data.updated_at
      });
    }
    console.log(`✅ Migrated ${batSpeedData.length} bat speed records`);

    // Migrate Reports
    console.log('📦 Migrating reports...');
    const reports = await sqliteDb.query('SELECT * FROM reports', { type: Sequelize.QueryTypes.SELECT });
    for (const report of reports) {
      await Report.create({
        id: report.id,
        session_id: report.session_id,
        report_type: report.report_type,
        file_path: report.file_path,
        created_at: report.created_at,
        updated_at: report.updated_at
      });
    }
    console.log(`✅ Migrated ${reports.length} reports`);

    console.log('🎉 Migration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Players: ${players.length}`);
    console.log(`   - Sessions: ${sessions.length}`);
    console.log(`   - Exit Velocity Records: ${exitVelocityData.length}`);
    console.log(`   - Bat Speed Records: ${batSpeedData.length}`);
    console.log(`   - Reports: ${reports.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sqliteDb.close();
    await postgresDb.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToPostgres();
}

module.exports = migrateToPostgres; 