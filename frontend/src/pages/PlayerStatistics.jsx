import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  UnfoldMore,
  FilterList,
  Refresh,
  Assessment,
  Speed,
  Timeline,
  Straighten,
  CalendarToday,
  Clear
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import safeToFixed from '../utils/safeToFixed';

const NAVY = '#1c2c4d';

const PlayerStatistics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [players, setPlayers] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  const [filteredStats, setFilteredStats] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  
  // Filter states (only date and pitch speed for players)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    pitchSpeedMin: '',
    pitchSpeedMax: ''
  });
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Sorting states
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Apply filters when data or filters change
  useEffect(() => {
    applyFilters();
  }, [playerStats, filters]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, get the player ID for the current user
      let playerId = null;
      try {
        const playersResponse = await api.get('/players');
        const playersData = playersResponse.data.players || playersResponse.data || [];
        const foundPlayer = playersData.find(p => p.name === user.name);
        
        if (foundPlayer) {
          playerId = foundPlayer.id;
          setCurrentPlayer(foundPlayer);
          setPlayers(playersData);
        } else {
          console.error('No player found for current user:', user.name);
          setError('Player not found for current user');
          return;
        }
      } catch (error) {
        console.error('Error fetching players:', error);
        setError('Failed to load player data');
        return;
      }

      // Load player stats with the correct player ID
      const params = new URLSearchParams();
      params.append('playerId', playerId);
      params.append('timeRange', 'all');

      const statsRes = await api.get(`/analytics/player-stats?${params}`);
      const statsData = statsRes.data.players || statsRes.data || [];

      console.log('📊 [PLAYER STATISTICS] Stats data:', statsData);
      console.log('📊 [PLAYER STATISTICS] Stats data length:', statsData.length);

      setPlayerStats(Array.isArray(statsData) ? statsData : []);
      
    } catch (err) {
      console.error('Error loading player statistics:', err);
      setError('Failed to load player statistics');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...playerStats];

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(stat => 
        new Date(stat.last_session_date) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(stat => 
        new Date(stat.last_session_date) <= new Date(filters.endDate)
      );
    }

    // Filter by pitch speed range
    if (filters.pitchSpeedMin && !isNaN(parseFloat(filters.pitchSpeedMin))) {
      filtered = filtered.filter(stat => 
        stat.avg_pitch_speed >= parseFloat(filters.pitchSpeedMin)
      );
    }

    if (filters.pitchSpeedMax && !isNaN(parseFloat(filters.pitchSpeedMax))) {
      filtered = filtered.filter(stat => 
        stat.avg_pitch_speed <= parseFloat(filters.pitchSpeedMax)
      );
    }

    setFilteredStats(filtered);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <UnfoldMore />;
    }
    return sortConfig.direction === 'asc' ? <TrendingUp /> : <TrendingDown />;
  };

  const sortedStats = React.useMemo(() => {
    console.log('📊 [PLAYER STATISTICS] Filtered stats:', filteredStats);
    console.log('📊 [PLAYER STATISTICS] Filtered stats length:', filteredStats.length);
    
    if (!sortConfig.key) return filteredStats;

    return [...filteredStats].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredStats, sortConfig]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      pitchSpeedMin: '',
      pitchSpeedMax: ''
    });
  };

  const formatNumber = (value, decimals = 1) => {
    if (value === null || value === undefined || value === 'N/A') return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    return safeToFixed(num, decimals);
  };

  const columns = [
    { key: 'player_name', label: 'Player', sortable: true },
    { key: 'player_level', label: 'Level', sortable: true },
    { key: 'total_sessions', label: 'Sessions', sortable: true },
    { key: 'total_swings', label: 'Swings', sortable: true },
    { key: 'avg_exit_velocity', label: 'Avg EV (mph)', sortable: true },
    { key: 'avg_launch_angle', label: 'Avg LA (°)', sortable: true },
    { key: 'barrel_percentage', label: 'Barrel %', sortable: true },
    { key: 'max_exit_velocity', label: 'Max EV (mph)', sortable: true },
    { key: 'avg_pitch_speed', label: 'Avg Pitch Speed (mph)', sortable: true }
  ];

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
          <Button color="inherit" size="small" onClick={loadData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 4, bgcolor: '#fff', border: '1.5px solid #e0e3e8', borderRadius: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <Assessment sx={{ fontSize: 40, mr: 2, color: NAVY }} />
            <Typography variant="h4" fontWeight="bold" color={NAVY}>
              Your Statistics Dashboard
            </Typography>
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ mr: 2, minWidth: 120, borderColor: NAVY, color: NAVY }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={loadData}
              sx={{ minWidth: 120, bgcolor: NAVY }}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        <Typography variant="body1" color={NAVY} sx={{ opacity: 0.8 }}>
          Your comprehensive statistics compiled across all sessions with filtering and sorting capabilities.
        </Typography>
      </Paper>

      {/* Enhanced Filters */}
      {showFilters && (
        <Paper sx={{ p: { xs: 2, sm: 4 }, mb: 5, bgcolor: '#fff', border: '2px solid #1c2c4d', borderRadius: 4, boxShadow: '0 4px 24px rgba(28,44,77,0.10)' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight={900} color={NAVY} sx={{ fontFamily: 'Inter, Roboto, Arial, sans-serif', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
              Advanced Filters
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<Clear />}
              onClick={clearFilters} 
              sx={{ color: NAVY, borderColor: NAVY, minWidth: 140, fontWeight: 700, fontSize: '1rem', height: 48 }}
            >
              Clear All
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Date Range */}
            <Grid item xs={12} md={6}>
              <Box display="flex" flexDirection="column" gap={3}>
                <Typography variant="subtitle1" color={NAVY} fontWeight={700} mb={1} sx={{ fontSize: 18, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
                  Date Range
                </Typography>
                <Box display="flex" gap={2}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    InputLabelProps={{ shrink: true, style: { fontSize: 18 } }}
                    inputProps={{ style: { fontSize: 18, height: 56 } }}
                    sx={{
                      '& .MuiInputLabel-root': { color: NAVY, fontSize: 18 },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e3e8' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' },
                      '& .MuiInputBase-input': { color: NAVY, fontSize: 18, padding: '18px 16px', height: 20 },
                      minHeight: 56
                    }}
                  />
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    InputLabelProps={{ shrink: true, style: { fontSize: 18 } }}
                    inputProps={{ style: { fontSize: 18, height: 56 } }}
                    sx={{
                      '& .MuiInputLabel-root': { color: NAVY, fontSize: 18 },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e3e8' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' },
                      '& .MuiInputBase-input': { color: NAVY, fontSize: 18, padding: '18px 16px', height: 20 },
                      minHeight: 56
                    }}
                  />
                </Box>
              </Box>
            </Grid>

            {/* Pitch Speed Range */}
            <Grid item xs={12} md={6}>
              <Box display="flex" flexDirection="column" gap={3}>
                <Typography variant="subtitle1" color={NAVY} fontWeight={700} mb={1} sx={{ fontSize: 18, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
                  Pitch Speed Range (mph)
                </Typography>
                <Box display="flex" gap={2}>
                  <TextField
                    fullWidth
                    label="Min Speed"
                    type="number"
                    value={filters.pitchSpeedMin}
                    onChange={(e) => handleFilterChange('pitchSpeedMin', e.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mph</InputAdornment>,
                      style: { fontSize: 18, height: 56 }
                    }}
                    InputLabelProps={{ style: { fontSize: 18 } }}
                    sx={{
                      '& .MuiInputLabel-root': { color: NAVY, fontSize: 18 },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e3e8' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' },
                      '& .MuiInputBase-input': { color: NAVY, fontSize: 18, padding: '18px 16px', height: 20 },
                      minHeight: 56
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Max Speed"
                    type="number"
                    value={filters.pitchSpeedMax}
                    onChange={(e) => handleFilterChange('pitchSpeedMax', e.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mph</InputAdornment>,
                      style: { fontSize: 18, height: 56 }
                    }}
                    InputLabelProps={{ style: { fontSize: 18 } }}
                    sx={{
                      '& .MuiInputLabel-root': { color: NAVY, fontSize: 18 },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e3e8' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' },
                      '& .MuiInputBase-input': { color: NAVY, fontSize: 18, padding: '18px 16px', height: 20 },
                      minHeight: 56
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Active Filters Summary */}
          {(filters.startDate || 
            filters.endDate || 
            filters.pitchSpeedMin || 
            filters.pitchSpeedMax) && (
            <Box mt={4} p={2} bgcolor="#f8f9fa" borderRadius={2}>
              <Typography variant="subtitle2" color={NAVY} fontWeight="bold" mb={1} sx={{ fontSize: 16 }}>
                Active Filters:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {filters.startDate && (
                  <Chip label={`From: ${filters.startDate}`} size="medium" color="info" sx={{ fontSize: 15, height: 32 }} />
                )}
                {filters.endDate && (
                  <Chip label={`To: ${filters.endDate}`} size="medium" color="info" sx={{ fontSize: 15, height: 32 }} />
                )}
                {filters.pitchSpeedMin && (
                  <Chip label={`Min Pitch: ${filters.pitchSpeedMin} mph`} size="medium" color="warning" sx={{ fontSize: 15, height: 32 }} />
                )}
                {filters.pitchSpeedMax && (
                  <Chip label={`Max Pitch: ${filters.pitchSpeedMax} mph`} size="medium" color="warning" sx={{ fontSize: 15, height: 32 }} />
                )}
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff', border: '1.5px solid #e0e3e8', borderRadius: 4 }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assessment sx={{ mr: 2, color: NAVY }} />
                <Box>
                  <Typography color={NAVY} gutterBottom fontWeight="bold">
                    Total Sessions
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ color: NAVY, fontWeight: 700 }}>
                    {filteredStats.reduce((sum, stat) => sum + (stat.total_sessions || 0), 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff', border: '1.5px solid #e0e3e8', borderRadius: 4 }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Timeline sx={{ mr: 2, color: NAVY }} />
                <Box>
                  <Typography color={NAVY} gutterBottom fontWeight="bold">
                    Total Swings
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ color: NAVY, fontWeight: 700 }}>
                    {filteredStats.reduce((sum, stat) => sum + (stat.total_swings || 0), 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff', border: '1.5px solid #e0e3e8', borderRadius: 4 }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Speed sx={{ mr: 2, color: NAVY }} />
                <Box>
                  <Typography color={NAVY} gutterBottom fontWeight="bold">
                    Avg Exit Velocity
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ color: NAVY, fontWeight: 700 }}>
                    {filteredStats.length > 0 ? 
                      formatNumber(filteredStats.reduce((sum, stat) => sum + (stat.avg_exit_velocity || 0), 0) / filteredStats.length) : 
                      'N/A'} mph
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff', border: '1.5px solid #e0e3e8', borderRadius: 4 }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Straighten sx={{ mr: 2, color: NAVY }} />
                <Box>
                  <Typography color={NAVY} gutterBottom fontWeight="bold">
                    Barrel %
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ color: NAVY, fontWeight: 700 }}>
                    {filteredStats.length > 0 ? 
                      formatNumber(filteredStats.reduce((sum, stat) => sum + (stat.barrel_percentage || 0), 0) / filteredStats.length) : 
                      '0.0'}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Statistics Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden', bgcolor: '#fff', border: '1.5px solid #e0e3e8', borderRadius: 4 }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    onClick={() => column.sortable && handleSort(column.key)}
                    sx={{
                      cursor: column.sortable ? 'pointer' : 'default',
                      fontWeight: 'bold',
                      bgcolor: '#f5f5f5',
                      color: NAVY,
                      '&:hover': column.sortable ? { bgcolor: '#e0e0e0' } : {},
                      userSelect: 'none',
                      fontSize: '14px',
                      padding: '16px 8px'
                    }}
                  >
                    <Box display="flex" alignItems="center">
                      {column.label}
                      {column.sortable && (
                        <IconButton size="small" sx={{ ml: 1 }}>
                          {getSortIcon(column.key)}
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedStats
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((stat, index) => (
                  <TableRow key={stat.player_id || index} hover>
                    <TableCell sx={{ fontWeight: 600, color: NAVY }}>
                      {stat.player_name}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={stat.player_level} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ color: NAVY }}>{stat.total_sessions || 0}</TableCell>
                    <TableCell sx={{ color: NAVY }}>{stat.total_swings || 0}</TableCell>
                    <TableCell sx={{ color: NAVY }}>{formatNumber(stat.avg_exit_velocity)}</TableCell>
                    <TableCell sx={{ color: NAVY }}>{formatNumber(stat.avg_launch_angle)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${formatNumber(stat.barrel_percentage)}%`}
                        size="small"
                        color={stat.barrel_percentage >= 10 ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#d32f2f' }}>
                      {formatNumber(stat.max_exit_velocity)}
                    </TableCell>
                    <TableCell sx={{ color: NAVY }}>
                      {formatNumber(stat.avg_pitch_speed)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={sortedStats.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>
    </Container>
  );
};

export default PlayerStatistics; 