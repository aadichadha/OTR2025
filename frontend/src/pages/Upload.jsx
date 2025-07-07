import { useState, useEffect } from 'react';
import { Box, Typography, Button, MenuItem, Select, InputLabel, FormControl, LinearProgress, Alert, Paper, TextField, Grid, Card, CardContent, Divider, Chip } from '@mui/material';
import axios from 'axios';
import React from 'react';
import ReportDisplay from '../components/ReportDisplay';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function Upload() {
  const [players, setPlayers] = useState([]);
  const [playerId, setPlayerId] = useState('');
  const [playerCode, setPlayerCode] = useState('');
  const [usePlayerCode, setUsePlayerCode] = useState(false);
  const [dataType, setDataType] = useState('blast');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fetch player list
    const fetchPlayers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/players`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPlayers(res.data.players || []);
      } catch (err) {
        setError('Failed to load players. Please login.');
      }
    };
    fetchPlayers();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploadResult(null);
    setProgress(0);
    
    if ((!playerId && !playerCode) || !file) {
      setError('Please select a player (or enter player code) and a file.');
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (usePlayerCode) {
        formData.append('playerCode', playerCode);
      } else {
        formData.append('playerId', playerId);
      }
      
      const token = localStorage.getItem('token');
      const endpoint = dataType === 'blast' ? '/upload/blast' : '/upload/hittrax';
      const response = await axios.post(`${API_URL}${endpoint}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        }
      });
      
      setSuccess('Upload successful! Your file has been processed and the report is ready.');
      setUploadResult(response.data);
      console.log('[DEBUG] Upload response data:', response.data);
      console.log('[DEBUG] Report data being passed to ReportDisplay:', response.data.report);
      console.log('[DEBUG] Report metrics structure:', response.data.report?.metrics);
      console.log('[DEBUG] Exit velocity metrics:', response.data.report?.metrics?.exitVelocity);
      console.log('[DEBUG] Bat speed metrics:', response.data.report?.metrics?.batSpeed);
      setFile(null);
      setProgress(100);
    } catch (err) {
      let msg = 'Upload failed.';
      if (err.response?.data?.error) {
        if (err.response.data.error.includes('No file uploaded')) {
          msg = 'No file was uploaded. Please select a CSV file.';
        } else if (err.response.data.error.includes('Player not found')) {
          msg = 'Player not found. Please check your selection or code.';
        } else if (err.response.data.error.includes('File too large')) {
          msg = 'File is too large. Please upload a smaller CSV file.';
        } else {
          msg = err.response.data.error;
        }
      }
      setError(msg);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/sessions/${sessionId}/report`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_session_${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download report');
      console.error('Error downloading report:', err);
    }
  };

  const handleEmailReport = (sessionId) => {
    const subject = encodeURIComponent(`Baseball Analytics Report - Session ${sessionId}`);
    const body = encodeURIComponent(`Please find attached the baseball analytics report for session ${sessionId}.

From: otrdatatrack@gmail.com
One-time password: exwx bdjz xjid qhmh`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  // Helper component for a hot zone cell (copied from PlayerDetails.jsx)
  function HotZoneCell({ zone, ev }) {
    let bgColor = '#f0f0f0';
    let t = 0;
    if (ev !== null && ev !== undefined) {
      const minEV = 60, maxEV = 110;
      t = Math.max(0, Math.min(1, (ev - minEV) / (maxEV - minEV)));
      const r = Math.round(255 * t);
      const g = Math.round(80 * (1 - t) + 30 * t);
      const b = Math.round(255 * (1 - t));
      bgColor = `rgb(${r},${g},${b})`;
    }
    return (
      <Box
        sx={{
          aspectRatio: '1',
          border: '2px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: bgColor,
          color: ev !== null && ev !== undefined ? (t > 0.5 ? 'white' : '#1c2c4d') : '#666',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          flexDirection: 'column',
          transition: 'background 0.3s',
          minWidth: 60,
          minHeight: 60
        }}
      >
        <span style={{ fontSize: '0.95rem', opacity: 0.7 }}>{zone}</span>
        <span>{ev !== null && ev !== undefined ? `${ev} mph` : 'N/A'}</span>
      </Box>
    );
  }

  return (
    <Box sx={{ background: '#1c2c4d', minHeight: '100vh', py: 4 }}>
      <img
        src="/images/otrbaseball-simple.png"
        alt="OTR Baseball Simple Logo"
        style={{ 
          maxWidth: 280, 
          marginBottom: 32,
          border: '2px solid white',
          borderRadius: '8px',
          padding: '8px',
          backgroundColor: 'white',
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 500, mb: 4, bgcolor: '#fff', border: '2px solid #1c2c4d', borderRadius: 3, boxShadow: '0 2px 12px rgba(28,44,77,0.07)', color: '#1c2c4d' }}>
          <Typography variant="h6" gutterBottom align="center" sx={{ color: '#1c2c4d', fontWeight: 800 }}>Upload Form</Typography>
          <form onSubmit={handleUpload} style={{ width: '100%' }}>
            <FormControl fullWidth margin="normal" sx={{ color: '#1c2c4d' }}>
              <InputLabel id="player-select-label" sx={{ color: '#1c2c4d' }}>Player Selection Method</InputLabel>
              <Select
                labelId="player-select-label"
                value={usePlayerCode ? 'code' : 'dropdown'}
                label="Player Selection Method"
                onChange={e => setUsePlayerCode(e.target.value === 'code')}
                sx={{ 
                  color: '#1c2c4d',
                  '& .MuiSelect-select': {
                    backgroundColor: '#fff',
                    color: '#1c2c4d'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3a7bd5'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: '#fff',
                      '& .MuiMenuItem-root': {
                        color: '#1c2c4d',
                        '&:hover': {
                          backgroundColor: '#eaf1fb'
                        },
                        '&.Mui-selected': {
                          backgroundColor: '#d2e3fa',
                          color: '#1c2c4d'
                        }
                      }
                    }
                  }
                }}
              >
                <MenuItem value="dropdown" sx={{ color: '#1c2c4d' }}>Select from List</MenuItem>
                <MenuItem value="code" sx={{ color: '#1c2c4d' }}>Enter Player Code</MenuItem>
              </Select>
            </FormControl>
            {usePlayerCode ? (
              <TextField
                fullWidth
                margin="normal"
                label="Player Code (4 digits)"
                value={playerCode}
                onChange={e => setPlayerCode(e.target.value)}
                placeholder="e.g., 1234"
                inputProps={{ maxLength: 4, pattern: '[0-9]{4}', style: { color: '#1c2c4d' } }}
                required
                sx={{ color: '#1c2c4d', '& .MuiInputBase-input': { color: '#1c2c4d' }, '& .MuiInputLabel-root': { color: '#1c2c4d' } }}
              />
            ) : (
              <FormControl fullWidth margin="normal" sx={{ color: '#1c2c4d' }}>
                <InputLabel id="player-label" sx={{ color: '#1c2c4d' }}>Player</InputLabel>
                <Select
                  labelId="player-label"
                  value={playerId}
                  label="Player"
                  onChange={e => setPlayerId(e.target.value)}
                  required
                  sx={{ 
                    color: '#1c2c4d',
                    '& .MuiSelect-select': {
                      backgroundColor: '#fff',
                      color: '#1c2c4d'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1c2c4d'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3a7bd5'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1c2c4d'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: '#fff',
                        '& .MuiMenuItem-root': {
                          color: '#1c2c4d',
                          '&:hover': {
                            backgroundColor: '#eaf1fb'
                          },
                          '&.Mui-selected': {
                            backgroundColor: '#d2e3fa',
                            color: '#1c2c4d'
                          }
                        }
                      }
                    }
                  }}
                >
                  {players.length === 0 && <MenuItem value="" sx={{ color: '#1c2c4d' }}>No players found</MenuItem>}
                  {players.map(player => (
                    <MenuItem key={player.id} value={player.id} sx={{ color: '#1c2c4d' }}>
                      {player.name} ({player.player_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl fullWidth margin="normal" sx={{ color: '#1c2c4d' }}>
              <InputLabel id="data-type-label" sx={{ color: '#1c2c4d' }}>Data Type</InputLabel>
              <Select
                labelId="data-type-label"
                value={dataType}
                label="Data Type"
                onChange={e => setDataType(e.target.value)}
                sx={{ 
                  color: '#1c2c4d',
                  '& .MuiSelect-select': {
                    backgroundColor: '#fff',
                    color: '#1c2c4d'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3a7bd5'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: '#fff',
                      '& .MuiMenuItem-root': {
                        color: '#1c2c4d',
                        '&:hover': {
                          backgroundColor: '#eaf1fb'
                        },
                        '&.Mui-selected': {
                          backgroundColor: '#d2e3fa',
                          color: '#1c2c4d'
                        }
                      }
                    }
                  }
                }}
              >
                <MenuItem value="blast" sx={{ color: '#1c2c4d' }}>Blast</MenuItem>
                <MenuItem value="hittrax" sx={{ color: '#1c2c4d' }}>Hittrax</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              component="label"
              fullWidth
              sx={{ mt: 2, color: '#1c2c4d', background: '#eaf1fb', fontWeight: 700, '&:hover': { background: '#d2e3fa' } }}
            >
              {file ? file.name : 'Select CSV File'}
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={e => setFile(e.target.files[0])}
              />
            </Button>
            {loading && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="caption" sx={{ color: '#1c2c4d' }}>{progress}%</Typography>
              </Box>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3, color: '#fff', background: '#1c2c4d', fontWeight: 700, '&:hover': { background: '#3a7bd5' } }}
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
          </form>
        </Paper>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>
      )}
      {uploadResult && (
        <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 4 }}>
          <Card sx={{ p: 4, mb: 4, background: 'rgba(255,255,255,0.95)' }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#1c2c4d', textAlign: 'center' }}>
              Upload Report Preview
            </Typography>
            <ReportDisplay report={uploadResult.report} />
          </Card>
        </Box>
      )}
    </Box>
  );
}

export default Upload; 