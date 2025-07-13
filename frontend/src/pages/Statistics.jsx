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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Slider,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  UnfoldMore,
  FilterList,
  Refresh,
  ExpandMore,
  Assessment,
  Speed,
  Timeline,
  Straighten,
  CalendarToday,
  Person
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import safeToFixed from '../utils/safeToFixed';

const Statistics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [players, setPlayers] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  const [filteredStats, setFilteredStats] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    selectedPlayers: [],
    playerLevels: [],
    startDate: '',
    endDate: '',
    timeRange: 'all'
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
      // Load players and their stats
      const [playersRes, statsRes] = await Promise.all([
        api.get('/players'),
        api.get('/analytics/player-stats?timeRange=all')
      ]);

      const playersData = playersRes.data.players || playersRes.data || [];
      const statsData = statsRes.data.players || statsRes.data || [];

      console.log('📊 [STATISTICS] Players data:', playersData);
      console.log('📊 [STATISTICS] Stats data:', statsData);
      console.log('📊 [STATISTICS] Stats data length:', statsData.length);
      console.log('📊 [STATISTICS] Raw API response:', statsRes.data);

      setPlayers(Array.isArray(playersData) ? playersData : []);
      setPlayerStats(Array.isArray(statsData) ? statsData : []);
    } catch (err) {
      console.error('Error loading statistics data:', err);
      setError('Failed to load statistics data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...playerStats];

    // Filter by selected players
    if (filters.selectedPlayers.length > 0) {
      filtered = filtered.filter(stat => 
        filters.selectedPlayers.includes(stat.player_id?.toString())
      );
    }

    // Filter by player levels
    if (filters.playerLevels.length > 0) {
      filtered = filtered.filter(stat => 
        filters.playerLevels.includes(stat.player_level)
      );
    }

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

    setFilteredStats(filtered);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <UnfoldMore />;
    }
    return sortConfig.direction === 'asc' ? <TrendingUp /> : <TrendingDown />;
  };

  const sortedStats = React.useMemo(() => {
    console.log('📊 [STATISTICS] Filtered stats:', filteredStats);
    console.log('📊 [STATISTICS] Filtered stats length:', filteredStats.length);
    
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
      selectedPlayers: [],
      playerLevels: [],
      startDate: '',
      endDate: '',
      timeRange: 'all'
    });
  };

  const formatNumber = (value, decimals = 1) => {
    if (value === null || value === undefined || value === 'N/A') return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    return safeToFixed(num, decimals);
  };

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id.toString() === playerId?.toString());
    return player ? player.name : 'Unknown Player';
  };

  const getPlayerLevel = (playerId) => {
    const player = players.find(p => p.id.toString() === playerId?.toString());
    if (!player) return 'N/A';
    
    if (player.high_school) return 'High School';
    if (player.travel_team) return 'Travel Team';
    if (player.college) return 'College';
    if (player.indy || player.affiliate) return 'Professional';
    if (player.little_league) return 'Little League';
    return 'N/A';
  };

  const columns = [
    { key: 'player_name', label: 'Player', sortable: true },
    { key: 'player_level', label: 'Level', sortable: true },
    { key: 'total_sessions', label: 'Sessions', sortable: true },
    { key: 'total_swings', label: 'Swings', sortable: true },
    { key: 'avg_exit_velocity', label: 'Avg EV (mph)', sortable: true },
    { key: 'avg_launch_angle', label: 'Avg LA (°)', sortable: true },
    { key: 'barrel_percentage', label: 'Barrel %', sortable: true },
    { key: 'max_exit_velocity', label: 'Max EV (mph)', sortable: true }
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
            <Assessment sx={{ fontSize: 40, mr: 2, color: '#1c2c4d' }} />
            <Typography variant="h4" fontWeight="bold" color="#1c2c4d">
              Player Statistics Dashboard
            </Typography>
          </Box>
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
        <Typography variant="body1" color="#1c2c4d" sx={{ opacity: 0.8 }}>
          Comprehensive player statistics compiled across all sessions with advanced filtering and sorting capabilities.
        </Typography>
      </Paper>

      {/* Filters */}
      {showFilters && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#fff', border: '1.5px solid #e0e3e8', borderRadius: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold" color="#1c2c4d">
              Advanced Filters
            </Typography>
            <Button variant="outlined" size="small" onClick={clearFilters} sx={{ color: '#1c2c4d', borderColor: '#1c2c4d' }}>
              Clear All
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {/* Player Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#1c2c4d' }}>Select Players</InputLabel>
                <Select
                  multiple
                  value={filters.selectedPlayers}
                  onChange={(e) => handleFilterChange('selectedPlayers', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(Array.isArray(selected) ? selected : []).map((playerId) => (
                        <Chip 
                          key={playerId} 
                          label={getPlayerName(playerId)} 
                          size="small" 
                        />
                      ))}
                    </Box>
                  )}
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
                >
                  {Array.isArray(players) && players.map(player => (
                    <MenuItem key={player.id} value={player.id.toString()}>
                      {player.name} - {player.position}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Player Level Filter */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#1c2c4d' }}>Player Levels</InputLabel>
                <Select
                  multiple
                  value={filters.playerLevels}
                  onChange={(e) => handleFilterChange('playerLevels', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(Array.isArray(selected) ? selected : []).map((level) => (
                        <Chip key={level} label={level} size="small" />
                      ))}
                    </Box>
                  )}
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
                >
                  <MenuItem value="Little League">Little League</MenuItem>
                  <MenuItem value="Travel Team">Travel Team</MenuItem>
                  <MenuItem value="High School">High School</MenuItem>
                  <MenuItem value="College">College</MenuItem>
                  <MenuItem value="Professional">Professional</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Date Range */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: '#1c2c4d',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e3e8',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3a7bd5',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3a7bd5',
                  },
                  '& .MuiInputBase-input': {
                    color: '#1c2c4d',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: '#1c2c4d',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e3e8',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3a7bd5',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3a7bd5',
                  },
                  '& .MuiInputBase-input': {
                    color: '#1c2c4d',
                  },
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff', border: '1.5px solid #e0e3e8', borderRadius: 4 }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Person sx={{ mr: 2, color: '#1c2c4d' }} />
                <Box>
                  <Typography color="#1c2c4d" gutterBottom fontWeight="bold">
                    Total Players
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ color: '#1c2c4d', fontWeight: 700 }}>
                    {filteredStats.length}
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
                <Timeline sx={{ mr: 2, color: '#1c2c4d' }} />
                <Box>
                  <Typography color="#1c2c4d" gutterBottom fontWeight="bold">
                    Total Sessions
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ color: '#1c2c4d', fontWeight: 700 }}>
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
                <Speed sx={{ mr: 2, color: '#1c2c4d' }} />
                <Box>
                  <Typography color="#1c2c4d" gutterBottom fontWeight="bold">
                    Total Swings
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ color: '#1c2c4d', fontWeight: 700 }}>
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
                <Straighten sx={{ mr: 2, color: '#1c2c4d' }} />
                <Box>
                  <Typography color="#1c2c4d" gutterBottom fontWeight="bold">
                    Avg Barrel %
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ color: '#1c2c4d', fontWeight: 700 }}>
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
                      color: '#1c2c4d',
                      '&:hover': column.sortable ? { bgcolor: '#e0e0e0' } : {},
                      userSelect: 'none'
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
                    <TableCell sx={{ fontWeight: 600, color: '#1c2c4d' }}>
                      {stat.player_name || getPlayerName(stat.player_id)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={stat.player_level || getPlayerLevel(stat.player_id)} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#1c2c4d' }}>{stat.total_sessions || 0}</TableCell>
                    <TableCell sx={{ color: '#1c2c4d' }}>{stat.total_swings || 0}</TableCell>
                    <TableCell sx={{ color: '#1c2c4d' }}>{formatNumber(stat.avg_exit_velocity)}</TableCell>
                    <TableCell sx={{ color: '#1c2c4d' }}>{formatNumber(stat.avg_launch_angle)}</TableCell>
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

export default Statistics; 