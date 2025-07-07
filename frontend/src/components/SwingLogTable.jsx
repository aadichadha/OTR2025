import React, { useState } from 'react';
import { Box, Card, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from '@mui/material';
import safeToFixed from '../utils/safeToFixed';

const NAVY = '#1c2c4d';

function SwingLogTable({ swings }) {
  const [selectedSwing, setSelectedSwing] = useState(null);

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
                <TableCell sx={{ color: NAVY, fontWeight: 'bold', borderBottom: '2px solid #3a7bd5', bgcolor: '#f8f9fa' }}>Exit Velocity</TableCell>
                <TableCell sx={{ color: NAVY, fontWeight: 'bold', borderBottom: '2px solid #3a7bd5', bgcolor: '#f8f9fa' }}>Launch Angle</TableCell>
                <TableCell sx={{ color: NAVY, fontWeight: 'bold', borderBottom: '2px solid #3a7bd5', bgcolor: '#f8f9fa' }}>Distance</TableCell>
                <TableCell sx={{ color: NAVY, fontWeight: 'bold', borderBottom: '2px solid #3a7bd5', bgcolor: '#f8f9fa' }}>Strike Zone</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {swings.map((swing, idx) => (
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
              <Typography variant="body2" sx={{ mb: 1, color: NAVY }}><b>Horizontal Angle:</b> {selectedSwing.horiz_angle}</Typography>
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