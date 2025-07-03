import React from 'react';
import { Box, Container, Typography, Button, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      {/* Removed floating logo box */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="md">
          <Paper elevation={6} sx={{ p: 6, borderRadius: 4, background: '#fff', color: '#1c2c4d', boxShadow: '0 8px 32px rgba(28,44,77,0.12)', border: '1.5px solid #e0e3e8' }}>
            <Grid container spacing={4} alignItems="center" justifyContent="center">
              <Grid item xs={12} md={12} sx={{ textAlign: 'center' }}>
                {/* Main logo */}
                <img src="/images/otrbaseball-main.png" alt="OTR Baseball Main Logo" style={{ maxWidth: 320, width: '100%', marginBottom: 16 }} />
                <Typography variant="h5" sx={{ color: '#1c2c4d', mb: 2 }} gutterBottom>
                  Unlock your game. Track, compare, and improve your swing with pro-level analytics.
                </Typography>
                <Typography variant="body1" sx={{ color: '#6c7a89', mb: 4 }}>
                  Upload your Blast or Hittrax data, tag sessions, and get instant insights. Visualize your progress, compare sessions, and see how you stack up against the best.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  color="primary"
                  sx={{ fontWeight: 700, fontSize: '1.2rem', px: 4, py: 1.5, borderRadius: 2, mr: 2 }}
                  onClick={() => navigate('/register')}
                >
                  Register
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  color="primary"
                  sx={{ fontWeight: 700, fontSize: '1.2rem', px: 4, py: 1.5, borderRadius: 2 }}
                  onClick={() => navigate('/login')}
                >
                  Log In
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing; 