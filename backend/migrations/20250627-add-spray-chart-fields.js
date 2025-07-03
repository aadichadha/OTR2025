'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('exit_velocity_data', 'spray_chart_x', {
      type: Sequelize.DECIMAL(8, 4),
      allowNull: true,
      comment: 'Spray chart X coordinate from Hittrax CSV'
    });

    await queryInterface.addColumn('exit_velocity_data', 'spray_chart_z', {
      type: Sequelize.DECIMAL(8, 4),
      allowNull: true,
      comment: 'Spray chart Z coordinate from Hittrax CSV'
    });

    await queryInterface.addColumn('exit_velocity_data', 'horiz_angle', {
      type: Sequelize.DECIMAL(6, 2),
      allowNull: true,
      comment: 'Horizontal angle from Hittrax CSV'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('exit_velocity_data', 'spray_chart_x');
    await queryInterface.removeColumn('exit_velocity_data', 'spray_chart_z');
    await queryInterface.removeColumn('exit_velocity_data', 'horiz_angle');
  }
}; 