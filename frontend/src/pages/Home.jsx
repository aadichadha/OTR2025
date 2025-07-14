import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, CircularProgress, Chip, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import Upload from '@mui/icons-material/Upload';
import People from '@mui/icons-material/People';
import Assessment from '@mui/icons-material/Assessment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const NAVY = '#1c2c4d';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalSessions: 0,
    recentSessions: []
  });
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (user?.role === 'coach' || user?.role === 'admin') {
      fetchDashboardData();
      fetchLeaderboard();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard stats from the new endpoint
      const statsRes = await api.get('/analytics/dashboard-stats');
      const { totalPlayers, totalSessions } = statsRes.data.data;

      setStats({
        totalPlayers,
        totalSessions,
        recentSessions: [] // No longer needed for the simplified dashboard
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/analytics/leaderboard');
      if (response.data.success) {
        setLeaderboard(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSessionTypeColor = (type) => {
    return type === 'blast' ? 'primary' : 'secondary';
  };

  const roundNumber = (num) => {
    if (num === null || num === undefined || num === 'N/A') return 'N/A';
    return Math.round(parseFloat(num) * 10) / 10;
  };

  if (user?.role === 'player') {
    // Redirect players to their dashboard
    return null; // This will be handled by the router
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: NAVY, py: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 1200, bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 32px rgba(28,44,77,0.10)', border: '2px solid #1c2c4d', p: { xs: 2, sm: 4 }, mx: 'auto' }}>
        <Typography variant="h3" align="center" sx={{ fontWeight: 900, color: NAVY, mb: 3, letterSpacing: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
          Coach Dashboard
        </Typography>
        
        {/* Stats Cards */}
        <Grid container spacing={4} justifyContent="center" alignItems="center" sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 2 }}>Current Users</Typography>
                <Typography variant="h2" sx={{ color: NAVY, fontWeight: 900, textAlign: 'center' }}>{stats.totalPlayers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 2 }}>Total Sessions</Typography>
                <Typography variant="h2" sx={{ color: NAVY, fontWeight: 900, textAlign: 'center' }}>{stats.totalSessions}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Assessment />}
            onClick={() => navigate('/analytics')}
            sx={{ bgcolor: NAVY, color: '#fff', fontWeight: 700, px: 4, py: 1.5, borderRadius: 3, fontSize: '1.1rem', '&:hover': { bgcolor: '#3a7bd5' } }}
          >
            Analytics
          </Button>
          <Button
            variant="contained"
            startIcon={<Assessment />}
            onClick={() => navigate('/statistics')}
            sx={{ bgcolor: NAVY, color: '#fff', fontWeight: 700, px: 4, py: 1.5, borderRadius: 3, fontSize: '1.1rem', '&:hover': { bgcolor: '#3a7bd5' } }}
          >
            Statistics
          </Button>
          <Button
            variant="contained"
            startIcon={<People />}
            onClick={() => navigate('/players')}
            sx={{ bgcolor: NAVY, color: '#fff', fontWeight: 700, px: 4, py: 1.5, borderRadius: 3, fontSize: '1.1rem', '&:hover': { bgcolor: '#3a7bd5' } }}
          >
            Player Management
          </Button>
          <Button
            variant="outlined"
            startIcon={<EmojiEventsIcon />}
            onClick={() => navigate('/leaderboard')}
            sx={{ borderColor: NAVY, color: NAVY, fontWeight: 700, px: 4, py: 1.5, borderRadius: 3, fontSize: '1.1rem', '&:hover': { borderColor: '#3a7bd5', color: '#3a7bd5' } }}
          >
            Full Leaderboard
          </Button>
        </Box>

        {/* Leaderboard Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: NAVY, mb: 3, textAlign: 'center' }}>
            Top Performers
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : leaderboard.length > 0 ? (
            <TableContainer component={Paper} sx={{ bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: NAVY }}>Rank</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: NAVY }}>Player</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: NAVY }}>Level</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: NAVY }}>Max EV</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: NAVY }}>Avg EV</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: NAVY }}>Barrel %</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: NAVY }}>Sessions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.slice(0, 10).map((player, index) => (
                    <TableRow key={player.player_id} hover>
                      <TableCell sx={{ fontWeight: 600, color: NAVY }}>
                        #{index + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: NAVY }}>
                        {player.player_name}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={player.player_level || 'N/A'} 
                          size="small"
                          sx={{ bgcolor: '#e3f2fd', color: NAVY, fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${roundNumber(player.max_exit_velocity)} mph`}
                          color={parseFloat(player.max_exit_velocity) >= 105 ? 'success' : parseFloat(player.max_exit_velocity) >= 95 ? 'warning' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${roundNumber(player.avg_exit_velocity)} mph`}
                          color={parseFloat(player.avg_exit_velocity) >= 95 ? 'success' : parseFloat(player.avg_exit_velocity) >= 85 ? 'warning' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${roundNumber(player.barrel_percentage)}%`}
                          color={parseFloat(player.barrel_percentage) >= 25 ? 'success' : parseFloat(player.barrel_percentage) >= 15 ? 'warning' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {player.total_sessions}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No leaderboard data available. Players need to upload sessions to see rankings.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
} 