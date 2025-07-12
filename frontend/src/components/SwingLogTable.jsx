import React, { useState, useMemo } from 'react';
import { Box, Card, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, IconButton, Tooltip } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import safeToFixed from '../utils/safeToFixed';

const NAVY = '#1c2c4d';

function SwingLogTable({ swings }) {
  const [selectedSwing, setSelectedSwing] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedSwings = useMemo(() => {
    // Ensure swings is always an array
    const safeSwings = Array.isArray(swings) ? swings : [];
    
    if (!sortConfig.key) return safeSwings;

    return [...safeSwings].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [swings, sortConfig]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />;
  };

  if (!swings || swings.length === 0) {
    return <Alert severity="info">No swings found for this session.</Alert>;
  }

  return (
    <Box>
      <Card sx={{ p: 3, mb: 4, bgcolor: '#fff', border: '1.5px solid #e0e3e8', borderRadius: 4, boxShadow: '0 4px 16px rgba(28,44,77,0.08)', color: NAVY }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: NAVY }}>
          Swing History
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: NAVY }}>
          Swing Details ({swings.length} swings)
        </Typography>
        <TableContainer sx={{ border: '1px solid #e0e3e8', borderRadius: 3, boxShadow: '0 2px 8px rgba(28,44,77,0.06)', bgcolor: '#fff' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: NAVY, fontWeight: 'bold', borderBottom: '2px solid #3a7bd5', bgcolor: '#f8f9fa' }}>#</TableCell>
                <Tooltip title="Click to sort">
                  <TableCell 
                    sx={{ 
                      color: NAVY, 
                      fontWeight: 'bold', 
                      borderBottom: '2px solid #3a7bd5', 
                      bgcolor: sortConfig.key === 'exit_velocity' ? '#e3f2fd' : '#f8f9fa',
                      cursor: 'pointer', 
                      '&:hover': { bgcolor: '#e3f2fd' },
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => handleSort('exit_velocity')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Exit Velocity
                      {getSortIcon('exit_velocity')}
                    </Box>
                  </TableCell>
                </Tooltip>
                <Tooltip title="Click to sort">
                  <TableCell 
                    sx={{ 
                      color: NAVY, 
                      fontWeight: 'bold', 
                      borderBottom: '2px solid #3a7bd5', 
                      bgcolor: sortConfig.key === 'launch_angle' ? '#e3f2fd' : '#f8f9fa',
                      cursor: 'pointer', 
                      '&:hover': { bgcolor: '#e3f2fd' },
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => handleSort('launch_angle')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Launch Angle
                      {getSortIcon('launch_angle')}
                    </Box>
                  </TableCell>
                </Tooltip>
                <Tooltip title="Click to sort">
                  <TableCell 
                    sx={{ 
                      color: NAVY, 
                      fontWeight: 'bold', 
                      borderBottom: '2px solid #3a7bd5', 
                      bgcolor: sortConfig.key === 'distance' ? '#e3f2fd' : '#f8f9fa',
                      cursor: 'pointer', 
                      '&:hover': { bgcolor: '#e3f2fd' },
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => handleSort('distance')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Distance
                      {getSortIcon('distance')}
                    </Box>
                  </TableCell>
                </Tooltip>
                <Tooltip title="Click to sort">
                  <TableCell 
                    sx={{ 
                      color: NAVY, 
                      fontWeight: 'bold', 
                      borderBottom: '2px solid #3a7bd5', 
                      bgcolor: sortConfig.key === 'strike_zone' ? '#e3f2fd' : '#f8f9fa',
                      cursor: 'pointer', 
                      '&:hover': { bgcolor: '#e3f2fd' },
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => handleSort('strike_zone')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Strike Zone
                      {getSortIcon('strike_zone')}
                    </Box>
                  </TableCell>
                </Tooltip>
                <Tooltip title="Click to sort">
                  <TableCell 
                    sx={{ 
                      color: NAVY, 
                      fontWeight: 'bold', 
                      borderBottom: '2px solid #3a7bd5', 
                      bgcolor: sortConfig.key === 'pitch_speed' ? '#e3f2fd' : '#f8f9fa',
                      cursor: 'pointer', 
                      '&:hover': { bgcolor: '#e3f2fd' },
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => handleSort('pitch_speed')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Pitch Speed
                      {getSortIcon('pitch_speed')}
                    </Box>
                  </TableCell>
                </Tooltip>
              </TableRow>
            </TableHead>
            <TableBody>
              {(Array.isArray(sortedSwings) ? sortedSwings : []).map((swing, idx) => (
                <TableRow
                  key={swing.id || idx}
                  hover
                  selected={selectedSwing && swing.id === selectedSwing.id}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f0f8ff' }, bgcolor: selectedSwing && swing.id === selectedSwing.id ? '#e3f2fd' : '#fff' }}
                  onClick={() => setSelectedSwing(swing)}
                >
                  <TableCell sx={{ color: NAVY }}>{idx + 1}</TableCell>
                  <TableCell sx={{ color: NAVY }}>{safeToFixed(swing.exit_velocity, 1)} MPH</TableCell>
                  <TableCell sx={{ color: NAVY }}>{safeToFixed(swing.launch_angle, 1)}°</TableCell>
                  <TableCell sx={{ color: NAVY }}>{safeToFixed(swing.distance, 0)} FT</TableCell>
                  <TableCell sx={{ color: NAVY }}>{swing.strike_zone}</TableCell>
                  <TableCell sx={{ color: NAVY }}>{safeToFixed(swing.pitch_speed, 1)} MPH</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      {/* Expanded Swing View */}
      <Dialog
        open={!!selectedSwing}
        onClose={() => setSelectedSwing(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#fff', border: '1.5px solid #e0e3e8', borderRadius: 4, color: NAVY, boxShadow: '0 8px 32px rgba(28,44,77,0.12)' } }}
      >
        <DialogTitle sx={{ color: NAVY, fontWeight: 700, borderBottom: '1px solid #e0e3e8', bgcolor: '#f8f9fa' }}>
          Swing Details
        </DialogTitle>
        <DialogContent sx={{ pt: 2, bgcolor: '#fff' }}>
          {selectedSwing && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1, color: NAVY }}><b>Exit Velocity:</b> {safeToFixed(selectedSwing.exit_velocity, 1)} MPH</Typography>
              <Typography variant="body2" sx={{ mb: 1, color: NAVY }}><b>Launch Angle:</b> {safeToFixed(selectedSwing.launch_angle, 1)}°</Typography>
              <Typography variant="body2" sx={{ mb: 1, color: NAVY }}><b>Distance:</b> {safeToFixed(selectedSwing.distance, 0)} FT</Typography>
              <Typography variant="body2" sx={{ mb: 1, color: NAVY }}><b>Strike Zone:</b> {selectedSwing.strike_zone}</Typography>
              <Typography variant="body2" sx={{ mb: 1, color: NAVY }}><b>Pitch Speed:</b> {safeToFixed(selectedSwing.pitch_speed, 1)} MPH</Typography>
              <Typography variant="body2" sx={{ mb: 1, color: NAVY }}><b>Time:</b> {selectedSwing.created_at}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e3e8', bgcolor: '#f8f9fa' }}>
          <Button onClick={() => setSelectedSwing(null)} sx={{ color: NAVY, fontWeight: 600, '&:hover': { bgcolor: 'rgba(28,44,77,0.08)' } }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SwingLogTable; 