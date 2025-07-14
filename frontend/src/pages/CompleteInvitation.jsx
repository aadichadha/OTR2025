import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import { Lock, CheckCircle, Error } from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const CompleteInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitationData, setInvitationData] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      setVerifying(false);
      return;
    }

    // Verify the invitation token
    verifyInvitation();
  }, [token]);

  const verifyInvitation = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/verify-invitation/${token}`);
      setInvitationData(response.data.user);
      setVerifying(false);
    } catch (error) {
      console.error('Invitation verification error:', error);
      setError(error.response?.data?.error || 'Invalid or expired invitation link.');
      setVerifying(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/complete-invitation`, {
        token,
        password: formData.password
      });

      setSuccess(true);
      
      // Store the token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Complete invitation error:', error);
      setError(error.response?.data?.error || 'Failed to complete invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const NAVY = '#1c2c4d';

  if (verifying) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: NAVY, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4
      }}>
        <Container maxWidth="sm">
          <Paper sx={{ 
            p: 4, 
            bgcolor: '#fff', 
            borderRadius: 4, 
            boxShadow: '0 4px 32px rgba(28,44,77,0.10)', 
            border: '2.5px solid #1c2c4d',
            textAlign: 'center'
          }}>
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <CircularProgress sx={{ color: NAVY }} />
              <Typography variant="h6" sx={{ color: NAVY, fontWeight: 600 }}>
                Verifying your invitation...
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (error && !invitationData) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: NAVY, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4
      }}>
        <Container maxWidth="sm">
          <Paper sx={{ 
            p: 4, 
            bgcolor: '#fff', 
            borderRadius: 4, 
            boxShadow: '0 4px 32px rgba(28,44,77,0.10)', 
            border: '2.5px solid #1c2c4d',
            textAlign: 'center'
          }}>
            <Error sx={{ fontSize: 64, mb: 2, color: '#d32f2f' }} />
            <Typography variant="h5" sx={{ color: NAVY, fontWeight: 700, mb: 2 }}>
              Invitation Error
            </Typography>
            <Typography variant="body1" sx={{ color: NAVY, mb: 3 }}>
              {error}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/login')}
              sx={{ 
                bgcolor: NAVY,
                color: '#fff',
                fontWeight: 700,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                '&:hover': {
                  bgcolor: '#3a7bd5'
                }
              }}
            >
              Go to Login
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: NAVY, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4
      }}>
        <Container maxWidth="sm">
          <Paper sx={{ 
            p: 4, 
            bgcolor: '#fff', 
            borderRadius: 4, 
            boxShadow: '0 4px 32px rgba(28,44,77,0.10)', 
            border: '2.5px solid #1c2c4d',
            textAlign: 'center'
          }}>
            <CheckCircle sx={{ fontSize: 64, mb: 2, color: '#2e7d32' }} />
            <Typography variant="h5" sx={{ color: NAVY, fontWeight: 700, mb: 2 }}>
              Registration Complete!
            </Typography>
            <Typography variant="body1" sx={{ color: NAVY, mb: 3 }}>
              Your account has been successfully created. Redirecting you to your dashboard...
            </Typography>
            <CircularProgress size={24} sx={{ color: NAVY }} />
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: NAVY, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      py: 4
    }}>
      <Container maxWidth="sm">
        <Paper sx={{ 
          p: 4, 
          bgcolor: '#fff', 
          borderRadius: 4, 
          boxShadow: '0 4px 32px rgba(28,44,77,0.10)', 
          border: '2.5px solid #1c2c4d'
        }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
              <Lock sx={{ color: NAVY, fontSize: 32 }} />
              <Typography variant="h4" component="h1" sx={{ color: NAVY, fontWeight: 700 }}>
                Complete Your Registration
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: NAVY, fontSize: '1.1rem' }}>
              Welcome, <strong>{invitationData?.name}</strong>! Please create your password to complete your account setup.
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap={3}>
              {error && (
                <Alert severity="error" sx={{ 
                  bgcolor: '#ffebee', 
                  color: '#c62828',
                  border: '1px solid #ffcdd2'
                }}>
                  {error}
                </Alert>
              )}

              <TextField
                label="New Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                fullWidth
                helperText="Password must be at least 6 characters long"
                disabled={loading}
                sx={{
                  '& .MuiInputLabel-root': { color: NAVY, fontWeight: 600 },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: NAVY, borderWidth: 2 },
                    '&:hover fieldset': { borderColor: '#3a7bd5' },
                    '&.Mui-focused fieldset': { borderColor: NAVY, borderWidth: 2 }
                  },
                  '& .MuiInputBase-input': { color: NAVY, fontWeight: 500 },
                  '& .MuiFormHelperText-root': { color: NAVY }
                }}
              />

              <TextField
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                fullWidth
                disabled={loading}
                sx={{
                  '& .MuiInputLabel-root': { color: NAVY, fontWeight: 600 },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: NAVY, borderWidth: 2 },
                    '&:hover fieldset': { borderColor: '#3a7bd5' },
                    '&.Mui-focused fieldset': { borderColor: NAVY, borderWidth: 2 }
                  },
                  '& .MuiInputBase-input': { color: NAVY, fontWeight: 500 }
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !formData.password || !formData.confirmPassword}
                sx={{ 
                  py: 2,
                  bgcolor: NAVY,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  borderRadius: 3,
                  border: '2px solid #1c2c4d',
                  '&:hover': {
                    bgcolor: '#3a7bd5',
                    borderColor: '#3a7bd5'
                  },
                  '&:disabled': {
                    bgcolor: '#ccc',
                    color: '#666',
                    borderColor: '#ccc'
                  }
                }}
              >
                {loading ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={20} color="inherit" />
                    Creating Account...
                  </Box>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </Box>
          </form>

          <Box mt={4} p={3} sx={{ 
            bgcolor: '#f8f9fa', 
            borderRadius: 3, 
            border: '1px solid #e0e3e8'
          }}>
            <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 2 }}>
              Account Details:
            </Typography>
            <Typography variant="body2" sx={{ color: NAVY, lineHeight: 1.8 }}>
              <strong>Name:</strong> {invitationData?.name}<br />
              <strong>Email:</strong> {invitationData?.email}<br />
              <strong>Expires:</strong> {invitationData?.expires_at ? new Date(invitationData.expires_at).toLocaleDateString() : 'Unknown'}
            </Typography>
          </Box>
                 </Paper>
       </Container>
     </Box>
   );
};

export default CompleteInvitation; 