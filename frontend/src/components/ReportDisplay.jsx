import React from 'react';
import { Box, Typography, Grid, Card, Chip } from '@mui/material';
import otrLogo from '/images/otrbaseball-main.png';
import { Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

// Helper for zone color
const getZoneColor = (avgEV) => {
  if (avgEV === null || avgEV === undefined) return '#ffffff'; // white for no data
  if (avgEV >= 90) return '#ff0000'; // red
  if (avgEV >= 85) return '#ff8c00'; // orange
  if (avgEV >= 80) return '#ffd700'; // yellow
  return '#808080'; // gray
};

function HotZoneCell({ zone, ev }) {
  const bgColor = getZoneColor(ev);
  return (
    <Box
      sx={{
        aspectRatio: '1',
        border: '2px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: bgColor,
        color: ev !== null && ev !== undefined && ev > 85 ? 'white' : 'black',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        flexDirection: 'column',
        transition: 'background 0.3s',
        minWidth: 60,
        minHeight: 60
      }}
    >
      <span style={{ fontSize: '0.95rem', opacity: 0.7 }}>{zone}</span>
      <span>{ev !== null && ev !== undefined ? `${ev.toFixed(1)} mph` : ''}</span>
    </Box>
  );
}

const formatMetricValue = (value, decimals = 1) => {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(decimals);
};

function ReportDisplay({ report }) {
  if (!report) return null;
  const metrics = report.metrics?.exitVelocity || report.metrics?.batSpeed;
  const isBlast = !!report.metrics?.batSpeed;
  const isHittrax = !!report.metrics?.exitVelocity;
  const player = report.player || {};
  const session = report.session || {};
  const history = report.history || [];
  // PDF header style
  return (
    <Box sx={{ bgcolor: '#f8f9fa', borderRadius: 3, boxShadow: '0 2px 12px rgba(28,44,77,0.07)', p: 0, overflow: 'hidden' }}>
      {/* Header with logo and title */}
      <Box sx={{ bgcolor: '#667eea', color: 'white', p: 3, display: 'flex', alignItems: 'center', minHeight: 120 }}>
        <img src={otrLogo} alt="OTR Baseball Logo" style={{ height: 40, marginRight: 32 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.5 }}>Performance Report</Typography>
          <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            {player.name} • {session.date ? new Date(session.date).toLocaleDateString() : ''} • {session.type ? session.type.toUpperCase() : ''}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ p: 4 }}>
        {/* Performance Metrics Section */}
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 2 }}>Performance Metrics</Typography>
        <Grid container spacing={3}>
          {/* Blast metrics */}
          {isBlast && (
            <>
              <MetricCard label="BAT SPEED" value={metrics.avgBatSpeed} unit="Mph" />
              <MetricCard label="TOP 10% SPEED" value={metrics.top10PercentBatSpeed} unit="Mph" />
              <MetricCard label="ATTACK ANGLE" value={metrics.avgAttackAngleTop10} unit="Degrees" />
              <MetricCard label="TIME TO CONTACT" value={metrics.avgTimeToContact} unit="Seconds" decimals={3} />
              <MetricCard label="TOTAL SWINGS" value={metrics.dataPoints} unit="Data Points" color="#1976d2" />
            </>
          )}
          {/* Hittrax metrics */}
          {isHittrax && (
            <>
              <MetricCard label="EXIT VELOCITY" value={metrics.avgExitVelocity} unit="Mph" />
              <MetricCard label="LAUNCH ANGLE" value={metrics.avgLaunchAngleTop8} unit="Degrees" />
              <MetricCard label="DISTANCE" value={metrics.avgDistanceTop8} unit="Feet" color="#1976d2" />
              <MetricCard label="TOP 8% EV" value={metrics.top8PercentEV} unit="Mph" />
              <MetricCard label="TOTAL SWINGS" value={metrics.dataPoints} unit="Data Points" color="#1976d2" />
            </>
          )}
        </Grid>
        {/* Strike Zone Section */}
        <Divider sx={{ my: 4 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 2 }}>Strike Zone Analysis</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Box sx={{ border: '2px solid #333', width: 200, height: 150, position: 'relative', mb: 1 }}>
            {/* Grid lines */}
            {[1,2].map(i => (
              <Box key={i} sx={{ position: 'absolute', left: `${(i/3)*100}%`, top: 0, bottom: 0, width: 2, bgcolor: '#ccc' }} />
            ))}
            {[1,2].map(i => (
              <Box key={i+10} sx={{ position: 'absolute', top: `${(i/3)*100}%`, left: 0, right: 0, height: 2, bgcolor: '#ccc' }} />
            ))}
            {/* Hot zones (overlay) */}
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' }}>
              {[1,2,3,4,5,6,7,8,9].map(zone => (
                <Box key={zone} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HotZoneCell zone={zone} ev={metrics.hotZoneEVs?.[zone]} />
                </Box>
              ))}
            </Box>
          </Box>
          <Typography variant="body2" color="textSecondary">Each zone shows the average exit velocity (mph) for that strike zone</Typography>
        </Box>
        {/* Summary/Analysis Section */}
        {report.summaryText && (
          <>
            <Divider sx={{ my: 4 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 2 }}>Detailed Analysis</Typography>
            <Paper sx={{ bgcolor: '#f8f9fa', border: '1px solid #e9ecef', p: 3, mb: 2 }}>
              <Typography variant="body1" sx={{ color: '#333' }}>{report.summaryText}</Typography>
            </Paper>
          </>
        )}
        {/* Session History Table */}
        {history && history.length > 1 && (
          <>
            <Divider sx={{ my: 4 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 2 }}>Session History</Typography>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Avg Bat Speed</TableCell>
                    <TableCell>Top Bat Speed</TableCell>
                    <TableCell>Avg Exit Velo</TableCell>
                    <TableCell>Top Exit Velo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.slice(-5).map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{s.sessionDate ? new Date(s.sessionDate).toLocaleDateString() : ''}</TableCell>
                      <TableCell>{s.sessionType ? s.sessionType.toUpperCase() : ''}</TableCell>
                      <TableCell>{s.metrics.avgBatSpeed !== undefined && s.metrics.avgBatSpeed !== null ? s.metrics.avgBatSpeed.toFixed(1) : 'N/A'}</TableCell>
                      <TableCell>{s.metrics.topBatSpeed !== undefined && s.metrics.topBatSpeed !== null ? s.metrics.topBatSpeed.toFixed(1) : 'N/A'}</TableCell>
                      <TableCell>{s.metrics.avgExitVelocity !== undefined && s.metrics.avgExitVelocity !== null ? s.metrics.avgExitVelocity.toFixed(1) : 'N/A'}</TableCell>
                      <TableCell>{s.metrics.topExitVelocity !== undefined && s.metrics.topExitVelocity !== null ? s.metrics.topExitVelocity.toFixed(1) : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
        {/* Footer */}
        <Divider sx={{ my: 4 }} />
        <Typography variant="caption" color="gray" align="center" display="block" sx={{ mt: 2 }}>
          Generated by OTR Baseball Analytics Platform
        </Typography>
      </Box>
    </Box>
  );
}

// Helper for PDF-style metric card
function MetricCard({ label, value, unit, color = '#333', decimals = 1 }) {
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 2, boxShadow: 'none', minWidth: 170, minHeight: 100 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color, mb: 0.5, fontSize: '2.2rem' }}>{value !== null && value !== undefined ? Number(value).toFixed(decimals) : 'N/A'}</Typography>
        <Typography variant="subtitle2" sx={{ color: '#495057', fontWeight: 700 }}>{label}</Typography>
        <Typography variant="caption" sx={{ color: '#6c757d' }}>{unit}</Typography>
      </Card>
    </Grid>
  );
}

export default ReportDisplay; 