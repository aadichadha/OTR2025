const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(__dirname, '../../database/otrbaseball.db'),
  logging: console.log,
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  dialectOptions: {
    // sqlite busy timeout in milliseconds
    busyTimeout: 60000
  },
  define: {
    // ensure correct naming and timestamps
    freezeTableName: true,
    timestamps: true
  },
  // every time a new sqlite connection is made:
  pool: {
    afterCreate: (conn, done) => {
      conn.run('PRAGMA foreign_keys = ON;', (err) => {
        if (err) console.error('Unable to enable foreign_keys:', err);
        done(err, conn);
      });
    }
  }
});

module.exports = sequelize; 