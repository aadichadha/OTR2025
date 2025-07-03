'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add session_category field to sessions table
    await queryInterface.addColumn('sessions', 'session_category', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Practice, Live ABs, Cage Work, etc.'
    });

    // Add swing_tags field to exit_velocity_data table
    await queryInterface.addColumn('exit_velocity_data', 'swing_tags', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON array of tags for individual swings'
    });

    // Add notes field to exit_velocity_data table
    await queryInterface.addColumn('exit_velocity_data', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Notes for individual swings'
    });

    // Add swing_number field to exit_velocity_data table for easier reference
    await queryInterface.addColumn('exit_velocity_data', 'swing_number', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Sequential swing number within the session'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sessions', 'session_category');
    await queryInterface.removeColumn('exit_velocity_data', 'swing_tags');
    await queryInterface.removeColumn('exit_velocity_data', 'notes');
    await queryInterface.removeColumn('exit_velocity_data', 'swing_number');
  }
}; 