import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  TextField,
  DialogActions,
  Autocomplete
} from '@mui/material';
import Delete from '@mui/icons-material/Delete';
import Download from '@mui/icons-material/Download';
import Close from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import Analytics from '@mui/icons-material/Analytics';
import Edit from '@mui/icons-material/Edit';
import LocalOffer from '@mui/icons-material/LocalOffer';
import Email from '@mui/icons-material/Email';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';
import getGradeColor from '../utils/getGradeColor';
import safeToFixed from '../utils/safeToFixed';
import ReportDisplay from './ReportDisplay';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Predefined session tags
const SESSION_TAGS = [
  'Soft Toss',
  'Over the Hand',
  'Machine',
  'Live BP',
  'Game',
  'Warm Up',
  'Practice',
  'Indoor',
  'Outdoor',
  'Morning',
  'Afternoon',
  'Evening',
  'Pre-Game',
  'Post-Game',
  'Recovery',
  'Strength',
  'Speed',
  'Technique',
  'Power',
  'Contact'
];

function PlayerDetails({ player, open, onClose, onSessionDeleted }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  
  // Tag editing state
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sessionTags, setSessionTags] = useState([]);
  const [tagLoading, setTagLoading] = useState(false);

  const [swingsModalOpen, setSwingsModalOpen] = useState(false);
  const [swingsForSession, setSwingsForSession] = useState([]);
  const [swingsSessionId, setSwingsSessionId] = useState(null);
  const [swingsLoading, setSwingsLoading] = useState(false);
  const [selectedSwing, setSelectedSwing] = useState(null);
  const [newTags, setNewTags] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Helper functions for metrics rendering (for swings modal)
  const getMetricColor = (value, benchmark, lowerIsBetter = false) => {
    if (!value || !benchmark) return '#666';
    const ratio = value / benchmark;
    if (lowerIsBetter) {
      return ratio < 1 ? '#4caf50' : ratio <= 1.1 ? '#ff9800' : '#f44336';
    }
    return ratio > 1 ? '#4caf50' : ratio >= 0.9 ? '#ff9800' : '#f44336';
  };

  const formatMetricValue = (value, decimals = 1) => {
    if (value === null || value === undefined) return 'N/A';
    return safeToFixed(value, decimals);
  };

  const renderMetrics = () => {
    if (!currentReport?.metrics) return null;

    const metrics = currentReport.metrics;
    const benchmarks = currentReport.benchmarks || {};

    return (
      <Grid container spacing={3}>
        {/* Bat Speed Metrics */}
        {metrics.batSpeed && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {safeToFixed(metrics.batSpeed.avg, 1)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Avg Bat Speed (MPH)
                </Typography>
                {benchmarks.batSpeed && (
                  <Chip
                    label={metrics.batSpeed.grade || 'N/A'}
                    color={getGradeColor(metrics.batSpeed.grade)}
                    size="small"
                    sx={{ mt: 1, color: 'white' }}
                  />
                )}
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', boxShadow: '0 4px 20px rgba(240, 147, 251, 0.3)' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {safeToFixed(metrics.batSpeed.max, 1)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Max Bat Speed (MPH)
                </Typography>
              </Card>
            </Grid>
          </>
        )}

        {/* Exit Velocity Metrics */}
        {metrics.exitVelocity && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', boxShadow: '0 4px 20px rgba(79, 172, 254, 0.3)' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {safeToFixed(metrics.exitVelocity.avg, 1)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Avg Exit Velocity (MPH)
                </Typography>
                {benchmarks.exitVelocity && (
                  <Chip
                    label={metrics.exitVelocity.grade || 'N/A'}
                    color={getGradeColor(metrics.exitVelocity.grade)}
                    size="small"
                    sx={{ mt: 1, color: 'white' }}
                  />
                )}
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white', boxShadow: '0 4px 20px rgba(67, 233, 123, 0.3)' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {safeToFixed(metrics.exitVelocity.max, 1)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Max Exit Velocity (MPH)
                </Typography>
              </Card>
            </Grid>
          </>
        )}

        {/* Additional metrics can be added here */}
      </Grid>
    );
  };

  useEffect(() => {
    if (open && player) {
      fetchSessions();
      // Get current user info
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          setCurrentUser(JSON.parse(userStr));
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      // Set initial email value
      setEmailValue(player.email || '');
    }
  }, [open, player]);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/players/${player.id}/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle both old and new response formats
      let sessionsData = [];
      if (response.data.success && response.data.data) {
        // New format
        sessionsData = response.data.data;
      } else if (response.data.sessions) {
        // Old format
        sessionsData = response.data.sessions;
      } else if (Array.isArray(response.data)) {
        // Direct array format
        sessionsData = response.data;
      }
      
      console.log('[DEBUG] Sessions response:', response.data);
      console.log('[DEBUG] Processed sessions:', sessionsData);
      
      setSessions(sessionsData);
    } catch (err) {
      setError('Failed to load sessions');
      console.error('Error fetching sessions:', err);
      console.error('Response:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Session deleted successfully');
      fetchSessions();
      if (onSessionDeleted) {
        onSessionDeleted();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete session');
    }
  };

  const handleDownloadReport = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/sessions/${sessionId}/report`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_session_${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download report');
      console.error('Error downloading report:', err);
    }
  };

  const handleViewReport = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/sessions/${sessionId}/report-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[DEBUG] handleViewReport - Raw response:', response.data);
      console.log('[DEBUG] handleViewReport - Metrics structure:', response.data?.metrics);
      console.log('[DEBUG] handleViewReport - Exit velocity metrics:', response.data?.metrics?.exitVelocity);
      
      setCurrentReport(response.data);
      setReportModalOpen(true);
    } catch (err) {
      setError('Failed to load report');
      console.error('Error loading report:', err);
      console.error('Response:', err.response?.data);
    }
  };

  const handleEmailReport = (sessionId) => {
    const subject = encodeURIComponent(`Baseball Analytics Report - ${player.name} - Session ${sessionId}`);
    const body = encodeURIComponent(`Please find attached the baseball analytics report for ${player.name} from session ${sessionId}.

