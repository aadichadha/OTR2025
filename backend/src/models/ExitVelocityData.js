const { DataTypes, Deferrable } = require('sequelize');
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
      key: 'id',
      deferrable: Deferrable.INITIALLY_DEFERRED
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
  },
  spray_chart_x: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true,
    comment: 'Spray chart X coordinate from Hittrax CSV'
  },
  spray_chart_z: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true,
    comment: 'Spray chart Z coordinate from Hittrax CSV'
  },
  horiz_angle: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    comment: 'Horizontal angle from Hittrax CSV'
  },
  swing_tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of tags for individual swings',
    get() {
      const rawValue = this.getDataValue('swing_tags');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('swing_tags', JSON.stringify(value));
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes for individual swings'
  },
  swing_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Sequential swing number within the session'
  }
}, {
  tableName: 'exit_velocity_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = ExitVelocityData; 