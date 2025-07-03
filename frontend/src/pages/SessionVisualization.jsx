import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import FilterList from '@mui/icons-material/FilterList';
import Analytics from '@mui/icons-material/Analytics';
import SprayChart from '../components/visualizations/SprayChart';
import api from '../services/api';

const SessionVisualization = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [swingData, setSwingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    launchAngleRange: null,
    exitVelocityMin: null,
    direction: ''
  });
  const [filteredMetrics, setFilteredMetrics] = useState(null);

  useEffect(() => {
    loadSessionData();
  }, [id]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load session details
      const sessionResponse = await api.get(`/sessions/${id}`);
      setSession(sessionResponse.data);

      // Load swing data for Hittrax sessions
      if (sessionResponse.data.session_type === 'hittrax') {
        try {
          const swingsResponse = await api.get(`/sessions/${id}/swings`);
          setSwingData(swingsResponse.data);
        } catch (swingError) {
          console.error('Error loading swing data:', swingError);
          setError('Failed to load swing data. The session may not have spray chart data available.');
          setSwingData([]);
        }
      } else {
        setSwingData([]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading session data:', err);
      setError(err.response?.data?.error || 'Failed to load session data');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!swingData.length) return;

    const filtered = swingData.filter(swing => {
      if (filters.launchAngleRange) {
        const [min, max] = filters.launchAngleRange;
        if (swing.launch_angle < min || swing.launch_angle > max) return false;
      }
      if (filters.exitVelocityMin && swing.exit_velocity < filters.exitVelocityMin) return false;
      if (filters.direction && !matchesDirection(swing.horiz_angle, filters.direction)) return false;
      return true;
    });

    // Calculate metrics for filtered data
    if (filtered.length > 0) {
      const maxEV = Math.max(...filtered.map(s => s.exit_velocity));
      const avgEV = filtered.reduce((sum, s) => sum + s.exit_velocity, 0) / filtered.length;
      const avgLA = filtered.reduce((sum, s) => sum + s.launch_angle, 0) / filtered.length;
      
      setFilteredMetrics({
        maxExitVelocity: maxEV.toFixed(1),
        avgExitVelocity: avgEV.toFixed(1),
        avgLaunchAngle: avgLA.toFixed(1),
        swingCount: filtered.length
      });
    } else {
      setFilteredMetrics(null);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, swingData]);

  const matchesDirection = (horizAngle, direction) => {
    if (!horizAngle) return true;
    
    switch (direction) {
      case 'pull':
        return horizAngle < -15;
      case 'center':
        return horizAngle >= -15 && horizAngle <= 15;
      case 'oppo':
        return horizAngle > 15;
      default:
        return true;
    }
  };

  const handleSwingClick = (swing) => {
    console.log('Selected swing:', swing);
  };

  const clearFilters = () => {
    setFilters({
      launchAngleRange: null,
      exitVelocityMin: null,
      direction: ''
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">Session not found</Alert>
      </Container>
    );
  }

  if (session.session_type !== 'hittrax') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">
          Spray chart visualization is only available for Hittrax sessions.
        </Alert>
      </Container>
    );
  }

  if (swingData.length === 0 && !loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/sessions/${id}`)}
            sx={{ mb: 2 }}
          >
            Back to Session
          </Button>
          <Typography variant="h4" gutterBottom>
            Session Visualization
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {session.player?.name} - {new Date(session.session_date).toLocaleDateString()}
          </Typography>
        </Box>
        
        <Paper elevation={2} sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            No spray chart data available for this session.
          </Alert>
          <Typography variant="body1" gutterBottom>
            This session doesn't contain spray chart coordinates. To visualize spray charts:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>Upload a Hittrax CSV file with spray chart data</li>
            <li>Ensure the CSV contains columns for spray chart X, Z coordinates, and horizontal angle</li>
            <li>Re-upload the session data if needed</li>
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/sessions/${id}`)}
          sx={{ mb: 2 }}
        >
          Back to Session
        </Button>
        <Typography variant="h4" gutterBottom>
          Session Visualization
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {session.player?.name} - {new Date(session.session_date).toLocaleDateString()}
        </Typography>
      </Box>

      {/* Filter Controls */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
          <FilterList />
          <Typography variant="h6">Filter Controls</Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography gutterBottom>Launch Angle Range</Typography>
            <Box sx={{ px: 2 }}>
              <Slider
                value={filters.launchAngleRange || [0, 50]}
                onChange={(_, value) => setFilters(prev => ({ ...prev, launchAngleRange: value }))}
                valueLabelDisplay="auto"
                min={0}
                max={50}
                marks={[
                  { value: 0, label: '0°' },
                  { value: 15, label: '15°' },
                  { value: 25, label: '25°' },
                  { value: 35, label: '35°' },
                  { value: 50, label: '50°' }
                ]}
              />
            </Box>
            <Box display="flex" gap={1} mt={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setFilters(prev => ({ ...prev, launchAngleRange: [15, 25] }))}
              >
                15-25°
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setFilters(prev => ({ ...prev, launchAngleRange: [25, 35] }))}
              >
                25-35°
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setFilters(prev => ({ ...prev, launchAngleRange: [35, 50] }))}
              >
                35°+
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography gutterBottom>Exit Velocity</Typography>
            <TextField
              type="number"
              label="Minimum EV (mph)"
              value={filters.exitVelocityMin || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, exitVelocityMin: e.target.value ? Number(e.target.value) : null }))}
              fullWidth
              size="small"
            />
            <Box display="flex" gap={1} mt={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setFilters(prev => ({ ...prev, exitVelocityMin: 90 }))}
              >
                90+ mph
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setFilters(prev => ({ ...prev, exitVelocityMin: 95 }))}
              >
                95+ mph
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Direction</InputLabel>
              <Select
                value={filters.direction}
                onChange={(e) => setFilters(prev => ({ ...prev, direction: e.target.value }))}
                label="Direction"
              >
                <MenuItem value="">All Directions</MenuItem>
                <MenuItem value="pull">Pull</MenuItem>
                <MenuItem value="center">Center</MenuItem>
                <MenuItem value="oppo">Oppo</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              size="small"
              onClick={clearFilters}
              sx={{ mt: 1 }}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Spray Chart */}
        <Grid item xs={12} lg={8}>
          <SprayChart
            data={swingData}
            filters={filters}
            onSwingClick={handleSwingClick}
          />
        </Grid>

        {/* Metrics Panel */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={3} sx={{ p: 3, height: 'fit-content' }}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
              <Analytics />
              <Typography variant="h6">Metrics</Typography>
            </Box>

            {filteredMetrics ? (
              <>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Filtered Data ({filteredMetrics.swingCount} swings)
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Max Exit Velocity
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {filteredMetrics.maxExitVelocity} mph
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Average Exit Velocity
                  </Typography>
                  <Typography variant="h5" color="secondary">
                    {filteredMetrics.avgExitVelocity} mph
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Average Launch Angle
                  </Typography>
                  <Typography variant="h5" color="info.main">
                    {filteredMetrics.avgLaunchAngle}°
                  </Typography>
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No data matches current filters
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              All Data ({swingData.length} swings)
            </Typography>
            
            {session.metrics?.exitVelocity && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Max Exit Velocity
                  </Typography>
                  <Typography variant="h6">
                    {session.metrics.exitVelocity.maxExitVelocity} mph
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Average Exit Velocity
                  </Typography>
                  <Typography variant="h6">
                    {session.metrics.exitVelocity.avgExitVelocity} mph
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Launch Angle (Top 5% EV)
                  </Typography>
                  <Typography variant="h6">
                    {session.metrics.exitVelocity.launchAngleTop5}°
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Average Launch Angle
                  </Typography>
                  <Typography variant="h6">
                    {session.metrics.exitVelocity.avgLaunchAngle}°
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Filtered Swings Table */}
      {swingData.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Swing Details
          </Typography>
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            <Grid container spacing={1}>
              {swingData
                .filter(swing => {
                  if (filters.launchAngleRange) {
                    const [min, max] = filters.launchAngleRange;
                    if (swing.launch_angle < min || swing.launch_angle > max) return false;
                  }
                  if (filters.exitVelocityMin && swing.exit_velocity < filters.exitVelocityMin) return false;
                  if (filters.direction && !matchesDirection(swing.horiz_angle, filters.direction)) return false;
                  return true;
                })
                .slice(0, 20) // Show first 20 filtered swings
                .map((swing, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined" sx={{ p: 1 }}>
                      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Chip label={`EV: ${swing.exit_velocity} mph`} size="small" color="primary" />
                          <Chip label={`LA: ${swing.launch_angle}°`} size="small" color="secondary" />
                          <Chip label={`Dist: ${swing.distance} ft`} size="small" color="info" />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default SessionVisualization; 