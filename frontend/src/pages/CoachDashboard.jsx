import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  UnfoldMore as UnfoldMoreIcon,
  DateRange as DateRangeIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const NAVY = '#1c2c4d';

const CoachDashboard = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [playerLevelFilter, setPlayerLevelFilter] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Player selection
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerSelectionDialog, setPlayerSelectionDialog] = useState(false);

  useEffect(() => {
    fetchAllPlayers();
    fetchPlayerStats();
  }, [timeRange, startDate, endDate, playerLevelFilter]);

  const fetchAllPlayers = async () => {
    try {
      const response = await api.get('/players');
      setAllPlayers(response.data || []);
    } catch (err) {
      console.error('Error fetching all players:', err);
    }
  };

  const fetchPlayerStats = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        timeRange,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(playerLevelFilter && { playerLevel: playerLevelFilter }),
        ...(selectedPlayers.length > 0 && { playerIds: selectedPlayers.join(',') })
      });

      const response = await api.get(`/analytics/player-stats?${params}`);
      setPlayers(response.data.players || []);
    } catch (err) {
      setError('Failed to fetch player stats');
      console.error('Fetch player stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <UnfoldMoreIcon />;
    return sortConfig.direction === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />;
  };

  const sortedPlayers = React.useMemo(() => {
    if (!sortConfig.key) return players;

    return [...players].sort((a, b) => {
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
  }, [players, sortConfig]);

  const filteredPlayers = React.useMemo(() => {
    if (!searchTerm) return sortedPlayers;
    
    return sortedPlayers.filter(player =>
      player.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.position && player.position.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sortedPlayers, searchTerm]);

  const formatNumber = (value) => {
    if (value === null || value === undefined || value === 'N/A') return 'N/A';
    return typeof value === 'number' ? value.toFixed(1) : value;
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined || value === 'N/A') return 'N/A';
    return typeof value === 'number' ? `${value.toFixed(1)}%` : value;
  };

  const getPlayerLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'little league': return 'success';
      case 'high school': return 'primary';
      case 'college': return 'warning';
      case 'professional': return 'error';
      default: return 'default';
    }
  };

  const handleAddPlayer = (playerId) => {
    if (!selectedPlayers.includes(playerId)) {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  const handleRemovePlayer = (playerId) => {
    setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
  };

  const columns = [
    { key: 'player_name', label: 'Player', sortable: true },
    { key: 'player_level', label: 'Level', sortable: true },
    { key: 'position', label: 'Position', sortable: true },
    { key: 'total_sessions', label: 'Sessions', sortable: true },
    { key: 'total_swings', label: 'Swings', sortable: true },
    { key: 'barrel_percentage', label: 'Barrel %', sortable: true },
    { key: 'max_exit_velocity', label: 'Max EV', sortable: true },
    { key: 'avg_exit_velocity', label: 'Avg EV', sortable: true },
    { key: 'avg_launch_angle', label: 'Avg LA', sortable: true },
    { key: 'avg_bat_speed', label: 'Avg BS', sortable: true },
    { key: 'max_bat_speed', label: 'Max BS', sortable: true },
    { key: 'avg_time_to_contact', label: 'Avg TTC', sortable: true }
  ];

  return (
    <Box sx={{
      width: '100%',
      minHeight: 'calc(100vh - 64px)',
      bgcolor: NAVY,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
    }}>
      <Box sx={{
        width: '100%',
        maxWidth: 1600,
        bgcolor: '#fff',
        borderRadius: 3,
        boxShadow: '0 4px 32px rgba(28,44,77,0.10)',
        border: '2px solid #1c2c4d',
        p: { xs: 1, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: NAVY,
      }}>
        {/* Header */}
        <Box sx={{
          width: '100%',
          bgcolor: '#fff',
          border: '2px solid #1c2c4d',
          borderRadius: 3,
          mb: 3,
          py: 1.2,
          boxShadow: '0 2px 12px rgba(28,44,77,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Typography variant="h3" align="center" sx={{ fontWeight: 900, color: NAVY, letterSpacing: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif', m: 0, fontSize: { xs: '2rem', md: '2.5rem' } }}>
            Player Analytics Dashboard
          </Typography>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3, width: '100%' }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#e0e3e8' },
                  '&:hover fieldset': { borderColor: '#3a7bd5' },
                  '&.Mui-focused fieldset': { borderColor: '#3a7bd5' },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                value={playerLevelFilter}
                onChange={(e) => setPlayerLevelFilter(e.target.value)}
                label="Level"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e3e8' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' },
                }}
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="Little League">Little League</MenuItem>
                <MenuItem value="High School">High School</MenuItem>
                <MenuItem value="College">College</MenuItem>
                <MenuItem value="Professional">Professional</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={(e, newValue) => newValue && setTimeRange(newValue)}
              size="small"
              sx={{ width: '100%' }}
            >
              <ToggleButton value="all" sx={{ flex: 1 }}>All Time</ToggleButton>
              <ToggleButton value="recent" sx={{ flex: 1 }}>30 Days</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showDatePicker}
                  onChange={(e) => setShowDatePicker(e.target.checked)}
                />
              }
              label="Custom Dates"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setPlayerSelectionDialog(true)}
              startIcon={<PeopleIcon />}
              sx={{
                borderColor: NAVY,
                color: NAVY,
                '&:hover': { borderColor: '#2d5aa0', backgroundColor: '#f8f9fa' },
              }}
            >
              Select Players
            </Button>
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchPlayerStats}
              startIcon={<RefreshIcon />}
              sx={{
                bgcolor: NAVY,
                '&:hover': { bgcolor: '#2d5aa0' },
              }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>

        {/* Custom Date Range */}
        {showDatePicker && (
          <Grid container spacing={2} sx={{ mb: 3, width: '100%' }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#e0e3e8' },
                    '&:hover fieldset': { borderColor: '#3a7bd5' },
                    '&.Mui-focused fieldset': { borderColor: '#3a7bd5' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#e0e3e8' },
                    '&:hover fieldset': { borderColor: '#3a7bd5' },
                    '&.Mui-focused fieldset': { borderColor: '#3a7bd5' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                sx={{
                  borderColor: NAVY,
                  color: NAVY,
                  '&:hover': { borderColor: '#2d5aa0', backgroundColor: '#f8f9fa' },
                }}
              >
                Clear Dates
              </Button>
            </Grid>
          </Grid>
        )}

        {/* Stats Summary */}
        <Card sx={{ mb: 3, width: '100%', bgcolor: '#f8f9fa', border: '1px solid #1c2c4d' }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="h6" color="textSecondary">Total Players</Typography>
                <Typography variant="h4" sx={{ color: NAVY, fontWeight: 700 }}>
                  {filteredPlayers.length}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="h6" color="textSecondary">Total Sessions</Typography>
                <Typography variant="h4" sx={{ color: NAVY, fontWeight: 700 }}>
                  {filteredPlayers.reduce((sum, p) => sum + (p.total_sessions || 0), 0)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="h6" color="textSecondary">Total Swings</Typography>
                <Typography variant="h4" sx={{ color: NAVY, fontWeight: 700 }}>
                  {filteredPlayers.reduce((sum, p) => sum + (p.total_swings || 0), 0)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="h6" color="textSecondary">Avg Barrel %</Typography>
                <Typography variant="h4" sx={{ color: NAVY, fontWeight: 700 }}>
                  {(() => {
                    const barrelPercentages = filteredPlayers
                      .map(p => p.barrel_percentage)
                      .filter(p => p !== null && p !== undefined);
                    return barrelPercentages.length > 0 
                      ? `${(barrelPercentages.reduce((a, b) => a + b, 0) / barrelPercentages.length).toFixed(1)}%`
                      : 'N/A';
                  })()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Players Table */}
        <TableContainer component={Paper} sx={{ width: '100%', maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    onClick={() => column.sortable && handleSort(column.key)}
                    sx={{
                      cursor: column.sortable ? 'pointer' : 'default',
                      bgcolor: NAVY,
                      color: '#fff',
                      fontWeight: 700,
                      '&:hover': column.sortable ? { bgcolor: '#2d5aa0' } : {},
                      userSelect: 'none'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {column.label}
                      {column.sortable && getSortIcon(column.key)}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredPlayers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    No players found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlayers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((player) => (
                    <TableRow key={player.player_id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{player.player_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={player.player_level || 'N/A'}
                          color={getPlayerLevelColor(player.player_level)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{player.position || 'N/A'}</TableCell>
                      <TableCell>{player.total_sessions || 0}</TableCell>
                      <TableCell>{player.total_swings || 0}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>
                        {formatPercentage(player.barrel_percentage)}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#d32f2f' }}>
                        {formatNumber(player.max_exit_velocity)}
                      </TableCell>
                      <TableCell>{formatNumber(player.avg_exit_velocity)}</TableCell>
                      <TableCell>{formatNumber(player.avg_launch_angle)}</TableCell>
                      <TableCell>{formatNumber(player.avg_bat_speed)}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#d32f2f' }}>
                        {formatNumber(player.max_bat_speed)}
                      </TableCell>
                      <TableCell>{formatNumber(player.avg_time_to_contact)}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredPlayers.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{ width: '100%', mt: 2 }}
        />

        {/* Player Selection Dialog */}
        <Dialog
          open={playerSelectionDialog}
          onClose={() => setPlayerSelectionDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: NAVY, color: '#fff' }}>
            Select Players to Include
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {allPlayers.map((player) => (
                <Grid item xs={12} sm={6} md={4} key={player.id}>
                  <Card sx={{ 
                    p: 1, 
                    cursor: 'pointer',
                    border: selectedPlayers.includes(player.id) ? '2px solid #1976d2' : '1px solid #e0e3e8',
                    bgcolor: selectedPlayers.includes(player.id) ? '#e3f2fd' : '#fff'
                  }}
                  onClick={() => {
                    if (selectedPlayers.includes(player.id)) {
                      handleRemovePlayer(player.id);
                    } else {
                      handleAddPlayer(player.id);
                    }
                  }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {player.name}
                      </Typography>
                      <IconButton size="small">
                        {selectedPlayers.includes(player.id) ? <RemoveIcon /> : <AddIcon />}
                      </IconButton>
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      {player.position || 'No position'} • {player.player_level || 'No level'}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#fff', borderTop: '1px solid #1c2c4d' }}>
            <Button 
              onClick={() => setPlayerSelectionDialog(false)}
              sx={{ color: NAVY }}
            >
              Close
            </Button>
            <Button 
              onClick={() => setSelectedPlayers([])}
              sx={{ color: NAVY }}
            >
              Clear All
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default CoachDashboard; 