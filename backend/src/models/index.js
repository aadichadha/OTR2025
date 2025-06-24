const User = require('./User');
const Player = require('./Player');
const Session = require('./Session');
const BatSpeedData = require('./BatSpeedData');
const ExitVelocityData = require('./ExitVelocityData');
const Report = require('./Report');

// Define associations
Player.hasMany(Session, { foreignKey: 'player_id', as: 'sessions' });
Session.belongsTo(Player, { foreignKey: 'player_id', as: 'player' });

Session.hasMany(BatSpeedData, { foreignKey: 'session_id', as: 'batSpeedData' });
BatSpeedData.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

Session.hasMany(ExitVelocityData, { foreignKey: 'session_id', as: 'exitVelocityData' });
ExitVelocityData.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

Session.hasMany(Report, { foreignKey: 'session_id', as: 'reports' });
Report.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

User.hasMany(Report, { foreignKey: 'user_id', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  User,
  Player,
  Session,
  BatSpeedData,
  ExitVelocityData,
  Report
}; 