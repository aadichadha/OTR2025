'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'coach', 'player'),
      defaultValue: 'player',
      allowNull: false
    });

    await queryInterface.addColumn('users', 'permissions', {
      type: Sequelize.JSON,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'created_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('users', 'team_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Update existing users to have appropriate roles
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role = 'admin' 
      WHERE email LIKE '%admin%' OR email LIKE '%@otr.com'
    `);

    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role = 'coach' 
      WHERE email LIKE '%coach%'
    `);

    // Set default role for remaining users
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role = 'player' 
      WHERE role IS NULL OR role = 'user'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'team_id');
    await queryInterface.removeColumn('users', 'created_by');
    await queryInterface.removeColumn('users', 'permissions');
    await queryInterface.removeColumn('users', 'role');
  }
}; 