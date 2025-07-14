import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, CircularProgress, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert, TextField } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import ReportDisplay from '../components/ReportDisplay';
import SwingLogTable from '../components/SwingLogTable';
import Timeline from '@mui/icons-material/Timeline';

const NAVY = '#1c2c4d';

const PlayerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [swingLogModal, setSwingLogModal] = useState({ open: false, swings: [], loading: false, error: '', sessionId: null });
  const [reportModal, setReportModal] = useState({ open: false, report: null, loading: false, error: '', sessionId: null });
  const [emailModal, setEmailModal] = useState({ open: false, sessionId: null, email: '', loading: false, error: '', success: false });

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
    setEmailModal({ open: true, sessionId, email: '', loading: false, error: '', success: false });
  };

  const handleCloseEmailModal = () => {
    setEmailModal({ open: false, sessionId: null, email: '', loading: false, error: '', success: false });
  };

  const handleSendEmail = async () => {
    if (!emailModal.email.trim()) {
      setEmailModal(prev => ({ ...prev, error: 'Please enter a valid email address' }));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailModal.email)) {
      setEmailModal(prev => ({ ...prev, error: 'Please enter a valid email address' }));
      return;
    }

    setEmailModal(prev => ({ ...prev, loading: true, error: '' }));
    
    try {
      await api.post(`/sessions/${emailModal.sessionId}/email`, {
        recipientEmail: emailModal.email
      });
      
      setEmailModal(prev => ({ 
        ...prev, 
        loading: false, 
        success: true, 
        error: '' 
      }));
      
      // Close modal after 2 seconds
      setTimeout(() => {
        handleCloseEmailModal();
      }, 2000);
      
    } catch (err) {
      setEmailModal(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.response?.data?.error || 'Failed to send email' 
      }));
    }
  };

  const handleOpenSwingLog = async (sessionId) => {
    setSwingLogModal({ open: true, swings: [], loading: true, error: '', sessionId });
    try {
      const res = await api.get(`/sessions/${sessionId}/swings`);
      setSwingLogModal({ open: true, swings: res.data, loading: false, error: '', sessionId });
    } catch (err) {
      setSwingLogModal({ open: true, swings: [], loading: false, error: 'Failed to load swings', sessionId });
    }
  };
  const handleCloseSwingLog = () => setSwingLogModal({ open: false, swings: [], loading: false, error: '', sessionId: null });

  const handleOpenReport = async (sessionId) => {
    setReportModal({ open: true, report: null, loading: true, error: '', sessionId });
    try {
      const res = await api.get(`/sessions/${sessionId}/report-data`);
      setReportModal({ open: true, report: res.data, loading: false, error: '', sessionId });
    } catch (err) {
      setReportModal({ open: true, report: null, loading: false, error: 'Failed to load report', sessionId });
    }
  };
  const handleCloseReport = () => setReportModal({ open: false, report: null, loading: false, error: '', sessionId: null });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: NAVY, py: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 1200, bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 32px rgba(28,44,77,0.10)', border: '2px solid #1c2c4d', p: { xs: 2, sm: 4 } }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: NAVY, letterSpacing: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
              Welcome, {user?.name || 'Player'}!
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#3a7bd5', fontWeight: 500, mt: 1 }}>
              Here is your personalized dashboard.
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Stats Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 2 }}>Your Stats</Typography>
                {loading ? <CircularProgress /> : stats ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ color: NAVY }}>Max Exit Velocity:</Typography>
                      <Typography variant="body1" sx={{ color: NAVY, fontWeight: 700 }}>{roundNumber(stats.maxExitVelocity)} mph</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ color: NAVY }}>Avg Exit Velocity:</Typography>
                      <Typography variant="body1" sx={{ color: NAVY, fontWeight: 700 }}>{roundNumber(stats.avgExitVelocity)} mph</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ color: NAVY }}>Max Bat Speed:</Typography>
                      <Typography variant="body1" sx={{ color: NAVY, fontWeight: 700 }}>{roundNumber(stats.maxBatSpeed)} mph</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ color: NAVY }}>Avg Bat Speed:</Typography>
                      <Typography variant="body1" sx={{ color: NAVY, fontWeight: 700 }}>{roundNumber(stats.avgBatSpeed)} mph</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ color: NAVY }}>Barrels:</Typography>
                      <Typography variant="body1" sx={{ color: NAVY, fontWeight: 700 }}>{stats.barrels || 0}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ color: NAVY }}>Sessions:</Typography>
                      <Typography variant="body1" sx={{ color: NAVY, fontWeight: 700 }}>{stats.sessionCount || 0}</Typography>
                    </Box>
                  </Box>
                ) : <Typography color="error">No stats found.</Typography>}
              </CardContent>
            </Card>
          </Grid>
          {/* Quick Actions Card */}
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 3 }}>Quick Actions</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button fullWidth variant="contained" startIcon={<Timeline />} onClick={() => navigate('/player/statistics')} sx={{ bgcolor: NAVY, py: 1.5, '&:hover': { bgcolor: '#3a7bd5' } }}>Statistics</Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button fullWidth variant="contained" startIcon={<AssessmentIcon />} onClick={() => navigate('/progression')} sx={{ bgcolor: NAVY, py: 1.5, '&:hover': { bgcolor: '#3a7bd5' } }}>Progression</Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button fullWidth variant="contained" startIcon={<EmojiEventsIcon />} onClick={() => navigate('/leaderboard')} sx={{ bgcolor: NAVY, py: 1.5, '&:hover': { bgcolor: '#3a7bd5' } }}>Leaderboard</Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button fullWidth variant="outlined" startIcon={<AssessmentIcon />} onClick={() => navigate('/upload')} sx={{ borderColor: NAVY, color: NAVY, py: 1.5, '&:hover': { borderColor: '#3a7bd5', color: '#3a7bd5' } }}>Upload Session</Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          {/* Recent Sessions - full width, below */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 3 }}>Recent Sessions</Typography>
                {loading ? <CircularProgress /> : (Array.isArray(sessions) && sessions.length > 0) ? (
                  <Grid container spacing={2}>
                    {(Array.isArray(sessions) ? sessions.slice(0, 6) : []).map((session) => (
                      <Grid item xs={12} sm={6} md={4} key={session.id}>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fff', border: '1px solid #e0e3e8', height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ color: NAVY, fontWeight: 600, mb: 1 }}>{formatDate(session.session_date)}</Typography>
                            <Chip label={session.session_type?.toUpperCase() || 'Unknown'} color={getSessionTypeColor(session.session_type)} size="small" sx={{ mb: 2 }} />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            <IconButton size="small" onClick={() => handleOpenSwingLog(session.id)} sx={{ color: NAVY, '&:hover': { bgcolor: '#e3f2fd' } }} title="View Swings"><VisibilityIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={() => handleOpenReport(session.id)} sx={{ color: NAVY, '&:hover': { bgcolor: '#e3f2fd' } }} title="View Report">📊</IconButton>
                            <IconButton size="small" onClick={() => handleDownloadReport(session.id)} sx={{ color: NAVY, '&:hover': { bgcolor: '#e3f2fd' } }} title="Download Report"><DownloadIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={() => handleEmailReport(session.id)} sx={{ color: NAVY, '&:hover': { bgcolor: '#e3f2fd' } }} title="Email Report"><EmailIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={() => handleDeleteSession(session)} sx={{ color: '#d32f2f', '&:hover': { bgcolor: '#ffebee' } }} title="Delete Session"><DeleteIcon fontSize="small" /></IconButton>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                ) : <Typography color="error">No sessions found.</Typography>}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
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

      {/* Swing Log Modal */}
      <Dialog open={swingLogModal.open} onClose={handleCloseSwingLog} maxWidth="md" fullWidth>
        <DialogTitle>Session Swing Log</DialogTitle>
        <DialogContent>
          {swingLogModal.loading ? (
            <CircularProgress />
          ) : swingLogModal.error ? (
            <Alert severity="error">{swingLogModal.error}</Alert>
          ) : (
            <SwingLogTable swings={swingLogModal.swings} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSwingLog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={reportModal.open} onClose={handleCloseReport} maxWidth="md" fullWidth>
        <DialogTitle>Session Report</DialogTitle>
        <DialogContent>
          {reportModal.loading ? (
            <CircularProgress />
          ) : reportModal.error ? (
            <Alert severity="error">{reportModal.error}</Alert>
          ) : (
            <ReportDisplay report={reportModal.report} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReport}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={emailModal.open} onClose={handleCloseEmailModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: NAVY, fontWeight: 700, bgcolor: '#fff', borderBottom: '1px solid #e0e3e8' }}>
          Email Session Report
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#fff', pt: 2 }}>
          {emailModal.success ? (
            <Alert severity="success" sx={{ mb: 2, bgcolor: '#e8f5e8', color: '#2e7d32' }}>
              Report sent successfully to {emailModal.email}!
            </Alert>
          ) : (
            <>
              <Typography sx={{ mb: 2, color: NAVY, fontWeight: 500 }}>
                Enter the email address where you'd like to send the session report:
              </Typography>
              <TextField
                fullWidth
                label="Recipient Email"
                type="email"
                value={emailModal.email}
                onChange={(e) => setEmailModal(prev => ({ ...prev, email: e.target.value, error: '' }))}
                error={!!emailModal.error}
                helperText={emailModal.error}
                disabled={emailModal.loading}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e3e8',
                    },
                    '&:hover fieldset': {
                      borderColor: NAVY,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: NAVY,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: NAVY,
                    '&.Mui-focused': {
                      color: NAVY,
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: NAVY,
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem', bgcolor: '#f8f9fa', p: 2, borderRadius: 2, border: '1px solid #e0e3e8' }}>
                <strong style={{ color: NAVY }}>The email will include:</strong>
                <br />• Session details and metrics
                <br />• PDF report attachment
                <br />• Professional formatting
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e3e8', bgcolor: '#f8f9fa' }}>
          {!emailModal.success && (
            <Button 
              onClick={handleCloseEmailModal} 
              disabled={emailModal.loading}
              sx={{ color: NAVY, fontWeight: 600 }}
            >
              Cancel
            </Button>
          )}
          {!emailModal.success && (
            <Button 
              onClick={handleSendEmail} 
              variant="contained" 
              disabled={emailModal.loading || !emailModal.email.trim()}
              sx={{ 
                bgcolor: NAVY, 
                fontWeight: 600,
                '&:hover': { bgcolor: '#3a7bd5' },
                '&:disabled': {
                  bgcolor: '#ccc',
                  color: '#666',
                }
              }}
            >
              {emailModal.loading ? 'Sending...' : 'Send Report'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlayerDashboard; 