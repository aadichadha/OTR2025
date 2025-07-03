'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Rename the old table
    await queryInterface.renameTable('sessions', 'sessions_old');

    // 2. Re-create 'sessions' with the correct PK definition
    await queryInterface.createTable('sessions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      player_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'players', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      session_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      session_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 3. Copy existing data over (except PK—let SQLite reassign IDs)
    await queryInterface.sequelize.query(`
      INSERT INTO sessions (player_id, session_date, session_type, created_at, updated_at)
      SELECT player_id, session_date, session_type, created_at, updated_at
      FROM sessions_old;
    `);

    // 4. Drop the old table
    await queryInterface.dropTable('sessions_old');
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback: restore the old table structure
    await queryInterface.renameTable('sessions', 'sessions_new');

    await queryInterface.createTable('sessions', {
      id: {
        type: Sequelize.INTEGER, // SERIAL alias was INTEGER under the hood
        primaryKey: true,
        // note: no autoIncrement here to simulate the old mismatch
      },
      player_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'players', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      session_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      session_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // copy data back
    await queryInterface.sequelize.query(`
      INSERT INTO sessions (id, player_id, session_date, session_type, created_at, updated_at)
      SELECT id, player_id, session_date, session_type, created_at, updated_at
      FROM sessions_new;
    `);

    await queryInterface.dropTable('sessions_new');
  }
}; 