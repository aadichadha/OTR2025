import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, CircularProgress, Chip, IconButton } from '@mui/material';
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

  useEffect(() => {
    if (user?.role === 'coach' || user?.role === 'admin') {
      fetchDashboardData();
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSessionTypeColor = (type) => {
    return type === 'blast' ? 'primary' : 'secondary';
  };

  if (user?.role === 'player') {
    // Redirect players to their dashboard
    return null; // This will be handled by the router
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: NAVY, py: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 600, bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 32px rgba(28,44,77,0.10)', border: '2px solid #1c2c4d', p: { xs: 2, sm: 4 }, mx: 'auto' }}>
        <Typography variant="h3" align="center" sx={{ fontWeight: 900, color: NAVY, mb: 3, letterSpacing: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
          Coach Dashboard
        </Typography>
        <Grid container spacing={4} justifyContent="center" alignItems="center">
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
      </Box>
    </Box>
  );
} 