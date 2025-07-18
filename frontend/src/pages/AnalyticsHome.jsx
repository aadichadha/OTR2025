import React, { useEffect, useState, useMemo } from 'react';
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
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TextField,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Alert,
  Checkbox,
  FormControlLabel,
  Divider,
  Avatar,
  LinearProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Assessment from '@mui/icons-material/Assessment';
import FilterList from '@mui/icons-material/FilterList';
import Visibility from '@mui/icons-material/Visibility';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TableChart from '@mui/icons-material/TableChart';
import ShowChart from '@mui/icons-material/ShowChart';
import Person from '@mui/icons-material/Person';
import TrendingUp from '@mui/icons-material/TrendingUp';
import Speed from '@mui/icons-material/Speed';
import Timeline from '@mui/icons-material/Timeline';
import CalendarToday from '@mui/icons-material/CalendarToday';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChart from '@mui/icons-material/PieChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import Info from '@mui/icons-material/Info';
import { useSearchParams } from 'react-router-dom';
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
  PieChart as RechartsPieChart, 
  Cell,
  Area,
  AreaChart
} from 'recharts';
import api from '../services/api';
import SprayChart3D from '../components/visualizations/SprayChart3D';
import BarrelsFilter from '../components/BarrelsFilter';
import safeToFixed from '../utils/safeToFixed';
import { useAuth } from '../context/AuthContext';
import Refresh from '@mui/icons-material/Refresh';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import Close from '@mui/icons-material/Close';
import ReportDisplay from '../components/ReportDisplay';

// Session type tags for filtering
const SESSION_TYPES = [
  'Soft Toss',
  'Over the Hand',
  'Machine',
  'Live BP',
  'Game',
  'Warm Up',
  'Practice'
];

// Filterable metrics for Hittrax and Blast data
const FILTERABLE_METRICS = {
  hittrax: [
    { key: 'exit_velocity', label: 'Exit Velocity (MPH)', min: 50, max: 120 },
    { key: 'launch_angle', label: 'Launch Angle (degrees)', min: -20, max: 50 },
    { key: 'distance', label: 'Distance (FT)', min: 0, max: 450 },
    { key: 'pitch_speed', label: 'Pitch Speed (MPH)', min: 40, max: 100 }
  ],
  blast: [
    { key: 'bat_speed', label: 'Bat Speed (MPH)', min: 40, max: 90 },
    { key: 'attack_angle', label: 'Attack Angle (degrees)', min: -20, max: 30 },
    { key: 'time_to_contact', label: 'Time to Contact (SEC)', min: 0.1, max: 0.5 }
  ]
};

