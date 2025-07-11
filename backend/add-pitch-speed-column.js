const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function addPitchSpeedColumn() {
  const dbPath = path.join(__dirname, 'database/otrbaseball.db');
  const db = new sqlite3.Database(dbPath);

  return new Promise((resolve, reject) => {
    console.log('🔧 Adding pitch_speed column to exit_velocity_data table...');
    
    // Check if column already exists
    db.get("PRAGMA table_info(exit_velocity_data)", (err, rows) => {
      if (err) {
        console.error('❌ Error checking table structure:', err);
        db.close();
        reject(err);
        return;
      }

      // Get all columns
      db.all("PRAGMA table_info(exit_velocity_data)", (err, columns) => {
        if (err) {
          console.error('❌ Error getting table info:', err);
          db.close();
          reject(err);
          return;
        }

        const columnNames = columns.map(col => col.name);
        console.log('📋 Current columns:', columnNames);

        if (columnNames.includes('pitch_speed')) {
          console.log('✅ pitch_speed column already exists');
          db.close();
          resolve();
          return;
        }

        // Add the pitch_speed column
        const sql = `
          ALTER TABLE exit_velocity_data 
          ADD COLUMN pitch_speed DECIMAL(5, 2) 
          DEFAULT NULL;
        `;

        db.run(sql, (err) => {
          if (err) {
            console.error('❌ Error adding pitch_speed column:', err);
            db.close();
            reject(err);
            return;
          }

          console.log('✅ Successfully added pitch_speed column');
          
          // Verify the column was added
          db.all("PRAGMA table_info(exit_velocity_data)", (err, columns) => {
            if (err) {
              console.error('❌ Error verifying column addition:', err);
            } else {
              const newColumnNames = columns.map(col => col.name);
              console.log('📋 Updated columns:', newColumnNames);
            }
            db.close();
            resolve();
          });
        });
      });
    });
  });
}

// Run if called directly
if (require.main === module) {
  addPitchSpeedColumn()
    .then(() => {
      console.log('🎉 Pitch speed column addition completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to add pitch speed column:', error);
      process.exit(1);
    });
}

module.exports = { addPitchSpeedColumn }; 