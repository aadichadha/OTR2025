import React, { useState, useEffect } from 'react';
import { Box, Button, Chip, Typography, Alert } from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';

const NAVY = '#1c2c4d';

const BarrelsFilter = ({ swingData, onFilteredDataChange, showStats = true }) => {
  const [showBarrelsOnly, setShowBarrelsOnly] = useState(false);
  const [barrelsCount, setBarrelsCount] = useState(0);
  const [totalSwings, setTotalSwings] = useState(0);

  useEffect(() => {
    // Ensure swingData is always an array
    const safeSwingData = Array.isArray(swingData) ? swingData : [];
    
    if (safeSwingData.length > 0) {
      // Calculate max exit velocity and 90% threshold
      const exitVelocities = safeSwingData
        .map(swing => parseFloat(swing.exit_velocity))
        .filter(ev => !isNaN(ev) && ev > 0);
      
      const maxEV = Math.max(...exitVelocities);
      const barrelThreshold = maxEV * 0.90; // 90% of max EV
      
      // Count barrels: ≥90% of max EV with launch angle 8-25 degrees
      const barrels = safeSwingData.filter(swing => {
        const exitVel = parseFloat(swing.exit_velocity);
        const launchAngle = parseFloat(swing.launch_angle);
        
        return exitVel >= barrelThreshold && 
               launchAngle >= 8 && 
               launchAngle <= 25;
      });
      
      setBarrelsCount(barrels.length);
      setTotalSwings(safeSwingData.length);
    }
  }, [swingData]);

  useEffect(() => {
    // Ensure swingData is always an array
    const safeSwingData = Array.isArray(swingData) ? swingData : [];
    
    if (safeSwingData.length > 0) {
      if (showBarrelsOnly) {
        // Calculate max exit velocity and 90% threshold
        const exitVelocities = safeSwingData
          .map(swing => parseFloat(swing.exit_velocity))
          .filter(ev => !isNaN(ev) && ev > 0);
        
        const maxEV = Math.max(...exitVelocities);
        const barrelThreshold = maxEV * 0.90; // 90% of max EV
        
        // Filter barrels: ≥90% of max EV with launch angle 8-25 degrees
        const barrels = safeSwingData.filter(swing => {
          const exitVel = parseFloat(swing.exit_velocity);
          const launchAngle = parseFloat(swing.launch_angle);
          
          return exitVel >= barrelThreshold && 
                 launchAngle >= 8 && 
                 launchAngle <= 25;
        });
        
        onFilteredDataChange(barrels);
      } else {
        onFilteredDataChange(safeSwingData);
      }
    }
  }, [showBarrelsOnly, swingData, onFilteredDataChange]);

  const handleToggleBarrels = () => {
    setShowBarrelsOnly(!showBarrelsOnly);
  };

  // Ensure swingData is always an array for the null check
  const safeSwingData = Array.isArray(swingData) ? swingData : [];
  
  if (!safeSwingData || safeSwingData.length === 0) {
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
              ({((barrelsCount / totalSwings) * 100).toFixed(1)}%) of {totalSwings} total swings
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