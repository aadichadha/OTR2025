#!/usr/bin/env node

/**
 * OTR Baseball Analytics - Deployment Checklist
 * 
 * This script validates all critical components before deployment to prevent
 * common issues that could cause system failures.
 */

const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

class DeploymentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checks = [];
  }

  addCheck(name, checkFn) {
    this.checks.push({ name, checkFn });
  }

  addError(message) {
    this.errors.push(message);
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  async runChecks() {
    console.log('🔍 OTR Baseball Analytics - Deployment Validation');
    console.log('=' .repeat(50));

    for (const check of this.checks) {
      try {
        console.log(`\n🔍 Running: ${check.name}`);
        await check.checkFn();
        console.log(`✅ ${check.name} - PASSED`);
      } catch (error) {
        console.log(`❌ ${check.name} - FAILED: ${error.message}`);
        this.addError(`${check.name}: ${error.message}`);
      }
    }

    this.printResults();
  }

  printResults() {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 VALIDATION RESULTS');
    console.log('=' .repeat(50));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All checks passed! Deployment is ready.');
      return true;
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`  - ${error}`));
      console.log('\n🚫 Deployment blocked due to errors above.');
      return false;
    }

    return true;
  }
}

async function validateDeployment() {
  const validator = new DeploymentValidator();

  // 1. Environment Variables Check
  validator.addCheck('Environment Variables', async () => {
    const required = ['NODE_ENV', 'JWT_SECRET', 'FRONTEND_URL'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required in production');
    }
  });

  // 2. Database Connection Check
  validator.addCheck('Database Connection', async () => {
    if (process.env.NODE_ENV === 'production') {
      const sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: { require: true, rejectUnauthorized: false }
        }
      });

      await sequelize.authenticate();
      await sequelize.close();
    }
  });

  // 3. Database Schema Check
  validator.addCheck('Database Schema', async () => {
    if (process.env.NODE_ENV === 'production') {
      const sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: { require: true, rejectUnauthorized: false }
        }
      });

      // Check for required tables
      const tables = ['users', 'players', 'sessions', 'exit_velocity_data', 'bat_speed_data'];
      for (const table of tables) {
        const [result] = await sequelize.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
          { bind: [table] }
        );
        
        if (!result[0].exists) {
          throw new Error(`Required table '${table}' does not exist`);
        }
      }

      // Check for invitation columns in users table
      const [columns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('invitation_token', 'invitation_expires_at', 'invitation_status', 'invited_by')
      `);

      const requiredColumns = ['invitation_token', 'invitation_expires_at', 'invitation_status', 'invited_by'];
      const missingColumns = requiredColumns.filter(col => 
        !columns.some(row => row.column_name === col)
      );

      if (missingColumns.length > 0) {
        throw new Error(`Missing invitation columns: ${missingColumns.join(', ')}`);
      }

      await sequelize.close();
    }
  });

  // 4. CORS Configuration Check
  validator.addCheck('CORS Configuration', async () => {
    const appPath = path.join(__dirname, '../src/app.js');
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    // Check for old Vercel domains
    const oldDomains = [
      'otr-2025-frontend.vercel.app',
      'otr-2025-frontend-pd5mjq47m-aadis-projects-cfbb1119.vercel.app'
    ];

    for (const domain of oldDomains) {
      if (appContent.includes(domain)) {
        validator.addWarning(`Old Vercel domain found in CORS config: ${domain}`);
      }
    }

    // Check for current domains
    const currentDomains = ['otr-data.com', 'otr2025.onrender.com'];
    for (const domain of currentDomains) {
      if (!appContent.includes(domain)) {
        validator.addWarning(`Current domain not found in CORS config: ${domain}`);
      }
    }
  });

  // 5. Email Configuration Check
  validator.addCheck('Email Configuration', async () => {
    if (process.env.NODE_ENV === 'production') {
      const required = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASSWORD'];
      const missing = required.filter(key => !process.env[key]);
      
      if (missing.length > 0) {
        validator.addWarning(`Email service not fully configured: ${missing.join(', ')}`);
      }
    }
  });

  // 6. Frontend Environment Check
  validator.addCheck('Frontend Environment', async () => {
    const frontendEnvPath = path.join(__dirname, '../../frontend/env.production');
    if (fs.existsSync(frontendEnvPath)) {
      const content = fs.readFileSync(frontendEnvPath, 'utf8');
      
      if (!content.includes('VITE_API_URL=https://otr2025.onrender.com/api')) {
        validator.addWarning('Frontend API URL may not be pointing to production backend');
      }
    }
  });

  // 7. Migration Files Check
  validator.addCheck('Migration Files', async () => {
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir);
    
    // Check for duplicate migration files
    const migrationNames = files.map(f => f.replace('.js', ''));
    const duplicates = migrationNames.filter((name, index) => 
      migrationNames.indexOf(name) !== index
    );

    if (duplicates.length > 0) {
      validator.addWarning(`Potential duplicate migrations: ${duplicates.join(', ')}`);
    }
  });

  // 8. Package Dependencies Check
  validator.addCheck('Package Dependencies', async () => {
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredDeps = ['express', 'sequelize', 'pg', 'nodemailer', 'jsonwebtoken'];
    const missing = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required dependencies: ${missing.join(', ')}`);
    }
  });

  return await validator.runChecks();
}

// Run validation if called directly
if (require.main === module) {
  validateDeployment()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateDeployment }; 