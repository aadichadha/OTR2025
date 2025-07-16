const fs = require('fs').promises;
const { BatSpeedData, ExitVelocityData } = require('../models');

class CSVParser {
  /**
   * Parse Blast CSV file (bat speed data) using direct column indexing
   * @param {string} filePath - Path to the CSV file
   * @param {number} sessionId - Database session ID (can be null for initial parsing)
   * @param {Object} transaction - Sequelize transaction object
   * @returns {Promise<Object>} - Parsed data summary
   */
  static async parseBlastCSV(filePath, sessionId, transaction = null) {
    try {
      console.log('Starting Blast CSV parsing:', filePath);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      console.log(`Total lines in file: ${lines.length}`);
      console.log('First 10 lines:', lines.slice(0, 10));
      
      const results = [];
      
      // Blast CSV data starts at row 10 (index 9) - skip first 9 rows (headers/empty)
      const dataStartRow = 9;
      
      if (dataStartRow >= lines.length) {
        throw new Error('Blast CSV file too short - no data rows found');
      }
      
      console.log(`Data starts at row ${dataStartRow + 1} (index ${dataStartRow})`);
      
      // Process data rows starting from row 11
      for (let i = dataStartRow; i < lines.length; i++) {
        const columns = lines[i].split(',').map(col => col.trim());
        
        if (columns.length < 16) {
          console.log(`Skipping row ${i + 1}: insufficient columns (${columns.length}, need at least 16)`);
          continue;
        }
        
        // Column H (index 7): Bat Speed
        const batSpeed = parseFloat(columns[7]);
        // Column K (index 10): Attack Angle  
        const attackAngle = parseFloat(columns[10]);
        // Column P (index 15): Time to Contact
        const timeToContact = parseFloat(columns[15]);
        
        console.log(`Row ${i + 1}: BatSpeed=${columns[7]} (col H), AttackAngle=${columns[10]} (col K), TimeToContact=${columns[15]} (col P)`);
        
        // Only require bat speed to be valid (other fields can be null)
        if (!isNaN(batSpeed) && batSpeed > 0) {
          const dataRow = {
            bat_speed: batSpeed,
            attack_angle: isNaN(attackAngle) ? null : attackAngle,
            time_to_contact: isNaN(timeToContact) ? null : timeToContact
          };
          
          // Add session_id if provided
          if (sessionId) {
            dataRow.session_id = sessionId;
          }
          
          results.push(dataRow);
        } else {
          console.log(`Skipping row ${i + 1}: invalid bat speed value (${columns[7]})`);
        }
      }
      
      console.log(`Successfully parsed ${results.length} Blast records`);
      if (results.length > 0) {
        console.log('Sample data:', JSON.stringify(results.slice(0, 3), null, 2));
        
        // Only save to database if sessionId is provided
        if (sessionId && results.length > 0) {
          console.log(`🔍 DEBUG: About to save ${results.length} Blast records to database`);
          console.log(`🔍 DEBUG: First 5 records:`, JSON.stringify(results.slice(0, 5), null, 2));
          
          const chunkSize = 300;
          for (let i = 0; i < results.length; i += chunkSize) {
            const chunk = results.slice(i, i + chunkSize);
            console.log(`🔍 DEBUG: Processing chunk ${Math.floor(i/chunkSize) + 1}, size: ${chunk.length}`);
            
            try {
              const inserted = await BatSpeedData.bulkCreate(chunk, {
                transaction,
                validate: false,
                logging: console.log
              });
              console.log(`🔍 DEBUG: Successfully inserted ${inserted.length} Blast records in this chunk`);
            } catch (error) {
              console.error(`🔍 DEBUG: Error inserting Blast chunk:`, error);
              throw error;
            }
          }
          console.log(`🔍 DEBUG: Total Blast records processed: ${results.length}`);
        }
      }
      
      return {
        totalRows: lines.length,
        skippedRows: lines.length - results.length,
        parsedRows: results.length,
        errorCount: 0,
        data: results
      };
      
    } catch (error) {
      console.error('Blast CSV parsing error:', error);
      throw error;
    }
  }

