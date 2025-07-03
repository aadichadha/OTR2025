'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Rename existing table to preserve data
    await queryInterface.renameTable('exit_velocity_data', 'exit_velocity_data_old');

    // Step 2: Create new table with correct PK definition and FK reference
    await queryInterface.createTable('exit_velocity_data', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sessions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      strike_zone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      exit_velocity: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      launch_angle: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      distance: {
        type: Sequelize.DECIMAL(6, 2),
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

    // Step 3: Copy data (excluding PK - let SQLite reassign IDs)
    await queryInterface.sequelize.query(`
      INSERT INTO exit_velocity_data (session_id, strike_zone, exit_velocity, launch_angle, distance, created_at, updated_at)
      SELECT session_id, strike_zone, exit_velocity, launch_angle, distance, created_at, created_at
      FROM exit_velocity_data_old;
    `);

    // Step 4: Clean up old table
    await queryInterface.dropTable('exit_velocity_data_old');
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback: restore old structure
    await queryInterface.renameTable('exit_velocity_data', 'exit_velocity_data_new');
    
    await queryInterface.createTable('exit_velocity_data', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        // Note: no autoIncrement to simulate old behavior
      },
      session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sessions_old', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      strike_zone: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      exit_velocity: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      launch_angle: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      distance: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Copy data back
    await queryInterface.sequelize.query(`
      INSERT INTO exit_velocity_data (id, session_id, strike_zone, exit_velocity, launch_angle, distance, created_at)
      SELECT id, session_id, strike_zone, exit_velocity, launch_angle, distance, created_at
      FROM exit_velocity_data_new;
    `);

    await queryInterface.dropTable('exit_velocity_data_new');
  }
}; 