From: otrdatatrack@gmail.com
One-time password: exwx bdjz xjid qhmh`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleVisualizeData = (sessionId) => {
    navigate(`/sessions/${sessionId}/visualize`);
    onClose(); // Close the player details dialog
  };

  // Tag editing functions
  const handleEditTags = (session) => {
    setEditingSession(session);
    setSessionTags(session.session_tags ? Array.isArray(session.session_tags) ? session.session_tags : session.session_tags.split(',').map(tag => tag.trim()) : []);
    setTagDialogOpen(true);
  };

  const handleSaveTags = async () => {
    if (!editingSession) return;
    
    setTagLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/sessions/${editingSession.id}`, {
        session_tags: JSON.stringify(sessionTags)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Session tags updated successfully');
      setTagDialogOpen(false);
      setEditingSession(null);
      setSessionTags([]);
      fetchSessions(); // Refresh sessions to show updated tags
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update session tags');
    } finally {
      setTagLoading(false);
    }
  };

  const handleCloseTagDialog = () => {
    setTagDialogOpen(false);
    setEditingSession(null);
    setSessionTags([]);
  };

  const getSessionTypeColor = (type) => {
    return type === 'blast' ? 'primary' : 'secondary';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderSessionTags = (tags) => {
    if (!tags) return null;
    let tagArray = [];
    try {
      tagArray = Array.isArray(tags) ? tags : JSON.parse(tags);
    } catch {
      tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    return (
      <Box display="flex" flexWrap="wrap" gap={0.5}>
        {tagArray.map((tag, index) => (
          <Chip
            key={index}
            label={tag}
            size="small"
            sx={{
              bgcolor: '#e3f2fd',
              color: '#1c2c4d',
              fontSize: '0.7rem',
              height: 20,
              '& .MuiChip-label': {
                px: 1
              }
            }}
          />
        ))}
      </Box>
    );
  };

  const handleViewSwings = async (sessionId) => {
    setSwingsLoading(true);
    setSwingsSessionId(sessionId);
    setSwingsModalOpen(true);
    setSwingsForSession([]);
    try {
      const res = await api.get(`/sessions/${sessionId}/swings`);
      const swings = Array.isArray(res.data) ? res.data : (res.data.swings || []);
      setSwingsForSession(swings);
      if (swings.length > 0) {
        console.log('[DEBUG] First swing object:', swings[0]);
      }
    } catch (err) {
      setSwingsForSession([]);
    } finally {
      setSwingsLoading(false);
    }
  };

  const handleResendInvite = async () => {
    if (!player.email) {
      setError('Player does not have an email address. Please add an email first.');
      return;
    }

    setInviteLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/auth/invite-player`, {
        name: player.name,
        email: player.email,
        position: player.position,
        team: player.travel_team || player.high_school || player.college || player.indy || player.affiliate || player.little_league
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Invitation sent successfully!');
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err.response?.data?.error || 'Failed to send invitation.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleStartEditEmail = () => {
    setEditingEmail(true);
    setEmailValue(player.email || '');
  };

  const handleCancelEditEmail = () => {
    setEditingEmail(false);
    setEmailValue(player.email || '');
  };

  const handleSaveEmail = async () => {
    if (!emailValue.trim()) {
      setError('Email cannot be empty.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setError('Please enter a valid email address.');
      return;
    }

    setEmailLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/players/${player.id}`, {
        email: emailValue.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update the player object with new email
      player.email = emailValue.trim();
      setSuccess('Email updated successfully!');
      setEditingEmail(false);
    } catch (err) {
      console.error('Error updating email:', err);
      setError(err.response?.data?.error || 'Failed to update email.');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh', bgcolor: '#fff', border: '2.5px solid #1c2c4d', color: '#1c2c4d' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" sx={{ color: '#1c2c4d', fontWeight: 800 }}>
              {player.name} - Player Details
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {/* Resend Invite Button - Only show for coaches/admins if player has email */}
              {currentUser && ['admin', 'coach'].includes(currentUser.role) && player.email && (
                <Button
                  variant="contained"
                  startIcon={<Email />}
                  onClick={handleResendInvite}
                  disabled={inviteLoading}
                  sx={{
                    bgcolor: '#1c2c4d',
                    color: '#fff',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    '&:hover': {
                      bgcolor: '#3a7bd5'
                    },
                    '&:disabled': {
                      bgcolor: '#ccc',
                      color: '#666'
                    }
                  }}
                >
                  {inviteLoading ? 'Sending...' : 'Resend Invite'}
                </Button>
              )}
              <IconButton onClick={onClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          {/* Player Information */}
          <Card sx={{ mb: 3, bgcolor: '#fff', border: '2px solid #1c2c4d', color: '#1c2c4d', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 700 }}>Player Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>Name</Typography>
                  <Typography variant="body1" sx={{ color: '#1c2c4d' }}>{player.name}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>Player Code</Typography>
                  <Typography variant="body1" sx={{ color: '#1c2c4d' }}><strong>{player.player_code}</strong></Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>Age</Typography>
                  <Typography variant="body1" sx={{ color: '#1c2c4d' }}>{player.age || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>Position</Typography>
                  <Typography variant="body1" sx={{ color: '#1c2c4d' }}>{player.position || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>Travel Team</Typography>
                  <Typography variant="body1" sx={{ color: '#1c2c4d' }}>{player.travel_team || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>High School</Typography>
                  <Typography variant="body1" sx={{ color: '#1c2c4d' }}>{player.high_school || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>College</Typography>
                  <Typography variant="body1" sx={{ color: '#1c2c4d' }}>{player.college || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>Independent</Typography>
                  <Typography variant="body1" sx={{ color: '#1c2c4d' }}>{player.indy || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>Affiliate</Typography>
                  <Typography variant="body1" sx={{ color: '#1c2c4d' }}>{player.affiliate || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>Graduation Year</Typography>
                  <Typography variant="body1" sx={{ color: '#1c2c4d' }}>{player.graduation_year || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>Email</Typography>
                  {editingEmail ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <TextField
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        size="small"
                        placeholder="Enter email address"
                        sx={{
                          flex: 1,
                          '& .MuiInputLabel-root': { color: '#1c2c4d' },
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#1c2c4d' },
                            '&:hover fieldset': { borderColor: '#3a7bd5' },
                            '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                          },
                          '& .MuiInputBase-input': { color: '#1c2c4d' }
                        }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleSaveEmail}
                        disabled={emailLoading}
                        sx={{
                          bgcolor: '#4caf50',
                          color: '#fff',
                          '&:hover': { bgcolor: '#45a049' },
                          '&:disabled': { bgcolor: '#ccc' }
                        }}
                      >
                        {emailLoading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleCancelEditEmail}
                        disabled={emailLoading}
                        sx={{
                          color: '#1c2c4d',
                          borderColor: '#1c2c4d',
                          '&:hover': { borderColor: '#3a7bd5', color: '#3a7bd5' }
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1" sx={{ color: '#1c2c4d', flex: 1 }}>
                        {player.email || <span style={{ color: '#999' }}>No email</span>}
                      </Typography>
                      {currentUser && ['admin', 'coach'].includes(currentUser.role) && (
                        <>
                          {player.email ? (
                            <Chip 
                              label="Invite Available" 
                              size="small" 
                              color="success" 
                              variant="outlined"
                            />
                          ) : (
                            <Chip 
                              label="Add Email to Invite" 
                              size="small" 
                              color="warning" 
                              variant="outlined"
                            />
                          )}
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={handleStartEditEmail}
                            sx={{
                              color: '#1c2c4d',
                              borderColor: '#1c2c4d',
                              fontSize: '0.75rem',
                              px: 1,
                              py: 0.5,
                              '&:hover': { borderColor: '#3a7bd5', color: '#3a7bd5' }
                            }}
                          >
                            {player.email ? 'Edit' : 'Add'}
                          </Button>
                        </>
                      )}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Divider sx={{ my: 2 }} />

          {/* Session History */}
          <Box>
            <Typography variant="h6" gutterBottom>Session History</Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : sessions.length === 0 ? (
              <Alert severity="info">No sessions found for this player.</Alert>
            ) : (
              <TableContainer component={Paper} sx={{ bgcolor: '#fff', border: '2px solid #1c2c4d', borderRadius: 3, color: '#1c2c4d' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#1c2c4d', fontWeight: 700, fontSize: '1rem', borderBottom: '2px solid #1c2c4d', bgcolor: '#fff' }}>Date</TableCell>
                      <TableCell sx={{ color: '#1c2c4d', fontWeight: 700, fontSize: '1rem', borderBottom: '2px solid #1c2c4d', bgcolor: '#fff' }}>Type</TableCell>
                      <TableCell sx={{ color: '#1c2c4d', fontWeight: 700, fontSize: '1rem', borderBottom: '2px solid #1c2c4d', bgcolor: '#fff' }}>Level</TableCell>
                      <TableCell sx={{ color: '#1c2c4d', fontWeight: 700, fontSize: '1rem', borderBottom: '2px solid #1c2c4d', bgcolor: '#fff' }}>Data Points</TableCell>
                      <TableCell sx={{ color: '#1c2c4d', fontWeight: 700, fontSize: '1rem', borderBottom: '2px solid #1c2c4d', bgcolor: '#fff' }}>Tags</TableCell>
                      <TableCell align="right" sx={{ color: '#1c2c4d', fontWeight: 700, fontSize: '1rem', borderBottom: '2px solid #1c2c4d', bgcolor: '#fff' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(Array.isArray(sessions) ? sessions : []).map((session) => (
                      <TableRow key={session.id} sx={{ '& td': { color: '#1c2c4d', fontWeight: 500, fontSize: '0.98rem', bgcolor: '#fff', borderBottom: '1.5px solid #1c2c4d' } }}>
                        <TableCell>{formatDate(session.session_date)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={session.session_type.toUpperCase()} 
                            color={getSessionTypeColor(session.session_type)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{session.player_level || 'N/A'}</TableCell>
                        <TableCell>
                          {session.batSpeedData?.length || session.exitVelocityData?.length || 0} points
                        </TableCell>
                        <TableCell>
                          {renderSessionTags(session.session_tags)}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewReport(session.id)}
                            sx={{ mr: 1 }}
                          >
                            View Report
                          </Button>
                          <IconButton 
                            color="primary" 
                            size="small"
                            onClick={() => handleDownloadReport(session.id)}
                            title="Download Report"
                          >
                            <Download />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            size="small"
                            onClick={() => handleDeleteSession(session.id)}
                            title="Delete Session"
                          >
                            <Delete />
                          </IconButton>
                          <IconButton 
                            color="info" 
                            size="small"
                            onClick={() => handleEditTags(session)}
                            title="Edit Tags"
                          >
                            <Edit />
                          </IconButton>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewSwings(session.id)}
                            sx={{ mr: 1 }}
                          >
                            View Swings
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      {currentReport && (
        <Dialog 
          open={reportModalOpen} 
          onClose={() => setReportModalOpen(false)} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{
            sx: { 
              minHeight: '90vh',
              bgcolor: '#fff',
              border: '2px solid #1c2c4d',
              borderRadius: 3,
              boxShadow: '0 4px 32px rgba(28,44,77,0.10)'
            }
          }}
        >
          <DialogTitle sx={{ 
            color: '#1c2c4d', 
            fontWeight: 800, 
            fontSize: '1.5rem',
            borderBottom: '2px solid #1c2c4d',
            bgcolor: '#fff'
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" sx={{ color: '#1c2c4d', fontWeight: 800 }}>
                Report - {player.name} - {currentReport.session?.date ? new Date(currentReport.session.date).toLocaleDateString() : 'Session'}
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleEmailReport(currentReport.session?.id)}
                  sx={{ 
                    mr: 1,
                    color: '#1c2c4d',
                    borderColor: '#1c2c4d',
                    fontWeight: 700,
                    '&:hover': {
                      borderColor: '#3a7bd5',
                      backgroundColor: '#eaf1fb'
                    }
                  }}
                >
                  Email Report
                </Button>
                <IconButton 
                  onClick={() => setReportModalOpen(false)}
                  sx={{ color: '#1c2c4d' }}
                >
                  <Close />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ bgcolor: '#fff', color: '#1c2c4d' }}>
            <ReportDisplay report={currentReport} />
          </DialogContent>
        </Dialog>
      )}

      {/* Tag Dialog */}
      {tagDialogOpen && (
        <Dialog
          open={tagDialogOpen}
          onClose={handleCloseTagDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { 
              bgcolor: '#fff', 
              border: '1.5px solid #e0e3e8',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(28,44,77,0.12)'
            }
          }}
        >
          <DialogTitle sx={{ 
            color: '#1c2c4d', 
            fontWeight: 700, 
            borderBottom: '1px solid #e0e3e8',
            bgcolor: '#f8f9fa'
          }}>
            <Box display="flex" alignItems="center">
              <LocalOffer sx={{ mr: 1, color: '#1c2c4d' }} />
              Edit Session Tags
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body2" color="#1c2c4d" sx={{ mb: 2, opacity: 0.8 }}>
              Add or remove tags to categorize this session. Tags help with filtering and organization.
            </Typography>
            <Autocomplete
              multiple
              options={SESSION_TAGS}
              value={sessionTags}
              onChange={(event, newValue) => {
                setSessionTags(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Session Tags"
                  placeholder="Select or type tags..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#e0e3e8',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3a7bd5',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3a7bd5',
                      },
                      '& input': {
                        color: '#1c2c4d',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#1c2c4d',
                    },
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    sx={{
                      bgcolor: '#e3f2fd',
                      color: '#1c2c4d',
                      fontWeight: 600,
                      '& .MuiChip-deleteIcon': {
                        color: '#1c2c4d',
                      }
                    }}
                  />
                ))
              }
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Chip
                    label={option}
                    size="small"
                    sx={{
                      bgcolor: '#f0f8ff',
                      color: '#1c2c4d',
                      fontWeight: 500
                    }}
                  />
                </Box>
              )}
            />
          </DialogContent>
          <DialogActions sx={{ 
            p: 3, 
            borderTop: '1px solid #e0e3e8',
            bgcolor: '#f8f9fa'
          }}>
            <Button 
              onClick={handleCloseTagDialog}
              sx={{ 
                color: '#1c2c4d',
                borderColor: '#1c2c4d',
                '&:hover': {
                  borderColor: '#3a7bd5',
                  bgcolor: 'rgba(28,44,77,0.08)',
                }
              }}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTags} 
              disabled={tagLoading}
              sx={{ 
                bgcolor: '#1c2c4d',
                color: '#fff',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#3a7bd5',
                },
                '&:disabled': {
                  bgcolor: '#ccc',
                  color: '#666',
                }
              }}
              variant="contained"
            >
              {tagLoading ? 'Saving...' : 'Save Tags'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Swings Modal */}
      <Dialog
        open={swingsModalOpen}
        onClose={() => setSwingsModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            bgcolor: '#fff', 
            border: '1.5px solid #e0e3e8', 
            borderRadius: 4, 
            color: '#1c2c4d',
            boxShadow: '0 8px 32px rgba(28,44,77,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#1c2c4d', 
          fontWeight: 700, 
          borderBottom: '1px solid #e0e3e8', 
          bgcolor: '#f8f9fa' 
        }}>
          Swings Log - Session {swingsSessionId}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, bgcolor: '#fff' }}>
          {swingsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress sx={{ color: '#1c2c4d' }} />
            </Box>
          ) : swingsForSession.length === 0 ? (
            <Alert severity="info">No swings found for this session.</Alert>
          ) : (
            <Box>
              {/* Swing History Section */}
              <Card sx={{ 
                p: 3, 
                mb: 4,
                bgcolor: '#fff',
                border: '1.5px solid #e0e3e8',
                borderRadius: 4,
                boxShadow: '0 4px 16px rgba(28,44,77,0.08)',
                color: '#1c2c4d'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1c2c4d' }}>
                  Swing History
                </Typography>
                {swingsLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress sx={{ color: '#1c2c4d' }} />
                  </Box>
                ) : swingsForSession.length === 0 ? (
                  <Alert severity="info">No swings found for this session.</Alert>
                ) : (
                  <>
                    {/* Swings Table */}
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#1c2c4d' }}>
                      Swing Details ({swingsForSession.length} swings)
                    </Typography>
                    <TableContainer sx={{ 
                      border: '1px solid #e0e3e8', 
                      borderRadius: 3, 
                      boxShadow: '0 2px 8px rgba(28,44,77,0.06)',
                      bgcolor: '#fff'
                    }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ color: '#1c2c4d', fontWeight: 'bold', borderBottom: '2px solid #3a7bd5', bgcolor: '#f8f9fa' }}>#</TableCell>
                            <TableCell sx={{ color: '#1c2c4d', fontWeight: 'bold', borderBottom: '2px solid #3a7bd5', bgcolor: '#f8f9fa' }}>Exit Velocity</TableCell>
                            <TableCell sx={{ color: '#1c2c4d', fontWeight: 'bold', borderBottom: '2px solid #3a7bd5', bgcolor: '#f8f9fa' }}>Launch Angle</TableCell>
                            <TableCell sx={{ color: '#1c2c4d', fontWeight: 'bold', borderBottom: '2px solid #3a7bd5', bgcolor: '#f8f9fa' }}>Distance</TableCell>
                            <TableCell sx={{ color: '#1c2c4d', fontWeight: 'bold', borderBottom: '2px solid #3a7bd5', bgcolor: '#f8f9fa' }}>Strike Zone</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {swingsForSession.map((swing, idx) => (
                            <TableRow
                              key={swing.id || idx}
                              hover
                              selected={selectedSwing && swing.id === selectedSwing.id}
                              sx={{ 
                                cursor: 'pointer', 
                                '&:hover': { bgcolor: '#f0f8ff' }, 
                                bgcolor: selectedSwing && swing.id === selectedSwing.id ? '#e3f2fd' : '#fff'
                              }}
                              onClick={() => setSelectedSwing(swing)}
                            >
                              <TableCell sx={{ color: '#1c2c4d' }}>{idx + 1}</TableCell>
                              <TableCell sx={{ color: '#1c2c4d' }}>{safeToFixed(swing.exit_velocity, 1)} MPH</TableCell>
                              <TableCell sx={{ color: '#1c2c4d' }}>{safeToFixed(swing.launch_angle, 1)}°</TableCell>
                              <TableCell sx={{ color: '#1c2c4d' }}>{safeToFixed(swing.distance, 0)} FT</TableCell>
                              <TableCell sx={{ color: '#1c2c4d' }}>{swing.strike_zone}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </Card>

              {/* Expanded Swing View */}
              <Dialog
                open={!!selectedSwing}
                onClose={() => setSelectedSwing(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ 
                  sx: { 
                    bgcolor: '#fff', 
                    border: '1.5px solid #e0e3e8', 
                    borderRadius: 4, 
                    color: '#1c2c4d',
                    boxShadow: '0 8px 32px rgba(28,44,77,0.12)'
                  } 
                }}
              >
                <DialogTitle sx={{ 
                  color: '#1c2c4d', 
                  fontWeight: 700, 
                  borderBottom: '1px solid #e0e3e8', 
                  bgcolor: '#f8f9fa' 
                }}>
                  Swing Details
                </DialogTitle>
                <DialogContent sx={{ pt: 2, bgcolor: '#fff' }}>
                  {selectedSwing && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, color: '#1c2c4d' }}><b>Exit Velocity:</b> {safeToFixed(selectedSwing.exit_velocity, 1)} MPH</Typography>
                      <Typography variant="body2" sx={{ mb: 1, color: '#1c2c4d' }}><b>Launch Angle:</b> {safeToFixed(selectedSwing.launch_angle, 1)}°</Typography>
                      <Typography variant="body2" sx={{ mb: 1, color: '#1c2c4d' }}><b>Distance:</b> {safeToFixed(selectedSwing.distance, 0)} FT</Typography>
                      <Typography variant="body2" sx={{ mb: 1, color: '#1c2c4d' }}><b>Strike Zone:</b> {selectedSwing.strike_zone}</Typography>
                      <Typography variant="body2" sx={{ mb: 1, color: '#1c2c4d' }}><b>Horizontal Angle:</b> {selectedSwing.horiz_angle}</Typography>
                      <Typography variant="body2" sx={{ mb: 1, color: '#1c2c4d' }}><b>Time:</b> {selectedSwing.created_at}</Typography>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e3e8', bgcolor: '#f8f9fa' }}>
                  <Button 
                    onClick={() => setSelectedSwing(null)} 
                    sx={{ 
                      color: '#1c2c4d',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: 'rgba(28,44,77,0.08)',
                      }
                    }}
                  >
                    Close
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e3e8', bgcolor: '#f8f9fa' }}>
          <Button 
            onClick={() => setSwingsModalOpen(false)} 
            sx={{ 
              color: '#1c2c4d',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(28,44,77,0.08)',
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Helper component for a hot zone cell
function HotZoneCell({ zone, ev }) {
  // Color scale: gray (low) to red (high) - matching Upload screen
  const getZoneColor = (avgEV) => {
    if (avgEV === null || avgEV === undefined) return '#ffffff'; // white for no data
    if (avgEV >= 90) return '#ff0000'; // red
    if (avgEV >= 85) return '#ff8c00'; // orange
    if (avgEV >= 80) return '#ffd700'; // yellow
    return '#808080'; // gray
  };

  const bgColor = getZoneColor(ev);
  return (
    <Box
      sx={{
        border: '2px solid #fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: bgColor,
        color: ev !== null && ev !== undefined && ev > 85 ? 'white' : '#1c2c4d',
        fontWeight: 'bold',
        fontSize: '1.2rem',
        flexDirection: 'column',
        width: 60,
        height: 60,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}
    >
      <span style={{ fontSize: '1rem', opacity: 0.8, fontWeight: 600 }}>{zone}</span>
      <span style={{ fontSize: '0.85rem', marginTop: 2 }}>{ev !== null && ev !== undefined ? `${safeToFixed(ev, 1)}` : ''}</span>
    </Box>
  );
}

export default PlayerDetails; 