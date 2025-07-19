const CSVParser = require('../services/csvParser');
const { Session, Player, BatSpeedData, ExitVelocityData } = require('../models');
const { sequelize } = require('../config/database');
const { checkGoalProgress } = require('./goalController');
const path = require('path');
const fs = require('fs');

class UploadController {
  /**
   * Extract session date from CSV file (Column C)
   * @param {string} filePath - Path to the CSV file
   * @param {string} type - 'blast' or 'hittrax'
   * @returns {Date|null} - Parsed session date or null if not found
   */
  static async extractSessionDateFromCSV(filePath, type) {
    try {
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (type === 'blast') {
        // For Blast CSV, date is in the second column (index 1) at the 6th row (index 5) - box 6B
        // Format: "Nov 08, 2024 01:35:57 pm" - but comma splits it across columns
        if (lines.length > 5) {
          const columns = lines[5].split(',').map(col => col.trim());
          if (columns.length >= 3) {
            // The date is split across columns 2 and 3 due to the comma
            const datePart1 = columns[1]; // "Nov 08"
            const datePart2 = columns[2]; // "2024 01:35:57 pm"
            
            // Combine them to get the full date string
            const fullDateString = `${datePart1}, ${datePart2}`;
            console.log(`📅 Extracted session date from Blast CSV row 6, columns 2-3 (box 6B): ${fullDateString}`);
            
            // Parse the date string (format: "Nov 08, 2024 01:35:57 pm")
            // Extract just the date part: "Nov 08, 2024"
            const dateMatch = fullDateString.match(/([A-Za-z]{3}\s+\d{1,2},\s+\d{4})/);
            if (dateMatch) {
              const parsedDate = new Date(dateMatch[1]);
              if (!isNaN(parsedDate.getTime())) {
                console.log(`✅ Successfully parsed session date: ${parsedDate.toDateString()}`);
                return parsedDate;
              }
            }
          }
        }
      } else if (type === 'hittrax') {
        // For Hittrax CSV, start from row 2 (index 1)
        if (lines.length > 1) {
          const columns = lines[1].split(',').map(col => col.trim());
          if (columns.length >= 3) {
            const dateString = columns[2]; // Column C (0-indexed)
            console.log(`📅 Extracted session date from Hittrax CSV Column C: ${dateString}`);
            
            // Parse the date string (format: 3/3/2025 21:23:22.144)
            const dateMatch = dateString.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
            if (dateMatch) {
              const parsedDate = new Date(dateMatch[1]);
              if (!isNaN(parsedDate.getTime())) {
                console.log(`✅ Successfully parsed session date: ${parsedDate.toDateString()}`);
                return parsedDate;
              }
            }
          }
        }
      }
      
      console.log(`⚠️ Could not extract session date from CSV, will use provided date or current date`);
      return null;
    } catch (error) {
      console.error('Error extracting session date from CSV:', error);
      return null;
    }
  }

