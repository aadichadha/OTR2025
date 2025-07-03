const { sequelize } = require('../src/config/database');
const { ExitVelocityData } = require('../src/models');

async function addSprayChartFields() {
  try {
    console.log('🚀 Adding spray chart fields to exit_velocity_data table...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Add the new columns using Sequelize queryInterface
    const queryInterface = sequelize.getQueryInterface();
    
    // Add spray_chart_x column
    await queryInterface.addColumn('exit_velocity_data', 'spray_chart_x', {
      type: 'DECIMAL(8, 4)',
      allowNull: true,
      comment: 'Spray chart X coordinate from Hittrax CSV'
    });
    console.log('✅ Added spray_chart_x column');
    
    // Add spray_chart_z column
    await queryInterface.addColumn('exit_velocity_data', 'spray_chart_z', {
      type: 'DECIMAL(8, 4)',
      allowNull: true,
      comment: 'Spray chart Z coordinate from Hittrax CSV'
    });
    console.log('✅ Added spray_chart_z column');
    
    // Add horiz_angle column
    await queryInterface.addColumn('exit_velocity_data', 'horiz_angle', {
      type: 'DECIMAL(6, 2)',
      allowNull: true,
      comment: 'Horizontal angle from Hittrax CSV'
    });
    console.log('✅ Added horiz_angle column');
    
    console.log('🎉 All spray chart fields added successfully!');
    
    // Verify the columns were added
    const tableInfo = await queryInterface.describeTable('exit_velocity_data');
    console.log('\n📊 Current columns in exit_velocity_data table:');
    Object.keys(tableInfo).forEach(column => {
      console.log(`  - ${column}: ${tableInfo[column].type}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to add spray chart fields:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script if executed directly
if (require.main === module) {
  addSprayChartFields()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addSprayChartFields }; 