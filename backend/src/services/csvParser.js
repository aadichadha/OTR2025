const csv = require('csv-parser');
const fs = require('fs');
const { BatSpeedData, ExitVelocityData } = require('../models');

class CSVParser {
  /**
   * Parse Blast CSV file (bat speed data)
   * @param {string} filePath - Path to the CSV file
   * @param {number} sessionId - Database session ID
   * @returns {Promise<Object>} - Parsed data summary
   */
  static async parseBlastCSV(filePath, sessionId) {
    return new Promise((resolve, reject) => {
      const results = [];
      let rowCount = 0;
      let skippedRows = 0;
      let errorCount = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowCount++;
          
          // Skip first 8 rows as per existing Python code
          if (rowCount <= 8) {
            skippedRows++;
            return;
          }

          try {
            // Extract data from specific columns (0-indexed)
            // Column H = index 7 (bat speed)
            // Column K = index 10 (attack angle) 
            // Column P = index 15 (time to contact)
            
            const batSpeed = this.parseNumericValue(row[Object.keys(row)[7]]);
            const attackAngle = this.parseNumericValue(row[Object.keys(row)[10]]);
            const timeToContact = this.parseNumericValue(row[Object.keys(row)[15]]);

            // Only add row if we have at least bat speed data
            if (batSpeed !== null) {
              results.push({
                session_id: sessionId,
                bat_speed: batSpeed,
                attack_angle: attackAngle,
                time_to_contact: timeToContact
              });
            }
          } catch (error) {
            errorCount++;
            console.warn(`Error parsing row ${rowCount}:`, error.message);
          }
        })
        .on('end', async () => {
          try {
            // Save to database
            if (results.length > 0) {
              await BatSpeedData.bulkCreate(results);
            }

            const summary = {
              totalRows: rowCount,
              skippedRows: skippedRows,
              parsedRows: results.length,
              errorCount: errorCount,
              data: results.slice(0, 5) // Return first 5 rows for preview
            };

            resolve(summary);
          } catch (error) {
            reject(new Error(`Database save failed: ${error.message}`));
          }
        })
        .on('error', (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        });
    });
  }

  /**
   * Parse Hittrax CSV file (exit velocity data)
   * @param {string} filePath - Path to the CSV file
   * @param {number} sessionId - Database session ID
   * @returns {Promise<Object>} - Parsed data summary
   */
  static async parseHittraxCSV(filePath, sessionId) {
    return new Promise((resolve, reject) => {
      const results = [];
      let rowCount = 0;
      let errorCount = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowCount++;

          try {
            // Extract data from specific columns (0-indexed)
            // Column F = index 5 (strike zone)
            // Column H = index 7 (exit velocity)
            // Column I = index 8 (launch angle)
            // Column J = index 9 (distance)
            
            const strikeZone = this.parseNumericValue(row[Object.keys(row)[5]]);
            const exitVelocity = this.parseNumericValue(row[Object.keys(row)[7]]);
            const launchAngle = this.parseNumericValue(row[Object.keys(row)[8]]);
            const distance = this.parseNumericValue(row[Object.keys(row)[9]]);

            // Only add row if we have exit velocity data
            if (exitVelocity !== null && exitVelocity > 0) {
              results.push({
                session_id: sessionId,
                strike_zone: strikeZone,
                exit_velocity: exitVelocity,
                launch_angle: launchAngle,
                distance: distance
              });
            }
          } catch (error) {
            errorCount++;
            console.warn(`Error parsing row ${rowCount}:`, error.message);
          }
        })
        .on('end', async () => {
          try {
            // Save to database
            if (results.length > 0) {
              await ExitVelocityData.bulkCreate(results);
            }

            const summary = {
              totalRows: rowCount,
              parsedRows: results.length,
              errorCount: errorCount,
              data: results.slice(0, 5) // Return first 5 rows for preview
            };

            resolve(summary);
          } catch (error) {
            reject(new Error(`Database save failed: ${error.message}`));
          }
        })
        .on('error', (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        });
    });
  }

  /**
   * Parse numeric value with error handling
   * @param {string} value - Raw value from CSV
   * @returns {number|null} - Parsed number or null if invalid
   */
  static parseNumericValue(value) {
    if (!value || value === '' || value === 'null' || value === 'undefined') {
      return null;
    }

    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Validate CSV file structure
   * @param {string} filePath - Path to the CSV file
   * @param {string} type - 'blast' or 'hittrax'
   * @returns {Promise<boolean>} - True if valid
   */
  static async validateCSVStructure(filePath, type) {
    return new Promise((resolve, reject) => {
      const headers = [];
      let isValid = false;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          if (headers.length === 0) {
            headers.push(...Object.keys(row));
          }
        })
        .on('end', () => {
          if (type === 'blast') {
            // Blast CSV should have at least 16 columns (0-15)
            isValid = headers.length >= 16;
          } else if (type === 'hittrax') {
            // Hittrax CSV should have at least 10 columns (0-9)
            isValid = headers.length >= 10;
          }
          resolve(isValid);
        })
        .on('error', (error) => {
          reject(new Error(`CSV validation failed: ${error.message}`));
        });
    });
  }
}

module.exports = CSVParser; 