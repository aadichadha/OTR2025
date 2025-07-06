const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

// Check if DATABASE_URL is provided
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL not found!');
  process.exit(1);
}

async function checkDatabaseStructure() {
  let sequelize;
  
  try {
    console.log('🔗 Connecting to production PostgreSQL database...');
    
    // Connect to production database
    sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
    
    await sequelize.authenticate();
    console.log('✅ Production database connection established');

    // Check users table structure
    console.log('\n📋 Checking users table structure...');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Check if demo users exist
    console.log('\n👥 Checking demo users...');
    const [users] = await sequelize.query(`
      SELECT id, email, name, role, created_at 
      FROM users 
      WHERE email IN ('admin@otr.com', 'coach@otr.com', 'player@otr.com')
    `);
    
    console.log('Demo users found:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    // Test password verification
    console.log('\n🔐 Testing password verification...');
    const testPassword = 'password123';
    const hashedPassword = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log(`Password '${testPassword}' matches hash: ${isValid}`);

    // Test login with coach user
    console.log('\n🧪 Testing login with coach@otr.com...');
    const [coachUser] = await sequelize.query(`
      SELECT * FROM users WHERE email = 'coach@otr.com'
    `);
    
    if (coachUser && coachUser.length > 0) {
      const user = coachUser[0];
      console.log('Coach user found:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });
      
      // Check if password column exists and has value
      if (user.password) {
        console.log('✅ Password column exists and has value');
        const passwordValid = await bcrypt.compare('password123', user.password);
        console.log('Password verification result:', passwordValid);
      } else {
        console.log('❌ Password column is null or undefined');
      }
    } else {
      console.log('❌ Coach user not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the check
checkDatabaseStructure(); 