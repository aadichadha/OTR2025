const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Player = sequelize.define('Player', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  travel_team: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  high_school: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  little_league: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  college: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  position: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  graduation_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 2024,
      max: 2030
    }
  },
  player_code: {
    type: DataTypes.CHAR(4),
    allowNull: false,
    unique: true
  },
  player_level: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'High School',
    comment: 'Player level: Little League, High School, College, etc.'
  }
}, {
  tableName: 'players',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Player; 