'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('players', 'player_level', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: 'High School',
      comment: 'Player level: Little League, High School, College, etc.'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('players', 'player_level');
  }
}; 