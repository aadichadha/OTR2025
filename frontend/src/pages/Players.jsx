import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import Analytics from '@mui/icons-material/Analytics';
import Close from '@mui/icons-material/Close';
import Refresh from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PlayerDetails from '../components/PlayerDetails';
import { getToken, removeToken } from '../services/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Player level options with their corresponding team types
const PLAYER_LEVELS = {
  'youth': { label: 'Youth' },
  'high_school': { label: 'High School' },
  'college': { label: 'College' },
  'professional': { label: 'Professional' }
};

// Baseball positions (C, 1B, 2B, 3B, SS, LF, CF, RF, DH, P)
const POSITIONS = [
  { value: 'C', label: 'Catcher (C)' },
  { value: '1B', label: 'First Base (1B)' },
  { value: '2B', label: 'Second Base (2B)' },
  { value: '3B', label: 'Third Base (3B)' },
  { value: 'SS', label: 'Shortstop (SS)' },
  { value: 'LF', label: 'Left Field (LF)' },
  { value: 'CF', label: 'Center Field (CF)' },
  { value: 'RF', label: 'Right Field (RF)' },
  { value: 'DH', label: 'Designated Hitter (DH)' },
  { value: 'P', label: 'Pitcher (P)' }
];

function Players() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    age: '', 
    player_level: '',
    team_type: '',
    team_name: '',
    position: [], 
    graduation_year: '',
    email: '' // Add email field
  });

  const fetchPlayers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      console.log('[Players] Token in localStorage:', token);
      if (!token) {
        setError('You are not logged in. Please log in.');
        setLoading(false);
        return;
      }
      
      // Add cache busting parameter
      const timestamp = new Date().getTime();
      const res = await axios.get(`${API_URL}/players?t=${timestamp}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('[Players] API Response:', res.data);
      console.log('[Players] Players received:', res.data.players?.length || 0);
      console.log('[Players] Pagination info:', res.data.pagination);
      console.log('[Players] All players:', res.data.players?.map(p => ({ id: p.id, name: p.name })));
      
      setPlayers(res.data.players || []);
    } catch (err) {
      console.error('[Players] Error fetching players:', err, err.response);
      if (err.response?.data?.error?.toLowerCase().includes('token')) {
        setError(`Session expired or invalid. Please re-login.\nToken: ${getToken()}\nError: ${err.response.data.error}\nDetails: ${err.response.data.details || ''}`);
      } else {
        setError(`Failed to load players: ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlayers(); }, []);

  // Refresh players list periodically to catch deletions
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPlayers();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleOpen = (player = null) => {
    setEditPlayer(player);
    if (player) {
      // Map existing player data to new form structure
      let playerLevel = '';
      let teamType = '';
      let teamName = '';
      
      // Determine level and team type based on existing data
      if (player.high_school) {
        playerLevel = 'high_school';
        teamType = 'high_school';
        teamName = player.high_school;
      } else if (player.travel_team) {
        // For travel team, we need to determine if it's youth or older
        if (player.age && player.age < 16) {
          playerLevel = 'youth';
        } else {
          playerLevel = 'high_school';
        }
        teamType = 'travel_team';
        teamName = player.travel_team;
      } else if (player.college) {
        playerLevel = 'college';
        teamType = '';
        teamName = player.college;
      } else if (player.indy) {
        playerLevel = 'professional';
        teamType = 'indy';
        teamName = player.indy;
      } else if (player.affiliate) {
        playerLevel = 'professional';
        teamType = 'affiliate';
        teamName = player.affiliate;
      } else if (player.little_league) {
        playerLevel = 'youth';
        teamType = 'little_league';
        teamName = player.little_league;
      }
      
      setForm({
        name: player.name,
        age: player.age || '',
        player_level: playerLevel,
        team_type: teamType,
        team_name: teamName,
        position: player.position ? (typeof player.position === 'string' ? player.position.split(',').map(p => p.trim()) : player.position) : [],
        graduation_year: player.graduation_year || '',
        email: player.email || '' // Map email
      });
    } else {
      // For new player, start with empty form
      setForm({ 
        name: '', // Allow coaches to enter player name
        age: '', 
        player_level: '',
        team_type: '',
        team_name: '',
        position: [], 
        graduation_year: '',
        email: '' // Initialize email for new player
      });
    }
    setOpen(true);
  };

  const handleClose = () => { 
    setOpen(false); 
    setEditPlayer(null); 
    setForm({ 
      name: '', 
      age: '', 
      player_level: '',
      team_type: '',
      team_name: '',
      position: [], 
      graduation_year: '',
      email: '' // Reset email for new player
    }); 
  };

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedPlayer(null);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => {
      const newForm = { ...prev, [name]: value };
      
      // If player level changed, reset team type and name
      if (name === 'player_level') {
        newForm.team_type = '';
        newForm.team_name = '';
      }
      
      return newForm;
    });
  };

  const handleSubmit = async () => {
    setError(''); 
    setSuccess('');
    const token = localStorage.getItem('token');
    
    try {
      // Debug: Log the current form state
      console.log('🔍 [Players] Current form state:', form);
      
      // Convert form data to backend format
      const playerData = {
        name: form.name, // Include the player name from the form
        age: form.age,
        position: Array.isArray(form.position) ? form.position.join(',') : form.position,
        graduation_year: form.graduation_year,
        email: form.email // Include email
      };

      // Map team data based on level and type
      if (form.player_level === 'youth') {
        if (form.team_type === 'little_league') {
          playerData.little_league = form.team_name;
        } else if (form.team_type === 'travel_team') {
          playerData.travel_team = form.team_name;
        }
      } else if (form.player_level === 'high_school') {
        if (form.team_type === 'high_school') {
          playerData.high_school = form.team_name;
        } else if (form.team_type === 'travel_team') {
          playerData.travel_team = form.team_name;
        }
      } else if (form.player_level === 'college') {
        playerData.college = form.team_name;
      } else if (form.player_level === 'professional') {
        if (form.team_type === 'indy') {
          playerData.indy = form.team_name;
        } else if (form.team_type === 'affiliate') {
          playerData.affiliate = form.team_name;
        }
      }

      console.log('🔍 [Players] Form data being sent:', playerData);
      console.log('🔍 [Players] PlayerData name value:', playerData.name);
      console.log('🔍 [Players] PlayerData name type:', typeof playerData.name);

      if (editPlayer) {
        await axios.put(`${API_URL}/players/${editPlayer.id}`, playerData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setSuccess('Player updated!');
      } else {
        const response = await axios.post(`${API_URL}/players`, playerData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        console.log('🔍 [Players] Backend response:', response.data);
        
        if (response.data.loginCredentials) {
          setSuccess(`Player and user account created successfully! Login credentials: Email: ${response.data.loginCredentials.email}, Password: ${response.data.loginCredentials.password}`);
        } else {
          setSuccess('Player added!');
        }
      }
      handleClose();
      fetchPlayers();
    } catch (err) {
      console.error('🔍 [Players] Error details:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to save player.');
    }
  };

  const handleDelete = async (id) => {
    setError(''); 
    setSuccess('');
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/players/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setSuccess('Player deleted!');
      fetchPlayers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete player.');
    }
  };

  const handleAnalyticsClick = (playerId) => {
    navigate(`/analytics?player=${playerId}`);
  };

  // Get team options based on selected player level
  const getTeamOptions = () => {
    if (!form.player_level) return [];
    return PLAYER_LEVELS[form.player_level]?.teamOptions || [];
  };

  // Get team type label
  const getTeamTypeLabel = (type) => {
    const labels = {
      'little_league': 'Little League',
      'travel_team': 'Travel Team',
      'high_school': 'High School',
      'college': 'College',
      'indy': 'Independent',
      'affiliate': 'Affiliate'
    };
    return labels[type] || type;
  };

  // Get level display name
  const getLevelDisplayName = (player) => {
    if (player.high_school) {
      return 'High School';
    } else if (player.travel_team) {
      return 'Youth/Travel';
    } else if (player.college) {
      return 'College';
    } else if (player.indy) {
      return 'Independent';
    } else if (player.affiliate) {
      return 'Affiliate';
    }
    return 'N/A';
  };

  return (
    <Box sx={{
      width: '100%',
      minHeight: 'calc(100vh - 64px)',
      bgcolor: '#1c2c4d',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
    }}>
      <Box sx={{
        width: '100%',
        maxWidth: 1400,
        bgcolor: '#fff',
        borderRadius: 4,
        boxShadow: '0 4px 32px rgba(28,44,77,0.10)',
        border: '2.5px solid #1c2c4d',
        p: { xs: 1, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: '#1c2c4d',
      }}>
        <Box sx={{
          width: '100%',
          bgcolor: '#fff',
          border: '3px solid #1c2c4d',
          borderRadius: 3,
          mb: 3,
          py: 1.2,
          boxShadow: '0 2px 12px rgba(28,44,77,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Typography variant="h3" align="center" className="otr-header" sx={{ fontWeight: 900, color: '#1c2c4d', letterSpacing: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif', m: 0, fontSize: { xs: '2rem', md: '2.5rem' } }}>
            Player Management
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error.split('\n').map((line, i) => <div key={i}>{line}</div>)}
            {error.toLowerCase().includes('re-login') && (
              <Button onClick={() => { removeToken(); window.location.reload(); }}>
                Re-login
              </Button>
            )}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
            {success}
          </Alert>
        )}
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} width="100%">
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchPlayers}
              disabled={loading}
              sx={{
                borderColor: '#1c2c4d',
                color: '#1c2c4d',
                fontWeight: 700,
                borderRadius: 3,
                px: 2.5,
                py: 0.8,
                fontSize: '0.98rem',
                minWidth: 120,
                boxShadow: '0 2px 8px rgba(28,44,77,0.08)',
                '&:hover': {
                  borderColor: '#3a7bd5',
                  bgcolor: 'rgba(28,44,77,0.04)',
                }
              }}
            >
              Refresh
            </Button>
            <Typography variant="body2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>
              {loading ? 'Loading...' : `${players.length} players loaded`}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
            sx={{
              color: '#1c2c4d',
              backgroundColor: '#fff',
              border: '2px solid #1c2c4d',
              borderRadius: 3,
              fontWeight: 700,
              px: 2.5,
              py: 0.8,
              fontSize: '0.98rem',
              minWidth: 120,
              boxShadow: '0 2px 8px rgba(28,44,77,0.08)',
              '&:hover': {
                backgroundColor: '#eaf1fb',
              },
            }}
          >
            Add Player
          </Button>
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" width="100%" sx={{ flex: 1 }}>
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ width: '100%', flex: 1, boxShadow: 'none', border: '2px solid #1c2c4d', borderRadius: 3, bgcolor: '#fff' }}>
            <Table className="otr-table" size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#1c2c4d', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #3a7bd5', bgcolor: '#fff', px: 1.5, py: 1 }}>Name</TableCell>
                  <TableCell sx={{ color: '#1c2c4d', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #3a7bd5', bgcolor: '#fff', px: 1.5, py: 1 }}>Player Code</TableCell>
                  <TableCell sx={{ color: '#1c2c4d', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #3a7bd5', bgcolor: '#fff', px: 1.5, py: 1 }}>Age</TableCell>
                  <TableCell sx={{ color: '#1c2c4d', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #3a7bd5', bgcolor: '#fff', px: 1.5, py: 1 }}>Level</TableCell>
                  <TableCell sx={{ color: '#1c2c4d', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #3a7bd5', bgcolor: '#fff', px: 1.5, py: 1 }}>Team</TableCell>
                  <TableCell sx={{ color: '#1c2c4d', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #3a7bd5', bgcolor: '#fff', px: 1.5, py: 1 }}>Position</TableCell>
                  <TableCell sx={{ color: '#1c2c4d', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #3a7bd5', bgcolor: '#fff', px: 1.5, py: 1 }}>Graduation Year</TableCell>
                  <TableCell align="right" sx={{ color: '#1c2c4d', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #3a7bd5', bgcolor: '#fff', px: 1.5, py: 1 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(Array.isArray(players) ? players : []).map(player => (
                  <TableRow
                    key={player.id}
                    hover
                    sx={{ cursor: 'pointer', color: '#1c2c4d', '& td': { color: '#1c2c4d', fontWeight: 500, fontSize: '0.98rem', bgcolor: '#fff', px: 1.5, py: 1.1 } }}
                    onClick={() => handlePlayerClick(player)}
                  >
                    <TableCell>{player.name}</TableCell>
                    <TableCell><strong>{player.player_code}</strong></TableCell>
                    <TableCell>{player.age}</TableCell>
                    <TableCell>{getLevelDisplayName(player)}</TableCell>
                    <TableCell>{player.high_school || player.travel_team || player.college || player.indy || player.affiliate || 'N/A'}</TableCell>
                    <TableCell>{player.position}</TableCell>
                    <TableCell>{player.graduation_year}</TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handlePlayerClick(player)}
                          sx={{
                            backgroundColor: '#1c2c4d',
                            color: '#fff',
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 2,
                            py: 0.7,
                            minWidth: 90,
                            fontSize: '0.95rem',
                            boxShadow: '0 2px 8px rgba(28,44,77,0.08)',
                            '&:hover': { backgroundColor: '#3a7bd5' },
                          }}
                        >
                          View Sessions
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Analytics />}
                          onClick={() => handleAnalyticsClick(player.id)}
                          sx={{
                            backgroundColor: '#1c2c4d',
                            color: '#fff',
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 2,
                            py: 0.7,
                            minWidth: 90,
                            fontSize: '0.95rem',
                            boxShadow: '0 2px 8px rgba(28,44,77,0.08)',
                            '&:hover': { backgroundColor: '#3a7bd5' },
                          }}
                        >
                          Analytics
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleOpen(player)}
                          sx={{
                            backgroundColor: '#1c2c4d',
                            color: '#fff',
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 2,
                            py: 0.7,
                            minWidth: 70,
                            fontSize: '0.95rem',
                            boxShadow: '0 2px 8px rgba(28,44,77,0.08)',
                            '&:hover': { backgroundColor: '#3a7bd5' },
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          color="error"
                          onClick={() => handleDelete(player.id)}
                          sx={{
                            backgroundColor: '#e53935',
                            color: '#fff',
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 2,
                            py: 0.7,
                            minWidth: 70,
                            fontSize: '0.95rem',
                            boxShadow: '0 2px 8px rgba(28,44,77,0.08)',
                            '&:hover': { backgroundColor: '#b71c1c' },
                          }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* Player Details Dialog */}
        {selectedPlayer && (
          <PlayerDetails 
            player={selectedPlayer} 
            open={showDetails} 
            onClose={handleCloseDetails}
            onSessionDeleted={fetchPlayers}
          />
        )}

        {/* Edit/Add Player Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#fff', borderRadius: 3, border: '2px solid #1c2c4d', color: '#1c2c4d' } }}>
          <DialogTitle sx={{ textAlign: 'center', pb: 2, color: '#1c2c4d', fontWeight: 800, fontSize: '2rem', letterSpacing: 1, fontFamily: 'Inter, Roboto, Arial, sans-serif', bgcolor: '#fff', borderBottom: '2px solid #1c2c4d' }}>
            {editPlayer ? 'Edit Player' : 'Complete Player Profile'}
          </DialogTitle>
          <DialogContent sx={{ color: '#1c2c4d' }}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField 
                  label="Player Name *" 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  fullWidth 
                  required 
                  placeholder="Enter player's full name"
                  sx={{
                    '& .MuiInputLabel-root': { color: '#1c2c4d', fontWeight: 600 },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#1c2c4d', borderWidth: 2 },
                      '&:hover fieldset': { borderColor: '#3a7bd5' },
                      '&.Mui-focused fieldset': { borderColor: '#1c2c4d', borderWidth: 2 }
                    },
                    '& .MuiInputBase-input': { color: '#1c2c4d', fontWeight: 500 },
                    '& .Mui-disabled': {
                      backgroundColor: '#f5f5f5',
                      '& .MuiInputBase-input': { color: '#1c2c4d', fontWeight: 600 }
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField 
                  label="Age" 
                  name="age" 
                  value={form.age} 
                  onChange={handleChange} 
                  fullWidth 
                  type="number" 
                  sx={{
                    '& .MuiInputLabel-root': { color: '#1c2c4d' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#1c2c4d' },
                      '&:hover fieldset': { borderColor: '#3a7bd5' },
                      '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                    },
                    '& .MuiInputBase-input': { color: '#1c2c4d' }
                  }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField 
                  label="Graduation Year" 
                  name="graduation_year" 
                  value={form.graduation_year} 
                  onChange={handleChange} 
                  fullWidth 
                  type="number" 
                  sx={{
                    '& .MuiInputLabel-root': { color: '#1c2c4d' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#1c2c4d' },
                      '&:hover fieldset': { borderColor: '#3a7bd5' },
                      '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                    },
                    '& .MuiInputBase-input': { color: '#1c2c4d' }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField 
                  label="Email (Optional)" 
                  name="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  fullWidth 
                  type="email"
                  placeholder="Enter player's email address"
                  sx={{
                    '& .MuiInputLabel-root': { color: '#1c2c4d' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#1c2c4d' },
                      '&:hover fieldset': { borderColor: '#3a7bd5' },
                      '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                    },
                    '& .MuiInputBase-input': { color: '#1c2c4d' }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth sx={{ minWidth: 260 }}>
                  <InputLabel sx={{ color: '#1c2c4d', fontWeight: 600 }}>Player Level *</InputLabel>
                  <Select
                    name="player_level"
                    value={form.player_level}
                    onChange={handleChange}
                    label="Player Level *"
                    MenuProps={{ PaperProps: { sx: { minWidth: 260 } } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#1c2c4d', borderWidth: 2 },
                        '&:hover fieldset': { borderColor: '#3a7bd5' },
                        '&.Mui-focused fieldset': { borderColor: '#1c2c4d', borderWidth: 2 }
                      },
                      '& .MuiSelect-select': { color: '#1c2c4d', fontWeight: 500 }
                    }}
                  >
                    {Object.entries(PLAYER_LEVELS).map(([key, level]) => (
                      <MenuItem key={key} value={key}>{level.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {form.player_level === 'youth' && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#1c2c4d' }}>Team Type</InputLabel>
                      <Select
                        name="team_type"
                        value={form.team_type}
                        onChange={handleChange}
                        label="Team Type"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#1c2c4d' },
                            '&:hover fieldset': { borderColor: '#3a7bd5' },
                            '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                          },
                          '& .MuiSelect-select': { color: '#1c2c4d' }
                        }}
                      >
                        <MenuItem value="travel_team">Travel Team</MenuItem>
                        <MenuItem value="little_league">Little League</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      label={form.team_type === 'travel_team' ? 'Travel Team Name' : form.team_type === 'little_league' ? 'Little League Team Name' : 'Team Name'}
                      name="team_name" 
                      value={form.team_name} 
                      onChange={handleChange} 
                      fullWidth 
                      sx={{
                        '& .MuiInputLabel-root': { color: '#1c2c4d' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#1c2c4d' },
                          '&:hover fieldset': { borderColor: '#3a7bd5' },
                          '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                        },
                        '& .MuiInputBase-input': { color: '#1c2c4d' }
                      }}
                    />
                  </Grid>
                </>
              )}
              {form.player_level === 'high_school' && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#1c2c4d' }}>Team Type</InputLabel>
                      <Select
                        name="team_type"
                        value={form.team_type}
                        onChange={handleChange}
                        label="Team Type"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#1c2c4d' },
                            '&:hover fieldset': { borderColor: '#3a7bd5' },
                            '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                          },
                          '& .MuiSelect-select': { color: '#1c2c4d' }
                        }}
                      >
                        <MenuItem value="high_school">High School</MenuItem>
                        <MenuItem value="travel_team">Travel Team</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      label={form.team_type === 'high_school' ? 'High School Name' : form.team_type === 'travel_team' ? 'Travel Team Name' : 'Team Name'}
                      name="team_name" 
                      value={form.team_name} 
                      onChange={handleChange} 
                      fullWidth 
                      sx={{
                        '& .MuiInputLabel-root': { color: '#1c2c4d' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#1c2c4d' },
                          '&:hover fieldset': { borderColor: '#3a7bd5' },
                          '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                        },
                        '& .MuiInputBase-input': { color: '#1c2c4d' }
                      }}
                    />
                  </Grid>
                </>
              )}
              {form.player_level === 'college' && (
                <Grid item xs={12}>
                  <TextField 
                    label="College Name" 
                    name="team_name" 
                    value={form.team_name} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiInputLabel-root': { color: '#1c2c4d' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#1c2c4d' },
                        '&:hover fieldset': { borderColor: '#3a7bd5' },
                        '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                      },
                      '& .MuiInputBase-input': { color: '#1c2c4d' }
                    }}
                  />
                </Grid>
              )}
              {form.player_level === 'professional' && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#1c2c4d' }}>Team Type</InputLabel>
                      <Select
                        name="team_type"
                        value={form.team_type}
                        onChange={handleChange}
                        label="Team Type"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#1c2c4d' },
                            '&:hover fieldset': { borderColor: '#3a7bd5' },
                            '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                          },
                          '& .MuiSelect-select': { color: '#1c2c4d' }
                        }}
                      >
                        <MenuItem value="indy">Independent</MenuItem>
                        <MenuItem value="affiliate">Affiliate</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      label={form.team_type === 'indy' ? 'Independent Team Name' : form.team_type === 'affiliate' ? 'Affiliate Team Name' : 'Team Name'}
                      name="team_name" 
                      value={form.team_name} 
                      onChange={handleChange} 
                      fullWidth 
                      sx={{
                        '& .MuiInputLabel-root': { color: '#1c2c4d' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#1c2c4d' },
                          '&:hover fieldset': { borderColor: '#3a7bd5' },
                          '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                        },
                        '& .MuiInputBase-input': { color: '#1c2c4d' }
                      }}
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <FormControl fullWidth sx={{ minWidth: 260 }}>
                  <InputLabel sx={{ color: '#1c2c4d', fontWeight: 600 }}>Position(s) *</InputLabel>
                  <Select
                    name="position"
                    multiple
                    value={Array.isArray(form.position) ? form.position : []}
                    onChange={e => {
                      const value = e.target.value;
                      setForm(prev => ({ ...prev, position: typeof value === 'string' ? value.split(',') : value }));
                    }}
                    label="Position(s) *"
                    MenuProps={{ PaperProps: { sx: { minWidth: 260 } } }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {Array.isArray(selected) && selected.map((value) => {
                          const position = POSITIONS.find(p => p.value === value);
                          return (
                            <Chip
                              key={value}
                              label={position ? position.label : value}
                              size="small"
                              sx={{
                                backgroundColor: '#1c2c4d',
                                color: '#fff',
                                '&:hover': {
                                  backgroundColor: '#3a7bd5',
                                  '& .MuiChip-deleteIcon': {
                                    color: '#fff',
                                    opacity: 1
                                  }
                                },
                                '& .MuiChip-deleteIcon': {
                                  color: '#fff',
                                  opacity: 0.7,
                                  '&:hover': {
                                    color: '#ff6b6b',
                                    opacity: 1
                                  }
                                }
                              }}
                              onDelete={(e) => {
                                e.stopPropagation();
                                setForm(prev => ({
                                  ...prev,
                                  position: prev.position.filter(pos => pos !== value)
                                }));
                              }}
                              deleteIcon={<Close />}
                            />
                          );
                        })}
                      </Box>
                    )}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#1c2c4d', borderWidth: 2 },
                        '&:hover fieldset': { borderColor: '#3a7bd5' },
                        '&.Mui-focused fieldset': { borderColor: '#1c2c4d', borderWidth: 2 }
                      },
                      '& .MuiSelect-select': { color: '#1c2c4d', fontWeight: 500 }
                    }}
                  >
                    {POSITIONS.map(pos => (
                      <MenuItem key={pos.value} value={pos.value}>
                        {pos.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={handleClose} variant="outlined" sx={{ color: '#1c2c4d', borderColor: '#1c2c4d', fontWeight: 700, borderRadius: 3, px: 3, py: 1, bgcolor: '#fff' }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{ backgroundColor: '#fff', color: '#1c2c4d', fontWeight: 700, borderRadius: 3, px: 3, py: 1, border: '2px solid #1c2c4d', '&:hover': { backgroundColor: '#eaf1fb' } }}
              disabled={
                !form.player_level ||
                !Array.isArray(form.position) || form.position.length === 0
              }
            >
              {editPlayer ? 'Update Player' : 'Add Player'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

export default Players; 