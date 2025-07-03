const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Create a fresh Sequelize instance with proper SQLite config
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(__dirname, '../database/otrbaseball.db'),
  logging: false,
  dialectOptions: {
    busyTimeout: 60000
  },
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
});

// Define minimal models that match your actual schema
const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  player_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  session_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  session_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  player_level: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const ExitVelocityData = sequelize.define('ExitVelocityData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  strike_zone: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  exit_velocity: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  launch_angle: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  distance: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true
  }
}, {
  tableName: 'exit_velocity_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Test function
async function testMinimalTransaction() {
  try {
    console.log('🧪 Testing minimal transaction...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check foreign key enforcement
    const [fkResult] = await sequelize.query('PRAGMA foreign_keys');
    console.log('🔍 Foreign key enforcement:', fkResult);
    
    // Ensure we have a player (create if needed)
    const [playerResult] = await sequelize.query('SELECT id FROM players WHERE id = 2');
    if (playerResult.length === 0) {
      console.log('⚠️ Player 2 not found, creating test player...');
      await sequelize.query(`
        INSERT INTO players (id, name, position, player_code, created_at, updated_at) 
        VALUES (2, 'Test Player', '3B', '1234', datetime('now'), datetime('now'))
      `);
    }
    
    // Test transaction
    await sequelize.transaction(async tx => {
      console.log('🔄 Starting transaction...');
      
      // Create session
      const session = await Session.create({
        player_id: 2,
        session_date: new Date().toISOString().split('T')[0],
        session_type: 'hittrax',
        player_level: 'High School'
      }, { transaction: tx });
      
      console.log('✅ Session created with ID:', session.id);
      
      // Verify session exists in transaction
      const [sessionCheck] = await sequelize.query(
        `SELECT id FROM sessions WHERE id = ${session.id}`,
        { transaction: tx }
      );
      console.log('🔍 Session visibility in transaction:', sessionCheck);
      
      // Insert one test record
      const exitData = await ExitVelocityData.create({
        session_id: session.id,
        strike_zone: 8,
        exit_velocity: 95.9,
        launch_angle: 16.2,
        distance: 286
      }, { transaction: tx });
      
      console.log('✅ Exit velocity data created with ID:', exitData.id);
      
      // Verify data exists in transaction
      const [dataCheck] = await sequelize.query(
        `SELECT COUNT(*) as count FROM exit_velocity_data WHERE session_id = ${session.id}`,
        { transaction: tx }
      );
      console.log('🔍 Data count in transaction:', dataCheck);
    });
    
    console.log('🎉 Transaction completed successfully!');
    
  } catch (error) {
    console.error('❌ Transaction failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      sql: error.sql,
      parameters: error.parameters
    });
  } finally {
    await sequelize.close();
  }
}

testMinimalTransaction(); 