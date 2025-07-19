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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" bgcolor="#1c2c4d">
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, bgcolor: '#1c2c4d', minHeight: '100vh' }}>
        <Alert severity="error" sx={{ bgcolor: '#ffebee', color: '#c62828' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#1c2c4d', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
            Player Progression Analysis
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#e0e0e0' }}>
            Select a player to view their detailed progression with 20-80 grades
          </Typography>
        </Box>
        <Assessment sx={{ fontSize: 48, color: 'white' }} />
      </Box>

      <Grid container spacing={3}>
        {/* Player Selection Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1c2c4d', fontWeight: 600 }}>
                <Group sx={{ color: '#1c2c4d' }} />
                Individual Player Progression
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
                View detailed progression analysis for a specific player including 20-80 grades, trends, milestones, and coaching tips.
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: '#1c2c4d' }}>Select Player</InputLabel>
                <Select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  label="Select Player"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#1c2c4d' },
                      '&:hover fieldset': { borderColor: '#1c2c4d' },
                      '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                    },
                    '& .MuiInputBase-input': { color: '#1c2c4d' }
                  }}
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
                sx={{ 
                  mb: 2,
                  bgcolor: '#1c2c4d',
                  '&:hover': { bgcolor: '#0f1a2e' }
                }}
              >
                View Player Progression
              </Button>
              
              <Typography variant="caption" sx={{ color: '#666' }}>
                Features: 20-80 Grades • Trends • Milestones • Coaching Tips • Swing Analysis
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics Overview Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1c2c4d', fontWeight: 600 }}>
                <TrendingUp sx={{ color: '#1c2c4d' }} />
                Team Analytics Overview
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
                Access comprehensive team analytics, comparisons, and performance insights across all players.
              </Typography>
              
              <Button
                variant="outlined"
                fullWidth
                onClick={handleViewAllProgression}
                startIcon={<TrendingUp />}
                sx={{ 
                  mb: 2,
                  borderColor: '#1c2c4d',
                  color: '#1c2c4d',
                  '&:hover': { 
                    borderColor: '#0f1a2e',
                    bgcolor: '#f5f5f5'
                  }
                }}
              >
                View Team Analytics
              </Button>
              
              <Typography variant="caption" sx={{ color: '#666' }}>
                Features: Team Comparisons • Leaderboards • Performance Trends • Session Analytics
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Access Cards */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2, color: 'white' }}>
            Quick Access
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/players')}
                sx={{ 
                  height: 80, 
                  flexDirection: 'column',
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': { 
                    borderColor: '#e0e0e0',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <Group sx={{ mb: 1, color: 'white' }} />
                Manage Players
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/statistics')}
                sx={{ 
                  height: 80, 
                  flexDirection: 'column',
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': { 
                    borderColor: '#e0e0e0',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <Assessment sx={{ mb: 1, color: 'white' }} />
                View Statistics
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/leaderboard')}
                sx={{ 
                  height: 80, 
                  flexDirection: 'column',
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': { 
                    borderColor: '#e0e0e0',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <TrendingUp sx={{ mb: 1, color: 'white' }} />
                Leaderboard
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/upload')}
                sx={{ 
                  height: 80, 
                  flexDirection: 'column',
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': { 
                    borderColor: '#e0e0e0',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <Assessment sx={{ mb: 1, color: 'white' }} />
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