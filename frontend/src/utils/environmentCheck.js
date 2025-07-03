// Environment validation script to check for differences between local and Vercel
export const validateEnvironment = () => {
  console.log('[ENVIRONMENT CHECK] ===== STARTING ENVIRONMENT VALIDATION =====');
  
  // Check Node.js version
  console.log('[ENVIRONMENT CHECK] User Agent:', navigator.userAgent);
  console.log('[ENVIRONMENT CHECK] Platform:', navigator.platform);
  console.log('[ENVIRONMENT CHECK] Language:', navigator.language);
  
  // Check environment variables
  console.log('[ENVIRONMENT CHECK] NODE_ENV:', import.meta.env.NODE_ENV);
  console.log('[ENVIRONMENT CHECK] MODE:', import.meta.env.MODE);
  console.log('[ENVIRONMENT CHECK] DEV:', import.meta.env.DEV);
  console.log('[ENVIRONMENT CHECK] PROD:', import.meta.env.PROD);
  console.log('[ENVIRONMENT CHECK] VITE_API_URL:', import.meta.env.VITE_API_URL);
  
  // Check React version
  console.log('[ENVIRONMENT CHECK] React version:', React.version);
  
  // Check browser capabilities
  console.log('[ENVIRONMENT CHECK] Local Storage available:', !!window.localStorage);
  console.log('[ENVIRONMENT CHECK] Session Storage available:', !!window.sessionStorage);
  console.log('[ENVIRONMENT CHECK] IndexedDB available:', !!window.indexedDB);
  
  // Check screen dimensions
  console.log('[ENVIRONMENT CHECK] Screen dimensions:', {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight
  });
  
  // Check window dimensions
  console.log('[ENVIRONMENT CHECK] Window dimensions:', {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight
  });
  
  // Check timezone
  console.log('[ENVIRONMENT CHECK] Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.log('[ENVIRONMENT CHECK] Current time:', new Date().toISOString());
  
  // Check if we're in an iframe
  console.log('[ENVIRONMENT CHECK] In iframe:', window !== window.top);
  
  // Check for any global errors
  const originalError = console.error;
  const errors = [];
  console.error = (...args) => {
    errors.push(args);
    originalError.apply(console, args);
  };
  
  // Check for any global warnings
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => {
    warnings.push(args);
    originalWarn.apply(console, args);
  };
  
  // Restore original console methods after a delay
  setTimeout(() => {
    console.error = originalError;
    console.warn = originalWarn;
    
    console.log('[ENVIRONMENT CHECK] Errors caught during validation:', errors);
    console.log('[ENVIRONMENT CHECK] Warnings caught during validation:', warnings);
    console.log('[ENVIRONMENT CHECK] ===== ENVIRONMENT VALIDATION COMPLETE =====');
  }, 1000);
  
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    nodeEnv: import.meta.env.NODE_ENV,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    apiUrl: import.meta.env.VITE_API_URL,
    reactVersion: React.version,
    localStorage: !!window.localStorage,
    sessionStorage: !!window.sessionStorage,
    indexedDB: !!window.indexedDB,
    screenDimensions: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight
    },
    windowDimensions: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currentTime: new Date().toISOString(),
    inIframe: window !== window.top
  };
};

// Function to compare environments
export const compareEnvironments = (localEnv, vercelEnv) => {
  console.log('[ENVIRONMENT COMPARISON] ===== COMPARING ENVIRONMENTS =====');
  
  const differences = [];
  
  // Compare each property
  Object.keys(localEnv).forEach(key => {
    if (JSON.stringify(localEnv[key]) !== JSON.stringify(vercelEnv[key])) {
      differences.push({
        key,
        local: localEnv[key],
        vercel: vercelEnv[key]
      });
    }
  });
  
  console.log('[ENVIRONMENT COMPARISON] Differences found:', differences);
  console.log('[ENVIRONMENT COMPARISON] ===== COMPARISON COMPLETE =====');
  
  return differences;
}; 