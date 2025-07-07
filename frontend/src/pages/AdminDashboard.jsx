import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: ''
  });
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  
  // Password reset dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Create user dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'player'
  });

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page + 1,
        pageSize: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter })
      });
      
      const response = await api.get(`/auth/users/advanced?${params}`);
      setUsers(response.data.users);
      setTotalUsers(response.data.total);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      await api.put(`/auth/users/${editingUser.id}`, editForm);
      setSuccess('User updated successfully');
      setEditDialogOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (user) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/auth/users/${deletingUser.id}`);
      setSuccess('User deleted successfully');
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (user) => {
    setResettingUser(user);
    setNewPassword('');
    setPasswordDialogOpen(true);
  };

  const confirmPasswordReset = async () => {
    try {
      setLoading(true);
      await api.post(`/auth/users/${resettingUser.id}/reset-password`, {
        newPassword
      });
      setSuccess('Password reset successfully');
      setPasswordDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setCreateForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'player'
    });
    setCreateDialogOpen(true);
  };

  const handleSaveCreate = async () => {
    try {
      // Validate form
      if (!createForm.name || !createForm.email || !createForm.password) {
        setError('Name, email, and password are required');
        return;
      }
      
      if (createForm.password !== createForm.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      if (createForm.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      setLoading(true);
      await api.post('/auth/create-user', {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role
      });
      
      setSuccess('User created successfully');
      setCreateDialogOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'coach': return 'warning';
      case 'player': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{
      width: '100%',
      minHeight: 'calc(100vh - 64px)',
      bgcolor: '#1c2c4d', // navy blue background
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
    }}>
      <Box sx={{
        width: '100%',
        maxWidth: 1400,
        bgcolor: '#fff', // white panel
        borderRadius: 3,
        boxShadow: '0 4px 32px rgba(28,44,77,0.10)',
        border: '2px solid #1c2c4d',
        p: { xs: 1, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: '#1c2c4d',
      }}>
        {/* Header */}
        <Box sx={{
          width: '100%',
          bgcolor: '#fff',
          border: '2px solid #1c2c4d',
          borderRadius: 3,
          mb: 3,
          py: 1.2,
          boxShadow: '0 2px 12px rgba(28,44,77,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Typography variant="h3" align="center" className="otr-header" sx={{ fontWeight: 900, color: '#1c2c4d', letterSpacing: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif', m: 0, fontSize: { xs: '2rem', md: '2.5rem' } }}>
            User Management
          </Typography>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
            {success}
          </Alert>
        )}

        {/* Search and Filter Controls */}
        <Grid container spacing={2} sx={{ mb: 3, width: '100%' }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
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
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Filter by Role"
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
                }}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="coach">Coach</MenuItem>
                <MenuItem value="player">Player</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={fetchUsers}
              startIcon={<RefreshIcon />}
              sx={{
                borderColor: '#1c2c4d',
                color: '#1c2c4d',
                '&:hover': {
                  borderColor: '#2d5aa0',
                  backgroundColor: '#f8f9fa',
                },
              }}
            >
              Refresh
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleCreateUser}
              startIcon={<AddIcon />}
              sx={{
                bgcolor: '#1c2c4d',
                color: '#fff',
                '&:hover': {
                  bgcolor: '#2d5aa0',
                },
              }}
            >
              Create User
            </Button>
          </Grid>
        </Grid>

        {/* Users Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#fff', color: '#1c2c4d', fontWeight: 600, borderBottom: '2px solid #1c2c4d' }}>Name</TableCell>
                  <TableCell sx={{ backgroundColor: '#fff', color: '#1c2c4d', fontWeight: 600, borderBottom: '2px solid #1c2c4d' }}>Email</TableCell>
                  <TableCell sx={{ backgroundColor: '#fff', color: '#1c2c4d', fontWeight: 600, borderBottom: '2px solid #1c2c4d' }}>Role</TableCell>
                  <TableCell sx={{ backgroundColor: '#fff', color: '#1c2c4d', fontWeight: 600, borderBottom: '2px solid #1c2c4d' }}>Created</TableCell>
                  <TableCell sx={{ backgroundColor: '#fff', color: '#1c2c4d', fontWeight: 600, borderBottom: '2px solid #1c2c4d' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            onClick={() => handleEditUser(user)}
                            sx={{ color: '#3a7bd5' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset Password">
                          <IconButton
                            size="small"
                            onClick={() => handleResetPassword(user)}
                            sx={{ color: '#ff9800' }}
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteUser(user)}
                            sx={{ color: '#f44336' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalUsers}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>

        {/* Edit User Dialog */}
        <Dialog 
          open={editDialogOpen} 
          onClose={() => setEditDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ 
            sx: { 
              bgcolor: '#fff', 
              borderRadius: 3, 
              border: '2px solid #1c2c4d', 
              color: '#1c2c4d' 
            } 
          }}
        >
          <DialogTitle sx={{ 
            fontFamily: 'Inter, Roboto, Arial, sans-serif', 
            bgcolor: '#fff', 
            borderBottom: '2px solid #1c2c4d',
            color: '#1c2c4d'
          }}>
            Edit User
          </DialogTitle>
          <DialogContent sx={{ bgcolor: '#fff', color: '#1c2c4d' }}>
            <TextField
              fullWidth
              label="Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#1c2c4d',
                  },
                  '&:hover fieldset': {
                    borderColor: '#3a7bd5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3a7bd5',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#1c2c4d',
                },
              }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#1c2c4d',
                  },
                  '&:hover fieldset': {
                    borderColor: '#3a7bd5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3a7bd5',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#1c2c4d',
                },
              }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: '#1c2c4d' }}>Role</InputLabel>
              <Select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                label="Role"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3a7bd5',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3a7bd5',
                  },
                  '& .MuiSelect-icon': {
                    color: '#1c2c4d',
                  },
                }}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="coach">Coach</MenuItem>
                <MenuItem value="player">Player</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#fff', borderTop: '1px solid #1c2c4d' }}>
            <Button 
              onClick={() => setEditDialogOpen(false)}
              sx={{ color: '#1c2c4d' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              variant="contained" 
              disabled={loading}
              sx={{ 
                bgcolor: '#1c2c4d',
                '&:hover': {
                  bgcolor: '#2d5aa0',
                },
              }}
            >
              {loading ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={deleteDialogOpen} 
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{ 
            sx: { 
              bgcolor: '#fff', 
              borderRadius: 3, 
              border: '2px solid #1c2c4d', 
              color: '#1c2c4d' 
            } 
          }}
        >
          <DialogTitle sx={{ 
            fontFamily: 'Inter, Roboto, Arial, sans-serif', 
            bgcolor: '#fff', 
            borderBottom: '2px solid #1c2c4d',
            color: '#1c2c4d'
          }}>
            Confirm Delete
          </DialogTitle>
          <DialogContent sx={{ bgcolor: '#fff', color: '#1c2c4d' }}>
            Are you sure you want to delete {deletingUser?.name}? This action cannot be undone.
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#fff', borderTop: '1px solid #1c2c4d' }}>
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              sx={{ color: '#1c2c4d' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete} 
              color="error" 
              variant="contained" 
              disabled={loading}
              sx={{ 
                bgcolor: '#f44336',
                '&:hover': {
                  bgcolor: '#d32f2f',
                },
              }}
            >
              {loading ? <CircularProgress size={20} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog 
          open={passwordDialogOpen} 
          onClose={() => setPasswordDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ 
            sx: { 
              bgcolor: '#fff', 
              borderRadius: 3, 
              border: '2px solid #1c2c4d', 
              color: '#1c2c4d' 
            } 
          }}
        >
          <DialogTitle sx={{ 
            fontFamily: 'Inter, Roboto, Arial, sans-serif', 
            bgcolor: '#fff', 
            borderBottom: '2px solid #1c2c4d',
            color: '#1c2c4d'
          }}>
            Reset Password for {resettingUser?.name}
          </DialogTitle>
          <DialogContent sx={{ bgcolor: '#fff', color: '#1c2c4d' }}>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              helperText="Password must be at least 6 characters long"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#1c2c4d',
                  },
                  '&:hover fieldset': {
                    borderColor: '#3a7bd5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3a7bd5',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#1c2c4d',
                },
                '& .MuiFormHelperText-root': {
                  color: '#1c2c4d',
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#fff', borderTop: '1px solid #1c2c4d' }}>
            <Button 
              onClick={() => setPasswordDialogOpen(false)}
              sx={{ color: '#1c2c4d' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmPasswordReset} 
              variant="contained" 
              disabled={loading || newPassword.length < 6}
              sx={{ 
                bgcolor: '#1c2c4d',
                '&:hover': {
                  bgcolor: '#2d5aa0',
                },
              }}
            >
              {loading ? <CircularProgress size={20} /> : 'Reset Password'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog 
          open={createDialogOpen} 
          onClose={() => setCreateDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ 
            sx: { 
              bgcolor: '#fff', 
              borderRadius: 3, 
              border: '2px solid #1c2c4d', 
              color: '#1c2c4d' 
            } 
          }}
        >
          <DialogTitle sx={{ 
            fontFamily: 'Inter, Roboto, Arial, sans-serif', 
            bgcolor: '#fff', 
            borderBottom: '2px solid #1c2c4d',
            color: '#1c2c4d'
          }}>
            Create New User
          </DialogTitle>
          <DialogContent sx={{ bgcolor: '#fff', color: '#1c2c4d' }}>
            <TextField
              fullWidth
              label="Name *"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#1c2c4d',
                  },
                  '&:hover fieldset': {
                    borderColor: '#3a7bd5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3a7bd5',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#1c2c4d',
                },
              }}
            />
            <TextField
              fullWidth
              label="Email *"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#1c2c4d',
                  },
                  '&:hover fieldset': {
                    borderColor: '#3a7bd5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3a7bd5',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#1c2c4d',
                },
              }}
            />
            <TextField
              fullWidth
              label="Password *"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              margin="normal"
              helperText="Password must be at least 6 characters long"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#1c2c4d',
                  },
                  '&:hover fieldset': {
                    borderColor: '#3a7bd5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3a7bd5',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#1c2c4d',
                },
                '& .MuiFormHelperText-root': {
                  color: '#1c2c4d',
                },
              }}
            />
            <TextField
              fullWidth
              label="Confirm Password *"
              type="password"
              value={createForm.confirmPassword}
              onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#1c2c4d',
                  },
                  '&:hover fieldset': {
                    borderColor: '#3a7bd5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3a7bd5',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#1c2c4d',
                },
              }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: '#1c2c4d' }}>Role *</InputLabel>
              <Select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                label="Role *"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3a7bd5',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3a7bd5',
                  },
                  '& .MuiSelect-icon': {
                    color: '#1c2c4d',
                  },
                }}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="coach">Coach</MenuItem>
                <MenuItem value="player">Player</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#fff', borderTop: '1px solid #1c2c4d' }}>
            <Button 
              onClick={() => setCreateDialogOpen(false)}
              sx={{ color: '#1c2c4d' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCreate} 
              variant="contained" 
              disabled={loading || !createForm.name || !createForm.email || !createForm.password || createForm.password !== createForm.confirmPassword || createForm.password.length < 6}
              sx={{ 
                bgcolor: '#1c2c4d',
                '&:hover': {
                  bgcolor: '#2d5aa0',
                },
              }}
            >
              {loading ? <CircularProgress size={20} /> : 'Create User'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdminDashboard; 