import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Players from './pages/Players';
import SessionVisualization from './pages/SessionVisualization';
import Landing from './pages/Landing';
import AnalyticsHome from './pages/AnalyticsHome';
import Topbar from './components/Topbar';
import { Box } from '@mui/material';

function App() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };
  return (
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
  );
}

export default App;
