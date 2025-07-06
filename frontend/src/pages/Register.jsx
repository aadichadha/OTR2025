import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register as registerService, login as loginService, setToken, getToken } from '../services/auth';
import { Box, TextField, Button, Typography, Alert, CircularProgress, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const PLAYER_LEVELS = {
  'youth': { label: 'Youth' },
  'high_school': { label: 'High School' },
  'college': { label: 'College' },
  'professional': { label: 'Professional' }
};
const POSITIONS = [
  { value: 'C', label: 'C' },
  { value: '1B', label: '1B' },
  { value: '2B', label: '2B' },
  { value: '3B', label: '3B' },
  { value: 'SS', label: 'SS' },
  { value: 'LF', label: 'LF' },
  { value: 'CF', label: 'CF' },
  { value: 'RF', label: 'RF' },
  { value: 'DH', label: 'DH' },
  { value: 'P', label: 'P' }
];

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [playerData, setPlayerData] = useState({
    age: '',
    player_level: '',
    travel_team: '',
    high_school: '',
    college: '',
    team_name: '',
    position: '',
    graduation_year: ''
  });
  const [step, setStep] = useState(1); // 1 = user, 2 = player
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handlePlayerChange = (e) => {
    setPlayerData({
      ...playerData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setLoading(true);
    try {
      // Register as player (role is set automatically by backend)
      await registerService(formData.name, formData.email, formData.password);
      // Auto-login after registration
      const loginRes = await loginService(formData.email, formData.password);
      setToken(loginRes.token);
      setStep(2); // Show player profile form
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = getToken();
      const payload = {
        ...playerData,
        position: Array.isArray(playerData.position) ? playerData.position.join(',') : playerData.position
      };
      await axios.post(`${API_URL}/players`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/players');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create player profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 64px)" bgcolor="background.default">
      <Paper 
        elevation={6} 
        sx={{ 
          p: 6, 
          width: 450, 
          borderRadius: 4, 
          background: '#fff', 
          color: '#1c2c4d', 
          boxShadow: '0 8px 32px rgba(28,44,77,0.12)', 
          border: '1.5px solid #e0e3e8'
        }}
      >
        {step === 1 ? (
          <>
            <Typography variant="h4" align="center" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 700, mb: 3 }}>
              Register
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            <form onSubmit={handleSubmit}>
              <TextField 
                label="Name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                fullWidth 
                margin="normal" 
                required 
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e3e8',
                    },
                    '&:hover fieldset': {
                      borderColor: '#3a7bd5',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3a7bd5',
                    },
                    '& input': {
                      color: '#1c2c4d',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#1c2c4d',
                  },
                }}
              />
              <TextField 
                label="Email" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                fullWidth 
                margin="normal" 
                required 
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e3e8',
                    },
                    '&:hover fieldset': {
                      borderColor: '#3a7bd5',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3a7bd5',
                    },
                    '& input': {
                      color: '#1c2c4d',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#1c2c4d',
                  },
                }}
              />
              <TextField 
                label="Password" 
                name="password" 
                type="password" 
                value={formData.password} 
                onChange={handleChange} 
                fullWidth 
                margin="normal" 
                required 
                inputProps={{ minLength: 6 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e3e8',
                    },
                    '&:hover fieldset': {
                      borderColor: '#3a7bd5',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3a7bd5',
                    },
                    '& input': {
                      color: '#1c2c4d',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#1c2c4d',
                  },
                }}
              />
              <TextField 
                label="Confirm Password" 
                name="confirmPassword" 
                type="password" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                fullWidth 
                margin="normal" 
                required 
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e3e8',
                    },
                    '&:hover fieldset': {
                      borderColor: '#3a7bd5',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3a7bd5',
                    },
                    '& input': {
                      color: '#1c2c4d',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#1c2c4d',
                  },
                }}
              />
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                sx={{ 
                  mt: 3, 
                  py: 1.5, 
                  fontWeight: 700, 
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1c2c4d 0%, #2d5aa0 100%)',
                  color: '#fff',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2d5aa0 0%, #1c2c4d 100%)',
                  }
                }} 
                disabled={loading} 
                startIcon={loading && <CircularProgress size={18} />}
              >
                {loading ? 'Signing Up...' : 'Sign Up!'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <Typography variant="h4" align="center" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 700, mb: 3 }}>
              Create Player Profile
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            <form onSubmit={handlePlayerSubmit}>
              <TextField 
                label="Age" 
                name="age" 
                value={playerData.age} 
                onChange={handlePlayerChange} 
                fullWidth 
                margin="normal" 
                type="number" 
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e3e8',
                    },
                    '&:hover fieldset': {
                      borderColor: '#3a7bd5',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3a7bd5',
                    },
                    '& input': {
                      color: '#1c2c4d',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#1c2c4d',
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box flex={1}>
                  <FormControl fullWidth margin="normal" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: '#1c2c4d' }}>Player Level</InputLabel>
                    <Select
                      name="player_level"
                      value={playerData.player_level || ''}
                      onChange={handlePlayerChange}
                      label="Player Level"
                      MenuProps={{ PaperProps: { sx: { minWidth: 120 } } }}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e0e3e8',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3a7bd5',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3a7bd5',
                        },
                        '& .MuiSelect-select, & .MuiSelect-multiple, & .MuiSelect-outlined, & .MuiSelect-root, & .MuiInputBase-input': {
                          color: '#1c2c4d',
                        },
                        '& .MuiInputLabel-root': {
                          color: '#1c2c4d',
                        },
                      }}
                    >
                      {Object.entries(PLAYER_LEVELS).map(([key, level]) => (
                        <MenuItem key={key} value={key}>{level.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box flex={1}>
                  <FormControl fullWidth margin="normal" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: '#1c2c4d' }}>Position(s)</InputLabel>
                    <Select
                      name="position"
                      multiple
                      value={playerData.position || []}
                      onChange={e => {
                        const value = e.target.value;
                        setPlayerData(prev => ({ ...prev, position: typeof value === 'string' ? value.split(',') : value }));
                      }}
                      label="Position(s)"
                      MenuProps={{ PaperProps: { sx: { minWidth: 120 } } }}
                      renderValue={selected =>
                        Array.isArray(selected)
                          ? selected.map(val => POSITIONS.find(p => p.value === val)?.label || val).join(', ')
                          : ''
                      }
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e0e3e8',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3a7bd5',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3a7bd5',
                        },
                        '& .MuiSelect-select, & .MuiSelect-multiple, & .MuiSelect-outlined, & .MuiSelect-root, & .MuiInputBase-input': {
                          color: '#1c2c4d',
                        },
                        '& .MuiInputLabel-root': {
                          color: '#1c2c4d',
                        },
                      }}
                    >
                      {POSITIONS.map(pos => (
                        <MenuItem key={pos.value} value={pos.value}>{pos.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              {playerData.player_level === 'youth' && (
                <>
                  <TextField 
                    label="Travel Team" 
                    name="travel_team" 
                    value={playerData.travel_team || ''} 
                    onChange={handlePlayerChange} 
                    fullWidth 
                    margin="normal" 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#e0e3e8',
                        },
                        '&:hover fieldset': {
                          borderColor: '#3a7bd5',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#3a7bd5',
                        },
                        '& input': {
                          color: '#1c2c4d',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#1c2c4d',
                      },
                    }}
                  />
                  <TextField 
                    label="Little League Team" 
                    name="little_league" 
                    value={playerData.little_league || ''} 
                    onChange={handlePlayerChange} 
                    fullWidth 
                    margin="normal" 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#e0e3e8',
                        },
                        '&:hover fieldset': {
                          borderColor: '#3a7bd5',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#3a7bd5',
                        },
                        '& input': {
                          color: '#1c2c4d',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#1c2c4d',
                      },
                    }}
                  />
                </>
              )}
              {playerData.player_level === 'high_school' && (
                <>
                  <TextField 
                    label="High School Team" 
                    name="high_school" 
                    value={playerData.high_school || ''} 
                    onChange={handlePlayerChange} 
                    fullWidth 
                    margin="normal" 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#e0e3e8',
                        },
                        '&:hover fieldset': {
                          borderColor: '#3a7bd5',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#3a7bd5',
                        },
                        '& input': {
                          color: '#1c2c4d',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#1c2c4d',
                      },
                    }}
                  />
                  <TextField 
                    label="Travel Team" 
                    name="travel_team" 
                    value={playerData.travel_team || ''} 
                    onChange={handlePlayerChange} 
                    fullWidth 
                    margin="normal" 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#e0e3e8',
                        },
                        '&:hover fieldset': {
                          borderColor: '#3a7bd5',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#3a7bd5',
                        },
                        '& input': {
                          color: '#1c2c4d',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#1c2c4d',
                      },
                    }}
                  />
                </>
              )}
              {playerData.player_level === 'college' && (
                <TextField 
                  label="College Name" 
                  name="college" 
                  value={playerData.college || ''} 
                  onChange={handlePlayerChange} 
                  fullWidth 
                  margin="normal" 
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#e0e3e8',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3a7bd5',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3a7bd5',
                      },
                      '& input': {
                        color: '#1c2c4d',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#1c2c4d',
                    },
                  }}
                />
              )}
              {playerData.player_level === 'professional' && (
                <TextField 
                  label="Team Name" 
                  name="team_name" 
                  value={playerData.team_name || ''} 
                  onChange={handlePlayerChange} 
                  fullWidth 
                  margin="normal" 
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#e0e3e8',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3a7bd5',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3a7bd5',
                      },
                      '& input': {
                        color: '#1c2c4d',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#1c2c4d',
                    },
                  }}
                />
              )}
              <TextField 
                label="Graduation Year" 
                name="graduation_year" 
                value={playerData.graduation_year} 
                onChange={handlePlayerChange} 
                fullWidth 
                margin="normal" 
                type="number" 
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e3e8',
                    },
                    '&:hover fieldset': {
                      borderColor: '#3a7bd5',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3a7bd5',
                    },
                    '& input': {
                      color: '#1c2c4d',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#1c2c4d',
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ 
                  mt: 3, 
                  py: 1.5, 
                  fontWeight: 700, 
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1c2c4d 0%, #2d5aa0 100%)',
                  color: '#fff',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2d5aa0 0%, #1c2c4d 100%)',
                  }
                }}
                disabled={
                  !playerData.player_level ||
                  (playerData.position?.length === 0) ||
                  loading
                }
                startIcon={loading && <CircularProgress size={18} />}
              >
                {loading ? 'Saving...' : 'Create Player'}
              </Button>
            </form>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default Register; 