import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar, Menu, MenuItem, Chip } from '@mui/material';
import Home from '@mui/icons-material/Home';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Group from '@mui/icons-material/Group';
import Assessment from '@mui/icons-material/Assessment';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import Logout from '@mui/icons-material/Logout';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import Sports from '@mui/icons-material/Sports';
import Person from '@mui/icons-material/Person';
import Timeline from '@mui/icons-material/Timeline';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

const NAVY = '#1c2c4d';

const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  // Role-based navigation items
  const getNavItems = () => {
    if (user?.role === 'player') {
      return [
        { label: 'Home', icon: <Home />, to: '/dashboard' },
        { label: 'My Progression', icon: <Assessment />, to: '/my-progression' },
        { label: 'Leaderboard', icon: <EmojiEvents />, to: '/leaderboard' },
        { label: 'Statistics', icon: <Timeline />, to: '/player/statistics' }
      ];
    }
    const baseItems = [
      { label: 'Home', icon: <Home />, to: '/dashboard' }
    ];

    // Add role-specific items
    if (hasPermission('view_own_data')) {
      baseItems.push({ label: 'Upload', icon: <CloudUpload />, to: '/upload' });
    }

    if (hasPermission('view_all_players')) {
      baseItems.push({ label: 'Players', icon: <Group />, to: '/players' });
    }

    if (hasPermission('view_analytics') && user?.role !== 'player') {
      baseItems.push({ label: 'Analytics', icon: <Assessment />, to: '/analytics' });
    }

    // Add admin-specific items
    if (user?.role === 'admin') {
      baseItems.push({ label: 'User Management', icon: <AdminPanelSettings />, to: '/admin/dashboard' });
    }

    // Add coach-specific items
    if (user?.role === 'coach') {
      baseItems.push({ label: 'Progression', icon: <Assessment />, to: '/progression' });
      baseItems.push({ label: 'Statistics', icon: <Timeline />, to: '/statistics' });
      baseItems.push({ label: 'Leaderboard', icon: <EmojiEvents />, to: '/leaderboard' });
    }

    return baseItems;
  };

  const navItems = getNavItems();

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettings />;
      case 'coach':
        return <Sports />;
      case 'player':
        return <Person />;
      default:
        return <Person />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#d32f2f';
      case 'coach':
        return '#1976d2';
      case 'player':
        return '#388e3c';
      default:
        return '#757575';
    }
  };

  if (!user) {
    return null; // Don't show topbar for unauthenticated users
  }

  return (
    <AppBar 
      position="static" 
      sx={{ 
        bgcolor: '#fff', 
        boxShadow: '0 2px 12px rgba(28,44,77,0.08)',
        borderBottom: '2px solid #3a7bd5'
      }}
    >
      <Toolbar sx={{ px: { xs: 1, sm: 4 }, py: 1 }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <img 
            src="/images/otrbaseball-simple.png" 
            alt="OTR Baseball" 
            style={{ height: 40, marginRight: 8 }} 
          />
          <Typography 
            variant="h6" 
            sx={{ 
              color: NAVY, 
              fontWeight: 700, 
              letterSpacing: 1.2,
              fontSize: { xs: '1.1rem', sm: '1.4rem' }
            }}
          >
            OTR Baseball
          </Typography>
        </Box>
        {/* Mobile Hamburger Menu */}
        {isMobile ? (
          <>
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: NAVY, ml: 1 }}>
              <MenuIcon fontSize="large" />
            </IconButton>
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
              <Box sx={{ width: 250, p: 2 }} role="presentation" onClick={() => setDrawerOpen(false)}>
                <List>
                  {navItems.map((item) => (
                    <ListItem button key={item.label} component={Link} to={item.to}>
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItem>
                  ))}
                  <ListItem button onClick={handleProfile}>
                    <ListItemIcon>{getRoleIcon(user.role)}</ListItemIcon>
                    <ListItemText primary="Profile Settings" />
                  </ListItem>
                  <ListItem button onClick={handleLogout}>
                    <ListItemIcon><Logout /></ListItemIcon>
                    <ListItemText primary="Logout" />
                  </ListItem>
                </List>
              </Box>
            </Drawer>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
            {navItems.map((item) => {
              const selected = location.pathname === item.to;
              return (
                <Button
                  key={item.label}
                  component={Link}
                  to={item.to}
                  startIcon={item.icon}
                  sx={{
                    color: selected ? '#fff' : NAVY,
                    fontWeight: selected ? 700 : 500,
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    background: selected 
                      ? NAVY
                      : 'transparent',
                    border: selected ? 'none' : '1px solid #e0e3e8',
                    transition: 'all 0.2s ease',
                    '& .MuiButton-startIcon, & .MuiSvgIcon-root': {
                      color: selected ? '#fff' : NAVY,
                    },
                    '&:hover': {
                      background: selected 
                        ? NAVY
                        : 'rgba(58,123,213,0.08)',
                      borderColor: selected ? 'transparent' : '#3a7bd5',
                      transform: 'translateY(-1px)',
                      boxShadow: selected 
                        ? '0 4px 12px rgba(28,44,77,0.18)'
                        : '0 2px 8px rgba(58,123,213,0.15)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -2,
                      left: -2,
                      right: -2,
                      bottom: -2,
                      borderRadius: 4,
                      background: selected 
                        ? NAVY
                        : 'transparent',
                      zIndex: -1,
                      opacity: selected ? 0.15 : 0,
                      transition: 'opacity 0.2s ease',
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>
        )}
        {/* User Profile Section (desktop only) */}
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Role Badge */}
            <Chip
              icon={getRoleIcon(user.role)}
              label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              size="small"
              sx={{
                bgcolor: getRoleColor(user.role),
                color: '#fff',
                fontWeight: 600,
                '& .MuiChip-icon': {
                  color: '#fff',
                }
              }}
            />
            {/* User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: NAVY, fontWeight: 600 }}>
                {user.name}
              </Typography>
              <IconButton
                onClick={handleMenuOpen}
                sx={{
                  color: NAVY,
                  border: '1px solid #e0e3e8',
                  borderRadius: 2,
                  '&:hover': {
                    background: 'rgba(58,123,213,0.08)',
                    borderColor: '#3a7bd5',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(58,123,213,0.15)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: getRoleColor(user.role) }}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Box>
            {/* Logout Button */}
            <IconButton 
              onClick={handleLogout} 
              sx={{ 
                color: NAVY,
                border: '1px solid #e0e3e8',
                borderRadius: 2,
                '&:hover': {
                  background: 'rgba(244,67,54,0.08)',
                  borderColor: '#f44336',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(244,67,54,0.15)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Logout />
            </IconButton>
          </Box>
        )}
        {/* User Menu Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          sx={{
            '& .MuiPaper-root': {
              mt: 1,
              minWidth: 200,
              bgcolor: '#fff',
              boxShadow: '0 4px 20px rgba(28,44,77,0.15)',
              border: '2px solid #1c2c4d',
              borderRadius: 3,
              color: NAVY,
            },
            '& .MuiMenuItem-root': {
              color: NAVY,
              '&:hover': {
                bgcolor: 'rgba(28,44,77,0.08)',
              },
            }
          }}
        >
          <MenuItem onClick={handleProfile} sx={{ color: NAVY }}>
            Profile Settings
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ color: '#f44336' }}>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar; 