  /**
   * Handle Blast CSV upload
   */
  static async uploadBlast(req, res) {
    try {
      // Add detailed logging
      console.log('Upload request received:', {
        playerId: req.body.playerId,
        playerCode: req.body.playerCode,
        fileName: req.file?.originalname,
        fileSize: req.file?.size
      });

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      let { playerId, playerCode, playerLevel = 'High School', sessionDate } = req.body;

      // 🔐 validate request
      if (!playerId && !playerCode) {
        return res.status(400).json({ error: 'playerId or playerCode is required' });
      }

      // Allow lookup by player_code
      let player = null;
      if (playerId) {
        player = await Player.findByPk(playerId);
      } else if (playerCode) {
        player = await Player.findOne({ where: { player_code: playerCode } });
      }
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      // Extract session date from CSV Column C first
      console.log('📅 Extracting session date from CSV Column C...');
      const csvSessionDate = await UploadController.extractSessionDateFromCSV(req.file.path, 'blast');
      
      // Use CSV date if found, otherwise use provided date, otherwise use current date
      const sessionDateVal = csvSessionDate || (sessionDate ? new Date(sessionDate) : new Date());
      const sessionTimestamp = new Date(); // This ensures each upload creates a unique session

      console.log(`📅 Final session date: ${sessionDateVal.toDateString()}`);

      // Parse CSV first to get the data
      console.log('Parsing Blast CSV file...');
      const parseResult = await CSVParser.parseBlastCSV(req.file.path, null, null);
      console.log(`Parsed ${parseResult.parsedRows} records from Blast CSV`);

      // 🔄 Create session and save data in transaction
      let session;
      await sequelize.transaction(async t => {
        // Verify player exists in this transaction
        const playerExists = await Player.findByPk(player.id, { transaction: t });
        if (!playerExists) {
          throw new Error(`Player with ID ${player.id} not found in transaction`);
        }
        console.log('Found player in transaction:', playerExists.name);

        // Create session linked to player
        session = await Session.create({
          player_id: player.id,
          session_date: sessionDateVal,
          session_type: 'blast',
          created_at: sessionTimestamp // This ensures uniqueness
        }, { transaction: t });

        console.log('Created session with ID:', session.id);

        // Parse CSV again to get ALL data with session ID
        console.log('Parsing Blast CSV with session ID...');
        const fullParseResult = await CSVParser.parseBlastCSV(req.file.path, session.id, t);
        console.log(`Successfully saved ${fullParseResult.parsedRows} records to database`);
      });

      // Generate report AFTER transaction is committed
      console.log('📄 Generating report after transaction commit...');
      const { aggregateReportData } = require('../services/reportAggregator');
      const reportData = await aggregateReportData(session.id);
      console.log('✅ Report generated successfully');

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      // Check goal progress after successful upload
      console.log('🎯 Checking goal progress...');
      await checkGoalProgress(player.id, session.id);

      // After generating the report, log the full metrics object for debugging
      console.log('[DEBUG] Full report data:', JSON.stringify(reportData, null, 2));
      if (reportData && reportData.metrics && reportData.metrics.batSpeed) {
        console.log('[DEBUG] Final bat speed metrics object:', reportData.metrics.batSpeed);
      }

      res.status(200).json({
        message: 'Blast data uploaded successfully',
        sessionId: session.id,
        playerName: player.name,
        playerCode: player.player_code,
        sessionDate: sessionDateVal.toDateString(),
        report: reportData,
        parseResult: {
          totalRows: parseResult.totalRows,
          parsedRows: parseResult.parsedRows,
          errorCount: parseResult.errorCount
        }
      });

    } catch (error) {
      console.error('💥 Blast upload error:', error);
      console.error('Error stack:', error.stack);
      if (req.file && fs.existsSync(req.file.path)) {
        console.log('🧹 Cleaning up file after error...');
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to process Blast file', details: error.message });
    }
  }

  /**
   * Handle Hittrax CSV upload
   */
  static async uploadHittrax(req, res) {
    try {
      console.log('🚀 Hittrax upload started');
      
      // Add detailed logging
      console.log('Upload request received:', {
        playerId: req.body.playerId,
        playerCode: req.body.playerCode,
        fileName: req.file?.originalname,
        fileSize: req.file?.size
      });

      if (!req.file) {
        console.log('❌ No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      let { playerId, playerCode, playerLevel = 'High School', sessionDate } = req.body;
      console.log('📋 Request body:', { playerId, playerCode, playerLevel, sessionDate });

      // 🔐 validate request
      if (!playerId && !playerCode) {
        console.log('❌ Missing playerId or playerCode');
        return res.status(400).json({ error: 'playerId or playerCode is required' });
      }

      // Allow lookup by player_code
      let player = null;
      if (playerId) {
        console.log('🔍 Looking up player by ID:', playerId);
        player = await Player.findByPk(playerId);
      } else if (playerCode) {
        console.log('🔍 Looking up player by code:', playerCode);
        player = await Player.findOne({ where: { player_code: playerCode } });
      }
      
      if (!player) {
        console.log('❌ Player not found');
        return res.status(404).json({ error: 'Player not found' });
      }
      
      console.log('✅ Player found:', player.name);

      // Extract session date from CSV Column C first
      console.log('📅 Extracting session date from CSV Column C...');
      const csvSessionDate = await UploadController.extractSessionDateFromCSV(req.file.path, 'hittrax');
      
      // Use CSV date if found, otherwise use provided date, otherwise use current date
      const sessionDateVal = csvSessionDate || (sessionDate ? new Date(sessionDate) : new Date());
      const sessionTimestamp = new Date(); // This ensures each upload creates a unique session
      console.log(`📅 Final session date: ${sessionDateVal.toDateString()}`);
      
      let session;
      let fullParseResult;
      let reportData;
      console.log('🔄 Starting database transaction...');
      await sequelize.transaction(async t => {
        console.log('📝 Creating session...');
        session = await Session.create({
          player_id: player.id,
          session_date: sessionDateVal,
          session_type: 'hittrax',
          created_at: sessionTimestamp // This ensures uniqueness
        }, { transaction: t });
        
        console.log(`✅ Created session with ID: ${session.id}`);
        
        // Parse CSV with session ID to save all data
        console.log('📊 Parsing Hittrax CSV with session ID...');
        fullParseResult = await CSVParser.parseHittraxCSV(req.file.path, session.id, t);
        console.log(`📊 Parse result - Total: ${fullParseResult.totalRows}, Parsed: ${fullParseResult.parsedRows}`);
        
        // Verify the data was actually saved
        const savedCount = await ExitVelocityData.count({ 
          where: { session_id: session.id }, 
          transaction: t 
        });
        console.log(`💾 Actually saved ${savedCount} records to database`);
        
        if (savedCount !== fullParseResult.parsedRows) {
          console.error(`⚠️ MISMATCH! Parsed ${fullParseResult.parsedRows} but saved ${savedCount}`);
        }
        
        // Generate report INSIDE transaction with transaction support
        console.log('📄 Generating report inside transaction...');
        const { aggregateReportData } = require('../services/reportAggregator');
        reportData = await aggregateReportData(session.id, { transaction: t });
        console.log('✅ Report generated successfully');
      });
      
      console.log('🧹 Cleaning up uploaded file...');
      fs.unlinkSync(req.file.path);
      
      // Check goal progress after successful upload
      console.log('🎯 Checking goal progress...');
      await checkGoalProgress(player.id, session.id);
      
      // After generating the report, log the full metrics object for debugging
      if (reportData && reportData.metrics && reportData.metrics.exitVelocity) {
        console.log('[DEBUG] Final exit velocity metrics object:', reportData.metrics.exitVelocity);
      }
      res.status(200).json({
        message: 'Hittrax data uploaded successfully',
        sessionId: session.id,
        playerName: player.name,
        playerCode: player.player_code,
        sessionDate: sessionDateVal.toDateString(),
        report: reportData,
        parseResult: {
          totalRows: fullParseResult.totalRows,
          parsedRows: fullParseResult.parsedRows,
          errorCount: fullParseResult.errorCount
        }
      });
    } catch (error) {
      console.error('💥 Hittrax upload error:', error);
      console.error('Error stack:', error.stack);
      if (req.file && fs.existsSync(req.file.path)) {
        console.log('🧹 Cleaning up file after error...');
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to process Hittrax file', details: error.message });
    }
  }
}

module.exports = UploadController; 