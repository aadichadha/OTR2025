const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Session = sequelize.define('Session', {
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
  session_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  session_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['blast', 'hittrax']]
    }
  },
  session_category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Practice, Live ABs, Cage Work, etc.'
  },
  session_tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comma-separated tags for session categorization'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes about the session'
  }
}, {
  tableName: 'sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Session; 