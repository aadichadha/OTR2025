import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Timeline,
  Assessment,
  TrendingUp,
  EmojiEvents,
  FilterList,
  Refresh,
  Visibility,
  Download
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const NAVY = '#1c2c4d';

const PlayerAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Data states
  const [sessions, setSessions] = useState([]);
  const [swings, setSwings] = useState([]);
  const [trends, setTrends] = useState([]);
  const [benchmarks, setBenchmarks] = useState(null);
  const [progress, setProgress] = useState(null);
  const [filterOptions, setFilterOptions] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    categories: [],
    sessionTypes: [],
    dateRange: [null, null],
    exitVelocityRange: [0, 120],
    launchAngleRange: [0, 45],
    strikeZones: []
  });
  
  const [showFilters, setShowFilters] = useState(false);

  // Load data when component mounts
  useEffect(() => {
    if (user && user.role === 'player') {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setDataLoading(true);
    try {
      // Load sessions for the current player
      const sessionsRes = await api.get(`/analytics/players/${user.id}/sessions`);
      setSessions(sessionsRes.data.data || []);

      // Load swings for the current player
      const swingsRes = await api.get(`/analytics/players/${user.id}/swings`);
      setSwings(swingsRes.data.data || []);

      // Load trends for the current player
      const trendsRes = await api.get(`/analytics/players/${user.id}/trends`);
      setTrends(trendsRes.data.data || []);

      // Load benchmarks for the current player
      const benchmarksRes = await api.get(`/analytics/players/${user.id}/benchmarks`);
      setBenchmarks(benchmarksRes.data.data);

      // Load progress for the current player
      const progressRes = await api.get(`/analytics/players/${user.id}/progress`);
      setProgress(progressRes.data.data);

      // Load filter options for the current player
      const filterOptionsRes = await api.get(`/analytics/players/${user.id}/filter-options`);
      setFilterOptions(filterOptionsRes.data.data || {});

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setDataLoading(false);
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleViewSession = (sessionId) => {
    navigate(`/sessions/${sessionId}/visualize`);
  };

  const handleDownloadReport = async (sessionId) => {
    try {
      const response = await api.get(`/sessions/${sessionId}/report`, {
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
      console.error('Error downloading report:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const roundNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return Math.round(parseFloat(num) * 10) / 10;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: NAVY, py: 4 }}>
      <Container maxWidth="xl">
        <Paper sx={{ p: 4, bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 32px rgba(28,44,77,0.10)', border: '2px solid #1c2c4d' }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, color: NAVY, mb: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
              Your Analytics
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
              Track your progress, analyze your performance, and see how you stack up against benchmarks.
            </Typography>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={loadAllData}
                disabled={dataLoading}
                sx={{ bgcolor: NAVY, '&:hover': { bgcolor: '#3a7bd5' } }}
              >
                Refresh Data
              </Button>
              <Button
                variant="outlined"
                startIcon={<EmojiEvents />}
                onClick={() => navigate('/leaderboard')}
                sx={{ borderColor: NAVY, color: NAVY, '&:hover': { borderColor: '#3a7bd5', color: '#3a7bd5' } }}
              >
                View Leaderboard
              </Button>
            </Box>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ '& .MuiTab-root': { color: NAVY, fontWeight: 600 } }}>
              <Tab label="Overview" icon={<Assessment />} />
              <Tab label="Sessions" icon={<Timeline />} />
              <Tab label="Trends" icon={<TrendingUp />} />
              <Tab label="Benchmarks" icon={<EmojiEvents />} />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: NAVY, mb: 3 }}>
                Performance Overview
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: '#f8f9fa', border: '1px solid #e0e3e8' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 2 }}>
                        Recent Performance
                      </Typography>
                      {sessions.length > 0 ? (
                        <Box>
                          <Typography variant="body1" sx={{ color: NAVY, mb: 1 }}>
                            Total Sessions: <b>{sessions.length}</b>
                          </Typography>
                          <Typography variant="body1" sx={{ color: NAVY, mb: 1 }}>
                            Total Swings: <b>{swings.length}</b>
                          </Typography>
                          <Typography variant="body1" sx={{ color: NAVY, mb: 1 }}>
                            Last Session: <b>{formatDate(sessions[0]?.session_date)}</b>
                          </Typography>
                        </Box>
                      ) : (
                        <Typography color="text.secondary">No sessions found.</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: '#f8f9fa', border: '1px solid #e0e3e8' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 2 }}>
                        Key Metrics
                      </Typography>
                      {swings.length > 0 ? (
                        <Box>
                          <Typography variant="body1" sx={{ color: NAVY, mb: 1 }}>
                            Avg Exit Velocity: <b>{roundNumber(swings.reduce((sum, swing) => sum + parseFloat(swing.exit_velocity || 0), 0) / swings.length)} mph</b>
                          </Typography>
                          <Typography variant="body1" sx={{ color: NAVY, mb: 1 }}>
                            Max Exit Velocity: <b>{roundNumber(Math.max(...swings.map(s => parseFloat(s.exit_velocity || 0))))} mph</b>
                          </Typography>
                          <Typography variant="body1" sx={{ color: NAVY }}>
                            Avg Launch Angle: <b>{roundNumber(swings.reduce((sum, swing) => sum + parseFloat(swing.launch_angle || 0), 0) / swings.length)}°</b>
                          </Typography>
                        </Box>
                      ) : (
                        <Typography color="text.secondary">No swing data available.</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: NAVY, mb: 3 }}>
                Your Sessions
              </Typography>
              
              {sessions.length > 0 ? (
                <TableContainer component={Paper} sx={{ bgcolor: '#f8f9fa' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: NAVY }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: NAVY }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: NAVY }}>Swings</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: NAVY }}>Avg EV</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: NAVY }}>Max EV</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: NAVY }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id} hover>
                          <TableCell>{formatDate(session.session_date)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={session.session_type?.toUpperCase() || 'Unknown'} 
                              size="small"
                              color={session.session_type === 'blast' ? 'primary' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell>{session.analytics?.total_swings || 0}</TableCell>
                          <TableCell>{roundNumber(session.analytics?.average_exit_velocity)} mph</TableCell>
                          <TableCell>{roundNumber(session.analytics?.best_exit_velocity)} mph</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Session">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewSession(session.id)}
                                  sx={{ color: NAVY }}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download Report">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownloadReport(session.id)}
                                  sx={{ color: NAVY }}
                                >
                                  <Download />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No sessions found. Upload your first session to see analytics!</Alert>
              )}
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: NAVY, mb: 3 }}>
                Performance Trends
              </Typography>
              
              {trends.length > 0 ? (
                <Grid container spacing={3}>
                  {trends.map((trend, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Card sx={{ bgcolor: '#f8f9fa', border: '1px solid #e0e3e8' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 2 }}>
                            {trend.metric}
                          </Typography>
                          <Typography variant="body1" sx={{ color: NAVY, mb: 1 }}>
                            Current: <b>{roundNumber(trend.current)}</b>
                          </Typography>
                          <Typography variant="body1" sx={{ color: NAVY, mb: 1 }}>
                            Previous: <b>{roundNumber(trend.previous)}</b>
                          </Typography>
                          <Typography variant="body1" sx={{ color: trend.change >= 0 ? 'success.main' : 'error.main' }}>
                            Change: <b>{trend.change >= 0 ? '+' : ''}{roundNumber(trend.change)}%</b>
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">Not enough data to show trends. Continue uploading sessions to see your progress!</Alert>
              )}
            </Box>
          )}

          {activeTab === 3 && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: NAVY, mb: 3 }}>
                Benchmark Comparison
              </Typography>
              
              {benchmarks ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: '#f8f9fa', border: '1px solid #e0e3e8' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 2 }}>
                          Your Performance
                        </Typography>
                        <Typography variant="body1" sx={{ color: NAVY, mb: 1 }}>
                          Avg Exit Velocity: <b>{roundNumber(benchmarks.player?.avg_exit_velocity)} mph</b>
                        </Typography>
                        <Typography variant="body1" sx={{ color: NAVY, mb: 1 }}>
                          Max Exit Velocity: <b>{roundNumber(benchmarks.player?.best_exit_velocity)} mph</b>
                        </Typography>
                        <Typography variant="body1" sx={{ color: NAVY }}>
                          Percentile: <b>{benchmarks.percentile}%</b>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: '#f8f9fa', border: '1px solid #e0e3e8' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 2 }}>
                          Age Group Average
                        </Typography>
                        <Typography variant="body1" sx={{ color: NAVY, mb: 1 }}>
                          Avg Exit Velocity: <b>{roundNumber(benchmarks.benchmark?.avg_exit_velocity)} mph</b>
                        </Typography>
                        <Typography variant="body1" sx={{ color: NAVY, mb: 1 }}>
                          Max Exit Velocity: <b>{roundNumber(benchmarks.benchmark?.best_exit_velocity)} mph</b>
                        </Typography>
                        <Typography variant="body1" sx={{ color: NAVY }}>
                          Level: <b>{benchmarks.age_group}</b>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">Benchmark data not available. Continue uploading sessions to see comparisons!</Alert>
              )}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default PlayerAnalytics; 