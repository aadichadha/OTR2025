'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('exit_velocity_data', 'pitch_speed', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Column E from Hittrax CSV - Pitch speed in mph'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('exit_velocity_data', 'pitch_speed');
  }
}; 