const { sequelize } = require('../src/config/database');
const Session = require('../src/models/Session');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected using main app Sequelize instance');

    // 1) Check model attributes
    console.log('🔍 Session Model Attributes:');
    console.log(Session.rawAttributes);
    
    // 2) Check model options
    console.log('\n🔍 Session Model Options:');
    console.log({
      tableName: Session.tableName,
      timestamps: Session.options.timestamps,
      createdAt: Session.options.createdAt,
      updatedAt: Session.options.updatedAt
    });

    // 3) Check actual table schema
    console.log('\n🔍 Actual Database Schema:');
    const schema = await sequelize.query(`PRAGMA table_info('sessions');`, { type: sequelize.QueryTypes.SELECT });
    console.table(schema);

    // 4) Test model sync
    console.log('\n🔍 Testing model sync...');
    await Session.sync({ force: false });
    console.log('✅ Model sync completed');

    // 5) Test a simple insert without transaction
    console.log('\n🔍 Testing simple insert...');
    const testSession = await Session.create({
      player_id: 2,
      session_date: new Date(),
      session_type: 'hittrax'
    });
    console.log('✅ Inserted session:', testSession.toJSON());
    
    // 6) Test finding it back
    const found = await Session.findByPk(testSession.id);
    console.log('✅ Found session:', found ? found.toJSON() : 'NOT FOUND');
    
    // 7) Clean up
    await testSession.destroy();
    console.log('✅ Cleaned up test session');

    console.log('\n✅ Model verification complete!');
    
  } catch (error) {
    console.error('❌ Model verification failed:', error);
  } finally {
    await sequelize.close();
  }
})(); 