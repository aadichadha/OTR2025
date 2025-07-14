import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assessment,
  FilterList,
  Clear,
  Refresh,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import api from '../services/api';

const NAVY = '#1c2c4d';

const PlayerStatistics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState([]);
  const [sessionTags, setSessionTags] = useState([]);
  const [playerLevels, setPlayerLevels] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    playerLevel: '',
    sessionTags: [],
    pitchSpeedRange: [0, 100],
    timeRange: 'all'
  });

  // Selected filters
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('');

  useEffect(() => {
    if (user && user.role === 'player') {
      fetchStats();
    }
  }, [user, filters]);

  const fetchStats = async () => {
    setDataLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters.playerLevel) {
        params.append('playerLevel', filters.playerLevel);
      }
      if (filters.sessionTags.length > 0) {
        params.append('sessionTags', filters.sessionTags.join(','));
      }
      if (filters.pitchSpeedRange[0] > 0 || filters.pitchSpeedRange[1] < 100) {
        params.append('minPitchSpeed', filters.pitchSpeedRange[0]);
        params.append('maxPitchSpeed', filters.pitchSpeedRange[1]);
      }
      params.append('timeRange', filters.timeRange);
      params.append('playerId', user.id); // Only get current player's stats

      const response = await api.get(`/analytics/player-stats?${params}`);
      
      if (response.data.success) {
        setStats(response.data.data || []);
        setSessionTags(response.data.sessionTags || []);
        setPlayerLevels(response.data.playerLevels || []);
      }
    } catch (error) {
      console.error('Error fetching player statistics:', error);
    } finally {
      setDataLoading(false);
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      playerLevel: '',
      sessionTags: [],
      pitchSpeedRange: [0, 100],
      timeRange: 'all'
    });
    setSelectedTags([]);
    setSelectedLevel('');
  };

  const handleTagToggle = (tag) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    setFilters(prev => ({ ...prev, sessionTags: newTags }));
  };

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
    setFilters(prev => ({ ...prev, playerLevel: level }));
  };

  const handlePitchSpeedChange = (index, value) => {
    const newRange = [...filters.pitchSpeedRange];
    newRange[index] = value;
    setFilters(prev => ({ ...prev, pitchSpeedRange: newRange }));
  };

  const roundNumber = (num) => {
    if (num === null || num === undefined || num === 'N/A') return 'N/A';
    return Math.round(parseFloat(num) * 10) / 10;
  };

  const getGradeColor = (value, metric) => {
    if (value === null || value === undefined || value === 'N/A') return 'default';
    
    const numValue = parseFloat(value);
    
    switch (metric) {
      case 'avg_exit_velocity':
        if (numValue >= 95) return 'success';
        if (numValue >= 85) return 'warning';
        return 'error';
      case 'max_exit_velocity':
        if (numValue >= 105) return 'success';
        if (numValue >= 95) return 'warning';
        return 'error';
      case 'barrel_percentage':
        if (numValue >= 25) return 'success';
        if (numValue >= 15) return 'warning';
        return 'error';
      case 'avg_launch_angle':
        if (numValue >= 8 && numValue <= 32) return 'success';
        if (numValue >= 5 && numValue <= 35) return 'warning';
        return 'error';
      default:
        return 'default';
    }
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
              Your Statistics
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
              View your performance statistics and track your progress over time.
            </Typography>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ bgcolor: NAVY, '&:hover': { bgcolor: '#3a7bd5' } }}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchStats}
                disabled={dataLoading}
                sx={{ borderColor: NAVY, color: NAVY, '&:hover': { borderColor: '#3a7bd5', color: '#3a7bd5' } }}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {/* Enhanced Filters */}
          {showFilters && (
            <Paper sx={{ p: { xs: 2, sm: 4 }, mb: 5, bgcolor: '#fff', border: '2px solid #1c2c4d', borderRadius: 4, boxShadow: '0 4px 24px rgba(28,44,77,0.10)' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight={900} color="#1c2c4d" sx={{ fontFamily: 'Inter, Roboto, Arial, sans-serif', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                  Advanced Filters
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={handleClearFilters}
                  sx={{ borderColor: '#d32f2f', color: '#d32f2f', fontWeight: 700, '&:hover': { borderColor: '#b71c1c', color: '#b71c1c' } }}
                >
                  Clear All
                </Button>
              </Box>

              <Grid container spacing={3}>
                {/* Date Range */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" fontWeight={700} color="#1c2c4d" sx={{ mb: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
                    Date Range
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Start Date"
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="End Date"
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Player Level */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" fontWeight={700} color="#1c2c4d" sx={{ mb: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
                    Player Level
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Level</InputLabel>
                    <Select
                      value={selectedLevel}
                      onChange={(e) => handleLevelChange(e.target.value)}
                      label="Select Level"
                    >
                      <MenuItem value="">All Levels</MenuItem>
                      {playerLevels.map((level) => (
                        <MenuItem key={level} value={level}>{level}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Pitch Speed Range */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" fontWeight={700} color="#1c2c4d" sx={{ mb: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
                    Pitch Speed Range (mph)
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={5}>
                      <TextField
                        label="Min Speed"
                        type="number"
                        value={filters.pitchSpeedRange[0]}
                        onChange={(e) => handlePitchSpeedChange(0, parseFloat(e.target.value) || 0)}
                        size="small"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mph</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <Typography align="center">to</Typography>
                    </Grid>
                    <Grid item xs={5}>
                      <TextField
                        label="Max Speed"
                        type="number"
                        value={filters.pitchSpeedRange[1]}
                        onChange={(e) => handlePitchSpeedChange(1, parseFloat(e.target.value) || 100)}
                        size="small"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mph</InputAdornment>,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Session Tags */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" fontWeight={700} color="#1c2c4d" sx={{ mb: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
                    Session Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {sessionTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onClick={() => handleTagToggle(tag)}
                        color={selectedTags.includes(tag) ? 'primary' : 'default'}
                        variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                        sx={{
                          bgcolor: selectedTags.includes(tag) ? NAVY : 'transparent',
                          color: selectedTags.includes(tag) ? '#fff' : NAVY,
                          borderColor: NAVY,
                          '&:hover': {
                            bgcolor: selectedTags.includes(tag) ? '#3a7bd5' : '#f0f0f0'
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Statistics Table */}
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: NAVY, mb: 3 }}>
              Your Performance Statistics
            </Typography>
            
            {dataLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : stats.length > 0 ? (
              <TableContainer component={Paper} sx={{ bgcolor: '#f8f9fa', borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: NAVY, fontSize: '1rem' }}>Player</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: NAVY, fontSize: '1rem' }}>Level</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: NAVY, fontSize: '1rem' }}>Sessions</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: NAVY, fontSize: '1rem' }}>Swings</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: NAVY, fontSize: '1rem' }}>Avg EV</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: NAVY, fontSize: '1rem' }}>Max EV</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: NAVY, fontSize: '1rem' }}>Avg LA</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: NAVY, fontSize: '1rem' }}>Barrel %</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: NAVY, fontSize: '1rem' }}>Last Session</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.map((player) => (
                      <TableRow key={player.player_id} hover>
                        <TableCell sx={{ fontWeight: 600, color: NAVY, fontSize: '1rem' }}>
                          {player.player_name}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={player.player_level || 'N/A'} 
                            size="small"
                            sx={{ bgcolor: '#e3f2fd', color: NAVY, fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '1rem' }}>{player.total_sessions}</TableCell>
                        <TableCell sx={{ fontSize: '1rem' }}>{player.total_swings}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`${roundNumber(player.avg_exit_velocity)} mph`}
                            color={getGradeColor(player.avg_exit_velocity, 'avg_exit_velocity')}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${roundNumber(player.max_exit_velocity)} mph`}
                            color={getGradeColor(player.max_exit_velocity, 'max_exit_velocity')}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${roundNumber(player.avg_launch_angle)}°`}
                            color={getGradeColor(player.avg_launch_angle, 'avg_launch_angle')}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${roundNumber(player.barrel_percentage)}%`}
                            color={getGradeColor(player.barrel_percentage, 'barrel_percentage')}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '1rem' }}>
                          {player.last_session_date ? new Date(player.last_session_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No statistics found for the selected filters. Try adjusting your filters or upload more sessions.
              </Alert>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PlayerStatistics; 