  /**
   * Parse Hittrax CSV file (exit velocity data) using direct column indexing
   * @param {string} filePath - Path to the CSV file
   * @param {number} sessionId - Database session ID (can be null for initial parsing)
   * @param {Object} transaction - Sequelize transaction object
   * @returns {Promise<Object>} - Parsed data summary
   */
  static async parseHittraxCSV(filePath, sessionId, transaction = null) {
    try {
      console.log('Starting Hittrax CSV parsing:', filePath);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      console.log(`Total lines in file: ${lines.length}`);
      console.log('First 3 lines:', lines.slice(0, 3));
      
      const results = [];
      
      // Hittrax starts from row 2 (index 1)
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(col => col.trim());
        
        if (columns.length < 24) {
          console.log(`Skipping row ${i + 1}: insufficient columns (${columns.length})`);
          continue;
        }
        
        const pitchSpeed = parseFloat(columns[4]);  // Column E - Pitch Speed
        const velo = parseFloat(columns[7]);    // Column H
        const la = parseFloat(columns[8]);      // Column I
        const dist = parseFloat(columns[9]);    // Column J
        const strikeZone = parseInt(columns[5]); // Column F
        const sprayChartX = parseFloat(columns[22]); // Column W - Spray Chart X
        const sprayChartZ = parseFloat(columns[23]); // Column X - Spray Chart Z
        
        console.log(`Row ${i + 1}: PitchSpeed=${columns[4]}, Velo=${columns[7]}, LA=${columns[8]}, Dist=${columns[9]}, SprayX=${columns[22]}, SprayZ=${columns[23]}`);
        
        if (!isNaN(velo) && !isNaN(la) && !isNaN(dist) && velo > 0) {
          const dataRow = {
            strike_zone: isNaN(strikeZone) ? null : strikeZone,
            exit_velocity: velo,
            launch_angle: la,
            distance: dist,
            pitch_speed: isNaN(pitchSpeed) ? null : pitchSpeed,
            spray_chart_x: isNaN(sprayChartX) ? null : sprayChartX,
            spray_chart_z: isNaN(sprayChartZ) ? null : sprayChartZ
          };
          // Debug log for distance and strike_zone
          console.log(`[DEBUG] Parsed row: distance=${dist}, strike_zone=${strikeZone}`);
          // Add session_id if provided
          if (sessionId) {
            dataRow.session_id = sessionId;
          }
          results.push(dataRow);
        }
      }
      
      console.log(`Successfully parsed ${results.length} Hittrax records`);
      if (results.length > 0) {
        console.log('Sample data:', JSON.stringify(results.slice(0, 3), null, 2));
        
        // Only save to database if sessionId is provided
        if (sessionId && results.length > 0) {
          console.log(`🔍 DEBUG: About to save ${results.length} records to database`);
          console.log(`🔍 DEBUG: First 5 records:`, JSON.stringify(results.slice(0, 5), null, 2));
          
          const chunkSize = 300;
          for (let i = 0; i < results.length; i += chunkSize) {
            const chunk = results.slice(i, i + chunkSize);
            console.log(`🔍 DEBUG: Processing chunk ${Math.floor(i/chunkSize) + 1}, size: ${chunk.length}`);
            
            try {
              const inserted = await ExitVelocityData.bulkCreate(chunk, {
                transaction,
                validate: false,
                logging: console.log
              });
              console.log(`🔍 DEBUG: Successfully inserted ${inserted.length} records in this chunk`);
            } catch (error) {
              console.error(`🔍 DEBUG: Error inserting chunk:`, error);
              throw error;
            }
          }
          console.log(`🔍 DEBUG: Total records processed: ${results.length}`);
        }
      }
      
      return {
        totalRows: lines.length,
        parsedRows: results.length,
        errorCount: 0,
        data: results
      };
      
    } catch (error) {
      console.error('Hittrax CSV parsing error:', error);
      throw error;
    }
  }

  /**
   * Parse numeric value from string
   * @param {string} value - String value to parse
   * @returns {number|null} - Parsed number or null if invalid
   */
  static parseNumericValue(value) {
    if (!value || value.trim() === '') return null;
    const parsed = parseFloat(value.trim());
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Validate CSV file structure
   * @param {string} filePath - Path to the CSV file
   * @param {string} type - 'blast' or 'hittrax'
   * @returns {Promise<boolean>} - True if valid
   */
  static async validateCSVStructure(filePath, type) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (type === 'blast') {
        // Blast CSV should have at least 15 columns in data rows
        return lines.length > 0;
      } else if (type === 'hittrax') {
        // Hittrax CSV should have at least 10 columns
        return lines.length > 1;
      }
      
      return false;
    } catch (error) {
      console.error(`${type} CSV validation error:`, error);
      return false;
    }
  }
}

module.exports = CSVParser; 