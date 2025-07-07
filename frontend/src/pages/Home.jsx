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
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: NAVY,
        py: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 1200, bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 32px rgba(28,44,77,0.10)', border: '2px solid #1c2c4d', p: { xs: 2, sm: 4 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <img
            src="/images/otrbaseball-simple.png"
            alt="OTR Baseball Logo"
            style={{
              maxWidth: '200px',
              width: '90%',
              marginBottom: 16,
              border: '2px solid #1c2c4d',
              borderRadius: '8px',
              padding: '8px',
              backgroundColor: 'white'
            }}
          />
          <Typography variant="h3" sx={{ fontWeight: 900, color: NAVY, mb: 2, letterSpacing: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
            Coach Dashboard
          </Typography>
          <Typography variant="h6" sx={{ color: NAVY, opacity: 0.8 }}>
            Professional baseball analytics platform for tracking player performance
          </Typography>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3, textAlign: 'center' }}>
              <CardContent>
                <People sx={{ fontSize: 48, color: NAVY, mb: 1 }} />
                <Typography variant="h4" sx={{ color: NAVY, fontWeight: 700 }}>
                  {loading ? <CircularProgress size={24} /> : stats.totalPlayers}
                </Typography>
                <Typography variant="h6" sx={{ color: NAVY, fontWeight: 600 }}>Total Players</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3, textAlign: 'center' }}>
              <CardContent>
                <Assessment sx={{ fontSize: 48, color: NAVY, mb: 1 }} />
                <Typography variant="h4" sx={{ color: NAVY, fontWeight: 700 }}>
                  {loading ? <CircularProgress size={24} /> : stats.totalSessions}
                </Typography>
                <Typography variant="h6" sx={{ color: NAVY, fontWeight: 600 }}>Total Sessions</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3, textAlign: 'center' }}>
              <CardContent>
                <Upload sx={{ fontSize: 48, color: NAVY, mb: 1 }} />
                <Typography variant="h6" sx={{ color: NAVY, fontWeight: 600, mb: 2 }}>Upload Data</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  sx={{ bgcolor: NAVY, color: '#fff', fontWeight: 700, '&:hover': { bgcolor: '#3a7bd5' } }}
                  onClick={() => navigate('/upload')}
                >
                  New Upload
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 2 }}>Quick Actions</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<People />}
                    sx={{ bgcolor: NAVY, color: '#fff', fontWeight: 700, py: 1.5, '&:hover': { bgcolor: '#3a7bd5' } }}
                    onClick={() => navigate('/players')}
                  >
                    Manage Players
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Assessment />}
                    sx={{ borderColor: NAVY, color: NAVY, fontWeight: 700, py: 1.5, '&:hover': { borderColor: '#3a7bd5', color: '#3a7bd5' } }}
                    onClick={() => navigate('/analytics')}
                  >
                    View Analytics
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<EmojiEventsIcon />}
                    sx={{ borderColor: NAVY, color: NAVY, fontWeight: 700, py: 1.5, '&:hover': { borderColor: '#3a7bd5', color: '#3a7bd5' } }}
                    onClick={() => navigate('/leaderboard')}
                  >
                    Leaderboard
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 2 }}>Recent Activity</Typography>
                {loading ? (
                  <CircularProgress />
                ) : stats.recentSessions.length > 0 ? (
                  <Box>
                    {stats.recentSessions.map((session) => (
                      <Box key={session.id} sx={{ 
                        mb: 1, 
                        p: 1, 
                        borderRadius: 2, 
                        bgcolor: '#fff', 
                        border: '1px solid #e0e3e8',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between'
                      }}>
                        <Box>
                          <Typography variant="body2" sx={{ color: NAVY, fontWeight: 600 }}>
                            {formatDate(session.session_date)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: NAVY }}>
                            {session.session_type?.toUpperCase() || 'Unknown Type'}
                          </Typography>
                        </Box>
                        <Chip 
                          label={session.session_type?.toUpperCase() || 'Unknown'} 
                          color={getSessionTypeColor(session.session_type)}
                          size="small" 
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">No recent sessions</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
} 