import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, CircularProgress, Chip, Button } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import api from '../services/api';

const NAVY = '#1c2c4d';

const columns = [
  { id: 'rank', label: 'Rank', minWidth: 60 },
  { id: 'name', label: 'Player', minWidth: 120 },
  { id: 'level', label: 'Level', minWidth: 80 },
  { id: 'maxExitVelocity', label: 'Max Exit Velo', minWidth: 100 },
  { id: 'avgExitVelocity', label: 'Avg Exit Velo', minWidth: 100 },
  { id: 'maxBatSpeed', label: 'Max Bat Speed', minWidth: 100 },
  { id: 'avgBatSpeed', label: 'Avg Bat Speed', minWidth: 100 },
  { id: 'sessions', label: 'Sessions', minWidth: 80 },
];

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderBy, setOrderBy] = useState('maxExitVelocity');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.get('/leaderboard');
        setPlayers(res.data.players || []);
      } catch (err) {
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const handleSort = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
    setPlayers([...players].sort((a, b) => {
      if (a[columnId] < b[columnId]) return isAsc ? -1 : 1;
      if (a[columnId] > b[columnId]) return isAsc ? 1 : -1;
      return 0;
    }));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: NAVY, py: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 1200, bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 32px rgba(28,44,77,0.10)', border: '2px solid #1c2c4d', p: { xs: 2, sm: 4 } }}>
        <Typography variant="h3" align="center" sx={{ fontWeight: 900, color: NAVY, mb: 3, letterSpacing: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
          <EmojiEventsIcon sx={{ fontSize: 40, color: '#fbc02d', mb: -1, mr: 1 }} /> Leaderboard
        </Typography>
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
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}
                      sx={{ color: NAVY, '&.Mui-active': { color: NAVY } }}
                    >
                      {col.label}
                    </TableSortLabel>
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
              ) : players.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    No players found
                  </TableCell>
                </TableRow>
              ) : (
                players.map((player, idx) => (
                  <TableRow key={player.id} hover sx={{ bgcolor: '#fff', color: NAVY }}>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{player.name}</TableCell>
                    <TableCell><Chip label={player.level} color="primary" size="small" /></TableCell>
                    <TableCell>{player.maxExitVelocity}</TableCell>
                    <TableCell>{player.avgExitVelocity}</TableCell>
                    <TableCell>{player.maxBatSpeed}</TableCell>
                    <TableCell>{player.avgBatSpeed}</TableCell>
                    <TableCell>{player.sessionCount}</TableCell>
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