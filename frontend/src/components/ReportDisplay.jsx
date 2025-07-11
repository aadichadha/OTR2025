import React, { useState } from 'react';
import { Box, Typography, Grid, Card, Button, CircularProgress } from '@mui/material';
import otrLogo from '/images/otrbaseball-main.png';
import DownloadIcon from '@mui/icons-material/Download';
import { getToken } from '../services/auth';
import getGradeColor from '../utils/getGradeColor';
import safeToFixed from '../utils/safeToFixed';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const NAVY = '#1a2340';
const PANEL_BG = '#fff';
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
        border: '2px solid #fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: bgColor,
        color: ev !== null && ev !== undefined && ev > 85 ? 'white' : NAVY,
        fontWeight: 'bold',
        fontSize: '1.2rem',
        flexDirection: 'column',
        width: 60,
        height: 60,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}
    >
      <span style={{ fontSize: '1rem', opacity: 0.8, fontWeight: 600 }}>{zone}</span>
      <span style={{ fontSize: '0.85rem', marginTop: 2 }}>{ev !== null && ev !== undefined ? safeToFixed(ev, 1) : ''}</span>
    </Box>
  );
}

function ReportDisplay({ report }) {
  if (!report) return null;
  const metrics = report.metrics?.exitVelocity || report.metrics?.batSpeed;
  const isHittrax = !!report.metrics?.exitVelocity;
  const player = report.player || {};
  const session = report.session || {};

  // Rectangular strike zone grid: [10, null, 11], [1,2,3], [4,5,6], [7,8,9], [12, null, 13]
  const zoneGrid = [
    [10, null, 11],
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [12, null, 13],
  ];

  // Add null check for hotZoneEVs
  const hotZoneEVs = metrics?.hotZoneEVs || {};

  return (
    <Box sx={{ bgcolor: NAVY, minHeight: '100vh', p: 0, m: 0 }}>
      {/* Header */}
      <Box sx={{ bgcolor: NAVY, color: '#fff', p: 3, display: 'flex', alignItems: 'center', minHeight: 100 }}>
        <img src={otrLogo} alt="OTR Baseball Logo" style={{ height: 44, marginRight: 32 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', mb: 0.5, letterSpacing: 1 }}>Performance Report</Typography>
          <Typography variant="subtitle1" sx={{ color: '#b3c6e0' }}>
            {player.name} • {session.date ? new Date(session.date).toLocaleDateString() : ''} • {session.type ? session.type.toUpperCase() : ''}
          </Typography>
        </Box>
      </Box>
      {/* White panel/card */}
      <Box sx={{ maxWidth: 900, mx: 'auto', mt: { xs: 2, md: 5 }, mb: 5, p: { xs: 2, md: 4 }, bgcolor: PANEL_BG, borderRadius: 5, boxShadow: '0 4px 32px rgba(28,44,77,0.13)' }}>
        {/* Metrics */}
        <Grid container spacing={3} justifyContent="center" sx={{ mb: 2 }}>
          {isHittrax && (
            <>
              <MetricCard label="MAX EXIT VELOCITY" value={metrics.maxExitVelocity} unit="MPH" grade={metrics.grades?.maxExitVelocity} />
              <MetricCard label="AVG EXIT VELOCITY" value={metrics.avgExitVelocity} unit="MPH" grade={metrics.grades?.avgExitVelocity} />
              <MetricCard label="AVG LA (TOP 5% EV)" value={metrics.launchAngleTop5} unit="°" grade={metrics.grades?.launchAngleTop5} />
              <MetricCard label="AVG LAUNCH ANGLE" value={metrics.avgLaunchAngle} unit="°" grade={metrics.grades?.avgLaunchAngle} />
              <MetricCard label="BARREL %" value={metrics.barrelPercentage} unit="%" grade="Quality" />
              <MetricCard label="TOTAL SWINGS" value={metrics.dataPoints} unit="" grade="Complete" />
            </>
          )}
        </Grid>
        {/* Strike Zone Grid */}
        <Box sx={{ bgcolor: NAVY, borderRadius: 4, boxShadow: '0 2px 16px rgba(0,0,0,0.18)', p: 3, mt: 4, mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 2, textAlign: 'center', letterSpacing: 1 }}>STRIKE ZONE HOT ZONES (Avg EV)</Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 60px)',
            gridTemplateRows: 'repeat(5, 60px)',
            gap: 2,
            justifyContent: 'center',
            mx: 'auto',
            bgcolor: NAVY,
            borderRadius: 2
          }}>
            {zoneGrid.flat().map((zone, idx) => (
              zone !== null ? (
                <HotZoneCell key={idx} zone={zone} ev={hotZoneEVs[zone]} />
              ) : (
                <Box key={idx} sx={{ width: 60, height: 60, bgcolor: 'transparent' }} />
              )
            ))}
          </Box>
        </Box>
        {/* Summary/Analysis Section */}
        {/* Removed Detailed Analysis section. Add Download PDF button instead. */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
          <DownloadPDFButton report={report} />
        </Box>
      </Box>
    </Box>
  );
}

function MetricCard({ label, value, unit, grade }) {
  // Color for grade
  let gradeColor = grade ? getGradeColor(grade) : '#7ecbff';
  return (
    <Grid item xs={12} sm={6} md={4} lg={2}>
      <Card sx={{ p: 2.5, textAlign: 'center', bgcolor: CARD_BG, border: 'none', borderRadius: 4, boxShadow: '0 2px 12px rgba(28,44,77,0.18)', minWidth: 120, minHeight: 80 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: CARD_TEXT, mb: 0.5, fontSize: '2.2rem', letterSpacing: 1 }}>{value !== null && value !== undefined ? safeToFixed(value, 1) : 'N/A'}{unit && <span style={{ fontSize: '1.2rem', color: METRIC_UNIT, marginLeft: 4 }}>{unit}</span>}</Typography>
        <Typography variant="subtitle2" sx={{ color: METRIC_LABEL, fontWeight: 700, fontSize: '1.05rem', letterSpacing: 0.5 }}>{label}</Typography>
        {grade && <Typography variant="caption" sx={{ color: gradeColor, fontWeight: 700, mt: 0.5 }}>{grade}</Typography>}
      </Card>
    </Grid>
  );
}

function DownloadPDFButton({ report }) {
  const [loading, setLoading] = useState(false);
  if (!report?.session?.id) return null;
  const sessionId = report.session.id;
  const playerName = report.player?.name?.replace(/\s+/g, '_') || 'Player';
  const sessionDate = report.session?.date ? new Date(report.session.date).toISOString().split('T')[0] : 'Session';
  const fileName = `OTR_Report_${playerName}_${sessionDate}.pdf`;

  const handleDownload = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      alert('You must be logged in to download reports.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}/report`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) throw new Error('You are not authorized to download this report. Please log in again.');
      if (res.status === 404) throw new Error('Session not found or report unavailable.');
      if (!res.ok) throw new Error('Failed to download PDF.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Failed to download PDF report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
      onClick={handleDownload}
      disabled={loading}
      sx={{ minWidth: 180, fontWeight: 700, fontSize: '1rem', borderRadius: 3 }}
    >
      {loading ? 'Preparing PDF...' : 'Download PDF'}
    </Button>
  );
}

export default ReportDisplay; 