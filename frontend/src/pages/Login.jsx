import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  CircularProgress, 
  Paper,
  Chip
} from '@mui/material';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await login(formData);
      
      if (result.success) {
        // Redirect based on role returned from backend
        switch (result.user.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'coach':
            navigate('/coach/dashboard');
            break;
          case 'player':
            navigate('/player/dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
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
          width: 400, 
          borderRadius: 4, 
          background: '#fff', 
          color: '#1c2c4d', 
          boxShadow: '0 8px 32px rgba(28,44,77,0.12)', 
          border: '1.5px solid #e0e3e8'
        }}
      >
        <Typography variant="h4" align="center" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 700, mb: 2 }}>
          Login
        </Typography>
        
        <Typography variant="body2" align="center" sx={{ color: '#1c2c4d', opacity: 0.7, mb: 4 }}>
          Enter your credentials to access your account
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
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
              '&:hover': {
                background: 'linear-gradient(135deg, #2d5aa0 0%, #1c2c4d 100%)',
              }
            }}
            disabled={loading}
            startIcon={loading && <CircularProgress size={18} />}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        {/* Demo Credentials */}
        <Box sx={{ mt: 4, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e0e3e8' }}>
          <Typography variant="caption" sx={{ color: '#1c2c4d', fontWeight: 600, display: 'block', mb: 1 }}>
            Demo Credentials:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Chip 
              label="Admin: admin@otr.com / password123" 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
            <Chip 
              label="Coach: coach@otr.com / password123" 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
            <Chip 
              label="Player: player@otr.com / password123" 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login; 