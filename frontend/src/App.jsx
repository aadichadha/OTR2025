import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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
import { Box, CircularProgress } from '@mui/material';

// Role-specific dashboard components (placeholder for now)
const AdminDashboard = () => (
  <Box sx={{ p: 3 }}>
    <h2>Admin Dashboard</h2>
    <p>Full system access - manage players, coaches, and system settings</p>
  </Box>
);

const CoachDashboard = () => (
  <Box sx={{ p: 3 }}>
    <h2>Coach Dashboard</h2>
    <p>Player management and analytics access</p>
  </Box>
);

const PlayerDashboard = () => (
  <Box sx={{ p: 3 }}>
    <h2>Player Dashboard</h2>
    <p>Personal data and sessions only</p>
  </Box>
);

const UnauthorizedPage = () => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <h2>Unauthorized Access</h2>
    <p>You don't have permission to access this page.</p>
  </Box>
);

function AppRoutes() {
  const { user, isAuthenticated, loading } = useAuth();

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Topbar />
      <Box component="main" sx={{ flexGrow: 1, width: '100%', pt: 2 }}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } />
          <Route path="/register" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
          } />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected routes with role-based access */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              {user?.role === 'admin' && <AdminDashboard />}
              {user?.role === 'coach' && <CoachDashboard />}
              {user?.role === 'player' && <PlayerDashboard />}
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Coach routes */}
          <Route path="/coach/dashboard" element={
            <ProtectedRoute allowedRoles={['coach']}>
              <CoachDashboard />
            </ProtectedRoute>
          } />

          {/* Player routes */}
          <Route path="/player/dashboard" element={
            <ProtectedRoute allowedRoles={['player']}>
              <PlayerDashboard />
            </ProtectedRoute>
          } />

          {/* Feature routes with role-based permissions */}
          <Route path="/upload" element={
            <ProtectedRoute requiredPermission="view_own_data">
              <Upload />
            </ProtectedRoute>
          } />
          
          <Route path="/players" element={
            <ProtectedRoute requiredPermission="view_all_players">
              <Players />
            </ProtectedRoute>
          } />
          
          <Route path="/sessions/:id/visualize" element={
            <ProtectedRoute requiredPermission="view_own_data">
              <SessionVisualization />
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute requiredPermission="view_analytics">
              <AnalyticsHome />
            </ProtectedRoute>
          } />

          {/* Redirect authenticated users to their dashboard */}
          <Route path="*" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
