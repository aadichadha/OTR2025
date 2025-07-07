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
    // User data
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Player data
    age: '',
    player_level: '',
    travel_team: '',
    high_school: '',
    college: '',
    team_name: '',
    position: '',
    graduation_year: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.player_level) {
      setError('Player level is required');
      return;
    }
    if (!formData.position) {
      setError('Position is required');
      return;
    }
    
    setLoading(true);
    try {
      // Step 1: Register user account
      console.log('🔍 [Register] Registering user with name:', formData.name);
      await registerService(formData.name, formData.email, formData.password);
      
      // Step 2: Auto-login after registration
      console.log('🔍 [Register] Auto-logging in user');
      const loginRes = await loginService(formData.email, formData.password);
      setToken(loginRes.token);
      
      // Step 3: Create player profile (name will be automatically used from authenticated user)
      console.log('🔍 [Register] Creating player profile');
      const token = getToken();
      const playerPayload = {
        age: formData.age,
        player_level: formData.player_level,
        travel_team: formData.travel_team,
        high_school: formData.high_school,
        college: formData.college,
        team_name: formData.team_name,
        position: Array.isArray(formData.position) ? formData.position.join(',') : formData.position,
        graduation_year: formData.graduation_year
      };
      
      console.log('🔍 [Register] Player payload:', playerPayload);
      
      await axios.post(`${API_URL}/players`, playerPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Navigate to players page
      navigate('/players');
    } catch (err) {
      console.error('🔍 [Register] Error:', err);
      setError(err.response?.data?.error || 'Registration failed');
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
          width: 500, 
          borderRadius: 4, 
          background: '#fff', 
          color: '#1c2c4d', 
          boxShadow: '0 8px 32px rgba(28,44,77,0.12)', 
          border: '1.5px solid #e0e3e8'
        }}
      >
        <Typography variant="h4" align="center" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 700, mb: 3 }}>
          Register
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <form onSubmit={handleSubmit}>
          {/* User Information Section */}
          <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 600, mb: 2, mt: 2 }}>
            Account Information
          </Typography>
          
          <TextField 
            label="Full Name *" 
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
            label="Email *" 
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
            label="Password *" 
            name="password" 
            type="password" 
            value={formData.password} 
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
            label="Confirm Password *" 
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

          {/* Player Information Section */}
          <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 600, mb: 2, mt: 4 }}>
            Player Information
          </Typography>
          
          <TextField 
            label="Age" 
            name="age" 
            value={formData.age} 
            onChange={handleChange} 
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
                <InputLabel sx={{ color: '#1c2c4d' }}>Player Level *</InputLabel>
                <Select
                  name="player_level"
                  value={formData.player_level || ''}
                  onChange={handleChange}
                  label="Player Level *"
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
                <InputLabel sx={{ color: '#1c2c4d' }}>Position *</InputLabel>
                <Select
                  name="position"
                  value={formData.position || ''}
                  onChange={handleChange}
                  label="Position *"
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
                  {POSITIONS.map(pos => (
                    <MenuItem key={pos.value} value={pos.value}>{pos.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
          
          {formData.player_level === 'youth' && (
            <>
              <TextField 
                label="Travel Team" 
                name="travel_team" 
                value={formData.travel_team || ''} 
                onChange={handleChange} 
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
                value={formData.little_league || ''} 
                onChange={handleChange} 
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
          
          {formData.player_level === 'high_school' && (
            <>
              <TextField 
                label="High School Team" 
                name="high_school" 
                value={formData.high_school || ''} 
                onChange={handleChange} 
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
                value={formData.travel_team || ''} 
                onChange={handleChange} 
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
          
          {formData.player_level === 'college' && (
            <TextField 
              label="College Name" 
              name="college" 
              value={formData.college || ''} 
              onChange={handleChange} 
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
          
          {formData.player_level === 'professional' && (
            <TextField 
              label="Team Name" 
              name="team_name" 
              value={formData.team_name || ''} 
              onChange={handleChange} 
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
            value={formData.graduation_year} 
            onChange={handleChange} 
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
              mt: 4, 
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
              !formData.name ||
              !formData.email ||
              !formData.password ||
              !formData.confirmPassword ||
              !formData.player_level ||
              !formData.position ||
              loading
            }
            startIcon={loading && <CircularProgress size={18} />}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default Register; 