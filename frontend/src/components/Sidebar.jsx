import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Divider, Box } from '@mui/material';
import { Home, CloudUpload, Group, Assessment, EmojiEvents, Menu, Logout } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Home', icon: <Home />, to: '/' },
  { label: 'Upload', icon: <CloudUpload />, to: '/upload' },
  { label: 'Players', icon: <Group />, to: '/players' },
  { label: 'Analytics', icon: <Assessment />, to: '/analytics/dashboard' },
  { label: 'Leaderboards', icon: <EmojiEvents />, to: '/analytics' },
];

const NAVY = '#1c2c4d';

const Sidebar = ({ onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const drawer = (
    <Box sx={{ width: 240, bgcolor: '#fff', height: '100%', pt: 2 }}>
      {/* No logo/text above menu, menu is at the top */}
      <List sx={{ color: NAVY }}>
        {navItems.map((item) => {
          const selected = location.pathname === item.to;
          return (
            <ListItem
              button
              key={item.label}
              component={Link}
              to={item.to}
              selected={selected}
              onClick={() => setMobileOpen(false)}
              sx={{
                color: NAVY,
                fontWeight: selected ? 700 : 500,
                '& .MuiListItemIcon-root': {
                  color: NAVY,
                },
                borderLeft: selected ? '4px solid #3a7bd5' : '4px solid transparent',
                background: selected ? 'rgba(58,123,213,0.08)' : 'none',
                mb: 0.5,
                borderRadius: 2,
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ color: NAVY, fontWeight: selected ? 700 : 500 }} />
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ my: 2 }} />
      <List sx={{ color: NAVY }}>
        <ListItem button onClick={onLogout} sx={{ color: NAVY, '& .MuiListItemIcon-root': { color: NAVY } }}>
          <ListItemIcon><Logout /></ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ color: NAVY, fontWeight: 500 }} />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      {/* Hamburger for mobile */}
      <IconButton
        color="primary"
        aria-label="open drawer"
        edge="start"
        onClick={() => setMobileOpen(true)}
        sx={{ display: { sm: 'none' }, position: 'fixed', top: 16, left: 16, zIndex: 1300 }}
      >
        <Menu />
      </IconButton>
      {/* Sidebar for desktop, Drawer for mobile */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240, bgcolor: '#fff', color: NAVY },
        }}
        open
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240, bgcolor: '#fff', color: NAVY },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Sidebar; 