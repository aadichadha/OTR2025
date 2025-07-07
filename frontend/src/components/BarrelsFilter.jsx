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
      const barrels = swingData.filter(swing => 
        swing.exit_velocity && parseFloat(swing.exit_velocity) >= 95
      );
      setBarrelsCount(barrels.length);
      setTotalSwings(swingData.length);
    }
  }, [swingData]);

  useEffect(() => {
    if (swingData && swingData.length > 0) {
      if (showBarrelsOnly) {
        const barrels = swingData.filter(swing => 
          swing.exit_velocity && parseFloat(swing.exit_velocity) >= 95
        );
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
          No barrels found in this data. Barrels are swings with exit velocity ≥ 95 mph.
        </Alert>
      )}

      {showBarrelsOnly && barrelsCount > 0 && (
        <Alert severity="success" sx={{ 
          bgcolor: '#d4edda', 
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: 2
        }}>
          Showing {barrelsCount} barrel{barrelsCount !== 1 ? 's' : ''} (exit velocity ≥ 95 mph)
        </Alert>
      )}
    </Box>
  );
};

export default BarrelsFilter; 