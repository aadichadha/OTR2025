import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, CircularProgress, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NAVY = '#1c2c4d';

const PlayerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/players/me/stats');
      setStats(statsRes.data);
      const sessionsRes = await api.get('/players/me/sessions');
      setSessions(sessionsRes.data.sessions || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setStats(null);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSessionTypeColor = (type) => {
    return type === 'blast' ? 'primary' : 'secondary';
  };

  const roundNumber = (num) => {
    if (num === null || num === undefined || num === 'N/A') return 'N/A';
    return Math.round(parseFloat(num) * 10) / 10;
  };

  const handleDeleteSession = (session) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    try {
      await api.delete(`/sessions/${sessionToDelete.id}`);
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error deleting session:', err);
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleViewSession = (sessionId) => {
    navigate(`/sessions/${sessionId}/report-data`);
  };

  const handleViewSwings = (sessionId) => {
    navigate(`/sessions/${sessionId}/swings`);
  };

  const handleViewAnalytics = () => {
    navigate('/analytics');
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const handleDownloadReport = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`${API_URL}/sessions/${sessionId}/report`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_session_${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download report');
      console.error('Error downloading report:', err);
    }
  };

  const handleEmailReport = (sessionId) => {
    const subject = encodeURIComponent(`Baseball Analytics Report - Session ${sessionId}`);
    const body = encodeURIComponent(`Please find attached the baseball analytics report for session ${sessionId}.\n\nFrom: otrdatatrack@gmail.com\nOne-time password: exwx bdjz xjid qhmh`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: NAVY, py: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 1200, bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 32px rgba(28,44,77,0.10)', border: '2px solid #1c2c4d', p: { xs: 2, sm: 4 } }}>
        <Typography variant="h3" align="center" sx={{ fontWeight: 900, color: NAVY, mb: 3, letterSpacing: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
          Player Dashboard
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 1 }}>Your Stats</Typography>
                {loading ? <CircularProgress /> : stats ? (
                  <Box>
                    <Typography variant="body1" sx={{ color: NAVY, mb: 1 }}>
                      Max Exit Velocity: <b>{roundNumber(stats.maxExitVelocity)} mph</b>
                    </Typography>
                    <Typography variant="body1" sx={{ color: NAVY, mb: 1 }}>
                      Avg Exit Velocity: <b>{roundNumber(stats.avgExitVelocity)} mph</b>
                    </Typography>
                    <Typography variant="body1" sx={{ color: NAVY, mb: 1 }}>
                      Max Bat Speed: <b>{roundNumber(stats.maxBatSpeed)} mph</b>
                    </Typography>
                    <Typography variant="body1" sx={{ color: NAVY, mb: 1 }}>
                      Avg Bat Speed: <b>{roundNumber(stats.avgBatSpeed)} mph</b>
                    </Typography>
                    <Typography variant="body1" sx={{ color: NAVY }}>
                      Sessions: <b>{stats.sessionCount || 0}</b>
                    </Typography>
                  </Box>
                ) : <Typography color="error">No stats found.</Typography>}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700 }}>Recent Sessions</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AssessmentIcon />}
                    sx={{ borderColor: NAVY, color: NAVY, '&:hover': { borderColor: '#3a7bd5', color: '#3a7bd5' } }}
                    onClick={handleViewAnalytics}
                  >
                    View All Analytics
                  </Button>
                </Box>
                {loading ? <CircularProgress /> : sessions.length > 0 ? (
                  <Box>
                    {sessions.slice(0, 5).map((session) => (
                      <Box key={session.id} sx={{ 
                        mb: 2, 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: '#fff', 
                        border: '1px solid #e0e3e8',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
                      }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ color: NAVY, fontWeight: 600, mb: 0.5 }}>
                            {formatDate(session.session_date)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: NAVY, mb: 1 }}>
                            {session.session_type?.toUpperCase() || 'Unknown Type'}
                          </Typography>
                          <Chip 
                            label={session.session_type?.toUpperCase() || 'Unknown'} 
                            color={getSessionTypeColor(session.session_type)}
                            size="small" 
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewSession(session.id)}
                            sx={{ color: NAVY, '&:hover': { bgcolor: '#e3f2fd' } }}
                            title="View Report"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadReport(session.id)}
                            sx={{ color: NAVY, '&:hover': { bgcolor: '#e3f2fd' } }}
                            title="Download Report"
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEmailReport(session.id)}
                            sx={{ color: NAVY, '&:hover': { bgcolor: '#e3f2fd' } }}
                            title="Email Report"
                          >
                            <EmailIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleViewSwings(session.id)}
                            sx={{ color: NAVY, '&:hover': { bgcolor: '#e3f2fd' } }}
                            title="View Swings"
                          >
                            📊
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSession(session)}
                            sx={{ color: '#d32f2f', '&:hover': { bgcolor: '#ffebee' } }}
                            title="Delete Session"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : <Typography color="error">No sessions found.</Typography>}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 5 }}>
          <Button
            variant="contained"
            startIcon={<AssessmentIcon />}
            sx={{ bgcolor: NAVY, color: '#fff', fontWeight: 700, px: 4, py: 1.5, borderRadius: 3, fontSize: '1.1rem', '&:hover': { bgcolor: '#3a7bd5' } }}
            onClick={handleViewAnalytics}
          >
            Full Analytics
          </Button>
          <Button
            variant="outlined"
            startIcon={<EmojiEventsIcon />}
            sx={{ borderColor: NAVY, color: NAVY, fontWeight: 700, px: 4, py: 1.5, borderRadius: 3, fontSize: '1.1rem', '&:hover': { borderColor: '#3a7bd5', color: '#3a7bd5' } }}
            onClick={() => navigate('/leaderboard')}
          >
            Leaderboard
          </Button>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ color: NAVY, fontWeight: 700 }}>Delete Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this session? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: NAVY }}>
            Cancel
          </Button>
          <Button onClick={confirmDeleteSession} sx={{ color: '#d32f2f' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlayerDashboard; 