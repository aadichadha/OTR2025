const { Sequelize } = require('sequelize');
require('dotenv').config();

const path = require('path');

let sequelize;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if provided (production or local testing with production DB)
  console.log('🔗 Using DATABASE_URL for database connection');
  
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
    },
    retry: {
      max: 3,
      timeout: 10000
    },
    // Add connection timeout and retry settings
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000
  });
} else {
  // Development: SQLite (fallback)
  console.log('🔗 Using SQLite for development database');
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../../database/otrbaseball.db'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      busyTimeout: 60000
    },
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
  });

  // Enable foreign key enforcement for SQLite (only in development)
  if (process.env.NODE_ENV !== 'production') {
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
}

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Database: ${process.env.DATABASE_URL ? 'PostgreSQL (Render)' : 'SQLite'}`);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    console.error('🔍 Error details:', {
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    
    if (process.env.NODE_ENV === 'production') {
      console.error('💡 Make sure DATABASE_URL is properly set in your Render environment variables');
    }
    
    throw error;
  }
};

module.exports = { sequelize, testConnection }; 