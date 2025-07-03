// Deployment validation script to ensure Vercel deployment works exactly like local
export const validateDeployment = async () => {
  console.log('[DEPLOYMENT VALIDATION] ===== STARTING DEPLOYMENT VALIDATION =====');
  
  const results = {
    environment: {},
    api: {},
    components: {},
    errors: [],
    warnings: []
  };
  
  try {
    // 1. Environment validation
    console.log('[DEPLOYMENT VALIDATION] Checking environment...');
    results.environment = {
      mode: import.meta.env.MODE,
      apiUrl: import.meta.env.VITE_API_URL,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    // 2. API connectivity test
    console.log('[DEPLOYMENT VALIDATION] Testing API connectivity...');
    try {
      const response = await fetch(import.meta.env.VITE_API_URL || 'http://localhost:3001/api/health');
      results.api = {
        status: response.status,
        ok: response.ok,
        url: response.url
      };
    } catch (error) {
      results.api = {
        error: error.message,
        status: 'failed'
      };
      results.errors.push(`API connectivity failed: ${error.message}`);
    }
    
    // 3. Component rendering test
    console.log('[DEPLOYMENT VALIDATION] Testing component rendering...');
    results.components = {
      reactVersion: React.version,
      muiAvailable: typeof MaterialUI !== 'undefined',
      routerAvailable: typeof ReactRouter !== 'undefined'
    };
    
    // 4. Local storage test
    console.log('[DEPLOYMENT VALIDATION] Testing local storage...');
    try {
      localStorage.setItem('deployment-test', 'test-value');
      const testValue = localStorage.getItem('deployment-test');
      localStorage.removeItem('deployment-test');
      results.localStorage = testValue === 'test-value';
    } catch (error) {
      results.localStorage = false;
      results.errors.push(`Local storage failed: ${error.message}`);
    }
    
    // 5. Performance test
    console.log('[DEPLOYMENT VALIDATION] Testing performance...');
    const startTime = performance.now();
    // Simulate some work
    for (let i = 0; i < 1000; i++) {
      Math.random();
    }
    const endTime = performance.now();
    results.performance = {
      executionTime: endTime - startTime,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    results.errors.push(`Validation failed: ${error.message}`);
  }
  
  console.log('[DEPLOYMENT VALIDATION] Validation results:', results);
  console.log('[DEPLOYMENT VALIDATION] ===== DEPLOYMENT VALIDATION COMPLETE =====');
  
  return results;
};

// Function to compare deployment results
export const compareDeployments = (localResults, vercelResults) => {
  console.log('[DEPLOYMENT COMPARISON] ===== COMPARING DEPLOYMENTS =====');
  
  const differences = {
    environment: {},
    api: {},
    components: {},
    performance: {},
    errors: []
  };
  
  // Compare environment
  Object.keys(localResults.environment).forEach(key => {
    if (localResults.environment[key] !== vercelResults.environment[key]) {
      differences.environment[key] = {
        local: localResults.environment[key],
        vercel: vercelResults.environment[key]
      };
    }
  });
  
  // Compare API
  Object.keys(localResults.api).forEach(key => {
    if (JSON.stringify(localResults.api[key]) !== JSON.stringify(vercelResults.api[key])) {
      differences.api[key] = {
        local: localResults.api[key],
        vercel: vercelResults.api[key]
      };
    }
  });
  
  // Compare components
  Object.keys(localResults.components).forEach(key => {
    if (localResults.components[key] !== vercelResults.components[key]) {
      differences.components[key] = {
        local: localResults.components[key],
        vercel: vercelResults.components[key]
      };
    }
  });
  
  // Compare performance
  if (localResults.performance && vercelResults.performance) {
    const localTime = localResults.performance.executionTime;
    const vercelTime = vercelResults.performance.executionTime;
    const timeDiff = Math.abs(localTime - vercelTime);
    const timeDiffPercent = (timeDiff / localTime) * 100;
    
    if (timeDiffPercent > 50) { // More than 50% difference
      differences.performance = {
        local: localTime,
        vercel: vercelTime,
        difference: timeDiff,
        differencePercent: timeDiffPercent
      };
    }
  }
  
  // Compare errors
  if (localResults.errors.length !== vercelResults.errors.length) {
    differences.errors = {
      local: localResults.errors,
      vercel: vercelResults.errors
    };
  }
  
  console.log('[DEPLOYMENT COMPARISON] Differences found:', differences);
  console.log('[DEPLOYMENT COMPARISON] ===== COMPARISON COMPLETE =====');
  
  return differences;
};

// Function to generate deployment report
export const generateDeploymentReport = (results) => {
  const report = {
    timestamp: new Date().toISOString(),
    environment: results.environment.mode,
    apiUrl: results.environment.apiUrl,
    apiStatus: results.api.status || results.api.error,
    componentsWorking: results.components.reactVersion && results.components.muiAvailable,
    localStorageWorking: results.localStorage,
    performanceTime: results.performance?.executionTime,
    errorCount: results.errors.length,
    warningCount: results.warnings.length,
    overallStatus: results.errors.length === 0 ? 'PASS' : 'FAIL'
  };
  
  console.log('[DEPLOYMENT REPORT] Generated report:', report);
  return report;
}; 