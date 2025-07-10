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
    allowNull: true,
    defaultValue: null
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
  },
  // Invitation fields
  invitation_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  invitation_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  invitation_status: {
    type: DataTypes.ENUM('pending', 'accepted', 'expired'),
    defaultValue: 'pending',
    allowNull: false
  },
  invited_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      console.log('[HOOK DEBUG] beforeCreate - password before:', user.password);
      if (user.password && !user.password.startsWith('$2a$')) {
        user.password = await bcrypt.hash(user.password, 10);
        console.log('[HOOK DEBUG] beforeCreate - password hashed:', user.password);
      } else {
        console.log('[HOOK DEBUG] beforeCreate - password already hashed, skipping');
      }
    },
    beforeUpdate: async (user) => {
      console.log('[HOOK DEBUG] beforeUpdate - password before:', user.password);
      if (user.changed('password') && !user.password.startsWith('$2a$')) {
        user.password = await bcrypt.hash(user.password, 10);
        console.log('[HOOK DEBUG] beforeUpdate - password hashed:', user.password);
      } else {
        console.log('[HOOK DEBUG] beforeUpdate - password already hashed or not changed, skipping');
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

// Instance method to check if invitation is expired
User.prototype.isInvitationExpired = function() {
  if (!this.invitation_expires_at) return false;
  return new Date() > new Date(this.invitation_expires_at);
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
      'view_player_dashboard',
      'view_analytics'
    ]
  };
  
  return rolePermissions[role] || [];
};

module.exports = User; 