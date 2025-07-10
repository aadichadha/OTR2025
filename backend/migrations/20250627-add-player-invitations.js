'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add invitation fields to users table
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
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Create index on invitation_token for faster lookups
    await queryInterface.addIndex('users', ['invitation_token'], {
      unique: true,
      name: 'idx_users_invitation_token'
    });

    // Create index on invitation_status for filtering
    await queryInterface.addIndex('users', ['invitation_status'], {
      name: 'idx_users_invitation_status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('users', 'idx_users_invitation_status');
    await queryInterface.removeIndex('users', 'idx_users_invitation_token');

    // Remove columns
    await queryInterface.removeColumn('users', 'invited_by');
    await queryInterface.removeColumn('users', 'invitation_status');
    await queryInterface.removeColumn('users', 'invitation_expires_at');
    await queryInterface.removeColumn('users', 'invitation_token');
  }
}; 