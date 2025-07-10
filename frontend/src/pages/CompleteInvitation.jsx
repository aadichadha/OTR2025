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

  if (verifying) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress />
          <Typography variant="h6" color="text.secondary">
            Verifying your invitation...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error && !invitationData) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Error color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" color="error" gutterBottom>
              Invitation Error
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {error}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/login')}
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" color="success.main" gutterBottom>
              Registration Complete!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your account has been successfully created. Redirecting you to your dashboard...
            </Typography>
            <CircularProgress size={24} />
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <Lock color="primary" />
              <Typography variant="h5" component="h1">
                Complete Your Registration
              </Typography>
            </Box>
          }
          subheader={`Welcome, ${invitationData?.name}! Please create your password to complete your account setup.`}
        />
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap={3}>
              {error && (
                <Alert severity="error">
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
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !formData.password || !formData.confirmPassword}
                sx={{ 
                  py: 1.5,
                  bgcolor: '#1a2340',
                  '&:hover': {
                    bgcolor: '#3a7bd5'
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

          <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
            <Typography variant="body2" color="text.secondary">
              <strong>Account Details:</strong>
              <br />
              Name: {invitationData?.name}
              <br />
              Email: {invitationData?.email}
              <br />
              Expires: {invitationData?.expires_at ? new Date(invitationData.expires_at).toLocaleDateString() : 'Unknown'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CompleteInvitation; 