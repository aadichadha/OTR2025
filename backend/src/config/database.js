const { Sequelize } = require('sequelize');
require('dotenv').config();

const path = require('path');

let sequelize;

if (process.env.NODE_ENV === 'production') {
  // Production: PostgreSQL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Development: SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../../database/otrbaseball.db'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      busyTimeout: 60000
    },
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
  });

  // Always enable foreign key enforcement for SQLite
  sequelize
    .getQueryInterface()
    .sequelize
    .query('PRAGMA foreign_keys = ON;')
    .then(() => {
      console.log('✅ SQLite foreign key enforcement enabled.');
    })
    .catch((err) => {
      console.error('❌ Failed to enable SQLite foreign key enforcement:', err);
    });
}

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, testConnection }; 