const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExitVelocityData = sequelize.define('ExitVelocityData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sessions',
      key: 'id'
    }
  },
  strike_zone: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Column F from Hittrax CSV'
  },
  exit_velocity: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Column H from Hittrax CSV'
  },
  launch_angle: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Column I from Hittrax CSV'
  },
  distance: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    comment: 'Column J from Hittrax CSV'
  }
}, {
  tableName: 'exit_velocity_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = ExitVelocityData; 