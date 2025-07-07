import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import api from '../services/api';

const SessionReport = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/sessions/${id}/report-data`);
        setReport(res.data);
      } catch (err) {
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) return <Box p={4}><CircularProgress /></Box>;
  if (error) return <Box p={4}><Alert severity="error">{error}</Alert></Box>;
  if (!report) return <Box p={4}><Alert severity="info">No report found.</Alert></Box>;

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Session Report</Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        <pre style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{JSON.stringify(report, null, 2)}</pre>
      </Paper>
    </Box>
  );
};

export default SessionReport; 