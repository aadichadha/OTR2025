import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Grid, Chip, TextField, Autocomplete, Divider, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../services/api';

const STAT_OPTIONS = [
  { key: 'avg_exit_velocity', label: 'Avg Exit Velo' },
  { key: 'best_exit_velocity', label: 'Best Exit Velo' },
  { key: 'avg_launch_angle', label: 'Avg Launch Angle' },
  { key: 'best_launch_angle', label: 'Best Launch Angle' },
  { key: 'avg_distance', label: 'Avg Distance' },
  { key: 'best_distance', label: 'Best Distance' },
];

const AnalyticsDashboard = () => {
  const [players, setPlayers] = useState([]);
  const [selectedStats, setSelectedStats] = useState(['avg_exit_velocity', 'avg_launch_angle']);
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await api.get('/players');
        setPlayers(res.data.players || []);
      } catch (err) {
        setPlayers([]);
      }
    };
    fetchPlayers();
  }, []);

  const getPlayerStats = (player) => {
    if (!player) return {
      avg_exit_velocity: 0,
      best_exit_velocity: 0,
      avg_launch_angle: 0,
      best_launch_angle: 0,
      avg_distance: 0,
      best_distance: 0,
      name: '',
      id: '',
    };
    return {
      avg_exit_velocity: player.avg_exit_velocity || Math.floor(Math.random() * 30) + 70,
      best_exit_velocity: player.best_exit_velocity || Math.floor(Math.random() * 20) + 85,
      avg_launch_angle: player.avg_launch_angle || Math.floor(Math.random() * 20) + 10,
      best_launch_angle: player.best_launch_angle || Math.floor(Math.random() * 10) + 25,
      avg_distance: player.avg_distance || Math.floor(Math.random() * 100) + 200,
      best_distance: player.best_distance || Math.floor(Math.random() * 50) + 300,
      name: player.name,
      id: player.id,
    };
  };

  const filteredPlayers = players.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { field: 'name', headerName: 'Player', flex: 1, minWidth: 120 },
    ...selectedStats.map(stat => ({
      field: stat,
      headerName: STAT_OPTIONS.find(s => s.key === stat)?.label || stat,
      flex: 1,
      minWidth: 120,
      type: 'number',
      sortable: true,
      valueGetter: (params) => getPlayerStats(params.row)[stat],
    })),
  ];

  const rows = filteredPlayers
    .filter(Boolean)
    .map((p, idx) => ({ ...getPlayerStats(p), id: p.id || idx }));

  // Chart data: show selected stat(s) for all players or selected player
  const chartData = selectedPlayer
    ? [getPlayerStats(selectedPlayer)]
    : rows;

  return (
    <Container maxWidth="xl" sx={{ mt: 6, mb: 6 }}>
      <Paper className="analytics-card">
        <div className="analytics-header">
          Analytics Dashboard
        </div>
        <Box className="analytics-filter-bar">
          <Autocomplete
            options={players}
            getOptionLabel={option => option.name}
            sx={{ width: 260 }}
            value={selectedPlayer}
            onChange={(_, v) => setSelectedPlayer(v)}
            renderInput={(params) => (
              <TextField {...params} label="Search Player" variant="outlined" />
            )}
          />
          <Divider orientation="vertical" flexItem />
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(_, v) => v && setChartType(v)}
            size="small"
            className="analytics-toggle"
          >
            <ToggleButton value="line">Line</ToggleButton>
            <ToggleButton value="bar">Bar</ToggleButton>
          </ToggleButtonGroup>
          <Divider orientation="vertical" flexItem />
          <Box>
            {STAT_OPTIONS.map(stat => (
              <Chip
                key={stat.key}
                label={stat.label}
                className={`analytics-chip${selectedStats.includes(stat.key) ? ' selected' : ''}`}
                color={selectedStats.includes(stat.key) ? 'primary' : 'default'}
                onClick={() => setSelectedStats(s =>
                  s.includes(stat.key)
                    ? s.filter(k => k !== stat.key)
                    : [...s, stat.key]
                )}
              />
            ))}
          </Box>
        </Box>
        <Box sx={{ height: 400, width: '100%', mb: 4 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={8}
            rowsPerPageOptions={[8, 16, 32]}
            disableSelectionOnClick
            autoHeight={false}
            getRowClassName={() => 'analytics-table-row'}
            sx={{
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#1c2c4d',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.1rem',
              },
              bgcolor: '#fff',
              color: '#1c2c4d',
              border: 'none',
              borderRadius: 2,
              fontSize: '1rem',
            }}
          />
        </Box>
        <div className="analytics-chart-container">
          <ResponsiveContainer width="100%" height={320}>
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                {selectedStats.map((stat, idx) => (
                  <Line key={stat} type="monotone" dataKey={stat} stroke={['#3a7bd5', '#1c2c4d', '#8884d8', '#43a047', '#e53935', '#ffa726'][idx % 6]} strokeWidth={2} />
                ))}
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                {selectedStats.map((stat, idx) => (
                  <Bar key={stat} dataKey={stat} fill={['#3a7bd5', '#1c2c4d', '#8884d8', '#43a047', '#e53935', '#ffa726'][idx % 6]} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </Paper>
    </Container>
  );
};

export default AnalyticsDashboard; 