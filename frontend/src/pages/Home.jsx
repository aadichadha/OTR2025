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
      // Fetch players count
      const playersRes = await api.get('/players');
      const totalPlayers = playersRes.data.length || 0;

      // Fetch recent sessions (we'll get this from the first few players)
      let totalSessions = 0;
      let recentSessions = [];
      
      if (playersRes.data.length > 0) {
        // Get sessions from the first few players to show recent activity
        const recentPlayers = playersRes.data.slice(0, 3);
        for (const player of recentPlayers) {
          try {
            const sessionsRes = await api.get(`/players/${player.id}/sessions`);
            const sessions = sessionsRes.data.sessions || [];
            totalSessions += sessions.length;
            recentSessions.push(...sessions.slice(0, 2)); // Get 2 most recent from each player
          } catch (err) {
            console.error(`Error fetching sessions for player ${player.id}:`, err);
          }
        }
      }

      // Sort by date and take the 5 most recent
      recentSessions.sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
      recentSessions = recentSessions.slice(0, 5);

      setStats({
        totalPlayers,
        totalSessions,
        recentSessions
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