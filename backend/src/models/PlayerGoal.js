const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlayerGoal = sequelize.define('PlayerGoal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  player_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'players',
      key: 'id'
    }
  },
  coach_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  goal_type: {
    type: DataTypes.ENUM('avg_ev', 'max_ev', 'avg_bs', 'max_bs'),
    allowNull: false,
    comment: 'Type of goal: average exit velocity, max exit velocity, average bat speed, max bat speed'
  },
  target_value: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    comment: 'Target value for the goal (e.g., 85.5 mph for exit velocity)'
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Start date for the goal period'
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'End date for the goal period'
  },
  status: {
    type: DataTypes.ENUM('active', 'achieved', 'missed', 'cancelled'),
    defaultValue: 'active',
    allowNull: false
  },
  achieved_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date when the goal was achieved'
  },
  achieved_session_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sessions',
      key: 'id'
    },
    comment: 'Session ID where the goal was achieved'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes about the goal'
  },
  milestone_awarded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether a milestone has been awarded for achieving this goal'
  }
}, {
  tableName: 'player_goals',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['player_id']
    },
    {
      fields: ['coach_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['goal_type']
    },
    {
      fields: ['end_date']
    }
  ]
});

module.exports = PlayerGoal; 