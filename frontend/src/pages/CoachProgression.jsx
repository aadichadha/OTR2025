import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Assessment,
  Group,
  TrendingUp
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CoachProgression = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/players');
        setPlayers(response.data.players || []);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError('Failed to load players');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const handlePlayerSelect = (playerId) => {
    if (playerId) {
      navigate(`/players/${playerId}/progression`);
    }
  };

  const handleViewAllProgression = () => {
    // This could navigate to a comparison view or analytics dashboard
    navigate('/analytics');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Player Progression Analysis
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Select a player to view their detailed progression with 20-80 grades
          </Typography>
        </Box>
        <Assessment sx={{ fontSize: 48, color: 'primary.main' }} />
      </Box>

      <Grid container spacing={3}>
        {/* Player Selection Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Group />
                Individual Player Progression
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                View detailed progression analysis for a specific player including 20-80 grades, trends, milestones, and coaching tips.
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Player</InputLabel>
                <Select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  label="Select Player"
                >
                  {players.map((player) => (
                    <MenuItem key={player.id} value={player.id}>
                      {player.name} - {player.position}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                fullWidth
                disabled={!selectedPlayer}
                onClick={() => handlePlayerSelect(selectedPlayer)}
                startIcon={<Assessment />}
                sx={{ mb: 2 }}
              >
                View Player Progression
              </Button>
              
              <Typography variant="caption" color="textSecondary">
                Features: 20-80 Grades • Trends • Milestones • Coaching Tips • Swing Analysis
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics Overview Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp />
                Team Analytics Overview
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Access comprehensive team analytics, comparisons, and performance insights across all players.
              </Typography>
              
              <Button
                variant="outlined"
                fullWidth
                onClick={handleViewAllProgression}
                startIcon={<TrendingUp />}
                sx={{ mb: 2 }}
              >
                View Team Analytics
              </Button>
              
              <Typography variant="caption" color="textSecondary">
                Features: Team Comparisons • Leaderboards • Performance Trends • Session Analytics
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Access Cards */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Quick Access
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/players')}
                sx={{ height: 80, flexDirection: 'column' }}
              >
                <Group sx={{ mb: 1 }} />
                Manage Players
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/statistics')}
                sx={{ height: 80, flexDirection: 'column' }}
              >
                <Assessment sx={{ mb: 1 }} />
                View Statistics
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/leaderboard')}
                sx={{ height: 80, flexDirection: 'column' }}
              >
                <TrendingUp sx={{ mb: 1 }} />
                Leaderboard
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/upload')}
                sx={{ height: 80, flexDirection: 'column' }}
              >
                <Assessment sx={{ mb: 1 }} />
                Upload Data
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CoachProgression; 