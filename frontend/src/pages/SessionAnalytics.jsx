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
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material';
import TrendingUp from '@mui/icons-material/TrendingUp';
import TrendingDown from '@mui/icons-material/TrendingDown';
import Timeline from '@mui/icons-material/Timeline';
import Assessment from '@mui/icons-material/Assessment';
import FilterList from '@mui/icons-material/FilterList';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Refresh from '@mui/icons-material/Refresh';
import Settings from '@mui/icons-material/Settings';
import Star from '@mui/icons-material/Star';
import StarBorder from '@mui/icons-material/StarBorder';
import Speed from '@mui/icons-material/Speed';
import ShowChart from '@mui/icons-material/ShowChart';
import Straighten from '@mui/icons-material/Straighten';
import CalendarToday from '@mui/icons-material/CalendarToday';
import Person from '@mui/icons-material/Person';
import School from '@mui/icons-material/School';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import TrendingFlat from '@mui/icons-material/TrendingFlat';
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
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import api from '../services/api';
import BarrelsFilter from '../components/BarrelsFilter';
import getGradeColor from '../utils/getGradeColor';
import safeToFixed from '../utils/safeToFixed';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const SessionAnalytics = () => {
  const { playerId: urlPlayerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Player selection state
  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(urlPlayerId || '');
  const [playersLoading, setPlayersLoading] = useState(true);
  
  // Data states
  const [sessions, setSessions] = useState([]);
  const [swings, setSwings] = useState([]);
  const [barrelsFilteredSwings, setBarrelsFilteredSwings] = useState([]);
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

  // Load players on component mount
  useEffect(() => {
    fetchPlayers();
  }, []);

  // Load data when player is selected
  useEffect(() => {
    if (selectedPlayerId) {
      loadAllData();
    } else {
      // Clear data when no player is selected
      setSessions([]);
      setSwings([]);
      setTrends([]);
      setBenchmarks(null);
      setProgress(null);
      setFilterOptions({});
    }
  }, [selectedPlayerId]);

  // Update filtered swings when swings change
  useEffect(() => {
    setBarrelsFilteredSwings(swings);
  }, [swings]);

  const fetchPlayers = async () => {
    try {
      setPlayersLoading(true);
      const response = await api.get('/players');
      const playersData = response.data.players || response.data || [];
      setPlayers(Array.isArray(playersData) ? playersData : []);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to load players');
    } finally {
      setPlayersLoading(false);
    }
  };

  const handlePlayerChange = (playerId) => {
    console.log('[DEBUG] Progression - Player selection changed to:', playerId);
    setSelectedPlayerId(playerId);
  };

  const loadAllData = async () => {
    if (!selectedPlayerId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [
        sessionsRes,
        swingsRes,
        playerStatsRes,
        benchmarksRes,
        progressRes,
        filterOptionsRes
      ] = await Promise.all([
        api.get(`/players/${selectedPlayerId}/sessions`),
        api.get(`/players/${selectedPlayerId}/swings`),
        api.get(`/analytics/player-stats?playerId=${selectedPlayerId}`),
        api.get(`/analytics/players/${selectedPlayerId}/benchmarks`),
        api.get(`/analytics/players/${selectedPlayerId}/progress`),
        api.get(`/analytics/players/${selectedPlayerId}/filter-options`)
      ]);

      // Ensure all data is properly handled as arrays
      const sessionsData = sessionsRes.data.data || [];
      const swingsData = swingsRes.data.data || [];
      const playerStatsData = playerStatsRes.data.players || playerStatsRes.data || [];
      const benchmarksData = benchmarksRes.data.data || {};
      const progressData = progressRes.data.data || {};
      const filterOptionsData = filterOptionsRes.data.data || {};

      // Get the player's stats (should be first in the array since we filtered by playerId)
      const playerStats = Array.isArray(playerStatsData) && playerStatsData.length > 0 ? playerStatsData[0] : null;

      console.log('[DEBUG] Sessions data:', sessionsData);
      console.log('[DEBUG] Player stats:', playerStats);

      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setSwings(Array.isArray(swingsData) ? swingsData : []);
      
      // Create trends data from sessions with proper metrics
      const trendsData = sessionsData.map(session => {
        const trend = {
          session_id: session.id,
          session_date: new Date(session.session_date).toLocaleDateString(),
          session_category: session.session_category,
          max_bat_speed: session.analytics?.max_bat_speed || null,
          avg_bat_speed: session.analytics?.avg_bat_speed || null,
          max_exit_velocity: session.analytics?.best_exit_velocity || null,
          avg_exit_velocity: session.analytics?.average_exit_velocity || null,
          barrel_percentage: session.analytics?.barrel_percentage || null
        };
        console.log(`[DEBUG] Session ${session.id} trend data:`, trend);
        return trend;
      }).filter(trend => trend.max_bat_speed || trend.max_exit_velocity || trend.avg_bat_speed || trend.avg_exit_velocity);
      
      // Sort by date for proper timeline display
      trendsData.sort((a, b) => new Date(a.session_date) - new Date(b.session_date));
      
      console.log('[DEBUG] Final trends data:', trendsData);
      setTrends(trendsData);
      setBenchmarks(benchmarksData);
      setProgress(playerStats); // Use player stats as progress data
      setFilterOptions(filterOptionsData);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getFilteredSwings = () => {
    if (!Array.isArray(swings)) return [];
    
    return swings.filter(swing => {
      if (!swing) return false;
      
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(swing.session_category)) {
        return false;
      }
      
      // Exit velocity range
      const exitVel = parseFloat(swing.exit_velocity);
      if (exitVel < filters.exitVelocityRange[0] || exitVel > filters.exitVelocityRange[1]) {
        return false;
      }
      
      // Launch angle range
      const launchAngle = parseFloat(swing.launch_angle);
      if (launchAngle < filters.launchAngleRange[0] || launchAngle > filters.launchAngleRange[1]) {
        return false;
      }
      
      return true;
    });
  };

  const getTrendDirection = (trend) => {
    if (trend > 0) return { icon: <TrendingUp color="success" />, color: 'success' };
    if (trend < 0) return { icon: <TrendingDown color="error" />, color: 'error' };
    return { icon: <TrendingFlat color="action" />, color: 'action' };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadAllData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  const filteredSwingsFromFilters = getFilteredSwings();

  const NAVY = '#1c2c4d';

  // Main return block
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: NAVY, py: { xs: 2, sm: 4 } }}>
      <Container maxWidth="xl" sx={{ p: { xs: 0.5, sm: 2 } }}>
        {/* Main Content Box */}
        <Paper sx={{ 
          p: { xs: 2, sm: 4 }, 
          bgcolor: '#fff', 
          borderRadius: 4, 
          boxShadow: '0 4px 32px rgba(28,44,77,0.10)', 
          border: '2.5px solid #1c2c4d'
        }}>
          {/* Header */}
          <Box sx={{ mb: { xs: 2, sm: 4 } }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 900, 
              color: NAVY, 
              mb: 1, 
              fontFamily: 'Inter, Roboto, Arial, sans-serif', 
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } 
            }}>
              Progression
            </Typography>
            <Typography variant="body1" sx={{ 
              color: NAVY, 
              mb: 2, 
              fontSize: { xs: '1rem', sm: '1.1rem' },
              opacity: 0.8
            }}>
              Track your progress and analyze your sessions over time.
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            gap: 2, 
            mb: 3 
          }}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ 
                borderColor: NAVY,
                color: NAVY,
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#3a7bd5',
                  bgcolor: 'rgba(28,44,77,0.04)'
                }
              }}
            >
              Filters {filters.categories.length > 0 && `(${filters.categories.length})`}
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={loadAllData}
              disabled={!selectedPlayerId}
              sx={{ 
                bgcolor: NAVY,
                color: '#fff',
                fontWeight: 700,
                '&:hover': {
                  bgcolor: '#3a7bd5'
                },
                '&:disabled': {
                  bgcolor: '#ccc',
                  color: '#666'
                }
              }}
            >
              Refresh
            </Button>
          </Box>

          {/* Player Selection */}
          <Box sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: '#f8f9fa', 
            border: '2px solid #e0e3e8', 
            borderRadius: 4 
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              mb: 2, 
              color: NAVY 
            }}>
              Select Player
            </Typography>
            <FormControl fullWidth>
              <InputLabel sx={{ color: NAVY, fontWeight: 600 }}>Choose Player</InputLabel>
              <Select
                value={selectedPlayerId}
                onChange={(e) => handlePlayerChange(e.target.value)}
                label="Choose Player"
                disabled={playersLoading}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: NAVY,
                    borderWidth: 2,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3a7bd5',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: NAVY,
                    borderWidth: 2,
                  },
                  '& .MuiSelect-select': {
                    color: NAVY,
                    fontWeight: 500,
                  },
                  '& .MuiInputLabel-root': {
                    color: NAVY,
                    fontWeight: 600,
                  }
                }}
              >
                <MenuItem value="">
                  <em>Select a player to view progression</em>
                </MenuItem>
                {Array.isArray(players) && players.map(player => (
                  <MenuItem key={player.id} value={player.id.toString()}>
                    {player.name} - {player.position}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        
          {/* Quick Stats - Only show when player is selected */}
          {selectedPlayerId ? (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: '#f8f9fa', 
                  border: '2px solid #e0e3e8',
                  '&:hover': { borderColor: NAVY }
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <Speed sx={{ mr: 2, color: NAVY }} />
                      <Box>
                        <Typography sx={{ color: NAVY, fontWeight: 600, mb: 1 }}>
                          Total Swings
                        </Typography>
                        <Typography variant="h4" sx={{ color: NAVY, fontWeight: 700 }}>
                          {swings.length}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: '#f8f9fa', 
                  border: '2px solid #e0e3e8',
                  '&:hover': { borderColor: NAVY }
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <CalendarToday sx={{ mr: 2, color: NAVY }} />
                      <Box>
                        <Typography sx={{ color: NAVY, fontWeight: 600, mb: 1 }}>
                          Sessions
                        </Typography>
                        <Typography variant="h4" sx={{ color: NAVY, fontWeight: 700 }}>
                          {sessions.length}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: '#f8f9fa', 
                  border: '2px solid #e0e3e8',
                  '&:hover': { borderColor: NAVY }
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <TrendingUp sx={{ mr: 2, color: NAVY }} />
                      <Box>
                        <Typography sx={{ color: NAVY, fontWeight: 600, mb: 1 }}>
                          Avg Exit Velocity
                        </Typography>
                        <Typography variant="h4" sx={{ color: NAVY, fontWeight: 700 }}>
                          {swings.length > 0 ? 
                            safeToFixed((swings.reduce((sum, s) => sum + parseFloat(s.exit_velocity || 0), 0) / swings.length), 1) : 
                            '0.0'} mph
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: '#f8f9fa', 
                  border: '2px solid #e0e3e8',
                  '&:hover': { borderColor: NAVY }
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <ShowChart sx={{ mr: 2, color: NAVY }} />
                      <Box>
                        <Typography sx={{ color: NAVY, fontWeight: 600, mb: 1 }}>
                          Avg Launch Angle
                        </Typography>
                        <Typography variant="h4" sx={{ color: NAVY, fontWeight: 700 }}>
                          {swings.length > 0 ? 
                            safeToFixed((swings.reduce((sum, s) => sum + parseFloat(s.launch_angle || 0), 0) / swings.length), 1) : 
                            '0.0'}°
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 6,
              bgcolor: '#f8f9fa',
              borderRadius: 4,
              border: '2px dashed #e0e3e8'
            }}>
              <Typography variant="h6" sx={{ color: NAVY, fontWeight: 600 }}>
                Select a player above to view their progression analytics
              </Typography>
            </Box>
          )}

          {/* Filters */}
          {showFilters && (
            <Box sx={{ 
              p: 3, 
              mb: 3, 
              bgcolor: '#f8f9fa', 
              border: '2px solid #e0e3e8', 
              borderRadius: 4 
            }}>
              <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 2 }}>
                Advanced Filters
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: NAVY, fontWeight: 600 }}>Session Categories</InputLabel>
                    <Select
                      multiple
                      value={filters.categories}
                      onChange={(e) => handleFilterChange('categories', e.target.value)}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(Array.isArray(selected) ? selected : []).map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: NAVY,
                          borderWidth: 2,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3a7bd5',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: NAVY,
                          borderWidth: 2,
                        },
                        '& .MuiSelect-select': {
                          color: NAVY,
                          fontWeight: 500,
                        },
                        '& .MuiInputLabel-root': {
                          color: NAVY,
                          fontWeight: 600,
                        }
                      }}
                    >
                      {(filterOptions.categories || []).map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Exit Velocity Range (mph)</Typography>
                <Slider
                  value={filters.exitVelocityRange}
                  onChange={(e, newValue) => handleFilterChange('exitVelocityRange', newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={120}
                />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption">{filters.exitVelocityRange[0]} mph</Typography>
                  <Typography variant="caption">{filters.exitVelocityRange[1]} mph</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Launch Angle Range (°)</Typography>
                <Slider
                  value={filters.launchAngleRange}
                  onChange={(e, newValue) => handleFilterChange('launchAngleRange', newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={45}
                />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption">{filters.launchAngleRange[0]}°</Typography>
                  <Typography variant="caption">{filters.launchAngleRange[1]}°</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Strike Zones</InputLabel>
                  <Select
                    multiple
                    value={filters.strikeZones}
                    onChange={(e) => handleFilterChange('strikeZones', e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(Array.isArray(selected) ? selected : []).map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {(filterOptions.strike_zones || []).map((zone) => (
                      <MenuItem key={zone} value={zone}>
                        Zone {zone}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}

          {/* Main Content Tabs */}
          <Box sx={{ width: '100%' }}>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ 
              borderBottom: 1, 
              borderColor: NAVY,
              '& .MuiTab-root': {
                color: NAVY,
                fontWeight: 600,
                '&.Mui-selected': {
                  color: NAVY,
                  fontWeight: 700
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: NAVY
              }
            }}>
              <Tab label="Overview" icon={<Assessment />} />
              <Tab label="Trends" icon={<Timeline />} />
              <Tab label="Benchmarks" icon={<EmojiEvents />} />
              <Tab label="Progress" icon={<TrendingUp />} />
              <Tab label="Swing Analysis" icon={<Speed />} />
            </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Box>
              {/* Key Metrics Summary */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 700, mb: 1 }}>
                        Max Bat Speed
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#1c2c4d', fontWeight: 900 }}>
                        {progress?.max_bat_speed || 'N/A'} mph
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 700, mb: 1 }}>
                        Max Exit Velocity
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#1c2c4d', fontWeight: 900 }}>
                        {progress?.max_exit_velocity || 'N/A'} mph
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 700, mb: 1 }}>
                        Avg Exit Velocity
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#1c2c4d', fontWeight: 900 }}>
                        {progress?.avg_exit_velocity || 'N/A'} mph
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 700, mb: 1 }}>
                        Avg Bat Speed
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#1c2c4d', fontWeight: 900 }}>
                        {progress?.avg_bat_speed || 'N/A'} mph
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Combined Performance Over Time Graph */}
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
                    <CardHeader 
                      title="Performance Over Time" 
                      sx={{ 
                        bgcolor: '#1c2c4d', 
                        color: 'white',
                        '& .MuiCardHeader-title': { fontWeight: 700 }
                      }}
                    />
                    <CardContent sx={{ p: 3 }}>
                      {/* Debug info */}
                      <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Debug: {trends.length} data points loaded
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Sample data: {trends.length > 0 ? JSON.stringify(trends[0]) : 'No data'}
                        </Typography>
                      </Box>
                      
                      <ResponsiveContainer width="100%" height={500}>
                        <LineChart data={trends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis 
                            dataKey="session_date" 
                            stroke="#1c2c4d"
                            tick={{ fill: '#1c2c4d', fontSize: 12 }}
                          />
                          <YAxis 
                            stroke="#1c2c4d"
                            tick={{ fill: '#1c2c4d', fontSize: 12 }}
                          />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '2px solid #1c2c4d',
                              borderRadius: 8
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="max_bat_speed" 
                            stroke="#1c2c4d" 
                            strokeWidth={3}
                            dot={{ fill: '#1c2c4d', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#1c2c4d', strokeWidth: 2 }}
                            name="Max Bat Speed"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="max_exit_velocity" 
                            stroke="#FF6B6B" 
                            strokeWidth={3}
                            dot={{ fill: '#FF6B6B', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#FF6B6B', strokeWidth: 2 }}
                            name="Max Exit Velocity"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="avg_exit_velocity" 
                            stroke="#4ECDC4" 
                            strokeWidth={3}
                            dot={{ fill: '#4ECDC4', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#4ECDC4', strokeWidth: 2 }}
                            name="Avg Exit Velocity"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="avg_bat_speed" 
                            stroke="#45B7D1" 
                            strokeWidth={3}
                            dot={{ fill: '#45B7D1', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#45B7D1', strokeWidth: 2 }}
                            name="Avg Bat Speed"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="barrel_percentage" 
                            stroke="#FFD93D" 
                            strokeWidth={3}
                            dot={{ fill: '#FFD93D', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#FFD93D', strokeWidth: 2 }}
                            name="Barrel %"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Legend */}
              <Box sx={{ mt: 3, p: 3, bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
                <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 700, mb: 2 }}>
                  Performance Metrics Legend
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box display="flex" alignItems="center">
                      <Box sx={{ width: 20, height: 3, bgcolor: '#1c2c4d', mr: 2 }} />
                      <Typography variant="body2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>
                        Max Bat Speed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box display="flex" alignItems="center">
                      <Box sx={{ width: 20, height: 3, bgcolor: '#FF6B6B', mr: 2 }} />
                      <Typography variant="body2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>
                        Max Exit Velocity
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box display="flex" alignItems="center">
                      <Box sx={{ width: 20, height: 3, bgcolor: '#4ECDC4', mr: 2 }} />
                      <Typography variant="body2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>
                        Avg Exit Velocity
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box display="flex" alignItems="center">
                      <Box sx={{ width: 20, height: 3, bgcolor: '#45B7D1', mr: 2 }} />
                      <Typography variant="body2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>
                        Avg Bat Speed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box display="flex" alignItems="center">
                      <Box sx={{ width: 20, height: 3, bgcolor: '#FFD93D', mr: 2 }} />
                      <Typography variant="body2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>
                        Barrel %
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}

          {/* Trends Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardHeader 
                    title="Performance Trends" 
                    action={
                      <Chip 
                        label={`${trends.length} sessions analyzed`}
                        color="primary"
                        variant="outlined"
                      />
                    }
                  />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="session_date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Line type="monotone" dataKey="average" stroke="#8884d8" strokeWidth={3} name="Average" />
                        <Line type="monotone" dataKey="best" stroke="#82ca9d" strokeWidth={3} name="Best" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Benchmarks Tab */}
          {activeTab === 2 && benchmarks && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Your Performance" />
                  <CardContent>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>Exit Velocity</Typography>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="h4" color="primary" sx={{ mr: 2 }}>
                          {benchmarks.player_metrics.avg_exit_velocity} mph
                        </Typography>
                        <Chip 
                          label={`${benchmarks.percentiles.avg_exit_velocity}%`}
                          sx={{ 
                            bgcolor: getGradeColor(benchmarks.grades?.avg_exit_velocity),
                            color: 'white'
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        vs {benchmarks.benchmark.avg_exit_velocity} mph benchmark
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6" gutterBottom>Best Exit Velocity</Typography>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="h4" color="primary" sx={{ mr: 2 }}>
                          {benchmarks.player_metrics.best_exit_velocity} mph
                        </Typography>
                        <Chip 
                          label={`${benchmarks.percentiles.best_exit_velocity}%`}
                          sx={{ 
                            bgcolor: getGradeColor(benchmarks.grades?.best_exit_velocity),
                            color: 'white'
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        vs {benchmarks.benchmark.best_exit_velocity} mph benchmark
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Grade Summary" />
                  <CardContent>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>Average Exit Velocity</Typography>
                      <Chip 
                        label={`Grade ${benchmarks.grades?.avg_exit_velocity || 'N/A'}`}
                        sx={{ 
                          bgcolor: getGradeColor(benchmarks.grades?.avg_exit_velocity),
                          color: 'white',
                          fontSize: '1.2rem', 
                          p: 1 
                        }}
                        size="large"
                      />
                    </Box>
                    <Box>
                      <Typography variant="h6" gutterBottom>Best Exit Velocity</Typography>
                      <Chip 
                        label={`Grade ${benchmarks.grades?.best_exit_velocity || 'N/A'}`}
                        sx={{ 
                          bgcolor: getGradeColor(benchmarks.grades?.best_exit_velocity),
                          color: 'white',
                          fontSize: '1.2rem', 
                          p: 1 
                        }}
                        size="large"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Progress Tab */}
          {activeTab === 3 && progress && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardHeader title="Progress Tracking" />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={progress.progress}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="session_date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Line type="monotone" dataKey="average" stroke="#8884d8" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Card>
                  <CardHeader title="Goal Prediction" />
                  <CardContent>
                    {progress.prediction ? (
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Target: {progress.prediction.goal_value} mph
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          Current: {progress.prediction.current_average} mph
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          Weekly improvement: {progress.prediction.weekly_improvement_rate} mph
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          Sessions to goal: {progress.prediction.sessions_to_goal}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Estimated date: {progress.prediction.estimated_date}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography color="textSecondary">
                        Need more data for predictions
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Swing Analysis Tab */}
          {activeTab === 4 && (
            <Grid container spacing={3}>
              {/* Barrels Filter */}
              {swings.length > 0 && (
                <Grid item xs={12}>
                  <BarrelsFilter
                    swingData={swings}
                    onFilteredDataChange={setBarrelsFilteredSwings}
                    showStats={true}
                  />
                </Grid>
              )}
              
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardHeader title="Exit Velocity Distribution" />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barrelsFilteredSwings.slice(0, 20)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="id" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="exit_velocity" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardHeader title="Launch Angle vs Exit Velocity" />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={barrelsFilteredSwings.slice(0, 20)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="exit_velocity" />
                        <YAxis />
                        <RechartsTooltip />
                        <Line type="monotone" dataKey="launch_angle" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Filtered Swings" />
                  <CardContent>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Showing {barrelsFilteredSwings.length} of {swings.length} swings
                    </Typography>
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                      {(Array.isArray(barrelsFilteredSwings) ? barrelsFilteredSwings.slice(0, 50) : []).map((swing) => (
                        <Box key={swing.id} sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
                          <Typography variant="body2">
                            Swing {swing.id}: {swing.exit_velocity} mph, {swing.launch_angle}° 
                            {swing.session_category && ` (${swing.session_category})`}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
          </Box>
        </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default SessionAnalytics; 