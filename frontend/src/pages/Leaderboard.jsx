import React, { useEffect, useState } from 'react';
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
  TableSortLabel,
  CircularProgress,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FilterListIcon from '@mui/icons-material/FilterList';
import api from '../services/api';

const NAVY = '#1c2c4d';

const columns = [
  { id: 'rank', label: 'Rank', minWidth: 60 },
  { id: 'name', label: 'Player', minWidth: 120 },
  { id: 'level', label: 'Level', minWidth: 100 },
  { id: 'barrels', label: 'Barrels', minWidth: 80 },
  { id: 'maxExitVelocity', label: 'Max EV', minWidth: 90 },
  { id: 'avgExitVelocity', label: 'Avg EV', minWidth: 90 },
  { id: 'maxBatSpeed', label: 'Max BS', minWidth: 90 },
  { id: 'avgBatSpeed', label: 'Avg BS', minWidth: 90 },
  { id: 'sessions', label: 'Sessions', minWidth: 80 },
];

const levels = ['All', 'High School', 'College', 'Youth', 'Other'];
const sortOptions = [
  { value: 'barrels', label: 'Barrels' },
  { value: 'maxExitVelocity', label: 'Max Exit Velocity' },
  { value: 'avgExitVelocity', label: 'Average Exit Velocity' },
  { value: 'maxBatSpeed', label: 'Max Bat Speed' },
  { value: 'avgBatSpeed', label: 'Average Bat Speed' },
  { value: 'overall', label: 'Overall Performance' }
];

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderBy, setOrderBy] = useState('maxExitVelocity');
  const [order, setOrder] = useState('desc');
  const [levelFilter, setLevelFilter] = useState('All');
  const [sortBy, setSortBy] = useState('maxExitVelocity');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.get('/leaderboard');
        setPlayers(res.data.players || []);
        setFilteredPlayers(res.data.players || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setPlayers([]);
        setFilteredPlayers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    // Apply filters and sorting
    let filtered = [...players];

    // Apply level filter
    if (levelFilter !== 'All') {
      filtered = filtered.filter(player => player.level === levelFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      if (sortBy === 'overall') {
        // Calculate overall score based on all metrics
        aValue = (a.barrels || 0) * 10 + (a.maxExitVelocity || 0) + (a.avgExitVelocity || 0) + (a.maxBatSpeed || 0) + (a.avgBatSpeed || 0);
        bValue = (b.barrels || 0) * 10 + (b.maxExitVelocity || 0) + (b.avgExitVelocity || 0) + (b.maxBatSpeed || 0) + (b.avgBatSpeed || 0);
      } else {
        aValue = a[sortBy] || 0;
        bValue = b[sortBy] || 0;
      }

      if (order === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    setFilteredPlayers(filtered);
  }, [players, levelFilter, sortBy, order]);

  const handleSort = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
    setSortBy(columnId);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'High School': return 'primary';
      case 'College': return 'secondary';
      case 'Youth': return 'success';
      default: return 'default';
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return typeof value === 'number' ? value.toFixed(1) : value;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: NAVY, py: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 1400, bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 32px rgba(28,44,77,0.10)', border: '2px solid #1c2c4d', p: { xs: 2, sm: 4 } }}>
        <Typography variant="h3" align="center" sx={{ fontWeight: 900, color: NAVY, mb: 3, letterSpacing: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
          <EmojiEventsIcon sx={{ fontSize: 40, color: '#fbc02d', mb: -1, mr: 1 }} /> Leaderboard
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3, bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterListIcon sx={{ color: NAVY, mr: 1 }} />
              <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700 }}>Filters</Typography>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: NAVY }}>Level</InputLabel>
                  <Select
                    value={levelFilter}
                    label="Level"
                    onChange={(e) => setLevelFilter(e.target.value)}
                    sx={{
                      color: NAVY,
                      '& .MuiSelect-select': { color: NAVY },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: NAVY },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: '#fff',
                          '& .MuiMenuItem-root': {
                            color: NAVY,
                            '&:hover': {
                              backgroundColor: '#e3f2fd'
                            },
                            '&.Mui-selected': {
                              backgroundColor: '#d2e3fa',
                              color: NAVY
                            }
                          }
                        }
                      }
                    }}
                  >
                    {levels.map((level) => (
                      <MenuItem key={level} value={level} sx={{ color: NAVY }}>
                        {level}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: NAVY }}>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{
                      color: NAVY,
                      '& .MuiSelect-select': { color: NAVY },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: NAVY },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: '#fff',
                          '& .MuiMenuItem-root': {
                            color: NAVY,
                            '&:hover': {
                              backgroundColor: '#e3f2fd'
                            },
                            '&.Mui-selected': {
                              backgroundColor: '#d2e3fa',
                              color: NAVY
                            }
                          }
                        }
                      }
                    }}
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value} sx={{ color: NAVY }}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="body2" sx={{ color: NAVY }}>
                Showing {filteredPlayers.length} of {players.length} players
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  setOrder(order === 'desc' ? 'asc' : 'desc');
                }}
                sx={{ borderColor: NAVY, color: NAVY, '&:hover': { borderColor: '#3a7bd5', color: '#3a7bd5' } }}
              >
                {order === 'desc' ? '↓ Descending' : '↑ Ascending'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <TableContainer component={Paper} sx={{ bgcolor: '#fff', borderRadius: 3, border: '1.5px solid #1c2c4d', boxShadow: 'none' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    sx={{ backgroundColor: '#fff', color: NAVY, fontWeight: 700, borderBottom: '2px solid #1c2c4d' }}
                    align={col.id === 'rank' ? 'center' : 'left'}
                    sortDirection={orderBy === col.id ? order : false}
                  >
                    {col.id === 'rank' ? (
                      col.label
                    ) : (
                      <TableSortLabel
                        active={orderBy === col.id}
                        direction={orderBy === col.id ? order : 'asc'}
                        onClick={() => handleSort(col.id)}
                        sx={{ color: NAVY, '&.Mui-active': { color: NAVY } }}
                      >
                        {col.label}
                      </TableSortLabel>
                    )}
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
                    <Typography sx={{ color: NAVY }}>No players found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlayers.map((player, idx) => (
                  <TableRow key={player.id} hover sx={{ bgcolor: '#fff', color: NAVY }}>
                    <TableCell align="center" sx={{ fontWeight: 700, color: NAVY }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: NAVY }}>
                      {player.name}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={player.level}
                        color={getLevelColor(player.level)}
                        size="small"
                        sx={{
                          bgcolor: player.level === 'High School' ? '#e3f2fd' :
                                  player.level === 'College' ? '#f3e5f5' :
                                  player.level === 'Youth' ? '#e8f5e8' : '#f5f5f5',
                          color: NAVY,
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: NAVY, fontWeight: 600 }}>
                      {formatValue(player.barrels)}
                    </TableCell>
                    <TableCell sx={{ color: NAVY }}>
                      {formatValue(player.maxExitVelocity)}
                    </TableCell>
                    <TableCell sx={{ color: NAVY }}>
                      {formatValue(player.avgExitVelocity)}
                    </TableCell>
                    <TableCell sx={{ color: NAVY }}>
                      {formatValue(player.maxBatSpeed)}
                    </TableCell>
                    <TableCell sx={{ color: NAVY }}>
                      {formatValue(player.avgBatSpeed)}
                    </TableCell>
                    <TableCell sx={{ color: NAVY }}>
                      {player.sessionCount}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default Leaderboard; 