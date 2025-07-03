'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Rename existing table to preserve data
    await queryInterface.renameTable('bat_speed_data', 'bat_speed_data_old');

    // Step 2: Create new table with correct PK definition and FK reference
    await queryInterface.createTable('bat_speed_data', {
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
      bat_speed: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      attack_angle: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      time_to_contact: {
        type: Sequelize.DECIMAL(5, 3),
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
      INSERT INTO bat_speed_data (session_id, bat_speed, attack_angle, time_to_contact, created_at, updated_at)
      SELECT session_id, bat_speed, attack_angle, time_to_contact, created_at, created_at
      FROM bat_speed_data_old;
    `);

    // Step 4: Clean up old table
    await queryInterface.dropTable('bat_speed_data_old');
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback: restore old structure
    await queryInterface.renameTable('bat_speed_data', 'bat_speed_data_new');
    
    await queryInterface.createTable('bat_speed_data', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        // Note: no autoIncrement to simulate old behavior
      },
      session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sessions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      bat_speed: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      attack_angle: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      time_to_contact: {
        type: Sequelize.DECIMAL(5, 3),
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
      INSERT INTO bat_speed_data (id, session_id, bat_speed, attack_angle, time_to_contact, created_at)
      SELECT id, session_id, bat_speed, attack_angle, time_to_contact, created_at
      FROM bat_speed_data_new;
    `);

    await queryInterface.dropTable('bat_speed_data_new');
  }
}; 