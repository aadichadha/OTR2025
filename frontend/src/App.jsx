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
import SessionAnalytics from './pages/SessionAnalytics';
import Statistics from './pages/Statistics';
import AdminDashboard from './pages/AdminDashboard';
import CoachDashboard from './pages/CoachDashboard';
import Topbar from './components/Topbar';
import ErrorBoundary from './components/ErrorBoundary';
import { validateEnvironment } from './utils/environmentCheck';
import { validateDeployment, generateDeploymentReport } from './utils/deploymentValidation';
import { Box, CircularProgress } from '@mui/material';
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerAnalytics from './pages/PlayerAnalytics';
import PlayerStatistics from './pages/PlayerStatistics';
import Leaderboard from './pages/Leaderboard';
import ProfileSettings from './pages/ProfileSettings';
import SessionReport from './pages/SessionReport';
import CompleteInvitation from './pages/CompleteInvitation';

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
          <Route path="/complete-invitation" element={<CompleteInvitation />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected routes with role-based access */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              {user?.role === 'admin' && <AdminDashboard />}
              {user?.role === 'coach' && <Home />}
              {user?.role === 'player' && <PlayerStatistics />}
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

          {/* Player routes - restrict to only Home (PlayerStatistics), Leaderboard, and Progression */}
          <Route path="/player/dashboard" element={
            <ProtectedRoute allowedRoles={['player']}>
              <PlayerStatistics />
            </ProtectedRoute>
          } />

          <Route path="/progression" element={
            <ProtectedRoute allowedRoles={['player']}>
              <SessionAnalytics />
            </ProtectedRoute>
          } />

          <Route path="/leaderboard" element={
            <ProtectedRoute allowedRoles={['player']}>
              <Leaderboard />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          } />

          <Route path="/sessions/:id/report-data" element={
            <ProtectedRoute requiredPermission="view_own_data">
              <SessionReport />
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
