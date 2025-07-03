const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Create a fresh Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(__dirname, '../../database/otrbaseball.db'),
  logging: console.log,
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  dialectOptions: {
    busyTimeout: 60000
  },
  define: {
    freezeTableName: true,
    timestamps: false
  },
  pool: {
    afterCreate: (conn, done) => {
      conn.run('PRAGMA foreign_keys = ON;', (err) => {
        if (err) console.error('Unable to enable foreign_keys:', err);
        done(err, conn);
      });
    }
  }
});

// Define models without timestamps
const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  player_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'players',
      key: 'id'
    }
  },
  session_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  session_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['blast', 'hittrax']]
    }
  }
}, {
  tableName: 'sessions',
  timestamps: false
});

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
      key: 'id'
    }
  },
  exit_velocity: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  launch_angle: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  distance: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false
  },
  strike_zone: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'exit_velocity_data',
  timestamps: false
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected with fresh Sequelize instance');

    // Get a valid player_id
    const players = await sequelize.query('SELECT id FROM players LIMIT 1', { type: sequelize.QueryTypes.SELECT });
    const playerId = players[0].id;
    console.log('🎯 Using player_id:', playerId);

    // Test with IMMEDIATE transaction
    console.log('🔄 Starting IMMEDIATE transaction...');
    
    // Use raw SQL to start an IMMEDIATE transaction
    await sequelize.query('BEGIN IMMEDIATE TRANSACTION;');
    
    try {
      // Step 1: Create session using raw SQL
      const sessionResult = await sequelize.query(
        'INSERT INTO sessions (player_id, session_date, session_type) VALUES (?, ?, ?) RETURNING id;',
        {
          replacements: [playerId, new Date().toISOString().split('T')[0], 'hittrax'],
          type: sequelize.QueryTypes.INSERT
        }
      );
      
      const sessionId = sessionResult[0];
      console.log('🆕 Created session id=', sessionId);

      // Step 2: Try to find the session within the same transaction
      const foundSession = await sequelize.query(
        'SELECT * FROM sessions WHERE id = ?;',
        {
          replacements: [sessionId],
          type: sequelize.QueryTypes.SELECT
        }
      );
      console.log('🔍 Session found in TX:', foundSession.length > 0 ? '✅ YES' : '❌ NO');
      
      if (foundSession.length > 0) {
        console.log('📋 Session details:', foundSession[0]);
      }

      // Step 3: Test bulk insert
      const mockData = [
        {
          session_id: sessionId,
          exit_velocity: 85.5,
          launch_angle: 12.3,
          distance: 245.7,
          strike_zone: 'middle'
        }
      ];

      console.log('📊 Attempting bulk insert...');
      
      for (const record of mockData) {
        await sequelize.query(
          'INSERT INTO exit_velocity_data (session_id, exit_velocity, launch_angle, distance, strike_zone) VALUES (?, ?, ?, ?, ?);',
          {
            replacements: [record.session_id, record.exit_velocity, record.launch_angle, record.distance, record.strike_zone],
            type: sequelize.QueryTypes.INSERT
          }
        );
      }
      console.log('✅ Bulk insert successful, created', mockData.length, 'records');

      // Step 4: Commit
      await sequelize.query('COMMIT;');
      console.log('✅ Transaction committed successfully!');

      // Step 5: Verify data is visible
      const committedSession = await sequelize.query(
        'SELECT * FROM sessions WHERE id = ?;',
        {
          replacements: [sessionId],
          type: sequelize.QueryTypes.SELECT
        }
      );
      console.log('🔍 Session after commit:', committedSession.length > 0 ? '✅ FOUND' : '❌ NOT FOUND');
      
      const committedRecords = await sequelize.query(
        'SELECT * FROM exit_velocity_data WHERE session_id = ?;',
        {
          replacements: [sessionId],
          type: sequelize.QueryTypes.SELECT
        }
      );
      console.log('🔍 Records after commit:', committedRecords.length);

      // Step 6: Clean up
      await sequelize.query('DELETE FROM exit_velocity_data WHERE session_id = ?;', {
        replacements: [sessionId],
        type: sequelize.QueryTypes.DELETE
      });
      await sequelize.query('DELETE FROM sessions WHERE id = ?;', {
        replacements: [sessionId],
        type: sequelize.QueryTypes.DELETE
      });
      console.log('🧹 Cleaned up test data');
      
    } catch (err) {
      console.error('❌ Error in transaction:', err);
      await sequelize.query('ROLLBACK;');
    }

    console.log('✅ IMMEDIATE transaction test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
})(); 