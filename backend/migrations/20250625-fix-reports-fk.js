'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Rename existing table to preserve data
    await queryInterface.renameTable('reports', 'reports_old');

    // Step 2: Create new table with correct FK references
    await queryInterface.createTable('reports', {
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
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      pdf_path: {
        type: Sequelize.STRING(500),
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
      INSERT INTO reports (session_id, user_id, pdf_path, created_at, updated_at)
      SELECT session_id, user_id, pdf_path, created_at, created_at
      FROM reports_old;
    `);

    // Step 4: Clean up old table
    await queryInterface.dropTable('reports_old');
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback: restore old structure
    await queryInterface.renameTable('reports', 'reports_new');
    
    await queryInterface.createTable('reports', {
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
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      pdf_path: {
        type: Sequelize.STRING(500),
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
      INSERT INTO reports (id, session_id, user_id, pdf_path, created_at)
      SELECT id, session_id, user_id, pdf_path, created_at
      FROM reports_new;
    `);

    await queryInterface.dropTable('reports_new');
  }
}; 