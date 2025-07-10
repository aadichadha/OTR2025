'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'invitation_token', {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn('users', 'invitation_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'invitation_status', {
      type: Sequelize.ENUM('pending', 'accepted', 'expired'),
      defaultValue: 'pending',
      allowNull: false
    });

    await queryInterface.addColumn('users', 'invited_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'invited_by');
    await queryInterface.removeColumn('users', 'invitation_status');
    await queryInterface.removeColumn('users', 'invitation_expires_at');
    await queryInterface.removeColumn('users', 'invitation_token');
  }
}; 