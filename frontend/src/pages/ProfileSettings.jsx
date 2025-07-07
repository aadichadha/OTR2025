import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NAVY = '#1c2c4d';

const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    role: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        role: user.role || ''
      }));
    }
  }, [user]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear messages when user starts typing
    setSuccess('');
    setError('');
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const updateData = {
        name: formData.name,
        email: formData.email
      };

      const result = await updateProfile(updateData);
      
      if (result.success) {
        setSuccess('Profile updated successfully!');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setSuccess('Password changed successfully!');
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: NAVY, py: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 800, bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 32px rgba(28,44,77,0.10)', border: '2px solid #1c2c4d', p: { xs: 2, sm: 4 } }}>
        <Typography variant="h3" align="center" sx={{ fontWeight: 900, color: NAVY, mb: 3, letterSpacing: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
          Profile Settings
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <Grid container spacing={4}>
          {/* Profile Information */}
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PersonIcon sx={{ color: NAVY, mr: 1 }} />
                  <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700 }}>
                    Profile Information
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  margin="normal"
                  sx={{
                    '& .MuiInputBase-input': { color: NAVY },
                    '& .MuiInputLabel-root': { color: NAVY },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: NAVY },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' }
                  }}
                />

                <TextField
                  fullWidth
                  label="Email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  margin="normal"
                  type="email"
                  sx={{
                    '& .MuiInputBase-input': { color: NAVY },
                    '& .MuiInputLabel-root': { color: NAVY },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: NAVY },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' }
                  }}
                />

                <FormControl fullWidth margin="normal">
                  <InputLabel sx={{ color: NAVY }}>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    disabled
                    sx={{
                      color: NAVY,
                      '& .MuiSelect-select': { color: NAVY },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: NAVY }
                    }}
                  >
                    <MenuItem value="admin" sx={{ color: NAVY }}>Admin</MenuItem>
                    <MenuItem value="coach" sx={{ color: NAVY }}>Coach</MenuItem>
                    <MenuItem value="player" sx={{ color: NAVY }}>Player</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  sx={{
                    bgcolor: NAVY,
                    color: '#fff',
                    fontWeight: 700,
                    mt: 3,
                    py: 1.5,
                    '&:hover': { bgcolor: '#3a7bd5' },
                    '&:disabled': { bgcolor: '#ccc' }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Update Profile'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Change Password */}
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#f8f9fa', border: '1.5px solid #1c2c4d', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <LockIcon sx={{ color: NAVY, mr: 1 }} />
                  <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700 }}>
                    Change Password
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  label="Current Password"
                  value={formData.currentPassword}
                  onChange={handleInputChange('currentPassword')}
                  margin="normal"
                  type="password"
                  sx={{
                    '& .MuiInputBase-input': { color: NAVY },
                    '& .MuiInputLabel-root': { color: NAVY },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: NAVY },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' }
                  }}
                />

                <TextField
                  fullWidth
                  label="New Password"
                  value={formData.newPassword}
                  onChange={handleInputChange('newPassword')}
                  margin="normal"
                  type="password"
                  sx={{
                    '& .MuiInputBase-input': { color: NAVY },
                    '& .MuiInputLabel-root': { color: NAVY },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: NAVY },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' }
                  }}
                />

                <TextField
                  fullWidth
                  label="Confirm New Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  margin="normal"
                  type="password"
                  sx={{
                    '& .MuiInputBase-input': { color: NAVY },
                    '& .MuiInputLabel-root': { color: NAVY },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: NAVY },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3a7bd5' }
                  }}
                />

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<LockIcon />}
                  onClick={handleChangePassword}
                  disabled={loading}
                  sx={{
                    borderColor: NAVY,
                    color: NAVY,
                    fontWeight: 700,
                    mt: 3,
                    py: 1.5,
                    '&:hover': { borderColor: '#3a7bd5', color: '#3a7bd5' },
                    '&:disabled': { borderColor: '#ccc', color: '#ccc' }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Change Password'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/dashboard')}
            sx={{
              borderColor: NAVY,
              color: NAVY,
              fontWeight: 700,
              px: 4,
              py: 1.5,
              '&:hover': { borderColor: '#3a7bd5', color: '#3a7bd5' }
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileSettings; 