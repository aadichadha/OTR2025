import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Slider,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import Compare from '@mui/icons-material/Compare';
import FilterList from '@mui/icons-material/FilterList';
import Refresh from '@mui/icons-material/Refresh';
import ExpandMore from '@mui/icons-material/ExpandMore';
import TrendingUp from '@mui/icons-material/TrendingUp';
import TrendingDown from '@mui/icons-material/TrendingDown';
import Speed from '@mui/icons-material/Speed';
import ShowChart from '@mui/icons-material/ShowChart';
import Straighten from '@mui/icons-material/Straighten';
import CalendarToday from '@mui/icons-material/CalendarToday';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  Legend
} from 'recharts';
import api from '../services/api';
import safeToFixed from '../utils/safeToFixed';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1'];

const SessionComparison = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [sessions, setSessions] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [filterOptions, setFilterOptions] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    categories: [],
    dateRange: [null, null],
    minSwings: 0,
    maxSwings: 1000
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [showSessions, setShowSessions] = useState(true);

  useEffect(() => {
    loadData();
  }, [playerId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [sessionsRes, filterOptionsRes] = await Promise.all([
        api.get(`/players/${playerId}/sessions`),
        api.get(`/analytics/players/${playerId}/filter-options`)
      ]);

      setSessions(sessionsRes.data.data || []);
      setFilterOptions(filterOptionsRes.data.data || {});
    } catch (err) {
      console.error('Error loading comparison data:', err);
      setError('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionToggle = (sessionId) => {
    setSelectedSessions(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId);
      } else {
        return [...prev, sessionId];
      }
    });
  };

  const handleCompareSessions = async () => {
    if (selectedSessions.length < 2) {
      setError('Please select at least 2 sessions to compare');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/analytics/compare-sessions', {
        sessionIds: selectedSessions,
        filters: filters
      });
      setComparisonData(response.data.data);
    } catch (err) {
      console.error('Error comparing sessions:', err);
      setError('Failed to compare sessions');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSessions = () => {
    return sessions.filter(session => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(session.session_category)) {
        return false;
      }
      
      // Swing count filter
      const swingCount = session.exitVelocityData?.length || 0;
      if (swingCount < filters.minSwings || swingCount > filters.maxSwings) {
        return false;
      }
      
      return true;
    });
  };

  const getSessionStats = (session) => {
    const swings = session.exitVelocityData || [];
    const exitVelocities = swings.map(s => parseFloat(s.exit_velocity)).filter(v => !isNaN(v));
    const launchAngles = swings.map(s => parseFloat(s.launch_angle)).filter(v => !isNaN(v));
    
    return {
      swingCount: swings.length,
      avgExitVelocity: exitVelocities.length > 0 ? safeToFixed((exitVelocities.reduce((a, b) => a + b, 0) / exitVelocities.length), 1) : 0,
      bestExitVelocity: exitVelocities.length > 0 ? safeToFixed(Math.max(...exitVelocities), 1) : 0,
      avgLaunchAngle: launchAngles.length > 0 ? safeToFixed((launchAngles.reduce((a, b) => a + b, 0) / launchAngles.length), 1) : 0
    };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  const filteredSessions = getFilteredSessions();

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Session Comparison
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ mr: 2 }}
            >
              Filters
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={loadData}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        
        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <CalendarToday color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Sessions
                    </Typography>
                    <Typography variant="h5" component="div">
                      {sessions.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Speed color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Swings
                    </Typography>
                    <Typography variant="h5" component="div">
                      {sessions.reduce((sum, s) => sum + (s.exitVelocityData?.length || 0), 0)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Compare color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Selected
                    </Typography>
                    <Typography variant="h5" component="div">
                      {selectedSessions.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <ShowChart color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Avg Launch Angle
                    </Typography>
                    <Typography variant="h5" component="div">
                      {(() => {
                        const allSwings = sessions.flatMap(s => s.exitVelocityData || []);
                        const angles = allSwings.map(s => parseFloat(s.launch_angle)).filter(v => !isNaN(v));
                        return angles.length > 0 ? safeToFixed((angles.reduce((a, b) => a + b, 0) / angles.length), 1) : '0.0';
                      })()}°
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Session Filters
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Session Categories</InputLabel>
                <Select
                  multiple
                  value={filters.categories}
                  onChange={(e) => setFilters(prev => ({ ...prev, categories: e.target.value }))}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {filterOptions.categories?.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Swing Count Range</Typography>
              <Slider
                value={[filters.minSwings, filters.maxSwings]}
                onChange={(e, newValue) => setFilters(prev => ({ 
                  ...prev, 
                  minSwings: newValue[0], 
                  maxSwings: newValue[1] 
                }))}
                valueLabelDisplay="auto"
                min={0}
                max={1000}
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">{filters.minSwings} swings</Typography>
                <Typography variant="caption">{filters.maxSwings} swings</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Session Selection */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader 
              title="Session Selection" 
              action={
                <IconButton onClick={() => setShowSessions(!showSessions)}>
                  {showSessions ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              }
            />
            <CardContent>
              {showSessions && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Compare />}
                      onClick={handleCompareSessions}
                      disabled={selectedSessions.length < 2}
                    >
                      Compare {selectedSessions.length} Sessions
                    </Button>
                  </Box>
                  
                  <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                    {filteredSessions.map((session) => {
                      const stats = getSessionStats(session);
                      const isSelected = selectedSessions.includes(session.id);
                      
                      return (
                        <ListItem
                          key={session.id}
                          button
                          onClick={() => handleSessionToggle(session.id)}
                          sx={{
                            border: 1,
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            borderRadius: 1,
                            mb: 1,
                            backgroundColor: isSelected ? 'primary.light' : 'transparent'
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box>
                                <Typography variant="subtitle2">
                                  {new Date(session.session_date).toLocaleDateString()}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {session.session_category || 'No category'}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  {stats.swingCount} swings • {stats.avgExitVelocity} mph avg • {stats.bestExitVelocity} mph best
                                </Typography>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            {isSelected ? (
                              <CheckCircle color="primary" />
                            ) : (
                              <Cancel color="action" />
                            )}
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Comparison Results */}
        <Grid item xs={12} lg={8}>
          {comparisonData ? (
            <Grid container spacing={3}>
              {/* Exit Velocity Comparison */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Exit Velocity Comparison" />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparisonData.sessions}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="session_date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="avg_exit_velocity" fill="#8884d8" name="Average" />
                        <Bar dataKey="best_exit_velocity" fill="#82ca9d" name="Best" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Launch Angle vs Exit Velocity Scatter */}
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardHeader title="Launch Angle vs Exit Velocity" />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="exit_velocity" name="Exit Velocity" />
                        <YAxis type="number" dataKey="launch_angle" name="Launch Angle" />
                        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter data={comparisonData.all_swings} fill="#8884d8" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Session Summary */}
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardHeader title="Session Summary" />
                  <CardContent>
                    <List>
                      {comparisonData.sessions.map((session, index) => (
                        <ListItem key={session.id}>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center">
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: COLORS[index % COLORS.length],
                                    mr: 2
                                  }}
                                />
                                <Typography variant="subtitle2">
                                  {new Date(session.session_date).toLocaleDateString()}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  Avg: {session.avg_exit_velocity} mph • Best: {session.best_exit_velocity} mph
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {session.swing_count} swings • {session.avg_launch_angle}° avg launch
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Performance Metrics */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Performance Metrics" />
                  <CardContent>
                    <Grid container spacing={2}>
                      {comparisonData.sessions.map((session, index) => (
                        <Grid item xs={12} sm={6} md={4} key={session.id}>
                          <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                            <Typography variant="h6" gutterBottom>
                              {new Date(session.session_date).toLocaleDateString()}
                            </Typography>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" color="textSecondary">
                                Average Exit Velocity
                              </Typography>
                              <Typography variant="h5" color="primary">
                                {session.avg_exit_velocity} mph
                              </Typography>
                            </Box>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" color="textSecondary">
                                Best Exit Velocity
                              </Typography>
                              <Typography variant="h5" color="success.main">
                                {session.best_exit_velocity} mph
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                Average Launch Angle
                              </Typography>
                              <Typography variant="h5" color="info.main">
                                {session.avg_launch_angle}°
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Card>
              <CardContent>
                <Box textAlign="center" py={8}>
                  <Compare sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Select Sessions to Compare
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Choose at least 2 sessions from the list to see detailed comparisons
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default SessionComparison; 