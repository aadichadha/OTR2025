import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar, Menu, MenuItem } from '@mui/material';
import Home from '@mui/icons-material/Home';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Group from '@mui/icons-material/Group';
import Assessment from '@mui/icons-material/Assessment';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import Logout from '@mui/icons-material/Logout';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Home', icon: <Home />, to: '/' },
  { label: 'Upload', icon: <CloudUpload />, to: '/upload' },
  { label: 'Players', icon: <Group />, to: '/players' },
  { label: 'Analytics', icon: <Assessment />, to: '/analytics' },
];

const NAVY = '#1c2c4d';

const Topbar = ({ onLogout }) => {
  const location = useLocation();

  return (
    <AppBar 
      position="static" 
      sx={{ 
        bgcolor: '#fff', 
        boxShadow: '0 2px 12px rgba(28,44,77,0.08)',
        borderBottom: '2px solid #3a7bd5'
      }}
    >
      <Toolbar sx={{ px: 4, py: 1 }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <img 
            src="/images/otrbaseball-simple.png" 
            alt="OTR Baseball" 
            style={{ height: 50, marginRight: 12 }} 
          />
          <Typography 
            variant="h6" 
            sx={{ 
              color: NAVY, 
              fontWeight: 700, 
              letterSpacing: 1.2,
              fontSize: '1.4rem'
            }}
          >
            OTR Baseball
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          <IconButton 
            onClick={onLogout} 
            sx={{ 
              ml: 2,
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
            <Logout />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar; 