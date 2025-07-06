import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, CircularProgress, Chip } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NAVY = '#1c2c4d';

const PlayerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const statsRes = await api.get('/players/me/stats');
        setStats(statsRes.data);
        const sessionsRes = await api.get('/players/me/sessions');
        setSessions(sessionsRes.data.sessions || []);
      } catch (err) {
        setStats(null);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: NAVY, py: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 1100, bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 32px rgba(28,44,77,0.10)', border: '2px solid #1c2c4d', p: { xs: 2, sm: 4 } }}>
        <Typography variant="h3" align="center" sx={{ fontWeight: 900, color: NAVY, mb: 3, letterSpacing: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
          Player Dashboard
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 1 }}>Your Stats</Typography>
                {loading ? <CircularProgress /> : stats ? (
                  <Box>
                    <Typography variant="body1" sx={{ color: NAVY }}>Max Exit Velocity: <b>{stats.maxExitVelocity} mph</b></Typography>
                    <Typography variant="body1" sx={{ color: NAVY }}>Avg Exit Velocity: <b>{stats.avgExitVelocity} mph</b></Typography>
                    <Typography variant="body1" sx={{ color: NAVY }}>Max Bat Speed: <b>{stats.maxBatSpeed} mph</b></Typography>
                    <Typography variant="body1" sx={{ color: NAVY }}>Avg Bat Speed: <b>{stats.avgBatSpeed} mph</b></Typography>
                    <Typography variant="body1" sx={{ color: NAVY }}>Sessions: <b>{stats.sessionCount}</b></Typography>
                  </Box>
                ) : <Typography color="error">No stats found.</Typography>}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 1 }}>Recent Sessions</Typography>
                {loading ? <CircularProgress /> : sessions.length > 0 ? (
                  <Box>
                    {sessions.slice(0, 5).map((session) => (
                      <Box key={session.id} sx={{ mb: 1, p: 1, borderRadius: 2, bgcolor: '#fff', border: '1px solid #e0e3e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" sx={{ color: NAVY, fontWeight: 600 }}>{session.date}</Typography>
                          <Typography variant="body2" sx={{ color: NAVY }}>{session.type} - {session.location}</Typography>
                        </Box>
                        <Chip label={session.swingCount + ' swings'} color="primary" size="small" />
                      </Box>
                    ))}
                  </Box>
                ) : <Typography color="error">No sessions found.</Typography>}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 5 }}>
          <Button
            variant="contained"
            startIcon={<AssessmentIcon />}
            sx={{ bgcolor: NAVY, color: '#fff', fontWeight: 700, px: 4, py: 1.5, borderRadius: 3, fontSize: '1.1rem', '&:hover': { bgcolor: '#3a7bd5' } }}
            onClick={() => navigate('/analytics')}
          >
            Analytics
          </Button>
          <Button
            variant="outlined"
            startIcon={<EmojiEventsIcon />}
            sx={{ borderColor: NAVY, color: NAVY, fontWeight: 700, px: 4, py: 1.5, borderRadius: 3, fontSize: '1.1rem', '&:hover': { borderColor: '#3a7bd5', color: '#3a7bd5' } }}
            onClick={() => navigate('/leaderboard')}
          >
            Leaderboard
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PlayerDashboard; 