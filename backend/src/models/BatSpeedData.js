const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BatSpeedData = sequelize.define('BatSpeedData', {
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
  bat_speed: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Column H from Blast CSV'
  },
  attack_angle: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Column K from Blast CSV'
  },
  time_to_contact: {
    type: DataTypes.DECIMAL(5, 3),
    allowNull: true,
    comment: 'Column P from Blast CSV'
  }
}, {
  tableName: 'bat_speed_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = BatSpeedData; 