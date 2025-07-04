import React from 'react';
import { Box, Typography, Grid, Card } from '@mui/material';
import otrLogo from '/images/otrbaseball-main.png';

const NAVY = '#1a2340';
const LIGHT_BLUE = '#3e5ba9';
const CARD_BG = NAVY;
const CARD_TEXT = '#fff';
const METRIC_LABEL = '#7ecbff';
const METRIC_UNIT = '#b3c6e0';

const getZoneColor = (avgEV) => {
  if (avgEV === null || avgEV === undefined) return '#ffffff';
  if (avgEV >= 90) return '#ff0000';
  if (avgEV >= 85) return '#ff8c00';
  if (avgEV >= 80) return '#ffd700';
  return '#808080';
};

function HotZoneCell({ zone, ev }) {
  const bgColor = getZoneColor(ev);
  return (
    <Box
      sx={{
        aspectRatio: '1',
        border: '2px solid #fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: bgColor,
        color: ev !== null && ev !== undefined && ev > 85 ? 'white' : NAVY,
        fontWeight: 'bold',
        fontSize: '1.1rem',
        flexDirection: 'column',
        minWidth: 56,
        minHeight: 56,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}
    >
      <span style={{ fontSize: '0.95rem', opacity: 0.7 }}>{zone}</span>
      <span>{ev !== null && ev !== undefined ? `${ev.toFixed(1)} mph` : ''}</span>
    </Box>
  );
}

function ReportDisplay({ report }) {
  if (!report) return null;
  const metrics = report.metrics?.exitVelocity || report.metrics?.batSpeed;
  const isBlast = !!report.metrics?.batSpeed;
  const isHittrax = !!report.metrics?.exitVelocity;
  const player = report.player || {};
  const session = report.session || {};
  const history = report.history || [];

  // 4x4 grid mapping for zones 1-13 (local layout)
  const zoneGrid = [
    [10, 11, null, null],
    [1, 2, 3, null],
    [4, 5, 6, 12],
    [7, 8, 9, 13],
  ];

  return (
    <Box sx={{ bgcolor: NAVY, minHeight: '100vh', p: 0, m: 0 }}>
      {/* Header */}
      <Box sx={{ bgcolor: NAVY, color: '#fff', p: 3, display: 'flex', alignItems: 'center', minHeight: 100, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <img src={otrLogo} alt="OTR Baseball Logo" style={{ height: 44, marginRight: 32 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', mb: 0.5, letterSpacing: 1 }}>Performance Report</Typography>
          <Typography variant="subtitle1" sx={{ color: '#b3c6e0' }}>
            {player.name} • {session.date ? new Date(session.date).toLocaleDateString() : ''} • {session.type ? session.type.toUpperCase() : ''}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ p: { xs: 2, md: 5 }, maxWidth: 1100, mx: 'auto' }}>
        {/* Metrics */}
        <Grid container spacing={3} justifyContent="center" sx={{ mb: 2 }}>
          {isHittrax && (
            <>
              <MetricCard label="MAX EXIT VELOCITY" value={metrics.maxExitVelocity} unit="MPH" grade={metrics.grades?.maxExitVelocity} />
              <MetricCard label="AVG EXIT VELOCITY" value={metrics.avgExitVelocity} unit="MPH" grade={metrics.grades?.avgExitVelocity} />
              <MetricCard label="AVG LA (TOP 5% EV)" value={metrics.launchAngleTop5} unit="°" grade={metrics.grades?.launchAngleTop5} />
              <MetricCard label="AVG LAUNCH ANGLE" value={metrics.avgLaunchAngle} unit="°" grade={metrics.grades?.avgLaunchAngle} />
              <MetricCard label="DISTANCE" value={metrics.avgDistance} unit="FT" grade="Distance" />
              <MetricCard label="TOTAL SWINGS" value={metrics.dataPoints} unit="" grade="Complete" />
            </>
          )}
        </Grid>
        {/* Strike Zone Grid */}
        <Box sx={{ bgcolor: NAVY, borderRadius: 4, boxShadow: '0 2px 16px rgba(0,0,0,0.18)', p: 3, mt: 4, mb: 4 }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 2, textAlign: 'center', letterSpacing: 1 }}>STRIKE ZONE HOT ZONES (Avg EV)</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 56px)', gridTemplateRows: 'repeat(4, 56px)', gap: 1, justifyContent: 'center', mx: 'auto', bgcolor: NAVY, borderRadius: 2, p: 2 }}>
            {zoneGrid.flat().map((zone, idx) => (
              <Box key={idx} sx={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: zone ? 'transparent' : NAVY }}>
                {zone ? <HotZoneCell zone={zone} ev={metrics.hotZoneEVs?.[zone]} /> : null}
              </Box>
            ))}
          </Box>
        </Box>
        {/* Summary/Analysis Section */}
        {report.summaryText && (
          <Box sx={{ bgcolor: CARD_BG, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', p: 3, mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: CARD_TEXT, mb: 2 }}>Detailed Analysis</Typography>
            <Typography variant="body1" sx={{ color: CARD_TEXT }}>{report.summaryText}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function MetricCard({ label, value, unit, grade }) {
  // Color for grade
  let gradeColor = '#7ecbff';
  if (grade === 'Above Average' || grade === 'Complete' || grade === 'Distance') gradeColor = '#3ecb7e';
  if (grade === 'Below Average') gradeColor = '#ff8c00';
  return (
    <Grid item xs={12} sm={6} md={4} lg={2}>
      <Card sx={{ p: 2.5, textAlign: 'center', bgcolor: CARD_BG, border: 'none', borderRadius: 4, boxShadow: '0 2px 12px rgba(28,44,77,0.18)', minWidth: 150, minHeight: 90 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: CARD_TEXT, mb: 0.5, fontSize: '2.2rem', letterSpacing: 1 }}>{value !== null && value !== undefined ? Number(value).toFixed(1) : 'N/A'}{unit && <span style={{ fontSize: '1.2rem', color: METRIC_UNIT, marginLeft: 4 }}>{unit}</span>}</Typography>
        <Typography variant="subtitle2" sx={{ color: METRIC_LABEL, fontWeight: 700, fontSize: '1.05rem', letterSpacing: 0.5 }}>{label}</Typography>
        {grade && <Typography variant="caption" sx={{ color: gradeColor, fontWeight: 700, mt: 0.5 }}>{grade}</Typography>}
      </Card>
    </Grid>
  );
}

export default ReportDisplay; 