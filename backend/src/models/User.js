const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'coach', 'player'),
    defaultValue: 'player',
    allowNull: false,
    validate: {
      isIn: [['admin', 'coach', 'player']]
    }
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  team_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Instance method to compare passwords
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check permissions
User.prototype.hasPermission = function(permission) {
  if (this.role === 'admin') return true;
  
  if (!this.permissions) return false;
  
  return this.permissions.includes(permission);
};

// Static method to get role permissions
User.getRolePermissions = function(role) {
  const rolePermissions = {
    admin: [
      'view_all_players',
      'manage_players',
      'manage_coaches',
      'manage_users',
      'view_own_data',
      'download_reports',
      'view_analytics',
      'view_admin_dashboard'
    ],
    coach: [
      'view_all_players',
      'manage_players',
      'view_own_data',
      'download_reports',
      'view_analytics',
      'view_coach_dashboard'
    ],
    player: [
      'view_own_data',
      'download_reports',
      'view_player_dashboard'
    ]
  };
  
  return rolePermissions[role] || [];
};

module.exports = User; 