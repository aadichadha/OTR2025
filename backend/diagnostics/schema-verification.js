const { sequelize } = require('../src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to SQLite using main app instance');

    // 1) PRAGMA foreign_keys status
    const fk = await sequelize.query(`PRAGMA foreign_keys;`, { type: sequelize.QueryTypes.SELECT });
    console.log('🔍 foreign_keys=', fk[0].foreign_keys);

    // 2) list all tables
    const tables = await sequelize.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`,
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('📋 Tables:', tables.map(t => t.name));

    // 3) for each table: schema + foreign_key_list
    for (const { name } of tables) {
      console.log(`\n📖 Schema for ${name}:`);
      const schema = await sequelize.query(`PRAGMA table_info('${name}');`, { type: sequelize.QueryTypes.SELECT });
      console.table(schema);

      console.log(`🔗 Foreign keys for ${name}:`);
      const fkList = await sequelize.query(`PRAGMA foreign_key_list('${name}');`, { type: sequelize.QueryTypes.SELECT });
      console.table(fkList);

      // 4) orphaned record check:
      for (const fk of fkList) {
        console.log(`  • Checking orphans in ${name}.${fk.from} → ${fk.table}.${fk.to}`);
        const orphans = await sequelize.query(
          `SELECT ${fk.from} FROM ${name} WHERE ${fk.from} NOT IN (SELECT ${fk.to} FROM ${fk.table});`,
          { type: sequelize.QueryTypes.SELECT }
        );
        console.log(`    → ${orphans.length} orphan(s)`);
      }
    }

    // 5) Additional checks for our specific tables
    console.log('\n🔍 SPECIFIC CHECKS:');
    
    // Check if players table has data
    const playerCount = await sequelize.query('SELECT COUNT(*) as count FROM players', { type: sequelize.QueryTypes.SELECT });
    console.log('   Players count:', playerCount[0].count);
    
    // Check sessions
    const sessionCount = await sequelize.query('SELECT COUNT(*) as count FROM sessions', { type: sequelize.QueryTypes.SELECT });
    console.log('   Sessions count:', sessionCount[0].count);
    
    // Check exit_velocity_data
    const exitCount = await sequelize.query('SELECT COUNT(*) as count FROM exit_velocity_data', { type: sequelize.QueryTypes.SELECT });
    console.log('   Exit velocity records count:', exitCount[0].count);
    
    // Check bat_speed_data
    const batCount = await sequelize.query('SELECT COUNT(*) as count FROM bat_speed_data', { type: sequelize.QueryTypes.SELECT });
    console.log('   Bat speed records count:', batCount[0].count);

    console.log('\n✅ Schema verification complete!');
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
  } finally {
    await sequelize.close();
  }
})(); 