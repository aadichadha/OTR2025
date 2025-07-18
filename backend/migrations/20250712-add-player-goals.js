'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('player_goals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      player_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'players',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      coach_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      goal_type: {
        type: Sequelize.ENUM('avg_ev', 'max_ev', 'avg_bs', 'max_bs'),
        allowNull: false,
        comment: 'Type of goal: average exit velocity, max exit velocity, average bat speed, max bat speed'
      },
      target_value: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
        comment: 'Target value for the goal (e.g., 85.5 mph for exit velocity)'
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Start date for the goal period'
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'End date for the goal period'
      },
      status: {
        type: Sequelize.ENUM('active', 'achieved', 'missed', 'cancelled'),
        defaultValue: 'active',
        allowNull: false
      },
      achieved_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Date when the goal was achieved'
      },
      achieved_session_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'sessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Session ID where the goal was achieved'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional notes about the goal'
      },
      milestone_awarded: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether a milestone has been awarded for achieving this goal'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for better performance
    await queryInterface.addIndex('player_goals', ['player_id'], {
      name: 'idx_player_goals_player_id'
    });

    await queryInterface.addIndex('player_goals', ['coach_id'], {
      name: 'idx_player_goals_coach_id'
    });

    await queryInterface.addIndex('player_goals', ['status'], {
      name: 'idx_player_goals_status'
    });

    await queryInterface.addIndex('player_goals', ['goal_type'], {
      name: 'idx_player_goals_type'
    });

    await queryInterface.addIndex('player_goals', ['end_date'], {
      name: 'idx_player_goals_end_date'
    });

    await queryInterface.addIndex('player_goals', ['player_id', 'status'], {
      name: 'idx_player_goals_player_status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('player_goals', 'idx_player_goals_player_status');
    await queryInterface.removeIndex('player_goals', 'idx_player_goals_end_date');
    await queryInterface.removeIndex('player_goals', 'idx_player_goals_type');
    await queryInterface.removeIndex('player_goals', 'idx_player_goals_status');
    await queryInterface.removeIndex('player_goals', 'idx_player_goals_coach_id');
    await queryInterface.removeIndex('player_goals', 'idx_player_goals_player_id');

    // Drop the table
    await queryInterface.dropTable('player_goals');
  }
}; 