import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Players from './pages/Players';
import SessionVisualization from './pages/SessionVisualization';
import Landing from './pages/Landing';
import AnalyticsHome from './pages/AnalyticsHome';
import Topbar from './components/Topbar';
import ErrorBoundary from './components/ErrorBoundary';
import { validateEnvironment } from './utils/environmentCheck';
import { validateDeployment, generateDeploymentReport } from './utils/deploymentValidation';
import { Box } from '@mui/material';

function App() {
  useEffect(() => {
    // Run comprehensive validation on every app load
    console.log('[APP] ===== APPLICATION STARTING =====');
    
    // Run environment validation
    validateEnvironment();
    
    // Run deployment validation
    validateDeployment().then(results => {
      const report = generateDeploymentReport(results);
      console.log('[APP] Deployment validation complete:', report);
      
      // Store results for comparison
      localStorage.setItem('deployment-validation', JSON.stringify({
        timestamp: new Date().toISOString(),
        results,
        report
      }));
    }).catch(error => {
      console.error('[APP] Deployment validation failed:', error);
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };
  return (
    <ErrorBoundary>
      <Router>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Topbar onLogout={handleLogout} />
          <Box component="main" sx={{ flexGrow: 1, width: '100%', pt: 2 }}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/players" element={<Players />} />
              <Route path="/sessions/:id/visualize" element={<SessionVisualization />} />
              <Route path="/analytics" element={<AnalyticsHome />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
