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
import { Delete, Download, Close, Visibility, Analytics, Edit, LocalOffer } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';

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
    return value.toFixed(decimals);
  };

  const getGradeColor = (grade) => {
    if (!grade) return 'default';
    if (grade === 'Above Average') return 'success';
    if (grade === 'Average') return 'warning';
    if (grade === 'Below Average') return 'error';
    return 'default';
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
                  {formatMetricValue(metrics.batSpeed.avg)}
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
                  {formatMetricValue(metrics.batSpeed.max)}
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
                  {formatMetricValue(metrics.exitVelocity.avg)}
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
                  {formatMetricValue(metrics.exitVelocity.max)}
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
      setSessions(response.data.sessions || []);
    } catch (err) {
      setError('Failed to load sessions');
      console.error('Error fetching sessions:', err);
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
      setCurrentReport(response.data);
      setReportModalOpen(true);
    } catch (err) {
      setError('Failed to load report');
      console.error('Error loading report:', err);
    }
  };

  const handleEmailReport = (sessionId) => {
    const subject = encodeURIComponent(`Baseball Analytics Report - ${player.name} - Session ${sessionId}`);
    const body = encodeURIComponent(`Please find attached the baseball analytics report for ${player.name} from session ${sessionId}.`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleVisualizeData = (sessionId) => {
    navigate(`/sessions/${sessionId}/visualize`);
    onClose(); // Close the player details dialog
  };

  // Tag editing functions
  const handleEditTags = (session) => {
    setEditingSession(session);
    setSessionTags(session.session_tags ? session.session_tags.split(',').map(tag => tag.trim()) : []);
    setTagDialogOpen(true);
  };

  const handleSaveTags = async () => {
    if (!editingSession) return;
    
    setTagLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/sessions/${editingSession.id}`, {
        session_tags: sessionTags.join(', ')
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
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
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
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
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
                    {sessions.map((session) => (
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
            <ReportDisplay report={currentReport} player={player} />
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
              {/* Metrics Grid */}
              <Card sx={{ 
                mb: 4, 
                p: 3, 
                textAlign: 'center', 
                bgcolor: '#fff',
                border: '1.5px solid #e0e3e8',
                borderRadius: 4,
                boxShadow: '0 4px 16px rgba(28,44,77,0.08)',
                color: '#1c2c4d'
              }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#1c2c4d', letterSpacing: 0.5 }}>
                  Performance Metrics
                </Typography>
                {renderMetrics()}
              </Card>

              {/* Strike Zone Heat Map */}
              {(currentReport?.metrics?.batSpeed?.hotZoneEVs || currentReport?.metrics?.exitVelocity?.hotZoneEVs) && (
                <Card sx={{ 
                  p: 3, 
                  textAlign: 'center', 
                  mb: 4,
                  bgcolor: '#fff',
                  border: '1.5px solid #e0e3e8',
                  borderRadius: 4,
                  boxShadow: '0 4px 16px rgba(28,44,77,0.08)',
                  color: '#1c2c4d'
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1c2c4d' }}>
                    STRIKE ZONE HOT ZONES (Avg EV)
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, maxWidth: 350, mx: 'auto' }}>
                    {[10, null, 11].map((zone, idx) => zone ? (
                      <HotZoneCell key={zone} zone={zone} ev={(currentReport?.metrics?.batSpeed?.hotZoneEVs || currentReport?.metrics?.exitVelocity?.hotZoneEVs)?.[zone]} />
                    ) : <Box key={idx} />)}
                    {[1, 2, 3].map(zone => <HotZoneCell key={zone} zone={zone} ev={(currentReport?.metrics?.batSpeed?.hotZoneEVs || currentReport?.metrics?.exitVelocity?.hotZoneEVs)?.[zone]} />)}
                    {[4, 5, 6].map(zone => <HotZoneCell key={zone} zone={zone} ev={(currentReport?.metrics?.batSpeed?.hotZoneEVs || currentReport?.metrics?.exitVelocity?.hotZoneEVs)?.[zone]} />)}
                    {[7, 8, 9].map(zone => <HotZoneCell key={zone} zone={zone} ev={(currentReport?.metrics?.batSpeed?.hotZoneEVs || currentReport?.metrics?.exitVelocity?.hotZoneEVs)?.[zone]} />)}
                    {[12, null, 13].map((zone, idx) => zone ? (
                      <HotZoneCell key={zone} zone={zone} ev={(currentReport?.metrics?.batSpeed?.hotZoneEVs || currentReport?.metrics?.exitVelocity?.hotZoneEVs)?.[zone]} />
                    ) : <Box key={idx + 'b'} />)}
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2, color: '#1c2c4d' }}>
                    Each zone shows the average exit velocity (mph) for that strike zone
                  </Typography>
                </Card>
              )}

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
                              <TableCell sx={{ color: '#1c2c4d' }}>{swing.exit_velocity?.toFixed(1)} MPH</TableCell>
                              <TableCell sx={{ color: '#1c2c4d' }}>{swing.launch_angle?.toFixed(1)}°</TableCell>
                              <TableCell sx={{ color: '#1c2c4d' }}>{swing.distance?.toFixed(0)} FT</TableCell>
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
                      <Typography variant="body2" sx={{ mb: 1, color: '#1c2c4d' }}><b>Exit Velocity:</b> {selectedSwing.exit_velocity} MPH</Typography>
                      <Typography variant="body2" sx={{ mb: 1, color: '#1c2c4d' }}><b>Launch Angle:</b> {selectedSwing.launch_angle}°</Typography>
                      <Typography variant="body2" sx={{ mb: 1, color: '#1c2c4d' }}><b>Distance:</b> {selectedSwing.distance} FT</Typography>
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

// Report Display Component
function ReportDisplay({ report, player }) {
  const [swingsForSession, setSwingsForSession] = useState([]);
  const [swingsLoading, setSwingsLoading] = useState(false);
  const [selectedSwing, setSelectedSwing] = useState(null);

  // Load swings automatically when report is displayed - using same logic as analytics screen
  useEffect(() => {
    if (player?.id) {
      loadSwings(player.id);
    }
  }, [player?.id]);

  const loadSwings = async (playerId) => {
    setSwingsLoading(true);
    setSwingsForSession([]);
    try {
      // Use the same API call as the analytics screen
      const res = await api.get(`/players/${playerId}/swings`);
      const swings = res.data.data || [];
      setSwingsForSession(swings);
    } catch (err) {
      console.error('Error loading swings:', err);
      setSwingsForSession([]);
    } finally {
      setSwingsLoading(false);
    }
  };

  if (!report) return null;

  return (
    <Box>
      {/* Metrics Grid */}
      <Card sx={{ 
        mb: 4, 
        p: 3, 
        textAlign: 'center', 
        bgcolor: '#fff',
        border: '1.5px solid #e0e3e8',
        borderRadius: 4,
        boxShadow: '0 4px 16px rgba(28,44,77,0.08)',
        color: '#1c2c4d'
      }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#1c2c4d', letterSpacing: 0.5 }}>
          Performance Metrics
        </Typography>
        {renderMetrics()}
      </Card>

      {/* Strike Zone Heat Map */}
      {(report.metrics?.batSpeed?.hotZoneEVs || report.metrics?.exitVelocity?.hotZoneEVs) && (
        <Card sx={{ 
          p: 3, 
          textAlign: 'center', 
          mb: 4,
          bgcolor: '#fff',
          border: '1.5px solid #e0e3e8',
          borderRadius: 4,
          boxShadow: '0 4px 16px rgba(28,44,77,0.08)',
          color: '#1c2c4d'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1c2c4d' }}>
            STRIKE ZONE HOT ZONES (Avg EV)
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, maxWidth: 350, mx: 'auto' }}>
            {[10, null, 11].map((zone, idx) => zone ? (
              <HotZoneCell key={zone} zone={zone} ev={(report.metrics?.batSpeed?.hotZoneEVs || report.metrics?.exitVelocity?.hotZoneEVs)?.[zone]} />
            ) : <Box key={idx} />)}
            {[1, 2, 3].map(zone => <HotZoneCell key={zone} zone={zone} ev={(report.metrics?.batSpeed?.hotZoneEVs || report.metrics?.exitVelocity?.hotZoneEVs)?.[zone]} />)}
            {[4, 5, 6].map(zone => <HotZoneCell key={zone} zone={zone} ev={(report.metrics?.batSpeed?.hotZoneEVs || report.metrics?.exitVelocity?.hotZoneEVs)?.[zone]} />)}
            {[7, 8, 9].map(zone => <HotZoneCell key={zone} zone={zone} ev={(report.metrics?.batSpeed?.hotZoneEVs || report.metrics?.exitVelocity?.hotZoneEVs)?.[zone]} />)}
            {[12, null, 13].map((zone, idx) => zone ? (
              <HotZoneCell key={zone} zone={zone} ev={(report.metrics?.batSpeed?.hotZoneEVs || report.metrics?.exitVelocity?.hotZoneEVs)?.[zone]} />
            ) : <Box key={idx + 'b'} />)}
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2, color: '#1c2c4d' }}>
            Each zone shows the average exit velocity (mph) for that strike zone
          </Typography>
        </Card>
      )}

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
                      <TableCell sx={{ color: '#1c2c4d' }}>{swing.exit_velocity?.toFixed(1)} MPH</TableCell>
                      <TableCell sx={{ color: '#1c2c4d' }}>{swing.launch_angle?.toFixed(1)}°</TableCell>
                      <TableCell sx={{ color: '#1c2c4d' }}>{swing.distance?.toFixed(0)} FT</TableCell>
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
              <Typography variant="body2" sx={{ mb: 1, color: '#1c2c4d' }}><b>Exit Velocity:</b> {selectedSwing.exit_velocity} MPH</Typography>
              <Typography variant="body2" sx={{ mb: 1, color: '#1c2c4d' }}><b>Launch Angle:</b> {selectedSwing.launch_angle}°</Typography>
              <Typography variant="body2" sx={{ mb: 1, color: '#1c2c4d' }}><b>Distance:</b> {selectedSwing.distance} FT</Typography>
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
        aspectRatio: '1',
        border: '2px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: bgColor,
        color: ev !== null && ev !== undefined && ev > 85 ? 'white' : 'black',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        flexDirection: 'column',
        transition: 'background 0.3s',
        minWidth: 60,
        minHeight: 60
      }}
    >
      <span style={{ fontSize: '0.95rem', opacity: 0.7 }}>{zone}</span>
      <span>{ev !== null && ev !== undefined ? `${ev.toFixed(1)} mph` : ''}</span>
    </Box>
  );
}

export default PlayerDetails; 