const AnalyticsHome = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [swingData, setSwingData] = useState([]);
  const [filteredSwingData, setFilteredSwingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  
  // Selection states
  const [selectedPlayer, setSelectedPlayer] = useState(searchParams.get('player') || '');
  const [selectedSessionTypes, setSelectedSessionTypes] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({});
  const [viewMode, setViewMode] = useState('table'); // 'table', 'chart', or 'profile'
  
  // UI states
  const [activeTab, setActiveTab] = useState(0);

  // Sort states
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Report states
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);

  // Player Profile states
  const [playerProfile, setPlayerProfile] = useState(null);
  const [playerTrends, setPlayerTrends] = useState(null);
  const [playerBenchmarks, setPlayerBenchmarks] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);

  // Auto-select and lock player for player role
  useEffect(() => {
    if (user && user.role === 'player') {
      setSelectedPlayer(user.id);
      setSearchParams({ player: user.id });
    }
  }, [user]);

  // Prevent player from changing player selector
  const isPlayerLocked = user && user.role === 'player';

  useEffect(() => {
    fetchPlayers();
  }, []);

  // Refresh players list periodically to catch new uploads
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPlayers();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPlayer) {
      fetchSessions(selectedPlayer);
    }
  }, [selectedPlayer]);

  useEffect(() => {
    if (selectedSessions.length > 0) {
      fetchSwingData();
    }
  }, [selectedSessions, filters]);

  // Update filtered swing data when swing data changes
  useEffect(() => {
    setFilteredSwingData(swingData);
  }, [swingData]);

  // New effect for player profile data
  useEffect(() => {
    if (selectedPlayer) {
      fetchPlayerProfile();
      fetchPlayerTrends();
      fetchPlayerBenchmarks();
      fetchSessionHistory();
    } else {
      setPlayerProfile(null);
      setPlayerTrends(null);
      setPlayerBenchmarks(null);
      setSessionHistory([]);
    }
  }, [selectedPlayer]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/players');
      // Ensure we always have an array
      const playersData = res.data.players || res.data || [];
      setPlayers(Array.isArray(playersData) ? playersData : []);
    } catch (err) {
      console.error('Error fetching players:', err);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async (playerId) => {
    try {
      const res = await api.get(`/players/${playerId}/sessions`);
      
      // Handle both old and new response formats
      let sessionsData = [];
      if (res.data.success && res.data.data) {
        // New format
        sessionsData = res.data.data;
      } else if (res.data.sessions) {
        // Old format
        sessionsData = res.data.sessions;
      } else if (Array.isArray(res.data)) {
        // Direct array format
        sessionsData = res.data;
      }
      
      console.log('[DEBUG] Analytics Sessions response:', res.data);
      console.log('[DEBUG] Analytics Processed sessions:', sessionsData);
      
      setSessions(sessionsData);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setSessions([]);
    }
  };

  const fetchSwingData = async () => {
    setDataLoading(true);
    try {
      // Fetch swing data for selected sessions
      const swingDataPromises = selectedSessions.map(sessionId => 
        api.get(`/sessions/${sessionId}/swings`)
      );
      const responses = await Promise.all(swingDataPromises);
      
      let allSwings = [];
      responses.forEach((res, index) => {
        // Debug log
        console.log(`[Analytics] Swings for session ${selectedSessions[index]}:`, res.data);
        // Accept both array and object with swings property
        const sessionSwings = Array.isArray(res.data)
          ? res.data
          : (res.data.swings || []);
        allSwings.push(...sessionSwings.map(swing => ({
          ...swing,
          sessionId: selectedSessions[index]
        })));
      });

      // Apply filters
      let filteredSwings = allSwings;
      Object.entries(filters).forEach(([metric, range]) => {
        if (range.min !== undefined || range.max !== undefined) {
          filteredSwings = filteredSwings.filter(swing => {
            const value = swing[metric];
            if (value === null || value === undefined) return false;
            const min = range.min !== undefined ? range.min : -Infinity;
            const max = range.max !== undefined ? range.max : Infinity;
            return value >= min && value <= max;
          });
        }
      });

      setSwingData(filteredSwings);
      if (filteredSwings.length === 0) {
        console.warn('[Analytics] No swings found for selected sessions:', selectedSessions);
      }
    } catch (err) {
      console.error('Error fetching swing data:', err);
      setSwingData([]);
    } finally {
      setDataLoading(false);
    }
  };

  // New fetch functions for player profile
  const fetchPlayerProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await api.get(`/players/${selectedPlayer}/analytics`);
      if (res.data.success && res.data.data) {
        setPlayerProfile(res.data.data);
      } else {
        console.warn('No player profile data received');
        setPlayerProfile(null);
      }
    } catch (err) {
      console.error('Error fetching player profile:', err);
      setPlayerProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchPlayerTrends = async () => {
    try {
      const res = await api.get(`/analytics/players/${selectedPlayer}/trends`);
      if (res.data.success && res.data.data) {
        // Ensure we have the correct data structure
        const trendsData = res.data.data;
        setPlayerTrends(trendsData);
      } else {
        console.warn('No player trends data received');
        setPlayerTrends(null);
      }
    } catch (err) {
      console.error('Error fetching player trends:', err);
      setPlayerTrends(null);
    }
  };

  const fetchPlayerBenchmarks = async () => {
    try {
      const res = await api.get(`/analytics/players/${selectedPlayer}/benchmarks`);
      if (res.data.success && res.data.data) {
        setPlayerBenchmarks(res.data.data);
      } else {
        console.warn('No player benchmarks data received');
        setPlayerBenchmarks(null);
      }
    } catch (err) {
      console.error('Error fetching player benchmarks:', err);
      setPlayerBenchmarks(null);
    }
  };

  const fetchSessionHistory = async () => {
    try {
      const res = await api.get(`/players/${selectedPlayer}/sessions`);
      const sessionsWithAnalytics = res.data.data || res.data.sessions || [];
      setSessionHistory(sessionsWithAnalytics);
    } catch (err) {
      console.error('Error fetching session history:', err);
      setSessionHistory([]);
    }
  };

  const handlePlayerChange = (playerId) => {
    setSelectedPlayer(playerId);
    setSelectedSessionTypes([]);
    setSelectedSessions([]);
    setSwingData([]);
    setFilters({});
    
    // Update URL
    if (playerId) {
      setSearchParams({ player: playerId });
    } else {
      setSearchParams({});
    }
  };

  const handleSessionTypeToggle = (sessionType) => {
    setSelectedSessionTypes(prev => 
      prev.includes(sessionType)
        ? prev.filter(type => type !== sessionType)
        : [...prev, sessionType]
    );
  };

  const handleSessionToggle = (sessionId) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleFilterChange = (metric, type, value) => {
    setFilters(prev => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [type]: value
      }
    }));
  };

  const getFilteredSessions = () => {
    console.log('[DEBUG] getFilteredSessions - sessions:', sessions);
    console.log('[DEBUG] getFilteredSessions - selectedSessionTypes:', selectedSessionTypes);
    
    if (selectedSessionTypes.length === 0) {
      console.log('[DEBUG] getFilteredSessions - returning all sessions:', sessions);
      return sessions;
    }
    
    const filtered = sessions.filter(session => 
      selectedSessionTypes.some(type => 
        session.session_type?.toLowerCase().includes(type.toLowerCase()) ||
        session.notes?.toLowerCase().includes(type.toLowerCase())
      )
    );
    
    console.log('[DEBUG] getFilteredSessions - filtered sessions:', filtered);
    return filtered;
  };

  const getSelectedPlayer = () => {
    return players.find(p => p.id.toString() === selectedPlayer);
  };

  // Helper functions for player profile
  const getPlayerDisplayName = () => {
    const player = getSelectedPlayer();
    return player ? `${player.name} - ${player.position}` : 'Unknown Player';
  };

  const getPlayerAvatar = () => {
    const player = getSelectedPlayer();
    return player ? player.name.charAt(0).toUpperCase() : '?';
  };

  const calculateDaysActive = () => {
    if (!sessionHistory || !Array.isArray(sessionHistory) || sessionHistory.length === 0) return 0;
    const firstSession = new Date(Math.min(...sessionHistory.map(s => new Date(s.session_date || s.created_at))));
    const lastSession = new Date(Math.max(...sessionHistory.map(s => new Date(s.session_date || s.created_at))));
    return Math.ceil((lastSession - firstSession) / (1000 * 60 * 60 * 24));
  };

  const getHardHitPercentage = () => {
    if (!playerProfile || !swingData || !Array.isArray(swingData) || !swingData.length) return 0;
    const hardHits = swingData.filter(swing => 
      swing && swing.exit_velocity && parseFloat(swing.exit_velocity) >= 95
    ).length;
    return safeToFixed(((hardHits / swingData.length) * 100), 1);
  };

  const getEVPercentile = () => {
    if (!playerBenchmarks || !playerProfile) return 50;
    const avgEV = parseFloat(playerProfile.average_exit_velocity);
    const benchmarkEV = parseFloat(playerBenchmarks.benchmark?.avg_exit_velocity || 75);
    return safeToFixed(Math.min(100, Math.max(0, (avgEV / benchmarkEV) * 100)), 1);
  };

  const generateTrendChartData = () => {
    if (!playerTrends?.trends || !Array.isArray(playerTrends.trends)) return [];
    return playerTrends.trends
      .filter(trend => trend && trend.count > 0)
      .map(trend => ({
        date: new Date(trend.session_date).toLocaleDateString(),
        avgEV: parseFloat(trend.average),
        bestEV: parseFloat(trend.best),
        sessionType: trend.session_category || 'Session'
      }));
  };

  const generateLaunchAngleDistribution = () => {
    if (!swingData || !Array.isArray(swingData) || !swingData.length) return [];
    const angleRanges = [
      { range: '0-10°', min: 0, max: 10, color: '#ff6b6b' },
      { range: '10-20°', min: 10, max: 20, color: '#4ecdc4' },
      { range: '20-30°', min: 20, max: 30, color: '#45b7d1' },
      { range: '30-40°', min: 30, max: 40, color: '#96ceb4' },
      { range: '40+°', min: 40, max: 90, color: '#feca57' }
    ];

    return angleRanges.map(range => {
      const count = swingData.filter(swing => {
        const angle = parseFloat(swing.launch_angle);
        return !isNaN(angle) && angle >= range.min && angle < range.max;
      }).length;
      return {
        name: range.range,
        value: count,
        color: range.color
      };
    }).filter(item => item.value > 0);
  };

  const generateSessionComparisonData = () => {
    if (!sessionHistory || !Array.isArray(sessionHistory) || !sessionHistory.length) return [];
    return sessionHistory.slice(-5).map(session => ({
      session: `Session ${session.id}`,
      avgEV: parseFloat(session.analytics?.average_exit_velocity || 0),
      swings: session.analytics?.total_swings || 0,
      date: new Date(session.session_date || session.created_at).toLocaleDateString()
    }));
  };

  // Sort functions
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />;
  };

  const handleViewReport = async () => {
    if (selectedSessions.length === 0) {
      setReportError('Please select at least one session to generate a report.');
      return;
    }

    setReportLoading(true);
    setReportError('');

    try {
      const response = await api.post('/sessions/multi-report', {
        sessionIds: selectedSessions
      });

      if (response.data.success) {
        const reportData = response.data.data;
        console.log('Generated multi-session report:', reportData);
        
        setCurrentReport(reportData);
        setReportModalOpen(true);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setReportError(error.response?.data?.error || 'Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (selectedSessions.length === 0) {
      setReportError('Please select at least one session to download a report.');
      return;
    }

    setReportLoading(true);
    setReportError('');

    try {
      const response = await api.post('/sessions/multi-report/download', {
        sessionIds: selectedSessions
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `multi_session_report_${selectedSessions.join('_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      setReportError('Failed to download report');
    } finally {
      setReportLoading(false);
    }
  };

  const sortedSwingData = useMemo(() => {
    if (!sortConfig.key) return filteredSwingData;

    return [...filteredSwingData].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredSwingData, sortConfig]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      {/* Header */}
      <Paper sx={{ 
        p: 4, 
        mb: 4, 
        background: '#fff', 
        color: '#1c2c4d', 
        boxShadow: '0 8px 32px rgba(28,44,77,0.12)', 
        border: '1.5px solid #e0e3e8',
        borderRadius: 4
      }}>
        <Box display="flex" alignItems="center" mb={2}>
          <AnalyticsIcon sx={{ fontSize: 40, mr: 2, color: '#1c2c4d' }} />
          <Typography variant="h4" fontWeight="bold" color="#1c2c4d">
            Advanced Analytics Hub
          </Typography>
        </Box>
        <Typography variant="body1" color="#1c2c4d" sx={{ opacity: 0.8 }}>
          Select a player, filter sessions, and analyze individual swing data with advanced filtering capabilities.
        </Typography>
      </Paper>

      {/* Player Selection */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        bgcolor: '#fff', 
        border: '1.5px solid #e0e3e8',
        borderRadius: 4,
        boxShadow: '0 4px 16px rgba(28,44,77,0.08)'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold" color="#1c2c4d">
            Player Selection
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchPlayers}
            disabled={loading}
            sx={{
              borderColor: '#1c2c4d',
              color: '#1c2c4d',
              '&:hover': {
                borderColor: '#3a7bd5',
                bgcolor: 'rgba(28,44,77,0.04)',
              }
            }}
          >
            Refresh Players
          </Button>
        </Box>
        <FormControl fullWidth>
          <InputLabel sx={{ color: '#1c2c4d' }}>Select Player</InputLabel>
          <Select
            value={selectedPlayer}
            onChange={(e) => handlePlayerChange(e.target.value)}
            label="Select Player"
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#e0e3e8',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3a7bd5',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3a7bd5',
              },
              '& .MuiSelect-select': {
                color: '#1c2c4d',
              },
            }}
            disabled={isPlayerLocked}
          >
            <MenuItem value="">All Players</MenuItem>
            {(players || []).map(player => (
              <MenuItem key={player.id} value={player.id}>
                {player.name} - {player.position}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedPlayer && (
        <>
          {/* Session Type Filtering */}
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: '#fff', 
            border: '1.5px solid #e0e3e8',
            borderRadius: 4,
            boxShadow: '0 4px 16px rgba(28,44,77,0.08)'
          }}>
            <Typography variant="h6" fontWeight="bold" mb={2} color="#1c2c4d">
              Session Type Filter
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {(SESSION_TYPES || []).map(type => (
                <Chip
                  key={type}
                  label={type}
                  onClick={() => handleSessionTypeToggle(type)}
                  color={selectedSessionTypes.includes(type) ? 'primary' : 'default'}
                  variant={selectedSessionTypes.includes(type) ? 'filled' : 'outlined'}
                  sx={{ 
                    fontWeight: 600,
                    '&.MuiChip-filled': {
                      bgcolor: '#1c2c4d',
                      color: '#fff',
                    },
                    '&.MuiChip-outlined': {
                      borderColor: '#1c2c4d',
                      color: '#1c2c4d',
                    }
                  }}
                />
              ))}
            </Box>
          </Paper>

          {/* Session Selection */}
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: '#fff', 
            border: '1.5px solid #e0e3e8',
            borderRadius: 4,
            boxShadow: '0 4px 16px rgba(28,44,77,0.08)'
          }}>
            <Typography variant="h6" fontWeight="bold" mb={2} color="#1c2c4d">
              Session Selection ({sessions.length} total sessions)
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress sx={{ color: '#1c2c4d' }} />
              </Box>
            ) : getFilteredSessions().length === 0 ? (
              <Box display="flex" justifyContent="center" p={4}>
                <Typography variant="body1" color="#1c2c4d" sx={{ opacity: 0.7 }}>
                  {sessions.length === 0 ? 'No sessions found for this player.' : 'No sessions match the current filters.'}
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {(getFilteredSessions() || []).map((session, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={session.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: selectedSessions.includes(session.id) ? '2px solid #3a7bd5' : '1px solid #e0e3e8',
                        bgcolor: selectedSessions.includes(session.id) ? '#f0f8ff' : '#fff',
                        borderRadius: 3,
                        boxShadow: selectedSessions.includes(session.id) ? '0 4px 12px rgba(58,123,213,0.15)' : '0 2px 8px rgba(28,44,77,0.08)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 16px rgba(28,44,77,0.12)',
                          transform: 'translateY(-1px)',
                        }
                      }}
                      onClick={() => handleSessionToggle(session.id)}
                    >
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold" color="#1c2c4d">
                          Session #{idx + 1}
                        </Typography>
                        <Typography variant="body2" color="#1c2c4d" sx={{ opacity: 0.85, fontWeight: 600 }}>
                          {session.session_type || 'Session'}
                        </Typography>
                        <Typography variant="body2" color="#1c2c4d" sx={{ opacity: 0.7 }}>
                          {new Date(session.created_at).toLocaleDateString()}
                        </Typography>
                        {/* Robust swing count extraction */}
                        {(() => {
                          const swingCount =
                            session.total_swings ??
                            session.swing_count ??
                            (Array.isArray(session.exitVelocityData) ? session.exitVelocityData.length : undefined) ??
                            0;
                          return (
                            <Typography variant="body2" color="#1c2c4d" sx={{ opacity: 0.7 }}>
                              {swingCount} swings
                            </Typography>
                          );
                        })()}
                        {session.session_tags && (
                          <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                            {(session.session_tags || '').split(',').map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag.trim()}
                                size="small"
                                sx={{
                                  bgcolor: '#e3f2fd',
                                  color: '#1c2c4d',
                                  fontSize: '0.75rem',
                                  height: 20
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>

          {/* Advanced Filtering */}
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: '#fff', 
            border: '1.5px solid #e0e3e8',
            borderRadius: 4,
            boxShadow: '0 4px 16px rgba(28,44,77,0.08)'
          }}>
            <Accordion defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' }, bgcolor: '#fff', borderRadius: 3 }}>
              <AccordionSummary 
                expandIcon={<ExpandMore sx={{ color: '#1c2c4d' }} />}
                sx={{ 
                  '& .MuiAccordionSummary-content': { margin: 0 },
                  bgcolor: '#fff',
                  borderRadius: 3
                }}
              >
                <Box display="flex" alignItems="center">
                  <FilterList sx={{ mr: 1, color: '#1c2c4d' }} />
                  <Typography variant="h6" fontWeight="bold" color="#1c2c4d">
                    Advanced Filtering
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2, bgcolor: '#fff', borderRadius: 3 }}>
                <Tabs 
                  value={activeTab} 
                  onChange={(_, v) => setActiveTab(v)} 
                  sx={{ 
                    mb: 3,
                    '& .MuiTab-root': {
                      color: '#1c2c4d',
                      fontWeight: 600,
                      '&.Mui-selected': {
                        color: '#3a7bd5',
                      }
                    },
                    '& .MuiTabs-indicator': {
                      bgcolor: '#3a7bd5',
                    },
                    bgcolor: '#fff',
                    borderRadius: 2
                  }}
                >
                  <Tab label="Hittrax Metrics" />
                  <Tab label="Blast Metrics" />
                </Tabs>
                <Grid container spacing={3}>
                  {((activeTab === 0 ? FILTERABLE_METRICS.hittrax : FILTERABLE_METRICS.blast) || []).map(metric => (
                    <Grid item xs={12} sm={6} md={4} key={metric.key}>
                      <Card sx={{ 
                        p: 2, 
                        border: '1.5px solid #e0e3e8',
                        borderRadius: 3,
                        boxShadow: '0 2px 8px rgba(28,44,77,0.06)',
                        bgcolor: '#fff',
                        color: '#1c2c4d'
                      }}>
                        <Typography variant="subtitle1" fontWeight="bold" mb={2} color="#1c2c4d">
                          {metric.label}
                        </Typography>
                        <Box sx={{ px: 2 }}>
                          <Slider
                            value={[
                              filters[metric.key]?.min ?? metric.min,
                              filters[metric.key]?.max ?? metric.max
                            ]}
                            onChange={(_, value) => {
                              handleFilterChange(metric.key, 'min', value[0]);
                              handleFilterChange(metric.key, 'max', value[1]);
                            }}
                            valueLabelDisplay="auto"
                            min={metric.min}
                            max={metric.max}
                            sx={{ 
                              color: '#3a7bd5',
                              '& .MuiSlider-thumb': {
                                bgcolor: '#1c2c4d',
                              },
                              '& .MuiSlider-track': {
                                bgcolor: '#3a7bd5',
                              }
                            }}
                          />
                        </Box>
                        <Box display="flex" gap={1} mt={1}>
                          <TextField
                            size="small"
                            label="Min"
                            type="number"
                            value={filters[metric.key]?.min ?? ''}
                            onChange={(e) => handleFilterChange(metric.key, 'min', parseFloat(e.target.value) || undefined)}
                            sx={{ 
                              width: '50%',
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
                          <TextField
                            size="small"
                            label="Max"
                            type="number"
                            value={filters[metric.key]?.max ?? ''}
                            onChange={(e) => handleFilterChange(metric.key, 'max', parseFloat(e.target.value) || undefined)}
                            sx={{ 
                              width: '50%',
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
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Paper>

          {/* Data Display */}
          {(selectedSessions.length > 0 || viewMode === 'profile') && (
            <Paper sx={{ 
              p: 3, 
              bgcolor: '#fff', 
              border: '1.5px solid #e0e3e8',
              borderRadius: 4,
              boxShadow: '0 4px 16px rgba(28,44,77,0.08)'
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold" color="#1c2c4d">
                  {viewMode === 'table' ? 'Swing Data Table' : 
                   viewMode === 'chart' ? 'Spray Chart Visualization' : 
                   'Player Profile'}
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant={viewMode === 'table' ? 'contained' : 'outlined'}
                    startIcon={<TableChart />}
                    onClick={() => setViewMode('table')}
                    sx={{ 
                      bgcolor: viewMode === 'table' ? '#1c2c4d' : 'transparent',
                      color: viewMode === 'table' ? '#fff' : '#1c2c4d',
                      borderColor: '#1c2c4d',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: viewMode === 'table' ? '#3a7bd5' : 'rgba(28,44,77,0.08)',
                      }
                    }}
                  >
                    Table View
                  </Button>
                  <Button
                    variant={viewMode === 'chart' ? 'contained' : 'outlined'}
                    startIcon={<ShowChart />}
                    onClick={() => setViewMode('chart')}
                    sx={{ 
                      bgcolor: viewMode === 'chart' ? '#1c2c4d' : 'transparent',
                      color: viewMode === 'chart' ? '#fff' : '#1c2c4d',
                      borderColor: '#1c2c4d',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: viewMode === 'chart' ? '#3a7bd5' : 'rgba(28,44,77,0.08)',
                      }
                    }}
                  >
                    Spray Chart
                  </Button>
                  {selectedPlayer && (
                    <Button
                      variant={viewMode === 'profile' ? 'contained' : 'outlined'}
                      startIcon={<Person />}
                      onClick={() => setViewMode('profile')}
                      sx={{ 
                        bgcolor: viewMode === 'profile' ? '#1c2c4d' : 'transparent',
                        color: viewMode === 'profile' ? '#fff' : '#1c2c4d',
                        borderColor: '#1c2c4d',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: viewMode === 'profile' ? '#3a7bd5' : 'rgba(28,44,77,0.08)',
                        }
                      }}
                    >
                      Player Profile
                    </Button>
                  )}
                  {selectedSessions.length > 0 && (
                    <Button
                      variant="contained"
                      startIcon={reportLoading ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
                      onClick={handleViewReport}
                      disabled={reportLoading}
                      sx={{ 
                        bgcolor: '#e74c3c',
                        color: '#fff',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: '#c0392b',
                        },
                        '&:disabled': {
                          bgcolor: '#bdc3c7',
                          color: '#7f8c8d'
                        }
                      }}
                    >
                      {reportLoading ? 'Generating...' : 'View Report'}
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Report Error Alert */}
              {reportError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setReportError('')}>
                  {reportError}
                </Alert>
              )}

              {/* Barrels Filter */}
              {swingData.length > 0 && viewMode !== 'profile' && (
                <BarrelsFilter
                  swingData={swingData}
                  onFilteredDataChange={setFilteredSwingData}
                  showStats={true}
                />
              )}

              {dataLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress sx={{ color: '#1c2c4d' }} />
                </Box>
              ) : viewMode === 'table' ? (
                <TableContainer sx={{ 
                  border: '1px solid #e0e3e8', 
                  borderRadius: 3,
                  boxShadow: '0 2px 8px rgba(28,44,77,0.06)'
                }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ 
                          color: '#1c2c4d', 
                          fontWeight: 'bold', 
                          borderBottom: '2px solid #3a7bd5',
                          bgcolor: '#f8f9fa'
                        }}>Session</TableCell>
                        <Tooltip title="Click to sort">
                          <TableCell 
                            sx={{ 
                              color: '#1c2c4d', 
                              fontWeight: 'bold', 
                              borderBottom: '2px solid #3a7bd5',
                              bgcolor: sortConfig.key === 'exit_velocity' ? '#e3f2fd' : '#f8f9fa',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#e3f2fd' },
                              transition: 'background-color 0.2s'
                            }}
                            onClick={() => handleSort('exit_velocity')}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              Exit Velocity
                              {getSortIcon('exit_velocity')}
                            </Box>
                          </TableCell>
                        </Tooltip>
                        <Tooltip title="Click to sort">
                          <TableCell 
                            sx={{ 
                              color: '#1c2c4d', 
                              fontWeight: 'bold', 
                              borderBottom: '2px solid #3a7bd5',
                              bgcolor: sortConfig.key === 'launch_angle' ? '#e3f2fd' : '#f8f9fa',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#e3f2fd' },
                              transition: 'background-color 0.2s'
                            }}
                            onClick={() => handleSort('launch_angle')}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              Launch Angle
                              {getSortIcon('launch_angle')}
                            </Box>
                          </TableCell>
                        </Tooltip>
                        <Tooltip title="Click to sort">
                          <TableCell 
                            sx={{ 
                              color: '#1c2c4d', 
                              fontWeight: 'bold', 
                              borderBottom: '2px solid #3a7bd5',
                              bgcolor: sortConfig.key === 'distance' ? '#e3f2fd' : '#f8f9fa',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#e3f2fd' },
                              transition: 'background-color 0.2s'
                            }}
                            onClick={() => handleSort('distance')}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              Distance
                              {getSortIcon('distance')}
                            </Box>
                          </TableCell>
                        </Tooltip>
                        <Tooltip title="Click to sort">
                          <TableCell 
                            sx={{ 
                              color: '#1c2c4d', 
                              fontWeight: 'bold', 
                              borderBottom: '2px solid #3a7bd5',
                              bgcolor: sortConfig.key === 'pitch_speed' ? '#e3f2fd' : '#f8f9fa',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#e3f2fd' },
                              transition: 'background-color 0.2s'
                            }}
                            onClick={() => handleSort('pitch_speed')}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              Pitch Speed
                              {getSortIcon('pitch_speed')}
                            </Box>
                          </TableCell>
                        </Tooltip>
                        <Tooltip title="Click to sort">
                          <TableCell 
                            sx={{ 
                              color: '#1c2c4d', 
                              fontWeight: 'bold', 
                              borderBottom: '2px solid #3a7bd5',
                              bgcolor: sortConfig.key === 'strike_zone' ? '#e3f2fd' : '#f8f9fa',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#e3f2fd' },
                              transition: 'background-color 0.2s'
                            }}
                            onClick={() => handleSort('strike_zone')}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              Strike Zone
                              {getSortIcon('strike_zone')}
                            </Box>
                          </TableCell>
                        </Tooltip>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedSwingData.map((swing, index) => (
                        <TableRow key={index} sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
                          <TableCell sx={{ color: '#1c2c4d' }}>{swing.sessionId}</TableCell>
                          <TableCell sx={{ color: '#1c2c4d' }}>{safeToFixed(swing.exit_velocity, 1)} MPH</TableCell>
                          <TableCell sx={{ color: '#1c2c4d' }}>{safeToFixed(swing.launch_angle, 1)}°</TableCell>
                          <TableCell sx={{ color: '#1c2c4d' }}>{safeToFixed(swing.distance, 0)} FT</TableCell>
                          <TableCell sx={{ color: '#1c2c4d' }}>{safeToFixed(swing.pitch_speed, 1)} MPH</TableCell>
                          <TableCell sx={{ color: '#1c2c4d' }}>{swing.strike_zone}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : viewMode === 'chart' ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                  {filteredSwingData.length > 0 ? (
                    <SprayChart3D
                      swings={filteredSwingData}
                      width={800}
                      height={500}
                    />
                  ) : (
                    <Alert severity="info" sx={{ 
                      bgcolor: '#e3f2fd', 
                      color: '#1c2c4d',
                      border: '1px solid #3a7bd5',
                      borderRadius: 3
                    }}>
                      No swing data available for visualization.
                    </Alert>
                  )}
                </Box>
              ) : viewMode === 'profile' ? (
                <PlayerProfileView 
                  playerProfile={playerProfile}
                  playerTrends={playerTrends}
                  playerBenchmarks={playerBenchmarks}
                  sessionHistory={sessionHistory}
                  swingData={swingData}
                  profileLoading={profileLoading}
                  getPlayerDisplayName={getPlayerDisplayName}
                  getPlayerAvatar={getPlayerAvatar}
                  calculateDaysActive={calculateDaysActive}
                  getHardHitPercentage={getHardHitPercentage}
                  getEVPercentile={getEVPercentile}
                  generateTrendChartData={generateTrendChartData}
                  generateLaunchAngleDistribution={generateLaunchAngleDistribution}
                  generateSessionComparisonData={generateSessionComparisonData}
                  handleSessionToggle={handleSessionToggle}
                  selectedSessions={selectedSessions}
                />
              ) : null}
            </Paper>
          )}
        </>
      )}

      {!selectedPlayer && (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          bgcolor: '#fff', 
          border: '1.5px solid #e0e3e8',
          borderRadius: 4,
          boxShadow: '0 4px 16px rgba(28,44,77,0.08)'
        }}>
          <AnalyticsIcon sx={{ fontSize: 60, color: '#1c2c4d', mb: 2 }} />
          <Typography variant="h6" color="#1c2c4d" mb={2}>
            Select a player to begin analytics
          </Typography>
          <Typography variant="body1" color="#1c2c4d" sx={{ opacity: 0.7 }}>
            Choose a player from the dropdown above to view their sessions and analyze swing data.
          </Typography>
        </Paper>
      )}

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
                Multi-Session Report - {currentReport.player?.name} - {currentReport.sessionCount} Sessions
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleDownloadReport}
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
                  Download PDF
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
    </Container>
  );
};

// Player Profile View Component
const PlayerProfileView = ({
  playerProfile,
  playerTrends,
  playerBenchmarks,
  sessionHistory,
  swingData,
  profileLoading,
  getPlayerDisplayName,
  getPlayerAvatar,
  calculateDaysActive,
  getHardHitPercentage,
  getEVPercentile,
  generateTrendChartData,
  generateLaunchAngleDistribution,
  generateSessionComparisonData,
  handleSessionToggle,
  selectedSessions
}) => {
  if (profileLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress sx={{ color: '#1c2c4d' }} />
      </Box>
    );
  }

  if (!playerProfile) {
    return (
      <Alert severity="info" sx={{ 
        bgcolor: '#e3f2fd', 
        color: '#1c2c4d',
        border: '1px solid #3a7bd5',
        borderRadius: 3
      }}>
        No player profile data available.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Player Header */}
      <Box display="flex" alignItems="center" mb={3} p={2} sx={{ 
        bgcolor: '#f8f9fa', 
        borderRadius: 3,
        border: '1px solid #e0e3e8'
      }}>
        <Avatar sx={{ 
          width: 60, 
          height: 60, 
          bgcolor: '#1c2c4d', 
          fontSize: '1.5rem',
          mr: 2
        }}>
          {getPlayerAvatar()}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="#1c2c4d">
            {getPlayerDisplayName()}
          </Typography>
          <Typography variant="body2" color="#1c2c4d" sx={{ opacity: 0.7 }}>
            {playerProfile.sessions_count} sessions • {playerProfile.total_swings} total swings
          </Typography>
        </Box>
      </Box>

      {/* Statistical Overview Cards */}
      <Grid container spacing={3} mb={4}>
        {/* Career Stats Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            p: 3, 
            border: '1.5px solid #e0e3e8',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(28,44,77,0.06)',
            bgcolor: '#fff'
          }}>
            <Box display="flex" alignItems="center" mb={2}>
              <EmojiEvents sx={{ color: '#1c2c4d', mr: 1 }} />
              <Typography variant="h6" fontWeight="bold" color="#1c2c4d">
                Career Stats
              </Typography>
            </Box>
            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="#1c2c4d">Total Sessions:</Typography>
                <Typography variant="body2" fontWeight="bold" color="#1c2c4d">
                  {playerProfile.sessions_count || 0}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="#1c2c4d">Total Swings:</Typography>
                <Typography variant="body2" fontWeight="bold" color="#1c2c4d">
                  {playerProfile.total_swings || 0}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="#1c2c4d">Avg Launch Angle:</Typography>
                <Typography variant="body2" fontWeight="bold" color="#1c2c4d">
                  {playerProfile.average_launch_angle || 0}°
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Performance Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            p: 3, 
            border: '1.5px solid #e0e3e8',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(28,44,77,0.06)',
            bgcolor: '#fff'
          }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Speed sx={{ color: '#1c2c4d', mr: 1 }} />
              <Typography variant="h6" fontWeight="bold" color="#1c2c4d">
                Performance
              </Typography>
            </Box>
            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="#1c2c4d">Avg Exit Velocity:</Typography>
                <Typography variant="body2" fontWeight="bold" color="#1c2c4d">
                  {playerProfile.average_exit_velocity || 0} MPH
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="#1c2c4d">Max Exit Velocity:</Typography>
                <Typography variant="body2" fontWeight="bold" color="#1c2c4d">
                  {playerProfile.best_exit_velocity || 0} MPH
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="#1c2c4d">Hard Hit %:</Typography>
                <Typography variant="body2" fontWeight="bold" color="#1c2c4d">
                  {getHardHitPercentage()}%
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Activity Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            p: 3, 
            border: '1.5px solid #e0e3e8',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(28,44,77,0.06)',
            bgcolor: '#fff'
          }}>
            <Box display="flex" alignItems="center" mb={2}>
              <CalendarToday sx={{ color: '#1c2c4d', mr: 1 }} />
              <Typography variant="h6" fontWeight="bold" color="#1c2c4d">
                Activity
              </Typography>
            </Box>
            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="#1c2c4d">First Session:</Typography>
                <Typography variant="body2" fontWeight="bold" color="#1c2c4d">
                  {sessionHistory.length > 0 ? 
                    new Date(sessionHistory[sessionHistory.length - 1]?.session_date || sessionHistory[sessionHistory.length - 1]?.created_at).toLocaleDateString() : 
                    'N/A'
                  }
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="#1c2c4d">Last Session:</Typography>
                <Typography variant="body2" fontWeight="bold" color="#1c2c4d">
                  {sessionHistory.length > 0 ? 
                    new Date(sessionHistory[0]?.session_date || sessionHistory[0]?.created_at).toLocaleDateString() : 
                    'N/A'
                  }
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="#1c2c4d">Days Active:</Typography>
                <Typography variant="body2" fontWeight="bold" color="#1c2c4d">
                  {calculateDaysActive()}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Advanced Metrics and Visualizations */}
      <Grid container spacing={3} mb={4}>
        {/* EV Trend Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            p: 3, 
            border: '1.5px solid #e0e3e8',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(28,44,77,0.06)',
            bgcolor: '#fff'
          }}>
            <Box display="flex" alignItems="center" mb={2}>
              <TrendingUp sx={{ color: '#1c2c4d', mr: 1 }} />
              <Typography variant="h6" fontWeight="bold" color="#1c2c4d">
                Exit Velocity Trend
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={generateTrendChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e8" />
                <XAxis dataKey="date" stroke="#1c2c4d" fontSize={12} />
                <YAxis stroke="#1c2c4d" fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ 
                    bgcolor: '#fff', 
                    border: '1px solid #e0e3e8',
                    borderRadius: 8
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgEV" 
                  stroke="#3a7bd5" 
                  strokeWidth={2}
                  dot={{ fill: '#3a7bd5', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Launch Angle Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            p: 3, 
            border: '1.5px solid #e0e3e8',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(28,44,77,0.06)',
            bgcolor: '#fff'
          }}>
            <Box display="flex" alignItems="center" mb={2}>
              <PieChart sx={{ color: '#1c2c4d', mr: 1 }} />
              <Typography variant="h6" fontWeight="bold" color="#1c2c4d">
                Launch Angle Distribution
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPieChart>
                <RechartsPie
                  data={generateLaunchAngleDistribution()}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${safeToFixed((percent * 100), 0)}%`}
                >
                  {generateLaunchAngleDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RechartsPie>
                <RechartsTooltip 
                  contentStyle={{ 
                    bgcolor: '#fff', 
                    border: '1px solid #e0e3e8',
                    borderRadius: 8
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Session Comparison */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Card sx={{ 
            p: 3, 
            border: '1.5px solid #e0e3e8',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(28,44,77,0.06)',
            bgcolor: '#fff'
          }}>
            <Box display="flex" alignItems="center" mb={2}>
              <BarChartIcon sx={{ color: '#1c2c4d', mr: 1 }} />
              <Typography variant="h6" fontWeight="bold" color="#1c2c4d">
                Recent Session Comparison
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={generateSessionComparisonData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e8" />
                <XAxis dataKey="session" stroke="#1c2c4d" fontSize={12} />
                <YAxis stroke="#1c2c4d" fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ 
                    bgcolor: '#fff', 
                    border: '1px solid #e0e3e8',
                    borderRadius: 8
                  }}
                />
                <Bar dataKey="avgEV" fill="#3a7bd5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Session Summary Table */}
      <Card sx={{ 
        p: 3, 
        border: '1.5px solid #e0e3e8',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(28,44,77,0.06)',
        bgcolor: '#fff'
      }}>
        <Box display="flex" alignItems="center" mb={2}>
          <TableChart sx={{ color: '#1c2c4d', mr: 1 }} />
          <Typography variant="h6" fontWeight="bold" color="#1c2c4d">
            Session Summary
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  color: '#1c2c4d', 
                  fontWeight: 'bold', 
                  borderBottom: '2px solid #3a7bd5',
                  bgcolor: '#f8f9fa'
                }}>Date</TableCell>
                <TableCell sx={{ 
                  color: '#1c2c4d', 
                  fontWeight: 'bold', 
                  borderBottom: '2px solid #3a7bd5',
                  bgcolor: '#f8f9fa'
                }}>Session Type</TableCell>
                <TableCell sx={{ 
                  color: '#1c2c4d', 
                  fontWeight: 'bold', 
                  borderBottom: '2px solid #3a7bd5',
                  bgcolor: '#f8f9fa'
                }}>Swings</TableCell>
                <TableCell sx={{ 
                  color: '#1c2c4d', 
                  fontWeight: 'bold', 
                  borderBottom: '2px solid #3a7bd5',
                  bgcolor: '#f8f9fa'
                }}>Avg EV</TableCell>
                <TableCell sx={{ 
                  color: '#1c2c4d', 
                  fontWeight: 'bold', 
                  borderBottom: '2px solid #3a7bd5',
                  bgcolor: '#f8f9fa'
                }}>Max EV</TableCell>
                <TableCell sx={{ 
                  color: '#1c2c4d', 
                  fontWeight: 'bold', 
                  borderBottom: '2px solid #3a7bd5',
                  bgcolor: '#f8f9fa'
                }}>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessionHistory.map((session) => (
                <TableRow 
                  key={session.id} 
                  sx={{ 
                    '&:hover': { bgcolor: '#f8f9fa' },
                    cursor: 'pointer',
                    bgcolor: selectedSessions.includes(session.id) ? '#e3f2fd' : 'transparent'
                  }}
                  onClick={() => handleSessionToggle(session.id)}
                >
                  <TableCell sx={{ color: '#1c2c4d' }}>
                    {new Date(session.session_date || session.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ color: '#1c2c4d' }}>
                    {session.session_type || 'Session'}
                  </TableCell>
                  <TableCell sx={{ color: '#1c2c4d' }}>
                    {session.analytics?.total_swings || 0}
                  </TableCell>
                  <TableCell sx={{ color: '#1c2c4d' }}>
                    {session.analytics?.average_exit_velocity || 0} MPH
                  </TableCell>
                  <TableCell sx={{ color: '#1c2c4d' }}>
                    {session.analytics?.best_exit_velocity || 0} MPH
                  </TableCell>
                  <TableCell sx={{ color: '#1c2c4d' }}>
                    {session.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default AnalyticsHome; 