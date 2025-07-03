import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Button } from '@mui/material';
import { Upload, People, Assessment } from '@mui/icons-material';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 6,
      }}
    >
      <img
        src="/images/otrbaseball-simple.png"
        alt="OTR Baseball Logo"
        style={{
          maxWidth: '280px',
          width: '90%',
          marginBottom: 32,
          border: '3px solid white',
          borderRadius: '8px',
          padding: '8px',
          backgroundColor: 'white',
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      />
      
      <Typography variant="h6" align="center" sx={{ mb: 6, color: 'white' }}>
        Professional baseball analytics platform for tracking player performance and generating detailed reports
      </Typography>
      
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent>
              <Upload sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom color="primary">Upload Data</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload Blast or Hittrax CSV files to analyze player performance metrics
              </Typography>
              <Button 
                variant="contained" 
                component={Link} 
                to="/upload"
                fullWidth
              >
                Start Upload
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent>
              <People sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom color="primary">Manage Players</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View and manage player profiles, sessions, and performance history
              </Typography>
              <Button 
                variant="contained" 
                component={Link} 
                to="/players"
                fullWidth
              >
                View Players
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent>
              <Assessment sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom color="primary">Generate Reports</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create detailed performance reports with benchmarks and analysis
              </Typography>
              <Button 
                variant="contained" 
                component={Link} 
                to="/upload"
                fullWidth
              >
                Create Report
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 