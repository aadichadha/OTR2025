import React, { useState, useEffect } from 'react';
import { Box, Button, Chip, Typography, Alert } from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';

const NAVY = '#1c2c4d';

const BarrelsFilter = ({ swingData, onFilteredDataChange, showStats = true }) => {
  const [showBarrelsOnly, setShowBarrelsOnly] = useState(false);
  const [barrelsCount, setBarrelsCount] = useState(0);
  const [totalSwings, setTotalSwings] = useState(0);

  useEffect(() => {
    if (swingData && swingData.length > 0) {
      // Calculate top 10% exit velocity threshold
      const exitVelocities = swingData
        .map(swing => parseFloat(swing.exit_velocity))
        .filter(ev => !isNaN(ev) && ev > 0)
        .sort((a, b) => b - a); // Sort descending
      
      const top10PercentIndex = Math.floor(exitVelocities.length * 0.1);
      const top10PercentThreshold = exitVelocities[top10PercentIndex] || 0;
      
      // Count barrels: top 10% EV with launch angle 8-30 degrees
      const barrels = swingData.filter(swing => {
        const exitVel = parseFloat(swing.exit_velocity);
        const launchAngle = parseFloat(swing.launch_angle);
        
        return exitVel >= top10PercentThreshold && 
               launchAngle >= 8 && 
               launchAngle <= 30;
      });
      
      setBarrelsCount(barrels.length);
      setTotalSwings(swingData.length);
    }
  }, [swingData]);

  useEffect(() => {
    if (swingData && swingData.length > 0) {
      if (showBarrelsOnly) {
        // Calculate top 10% exit velocity threshold
        const exitVelocities = swingData
          .map(swing => parseFloat(swing.exit_velocity))
          .filter(ev => !isNaN(ev) && ev > 0)
          .sort((a, b) => b - a); // Sort descending
        
        const top10PercentIndex = Math.floor(exitVelocities.length * 0.1);
        const top10PercentThreshold = exitVelocities[top10PercentIndex] || 0;
        
        // Filter barrels: top 10% EV with launch angle 8-30 degrees
        const barrels = swingData.filter(swing => {
          const exitVel = parseFloat(swing.exit_velocity);
          const launchAngle = parseFloat(swing.launch_angle);
          
          return exitVel >= top10PercentThreshold && 
                 launchAngle >= 8 && 
                 launchAngle <= 30;
        });
        
        onFilteredDataChange(barrels);
      } else {
        onFilteredDataChange(swingData);
      }
    }
  }, [showBarrelsOnly, swingData, onFilteredDataChange]);

  const handleToggleBarrels = () => {
    setShowBarrelsOnly(!showBarrelsOnly);
  };

  if (!swingData || swingData.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          variant={showBarrelsOnly ? 'contained' : 'outlined'}
          startIcon={<WhatshotIcon />}
          onClick={handleToggleBarrels}
          sx={{
            bgcolor: showBarrelsOnly ? '#ff6b35' : 'transparent',
            color: showBarrelsOnly ? '#fff' : '#ff6b35',
            borderColor: '#ff6b35',
            fontWeight: 600,
            '&:hover': {
              bgcolor: showBarrelsOnly ? '#e55a2b' : 'rgba(255, 107, 53, 0.1)',
            }
          }}
        >
          {showBarrelsOnly ? 'Show All Swings' : 'Show Barrels Only'}
        </Button>
        
        {showStats && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${barrelsCount} Barrels`}
              color="warning"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="body2" sx={{ color: NAVY, fontWeight: 500 }}>
              of {totalSwings} total swings
            </Typography>
          </Box>
        )}
      </Box>

      {showBarrelsOnly && barrelsCount === 0 && (
        <Alert severity="info" sx={{ 
          bgcolor: '#fff3cd', 
          color: '#856404',
          border: '1px solid #ffeaa7',
          borderRadius: 2
        }}>
          No barrels found in this data. Barrels are swings in the top 10% exit velocity with launch angle 8-30°.
        </Alert>
      )}

      {showBarrelsOnly && barrelsCount > 0 && (
        <Alert severity="success" sx={{ 
          bgcolor: '#d4edda', 
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: 2
        }}>
          Showing {barrelsCount} barrel{barrelsCount !== 1 ? 's' : ''} (top 10% EV, LA 8-30°)
        </Alert>
      )}
    </Box>
  );
};

export default BarrelsFilter; 