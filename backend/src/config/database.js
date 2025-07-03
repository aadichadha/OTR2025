const { Sequelize } = require('sequelize');
require('dotenv').config();

const path = require('path');

let sequelize;

if (process.env.NODE_ENV === 'production') {
  // Production: PostgreSQL with DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is required in production environment');
    process.exit(1);
  }
  
  console.log('🔗 Using DATABASE_URL for production database connection');
  
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
    }
  });
} else {
  // Development: SQLite
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
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Database: ${process.env.NODE_ENV === 'production' ? 'PostgreSQL (Render)' : 'SQLite'}`);
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