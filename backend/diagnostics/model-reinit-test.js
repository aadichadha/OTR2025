const { sequelize } = require('../src/config/database');
const { DataTypes } = require('sequelize');

// Re-define the Session model to ensure it's using the correct instance
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
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Re-define ExitVelocityData model
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
    type: DataTypes.FLOAT,
    allowNull: false
  },
  launch_angle: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  distance: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  strike_zone: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'exit_velocity_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected using main app Sequelize instance');

    // Get a valid player_id
    const players = await sequelize.query('SELECT id FROM players LIMIT 1', { type: sequelize.QueryTypes.SELECT });
    const playerId = players[0].id;
    console.log('🎯 Using player_id:', playerId);

    // Test transaction with re-initialized models
    const t = await sequelize.transaction();
    try {
      console.log('🔄 Starting transaction with re-initialized models...');
      
      // Step 1: Create session
      const session = await Session.create({
        player_id: playerId,
        session_date: new Date(),
        session_type: 'hittrax'
      }, { transaction: t });
      console.log('🆕 Created session id=', session.id);

      // Step 2: Try to find the session within the same transaction
      const foundSession = await Session.findByPk(session.id, { transaction: t });
      console.log('🔍 Session found in TX:', foundSession ? '✅ YES' : '❌ NO');
      
      if (foundSession) {
        console.log('📋 Session details:', foundSession.toJSON());
      }

      // Step 3: Test bulk insert
      const mockData = [
        {
          session_id: session.id,
          exit_velocity: 85.5,
          launch_angle: 12.3,
          distance: 245.7,
          strike_zone: 'middle'
        }
      ];

      console.log('📊 Attempting bulk insert...');
      const records = await ExitVelocityData.bulkCreate(mockData, { transaction: t });
      console.log('✅ Bulk insert successful, created', records.length, 'records');

      // Step 4: Commit
      await t.commit();
      console.log('✅ Transaction committed successfully!');

      // Step 5: Verify data is visible
      const committedSession = await Session.findByPk(session.id);
      console.log('🔍 Session after commit:', committedSession ? '✅ FOUND' : '❌ NOT FOUND');
      
      const committedRecords = await ExitVelocityData.findAll({
        where: { session_id: session.id }
      });
      console.log('🔍 Records after commit:', committedRecords.length);

      // Step 6: Clean up
      await ExitVelocityData.destroy({ where: { session_id: session.id } });
      await Session.destroy({ where: { id: session.id } });
      console.log('🧹 Cleaned up test data');
      
    } catch (err) {
      console.error('❌ Error in transaction:', err);
      await t.rollback();
    }

    console.log('✅ Model re-initialization test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
})(); 