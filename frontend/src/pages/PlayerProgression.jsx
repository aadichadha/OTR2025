import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Slider,
  Badge,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  EmojiEvents,
  Lightbulb,
  Timeline,
  Speed,
  ShowChart,
  FilterList,
  CompareArrows,
  Warning,
  CheckCircle,
  Star,
  Fire,
  Add
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart, ScatterChart, Scatter, ReferenceLine } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getGradeInfo, getGradeEmoji, formatGrade } from '../utils/grade20to80';

// Custom hook for progression data
const useProgressionData = (playerId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/players/${playerId}/progression`);
        setData(response.data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (playerId) {
      fetchData();
    }
  }, [playerId]);

  return { data, loading, error };
};

// Sparkline component for micro-trends
const Sparkline = ({ data, color = '#1c2c4d', height = 30 }) => {
  if (!data || data.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.3}
          strokeWidth={1}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Progress ring component for goal heat-meter
const ProgressRing = ({ progress, size = 60, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getColor = (progress) => {
    if (progress >= 90) return '#43a047'; // Green
    if (progress >= 70) return '#ffa726'; // Orange
    return '#e53935'; // Red
  };

  return (
    <Box position="relative" display="inline-block">
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(progress)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        textAlign="center"
      >
        <Typography variant="caption" fontWeight="bold" color="#1c2c4d">
          {Math.round(progress)}%
        </Typography>
      </Box>
    </Box>
  );
};

// Overview Tab Component
const OverviewTab = ({ data }) => {
  const { progressionData, levelStats } = data;
  const [timePeriod, setTimePeriod] = useState('all'); // 'all', '30d', '60d', '90d', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Filter data based on time period
  const filteredData = useMemo(() => {
    let filtered = [...progressionData];

    // Apply time period filter
    const now = new Date();
    let startDate = null;
    let endDate = null;

    switch (timePeriod) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '60d':
        startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (customStartDate) {
          startDate = new Date(customStartDate);
        }
        if (customEndDate) {
          endDate = new Date(customEndDate);
        }
        break;
      case 'all':
        // For "all time", don't set any date filters - return all data
        startDate = null;
        endDate = null;
        break;
      default:
        startDate = null;
    }

    if (startDate) {
      filtered = filtered.filter(session => new Date(session.sessionDate) >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter(session => new Date(session.sessionDate) <= endDate);
    }

    return filtered;
  }, [progressionData, timePeriod, customStartDate, customEndDate]);

  const chartData = useMemo(() => {
    return filteredData.map(session => ({
      date: new Date(session.sessionDate).toLocaleDateString(),
      avgEv: session.metrics.avgEv || null,
      maxEv: session.metrics.maxEv || null,
      avgBs: session.metrics.avgBs || null,
      maxBs: session.metrics.maxBs || null,
      barrelPct: session.metrics.barrelPct || null,
      avgEvGrade: session.grades.avgEv,
      maxEvGrade: session.grades.maxEv,
      avgBsGrade: session.grades.avgBs,
      maxBsGrade: session.grades.maxBs,
      barrelPctGrade: session.grades.barrelPct
    }));
  }, [filteredData]);

  // Calculate averages over the selected time period
  const periodAverages = useMemo(() => {
    if (filteredData.length === 0) return {};

    const metrics = ['avgEv', 'maxEv', 'avgBs', 'maxBs', 'barrelPct'];
    const averages = {};

    metrics.forEach(metric => {
      const values = filteredData
        .map(session => session.metrics[metric])
        .filter(value => value !== null && value !== undefined && value > 0);
      
      if (values.length > 0) {
        averages[metric] = values.reduce((sum, val) => sum + val, 0) / values.length;
      } else {
        averages[metric] = null; // Show N/A when no data
      }
    });

    return averages;
  }, [filteredData]);

  const metrics = [
    { key: 'avgEv', label: 'Avg Exit Velocity', unit: 'MPH', color: '#1c2c4d' },
    { key: 'maxEv', label: 'Max Exit Velocity', unit: 'MPH', color: '#3a7bd5' },
    { key: 'avgBs', label: 'Avg Bat Speed', unit: 'MPH', color: '#43a047' },
    { key: 'maxBs', label: 'Max Bat Speed', unit: 'MPH', color: '#ffa726' },
    { key: 'barrelPct', label: 'Barrel %', unit: '%', color: '#e53935' }
  ];

  return (
    <Box sx={{ bgcolor: '#1c2c4d', minHeight: '100vh', p: 3 }}>
      <Card sx={{ mb: 3, bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 600 }}>
            Performance Trends
          </Typography>
        </CardContent>
      </Card>

      {/* Time Period Toggle */}
      <Card sx={{ mb: 3, bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ color: '#1c2c4d', fontWeight: 600, mb: 2 }}>
            Time Period: {timePeriod === 'all' ? 'All Time' : 
                         timePeriod === '30d' ? 'Last 30 Days' :
                         timePeriod === '60d' ? 'Last 60 Days' :
                         timePeriod === '90d' ? 'Last 90 Days' : 'Custom Range'}
          </Typography>
          
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <Button
              variant={timePeriod === 'all' ? 'contained' : 'outlined'}
              onClick={() => setTimePeriod('all')}
              sx={{ 
                bgcolor: timePeriod === 'all' ? '#1c2c4d' : 'transparent',
                color: timePeriod === 'all' ? 'white' : '#1c2c4d',
                borderColor: '#1c2c4d',
                '&:hover': {
                  bgcolor: timePeriod === 'all' ? '#0f1a2e' : '#f5f5f5'
                }
              }}
            >
              All Time
            </Button>
            <Button
              variant={timePeriod === '30d' ? 'contained' : 'outlined'}
              onClick={() => setTimePeriod('30d')}
              sx={{ 
                bgcolor: timePeriod === '30d' ? '#1c2c4d' : 'transparent',
                color: timePeriod === '30d' ? 'white' : '#1c2c4d',
                borderColor: '#1c2c4d',
                '&:hover': {
                  bgcolor: timePeriod === '30d' ? '#0f1a2e' : '#f5f5f5'
                }
              }}
            >
              30 Days
            </Button>
            <Button
              variant={timePeriod === '60d' ? 'contained' : 'outlined'}
              onClick={() => setTimePeriod('60d')}
              sx={{ 
                bgcolor: timePeriod === '60d' ? '#1c2c4d' : 'transparent',
                color: timePeriod === '60d' ? 'white' : '#1c2c4d',
                borderColor: '#1c2c4d',
                '&:hover': {
                  bgcolor: timePeriod === '60d' ? '#0f1a2e' : '#f5f5f5'
                }
              }}
            >
              60 Days
            </Button>
            <Button
              variant={timePeriod === '90d' ? 'contained' : 'outlined'}
              onClick={() => setTimePeriod('90d')}
              sx={{ 
                bgcolor: timePeriod === '90d' ? '#1c2c4d' : 'transparent',
                color: timePeriod === '90d' ? 'white' : '#1c2c4d',
                borderColor: '#1c2c4d',
                '&:hover': {
                  bgcolor: timePeriod === '90d' ? '#0f1a2e' : '#f5f5f5'
                }
              }}
            >
              90 Days
            </Button>
            <Button
              variant={timePeriod === 'custom' ? 'contained' : 'outlined'}
              onClick={() => setTimePeriod('custom')}
              sx={{ 
                bgcolor: timePeriod === 'custom' ? '#1c2c4d' : 'transparent',
                color: timePeriod === 'custom' ? 'white' : '#1c2c4d',
                borderColor: '#1c2c4d',
                '&:hover': {
                  bgcolor: timePeriod === 'custom' ? '#0f1a2e' : '#f5f5f5'
                }
              }}
            >
              Custom
            </Button>
          </Box>



          {/* Custom Date Range Inputs */}
          {timePeriod === 'custom' && (
            <Box display="flex" gap={2} mt={2} alignItems="center" flexWrap="wrap">
              <TextField
                label="Start Date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ 
                  minWidth: 150,
                  '& .MuiInputLabel-root': { color: '#1c2c4d' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#1c2c4d' },
                    '&:hover fieldset': { borderColor: '#1c2c4d' },
                    '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                  },
                  '& .MuiInputBase-input': { color: '#1c2c4d' }
                }}
              />
              <TextField
                label="End Date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ 
                  minWidth: 150,
                  '& .MuiInputLabel-root': { color: '#1c2c4d' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#1c2c4d' },
                    '&:hover fieldset': { borderColor: '#1c2c4d' },
                    '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                  },
                  '& .MuiInputBase-input': { color: '#1c2c4d' }
                }}
              />
            </Box>
          )}

          {/* Period Averages Summary */}
          {Object.keys(periodAverages).length > 0 && (
            <Box mt={2} p={2} bgcolor="white" borderRadius={1} border="1px solid #1c2c4d">
              <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600, mb: 1 }}>
                Period Averages ({filteredData.length} sessions):
              </Typography>
              <Box display="flex" gap={3} flexWrap="wrap">
                {Object.entries(periodAverages).map(([metric, average]) => (
                  <Box key={metric}>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {metric === 'avgEv' ? 'Avg EV' :
                       metric === 'maxEv' ? 'Max EV' :
                       metric === 'avgBs' ? 'Avg BS' :
                       metric === 'maxBs' ? 'Max BS' :
                       metric === 'barrelPct' ? 'Barrel %' : metric}:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#1c2c4d', fontWeight: 600 }}>
                      {average ? average.toFixed(1) : 'N/A'} {metric.includes('Ev') || metric.includes('Bs') ? 'mph' : '%'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
      
      <Card sx={{ mb: 3, bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="center">
            <ResponsiveContainer width="65%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#1c2c4d" />
              <YAxis stroke="#1c2c4d" />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <Card sx={{ p: 2, bgcolor: 'white', border: '2px solid #1c2c4d' }}>
                        <Typography variant="subtitle2" sx={{ color: '#1c2c4d' }}>{label}</Typography>
                        {payload.map((entry, index) => (
                          <Box key={index} sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ color: entry.color }}>
                              {entry.name}: {entry.value} {entry.payload[`${entry.dataKey}Grade`] && 
                                `(${formatGrade(entry.payload[`${entry.dataKey}Grade`])} grade)`
                              }
                            </Typography>
                          </Box>
                        ))}
                      </Card>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="avgEv" stroke="#1c2c4d" strokeWidth={2} dot={{ fill: '#1c2c4d' }} />
              <Line type="monotone" dataKey="maxEv" stroke="#3a7bd5" strokeWidth={2} dot={{ fill: '#3a7bd5' }} />
              <Line type="monotone" dataKey="barrelPct" stroke="#43a047" strokeWidth={2} dot={{ fill: '#43a047' }} />
            </LineChart>
          </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {metrics.map((metric) => {
          const latestValue = chartData[chartData.length - 1]?.[metric.key];
          const periodAverage = periodAverages[metric.key];
          const previousValue = chartData[chartData.length - 2]?.[metric.key];
          const trend = latestValue && previousValue ? latestValue - previousValue : 0;
          const trendPercent = previousValue ? (trend / previousValue) * 100 : 0;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={metric.key}>
              <Card sx={{ bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 600 }}>
                      {metric.label}
                    </Typography>
                    <CheckCircle sx={{ color: '#43a047' }} />
                  </Box>
                  
                  <Typography variant="h4" sx={{ color: metric.color, fontWeight: 700, mb: 1 }}>
                    {periodAverage ? `${periodAverage.toFixed(1)} ${metric.unit}` : 'N/A'}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    Period Average • {filteredData.length} sessions
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={1}>
                    {trend > 0 ? (
                      <TrendingUp sx={{ color: '#43a047', fontSize: 20 }} />
                    ) : trend < 0 ? (
                      <TrendingDown sx={{ color: '#e53935', fontSize: 20 }} />
                    ) : (
                      <TrendingFlat sx={{ color: '#757575', fontSize: 20 }} />
                    )}
                    <Typography variant="body2" sx={{ color: '#1c2c4d' }}>
                      {trendPercent ? Math.abs(trendPercent).toFixed(1) : 'N/A'}% recent trend
                    </Typography>
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(Math.abs(trendPercent) * 10, 100)} 
                    sx={{ 
                      mt: 1, 
                      height: 4, 
                      borderRadius: 2,
                      bgcolor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: trend > 0 ? '#43a047' : trend < 0 ? '#e53935' : '#757575'
                      }
                    }} 
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

// Trends Tab Component
const TrendsTab = ({ data }) => {
  const { progressionData, trends: dataTrends } = data;
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonSlider, setComparisonSlider] = useState(50);
  const [timePeriod, setTimePeriod] = useState('all'); // 'all', '30d', '60d', '90d', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Filter data based on time period for trends
  const filteredTrendData = useMemo(() => {
    let filtered = [...progressionData];

    // Apply time period filter
    const now = new Date();
    let startDate = null;
    let endDate = null;

    switch (timePeriod) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '60d':
        startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (customStartDate) {
          startDate = new Date(customStartDate);
        }
        if (customEndDate) {
          endDate = new Date(customEndDate);
        }
        break;
      case 'all':
        // For "all time", don't set any date filters - return all data
        startDate = null;
        endDate = null;
        break;
      default:
        startDate = null;
    }

    if (startDate) {
      filtered = filtered.filter(session => new Date(session.sessionDate) >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter(session => new Date(session.sessionDate) <= endDate);
    }

    return filtered;
  }, [progressionData, timePeriod, customStartDate, customEndDate]);

  // Calculate trends for each metric (first session vs last session)
  const trends = useMemo(() => {
    const trendMetrics = [
      { key: 'avgEv', label: 'Average Exit Velocity', unit: 'MPH' },
      { key: 'maxEv', label: 'Maximum Exit Velocity', unit: 'MPH' },
      { key: 'avgBs', label: 'Average Bat Speed', unit: 'MPH' },
      { key: 'maxBs', label: 'Maximum Bat Speed', unit: 'MPH' },
      { key: 'barrelPct', label: 'Barrel Percentage', unit: '%' }
    ];

    // Always return all metrics, even if no data
    return trendMetrics.reduce((acc, metric) => {
      // Check if we have enough data to calculate trends
      if (filteredTrendData.length < 2) {
        acc[metric.key] = {
          percentChange: null,
          direction: 'flat',
          firstValue: null,
          lastValue: null,
          hasData: false
        };
        return acc;
      }

      // Find the first and last sessions that have valid data for this metric
      const sessionsWithMetric = filteredTrendData.filter(session => 
        session.metrics[metric.key] !== null && session.metrics[metric.key] !== undefined && session.metrics[metric.key] > 0
      );
      
      if (sessionsWithMetric.length >= 2) {
        const firstSessionWithMetric = sessionsWithMetric[0];
        const lastSessionWithMetric = sessionsWithMetric[sessionsWithMetric.length - 1];
        
        const firstValue = firstSessionWithMetric.metrics[metric.key];
        const lastValue = lastSessionWithMetric.metrics[metric.key];
        const percentChange = ((lastValue - firstValue) / firstValue) * 100;
        const direction = percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'flat';

        acc[metric.key] = {
          percentChange: Math.round(percentChange * 10) / 10,
          direction,
          firstValue: Math.round(firstValue * 10) / 10,
          lastValue: Math.round(lastValue * 10) / 10,
          hasData: true
        };
      } else if (sessionsWithMetric.length === 1) {
        // Only one session with this metric
        const session = sessionsWithMetric[0];
        acc[metric.key] = {
          percentChange: null,
          direction: 'flat',
          firstValue: session.metrics[metric.key],
          lastValue: session.metrics[metric.key],
          hasData: false
        };
      } else {
        // Show N/A when no data
        acc[metric.key] = {
          percentChange: null,
          direction: 'flat',
          firstValue: null,
          lastValue: null,
          hasData: false
        };
      }

      return acc;
    }, {});
  }, [filteredTrendData]);

  const trendMetrics = [
    { key: 'avgEv', label: 'Average Exit Velocity', unit: 'MPH' },
    { key: 'maxEv', label: 'Maximum Exit Velocity', unit: 'MPH' },
    { key: 'avgBs', label: 'Average Bat Speed', unit: 'MPH' },
    { key: 'maxBs', label: 'Maximum Bat Speed', unit: 'MPH' },
    { key: 'barrelPct', label: 'Barrel Percentage', unit: '%' }
  ];

  return (
    <Box sx={{ bgcolor: '#1c2c4d', minHeight: '100vh', p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
        Performance Trends & Changes
      </Typography>

      {/* Time Period Toggle for Trends */}
      <Card sx={{ mb: 3, bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ color: '#1c2c4d', fontWeight: 600, mb: 2 }}>
            Analysis Period: {timePeriod === 'all' ? 'All Time' : 
                             timePeriod === '30d' ? 'Last 30 Days' :
                             timePeriod === '60d' ? 'Last 60 Days' :
                             timePeriod === '90d' ? 'Last 90 Days' : 'Custom Range'}
          </Typography>
          
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <Button
              variant={timePeriod === 'all' ? 'contained' : 'outlined'}
              onClick={() => setTimePeriod('all')}
              sx={{ 
                bgcolor: timePeriod === 'all' ? '#1c2c4d' : 'transparent',
                color: timePeriod === 'all' ? 'white' : '#1c2c4d',
                borderColor: '#1c2c4d',
                '&:hover': {
                  bgcolor: timePeriod === 'all' ? '#0f1a2e' : '#f5f5f5'
                }
              }}
            >
              All Time
            </Button>
            <Button
              variant={timePeriod === '30d' ? 'contained' : 'outlined'}
              onClick={() => setTimePeriod('30d')}
              sx={{ 
                bgcolor: timePeriod === '30d' ? '#1c2c4d' : 'transparent',
                color: timePeriod === '30d' ? 'white' : '#1c2c4d',
                borderColor: '#1c2c4d',
                '&:hover': {
                  bgcolor: timePeriod === '30d' ? '#0f1a2e' : '#f5f5f5'
                }
              }}
            >
              30 Days
            </Button>
            <Button
              variant={timePeriod === '60d' ? 'contained' : 'outlined'}
              onClick={() => setTimePeriod('60d')}
              sx={{ 
                bgcolor: timePeriod === '60d' ? '#1c2c4d' : 'transparent',
                color: timePeriod === '60d' ? 'white' : '#1c2c4d',
                borderColor: '#1c2c4d',
                '&:hover': {
                  bgcolor: timePeriod === '60d' ? '#0f1a2e' : '#f5f5f5'
                }
              }}
            >
              60 Days
            </Button>
            <Button
              variant={timePeriod === '90d' ? 'contained' : 'outlined'}
              onClick={() => setTimePeriod('90d')}
              sx={{ 
                bgcolor: timePeriod === '90d' ? '#1c2c4d' : 'transparent',
                color: timePeriod === '90d' ? 'white' : '#1c2c4d',
                borderColor: '#1c2c4d',
                '&:hover': {
                  bgcolor: timePeriod === '90d' ? '#0f1a2e' : '#f5f5f5'
                }
              }}
            >
              90 Days
            </Button>
            <Button
              variant={timePeriod === 'custom' ? 'contained' : 'outlined'}
              onClick={() => setTimePeriod('custom')}
              sx={{ 
                bgcolor: timePeriod === 'custom' ? '#1c2c4d' : 'transparent',
                color: timePeriod === 'custom' ? 'white' : '#1c2c4d',
                borderColor: '#1c2c4d',
                '&:hover': {
                  bgcolor: timePeriod === 'custom' ? '#0f1a2e' : '#f5f5f5'
                }
              }}
            >
              Custom
            </Button>
          </Box>



          {/* Custom Date Range Inputs */}
          {timePeriod === 'custom' && (
            <Box display="flex" gap={2} mt={2} alignItems="center" flexWrap="wrap">
              <TextField
                label="Start Date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ 
                  minWidth: 150,
                  '& .MuiInputLabel-root': { color: '#1c2c4d' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#1c2c4d' },
                    '&:hover fieldset': { borderColor: '#1c2c4d' },
                    '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                  },
                  '& .MuiInputBase-input': { color: '#1c2c4d' }
                }}
              />
              <TextField
                label="End Date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ 
                  minWidth: 150,
                  '& .MuiInputLabel-root': { color: '#1c2c4d' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#1c2c4d' },
                    '&:hover fieldset': { borderColor: '#1c2c4d' },
                    '&.Mui-focused fieldset': { borderColor: '#1c2c4d' }
                  },
                  '& .MuiInputBase-input': { color: '#1c2c4d' }
                }}
              />
            </Box>
          )}

          {/* Trends Summary */}
          {filteredTrendData.length > 0 ? (
            <Box mt={2} p={2} bgcolor="white" borderRadius={1} border="1px solid #1c2c4d">
              <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600, mb: 1 }}>
                Trends Analysis ({filteredTrendData.length} sessions):
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Comparing {filteredTrendData[0]?.sessionDate ? new Date(filteredTrendData[0].sessionDate).toLocaleDateString() : 'first session'} 
                {' '}to{' '} {filteredTrendData[filteredTrendData.length - 1]?.sessionDate ? new Date(filteredTrendData[filteredTrendData.length - 1].sessionDate).toLocaleDateString() : 'latest session'}
              </Typography>
              
              {/* Show session type breakdown */}
              {(() => {
                const sessionTypes = [...new Set(filteredTrendData.map(s => s.sessionType))];
                const hittraxSessions = filteredTrendData.filter(s => s.sessionType === 'hittrax').length;
                const blastSessions = filteredTrendData.filter(s => s.sessionType === 'blast').length;
                
                return (
                  <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                    Session breakdown: {hittraxSessions} Hittrax, {blastSessions} Blast
                  </Typography>
                );
              })()}
            </Box>
          ) : (
            <Box mt={2} p={2} bgcolor="white" borderRadius={1} border="1px solid #1c2c4d">
              <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600, mb: 1 }}>
                No Session Data Available
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Need at least 2 sessions to calculate trends. Upload more data to see progression analysis.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {trendMetrics.map((metric) => {
          const trend = trends[metric.key];
          // Always show the metric card, even if no data
          const { percentChange, direction, firstValue, lastValue, hasData } = trend || {};
          const isPositive = direction === 'up';
          const isNegative = direction === 'down';

          return (
            <Grid item xs={12} md={6} key={metric.key}>
              <Card sx={{ bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 600 }}>{metric.label}</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {hasData && isPositive && <TrendingUp sx={{ color: '#43a047' }} />}
                      {hasData && isNegative && <TrendingDown sx={{ color: '#e53935' }} />}
                      {hasData && !isPositive && !isNegative && <TrendingFlat sx={{ color: '#757575' }} />}
                      {!hasData && <TrendingFlat sx={{ color: '#999' }} />}
                    </Box>
                  </Box>
                  
                  {/* Show helpful message about data availability */}
                  {trend.message && (
                    <Typography variant="body2" sx={{ color: '#666', mb: 2, fontStyle: 'italic' }}>
                      {trend.message}
                    </Typography>
                  )}

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Percent Change
                      </Typography>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          color: isPositive ? '#43a047' : isNegative ? '#e53935' : '#1c2c4d',
                          fontWeight: 700
                        }}
                      >
                        {trend.percentChange !== null ? `${trend.percentChange > 0 ? '+' : ''}${trend.percentChange}%` : 'N/A'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Previous Average
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#1c2c4d' }}>
                        {trend.firstValue !== null ? `${trend.firstValue} ${metric.unit}` : 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        New Average
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#1c2c4d' }}>
                        {trend.lastValue !== null ? `${trend.lastValue} ${metric.unit}` : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>

                  <LinearProgress
                    variant="determinate"
                    value={hasData && trend.percentChange !== null ? Math.min(Math.abs(trend.percentChange), 100) : 0}
                    sx={{ 
                      mt: 2, 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: hasData ? (isPositive ? '#43a047' : isNegative ? '#e53935' : '#1c2c4d') : '#999'
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Additional Trend Insights */}
      {Object.keys(trends).length > 0 && (
        <Card sx={{ mt: 3, bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 600, mb: 2 }}>
              Trend Insights
            </Typography>
            
            <Grid container spacing={2}>
              {/* Most Improved Metric */}
              <Grid item xs={12} md={6}>
                <Box p={2} bgcolor="#e8f5e8" borderRadius={1} border="1px solid #43a047">
                  <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600, mb: 1 }}>
                    Most Improved
                  </Typography>
                  {(() => {
                    const mostImproved = Object.entries(trends)
                      .filter(([_, trend]) => trend.hasData && trend.direction === 'up')
                      .sort(([_, a], [__, b]) => b.percentChange - a.percentChange)[0];
                    
                    if (mostImproved) {
                      const [metric, trend] = mostImproved;
                      return (
                        <Typography variant="body1" sx={{ color: '#43a047', fontWeight: 600 }}>
                          {metric === 'avgEv' ? 'Average Exit Velocity' :
                           metric === 'maxEv' ? 'Maximum Exit Velocity' :
                           metric === 'avgBs' ? 'Average Bat Speed' :
                           metric === 'maxBs' ? 'Maximum Bat Speed' :
                           metric === 'barrelPct' ? 'Barrel Percentage' : metric}: +{trend.percentChange}%
                        </Typography>
                      );
                    }
                    return <Typography variant="body2" sx={{ color: '#666' }}>No improvements detected</Typography>;
                  })()}
                </Box>
              </Grid>

              {/* Areas for Improvement */}
              <Grid item xs={12} md={6}>
                <Box p={2} bgcolor="#ffebee" borderRadius={1} border="1px solid #e53935">
                  <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600, mb: 1 }}>
                    Areas for Focus
                  </Typography>
                  {(() => {
                    const needsImprovement = Object.entries(trends)
                      .filter(([_, trend]) => trend.hasData && trend.direction === 'down')
                      .sort(([_, a], [__, b]) => a.percentChange - b.percentChange)[0];
                    
                    if (needsImprovement) {
                      const [metric, trend] = needsImprovement;
                      return (
                        <Typography variant="body1" sx={{ color: '#e53935', fontWeight: 600 }}>
                          {metric === 'avgEv' ? 'Average Exit Velocity' :
                           metric === 'maxEv' ? 'Maximum Exit Velocity' :
                           metric === 'avgBs' ? 'Average Bat Speed' :
                           metric === 'maxBs' ? 'Maximum Bat Speed' :
                           metric === 'barrelPct' ? 'Barrel Percentage' : metric}: {trend.percentChange}%
                        </Typography>
                      );
                    }
                    return <Typography variant="body2" sx={{ color: '#666' }}>All metrics trending positively</Typography>;
                  })()}
                </Box>
              </Grid>

              {/* Consistency Score */}
              <Grid item xs={12}>
                <Box p={2} bgcolor="#e3f2fd" borderRadius={1} border="1px solid #1976d2">
                  <Typography variant="subtitle2" sx={{ color: '#1c2c4d', fontWeight: 600, mb: 1 }}>
                    Performance Consistency
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {(() => {
                      const trendsWithData = Object.values(trends).filter(t => t.hasData);
                      if (trendsWithData.length === 0) {
                        return 'No trend data available - need at least 2 sessions to calculate trends';
                      }
                      
                      const positiveTrends = trendsWithData.filter(t => t.direction === 'up').length;
                      const totalTrends = trendsWithData.length;
                      const consistencyScore = Math.round((positiveTrends / totalTrends) * 100);
                      
                      if (consistencyScore >= 80) {
                        return `Excellent consistency: ${consistencyScore}% of metrics are improving`;
                      } else if (consistencyScore >= 60) {
                        return `Good consistency: ${consistencyScore}% of metrics are improving`;
                      } else if (consistencyScore >= 40) {
                        return `Moderate consistency: ${consistencyScore}% of metrics are improving`;
                      } else {
                        return `Needs attention: Only ${consistencyScore}% of metrics are improving`;
                      }
                    })()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

// Goals Tab Component
const GoalsTab = ({ data }) => {
  const { goals, coachingTips, progressionData } = data;
  const { user } = useAuth();
  const [showAchieved, setShowAchieved] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [createGoalData, setCreateGoalData] = useState({
    goalType: 'avg_ev',
    targetValue: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  const latestSession = progressionData[progressionData.length - 1];
  const activeGoals = goals.filter(g => g.status === 'active');
  const achievedGoals = goals.filter(g => g.status === 'achieved');
  const missedGoals = goals.filter(g => g.status === 'missed');

  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  const handleCreateGoal = async () => {
    try {
      const response = await api.post(`/players/${data.player.id}/goals`, createGoalData);
      if (response.data.success) {
        setShowCreateGoal(false);
        setCreateGoalData({
          goalType: 'avg_ev',
          targetValue: '',
          startDate: '',
          endDate: '',
          notes: ''
        });
        // Refresh the page to get updated goals
        window.location.reload();
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal: ' + error.response?.data?.message || error.message);
    }
  };

  const handleAwardMilestone = async (goalId) => {
    try {
      const response = await api.post(`/goals/${goalId}/award-milestone`);
      if (response.data.success) {
        // Refresh the page to get updated goals
        window.location.reload();
      }
    } catch (error) {
      console.error('Error awarding milestone:', error);
      alert('Failed to award milestone: ' + error.response?.data?.message || error.message);
    }
  };

  const getGoalTypeLabel = (goalType) => {
    switch (goalType) {
      case 'avg_ev': return 'Average Exit Velocity';
      case 'max_ev': return 'Maximum Exit Velocity';
      case 'avg_bs': return 'Average Bat Speed';
      case 'max_bs': return 'Maximum Bat Speed';
      default: return goalType;
    }
  };

  const getGoalProgress = (goal) => {
    if (goal.status === 'achieved') return 100;
    
    const currentValue = latestSession?.metrics[goal.goal_type];
    if (!currentValue) return 0;
    
    const progress = (currentValue / goal.target_value) * 100;
    return Math.min(progress, 100);
  };

  const getGoalStatusColor = (status) => {
    switch (status) {
      case 'active': return '#1976d2';
      case 'achieved': return '#43a047';
      case 'missed': return '#d32f2f';
      default: return '#666';
    }
  };

  const getGoalStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Timeline />;
      case 'achieved': return <CheckCircle />;
      case 'missed': return <Warning />;
      default: return <Star />;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 600 }}>
          Goals & Milestones
        </Typography>
        {isCoach && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateGoal(true)}
            sx={{ bgcolor: '#1c2c4d', '&:hover': { bgcolor: '#0f1a2e' } }}
          >
            Create Goal
          </Button>
        )}
      </Box>

      <Box display="flex" gap={2} mb={3}>
        <FormControlLabel
          control={
            <Switch
              checked={showActive}
              onChange={(e) => setShowActive(e.target.checked)}
            />
          }
          label="Show Active"
          sx={{ color: '#1c2c4d' }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={showAchieved}
              onChange={(e) => setShowAchieved(e.target.checked)}
            />
          }
          label="Show Achieved"
          sx={{ color: '#1c2c4d' }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Active Goals */}
        {showActive && activeGoals.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'white', border: '2px solid #1976d2', borderRadius: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Timeline sx={{ color: '#1976d2' }} />
                  <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 600 }}>
                    Active Goals
                  </Typography>
                </Box>

                <List>
                  {activeGoals.map((goal) => {
                    const progress = getGoalProgress(goal);
                    const daysLeft = Math.ceil((new Date(goal.end_date) - new Date()) / (1000 * 60 * 60 * 24));

                    return (
                      <ListItem key={goal.id} sx={{ mb: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #1976d2' }}>
                        <ListItemIcon>
                          <Timeline sx={{ color: '#1976d2' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={getGoalTypeLabel(goal.goal_type)}
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ color: '#666' }}>
                                Target: {goal.target_value} {goal.goal_type.includes('ev') ? 'mph' : 'mph'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666' }}>
                                Due: {new Date(goal.end_date).toLocaleDateString()} ({daysLeft} days left)
                              </Typography>
                              {goal.notes && (
                                <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                                  {goal.notes}
                                </Typography>
                              )}
                            </Box>
                          }
                          sx={{ 
                            '& .MuiListItemText-primary': { color: '#1c2c4d', fontWeight: 600 },
                            '& .MuiListItemText-secondary': { color: '#666' }
                          }}
                        />
                        <Box display="flex" alignItems="center" gap={1}>
                          <ProgressRing progress={progress} size={40} />
                          <Typography variant="caption" sx={{ color: '#1c2c4d', fontWeight: 600 }}>
                            {Math.round(progress)}%
                          </Typography>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Achieved Goals */}
        {showAchieved && achievedGoals.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'white', border: '2px solid #43a047', borderRadius: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <EmojiEvents sx={{ color: '#43a047' }} />
                  <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 600 }}>
                    Achieved Goals
                  </Typography>
                </Box>

                <List>
                  {achievedGoals.map((goal) => (
                    <ListItem key={goal.id} sx={{ mb: 2, bgcolor: '#e8f5e8', borderRadius: 1, border: '1px solid #43a047' }}>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: '#43a047' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={getGoalTypeLabel(goal.goal_type)}
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              Achieved: {new Date(goal.achieved_date).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              Target: {goal.target_value} {goal.goal_type.includes('ev') ? 'mph' : 'mph'}
                            </Typography>
                            {goal.notes && (
                              <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                                {goal.notes}
                              </Typography>
                            )}
                          </Box>
                        }
                        sx={{ 
                          '& .MuiListItemText-primary': { color: '#1c2c4d', fontWeight: 600 },
                          '& .MuiListItemText-secondary': { color: '#666' }
                        }}
                      />
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        {!goal.milestone_awarded && isCoach && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleAwardMilestone(goal.id)}
                            sx={{ borderColor: '#43a047', color: '#43a047' }}
                          >
                            Award Milestone
                          </Button>
                        )}
                        {goal.milestone_awarded && (
                          <Chip 
                            label="Milestone Awarded" 
                            size="small" 
                            sx={{ bgcolor: '#43a047', color: 'white', fontWeight: 600 }}
                          />
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Coaching Tips */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Lightbulb sx={{ color: '#1c2c4d' }} />
                <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 600 }}>Coaching Tips</Typography>
              </Box>

              {coachingTips.length > 0 ? (
                <List>
                  {coachingTips.map((tip, index) => (
                    <ListItem key={index} sx={{ mb: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #1976d2' }}>
                      <ListItemIcon>
                        <Lightbulb sx={{ color: '#1976d2' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${tip.metric.toUpperCase()} Improvement`}
                        secondary={tip.tip}
                        sx={{ 
                          '& .MuiListItemText-primary': { color: '#1c2c4d', fontWeight: 600 },
                          '& .MuiListItemText-secondary': { color: '#666' }
                        }}
                      />
                      <Chip 
                        label={`${tip.currentGrade} → ${tip.targetGrade}`}
                        size="small"
                        sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 600 }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info" sx={{ bgcolor: '#e3f2fd', color: '#1c2c4d' }}>
                  No coaching tips available at this time.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Goal Dialog */}
      {showCreateGoal && (
        <Dialog 
          open={showCreateGoal} 
          onClose={() => setShowCreateGoal(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: 'white',
              border: '2px solid #1c2c4d',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(28, 44, 77, 0.1)'
            }
          }}
        >
          <DialogTitle sx={{ 
            color: '#1c2c4d', 
            fontWeight: 600, 
            borderBottom: '1px solid #e0e0e0',
            bgcolor: '#f8f9fa'
          }}>
            Create New Goal
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ color: '#1c2c4d', fontWeight: 500 }}>Goal Type</InputLabel>
                <Select
                  value={createGoalData.goalType}
                  onChange={(e) => setCreateGoalData({...createGoalData, goalType: e.target.value})}
                  label="Goal Type"
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1c2c4d',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1c2c4d',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1c2c4d',
                    }
                  }}
                >
                  <MenuItem value="avg_ev">Average Exit Velocity</MenuItem>
                  <MenuItem value="max_ev">Maximum Exit Velocity</MenuItem>
                  <MenuItem value="avg_bs">Average Bat Speed</MenuItem>
                  <MenuItem value="max_bs">Maximum Bat Speed</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Target Value"
                type="number"
                value={createGoalData.targetValue}
                onChange={(e) => setCreateGoalData({...createGoalData, targetValue: e.target.value})}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#1c2c4d',
                    fontWeight: 500
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#666'
                  }
                }}
                helperText={`Target ${createGoalData.goalType.includes('ev') ? 'exit velocity' : 'bat speed'} in mph`}
              />

              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={createGoalData.startDate}
                onChange={(e) => setCreateGoalData({...createGoalData, startDate: e.target.value})}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#1c2c4d',
                    fontWeight: 500
                  }
                }}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={createGoalData.endDate}
                onChange={(e) => setCreateGoalData({...createGoalData, endDate: e.target.value})}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#1c2c4d',
                    fontWeight: 500
                  }
                }}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={createGoalData.notes}
                onChange={(e) => setCreateGoalData({...createGoalData, notes: e.target.value})}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1c2c4d',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#1c2c4d',
                    fontWeight: 500
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            p: 3, 
            borderTop: '1px solid #e0e0e0',
            bgcolor: '#f8f9fa'
          }}>
            <Button 
              onClick={() => setShowCreateGoal(false)}
              sx={{ 
                color: '#1c2c4d',
                borderColor: '#1c2c4d',
                '&:hover': {
                  bgcolor: '#f0f0f0',
                  borderColor: '#1c2c4d'
                }
              }}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGoal} 
              variant="contained"
              disabled={!createGoalData.targetValue || !createGoalData.startDate || !createGoalData.endDate}
              sx={{ 
                bgcolor: '#1c2c4d',
                color: 'white',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#0f1a2e'
                },
                '&:disabled': {
                  bgcolor: '#ccc',
                  color: '#666'
                }
              }}
            >
              Create Goal
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

// Swing Analysis Tab Component
const SwingAnalysisTab = ({ data }) => {
  const { progressionData } = data;
  const [qualityFilter, setQualityFilter] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonSlider, setComparisonSlider] = useState(50);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [timePeriod, setTimePeriod] = useState('all'); // 'all', '30d', '60d', '90d', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Filter data based on time period
  const filteredData = useMemo(() => {
    let filtered = [...progressionData];

    // Apply quality filter
    if (qualityFilter) {
      filtered = filtered.filter(session => {
        const hasGoodAttackAngles = session.metrics.avgBs && 
          session.metrics.avgBs > 45; // Minimum bat speed threshold
        return hasGoodAttackAngles;
      });
    }

    // Apply time period filter
    const now = new Date();
    let startDate = null;

    switch (timePeriod) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '60d':
        startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (customStartDate) {
          startDate = new Date(customStartDate);
        }
        if (customEndDate) {
          const endDate = new Date(customEndDate);
          filtered = filtered.filter(session => new Date(session.sessionDate) <= endDate);
        }
        break;
      default: // 'all'
        startDate = null;
    }

    if (startDate) {
      filtered = filtered.filter(session => new Date(session.sessionDate) >= startDate);
    }

    return filtered;
  }, [progressionData, qualityFilter, timePeriod, customStartDate, customEndDate]);

  // Prepare chart data for LA vs EV scatter plot
  const laEvChartData = useMemo(() => {
    return filteredData
      .filter(session => session.metrics.avgEv && session.metrics.avgLa)
      .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate)) // Sort chronologically
      .map(session => ({
        avgEv: session.metrics.avgEv,
        avgLa: session.metrics.avgLa,
        sessionId: session.id,
        sessionDate: new Date(session.sessionDate).toLocaleDateString(),
        avgBs: session.metrics.avgBs
      }));
  }, [filteredData]);

  // Prepare chart data for average EV per session (time series)
  const evChartData = useMemo(() => {
    return filteredData
      .filter(session => session.metrics.avgEv)
      .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate)) // Sort chronologically
      .map(session => ({
        date: new Date(session.sessionDate).toLocaleDateString(),
        avgEv: session.metrics.avgEv,
        maxEv: session.metrics.maxEv,
        sessionId: session.id
      }));
  }, [filteredData]);

  const firstSession = filteredData[0];
  const lastSession = filteredData[filteredData.length - 1];

  const handleSessionSelection = (sessionId) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const getSelectedSessionData = () => {
    if (selectedSessions.length === 0) return filteredData;
    return filteredData.filter(session => selectedSessions.includes(session.id));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 600 }}>
        Swing Analysis & Quality Control
      </Typography>

      {/* Filters Section */}
      <Card sx={{ mb: 3, bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 600 }}>
            Analysis Filters
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2} flexWrap="wrap">
                <FormControlLabel
                  control={
                    <Switch
                      checked={qualityFilter}
                      onChange={(e) => setQualityFilter(e.target.checked)}
                    />
                  }
                  label="Quality Filter (Hide poor swings)"
                  sx={{ color: '#1c2c4d' }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={comparisonMode}
                      onChange={(e) => setComparisonMode(e.target.checked)}
                    />
                  }
                  label="Comparison Mode"
                  sx={{ color: '#1c2c4d' }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <Typography variant="body2" sx={{ color: '#1c2c4d', fontWeight: 600 }}>
                  Time Period:
                </Typography>
                <select 
                  value={timePeriod} 
                  onChange={(e) => setTimePeriod(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #1c2c4d',
                    borderRadius: '6px',
                    color: '#1c2c4d',
                    fontWeight: 600,
                    backgroundColor: 'white'
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="60d">Last 60 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </Box>
              
              {timePeriod === 'custom' && (
                <Box display="flex" gap={2} mt={2} flexWrap="wrap">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid #1c2c4d',
                      borderRadius: '6px',
                      color: '#1c2c4d',
                      fontWeight: 600,
                      backgroundColor: 'white'
                    }}
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid #1c2c4d',
                      borderRadius: '6px',
                      color: '#1c2c4d',
                      fontWeight: 600,
                      backgroundColor: 'white'
                    }}
                    placeholder="End Date"
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Session Selection */}
      <Card sx={{ mb: 3, bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 600 }}>
            Session Selection ({selectedSessions.length} selected)
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {filteredData.map((session) => (
              <Chip
                key={session.id}
                label={`${new Date(session.sessionDate).toLocaleDateString()} (${session.metrics.avgEv ? session.metrics.avgEv.toFixed(1) : 'N/A'} EV)`}
                onClick={() => handleSessionSelection(session.id)}
                sx={{
                  bgcolor: selectedSessions.includes(session.id) ? '#1c2c4d' : 'transparent',
                  color: selectedSessions.includes(session.id) ? 'white' : '#1c2c4d',
                  border: '2px solid #1c2c4d',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: selectedSessions.includes(session.id) ? '#1c2c4d' : '#f5f5f5'
                  }
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* LA vs EV Scatter Plot */}
      <Card sx={{ mb: 3, bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 600 }}>
            Exit Velocity vs Launch Angle Relationship
          </Typography>
          {laEvChartData.length > 0 ? (
            <Box display="flex" justifyContent="center">
              <ResponsiveContainer width="65%" height={400}>
              <ScatterChart data={laEvChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="avgEv" 
                  stroke="#1c2c4d" 
                  label={{ value: 'Average Exit Velocity (MPH)', position: 'bottom', offset: 0 }}
                  domain={[60, 100]}
                  type="number"
                  tick={{ fill: '#1c2c4d' }}
                />
                <YAxis 
                  stroke="#1c2c4d" 
                  label={{ value: 'Average Launch Angle (°)', angle: -90, position: 'left' }}
                  domain={[-15, 40]}
                  type="number"
                  tick={{ fill: '#1c2c4d' }}
                />
                <ReferenceLine x={0} stroke="#e0e0e0" strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke="#e0e0e0" strokeDasharray="3 3" />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <Card sx={{ p: 2, bgcolor: 'white', border: '2px solid #1c2c4d' }}>
                          <Typography variant="subtitle2" sx={{ color: '#1c2c4d' }}>
                            Session: {data.sessionDate}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#1c2c4d' }}>
                            Exit Velocity: {data.avgEv} MPH
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#1c2c4d' }}>
                            Launch Angle: {data.avgLa}°
                          </Typography>
                          {data.avgBs && (
                            <Typography variant="body2" sx={{ color: '#1c2c4d' }}>
                              Bat Speed: {data.avgBs} MPH
                            </Typography>
                          )}
                        </Card>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  dataKey="avgLa" 
                  fill="#1c2c4d" 
                  stroke="#1c2c4d" 
                  strokeWidth={2}
                  r={6}
                  name="Launch Angle vs Exit Velocity"
                />
                <Line 
                  type="monotone" 
                  dataKey="avgLa" 
                  stroke="#1c2c4d" 
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  connectNulls={false}
                />
              </ScatterChart>
            </ResponsiveContainer>
            </Box>
          ) : (
            <Alert severity="info" sx={{ bgcolor: '#e3f2fd', color: '#1c2c4d' }}>
              No launch angle data available for the selected time period.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Average EV per Session Graph */}
      <Card sx={{ mb: 3, bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 600 }}>
            Exit Velocity Trends Over Time
          </Typography>
          {evChartData.length > 0 ? (
            <Box display="flex" justifyContent="center">
              <ResponsiveContainer width="65%" height={400}>
              <LineChart data={evChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#1c2c4d" />
                <YAxis stroke="#1c2c4d" />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <Card sx={{ p: 2, bgcolor: 'white', border: '2px solid #1c2c4d' }}>
                          <Typography variant="subtitle2" sx={{ color: '#1c2c4d' }}>{label}</Typography>
                          {payload.map((entry, index) => (
                            <Box key={index} sx={{ mt: 1 }}>
                              <Typography variant="body2" sx={{ color: entry.color }}>
                                {entry.name}: {entry.value} MPH
                              </Typography>
                            </Box>
                          ))}
                        </Card>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgEv" 
                  stroke="#1c2c4d" 
                  strokeWidth={3} 
                  dot={{ fill: '#1c2c4d', r: 4 }}
                  name="Average Exit Velocity"
                />
                <Line 
                  type="monotone" 
                  dataKey="maxEv" 
                  stroke="#e53935" 
                  strokeWidth={2} 
                  dot={{ fill: '#e53935', r: 3 }}
                  name="Maximum Exit Velocity"
                />
              </LineChart>
            </ResponsiveContainer>
            </Box>
          ) : (
            <Alert severity="info" sx={{ bgcolor: '#e3f2fd', color: '#1c2c4d' }}>
              No exit velocity data available for the selected time period.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Comparison Mode */}
      {comparisonMode && (
        <Card sx={{ mb: 3, bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 600 }}>
              Compare Progress: First Session vs Latest Session
            </Typography>
            <Slider
              value={comparisonSlider}
              onChange={(e, value) => setComparisonSlider(value)}
              valueLabelDisplay="auto"
              marks={[
                { value: 0, label: 'First' },
                { value: 50, label: 'Middle' },
                { value: 100, label: 'Latest' }
              ]}
              sx={{
                '& .MuiSlider-markLabel': { color: '#1c2c4d' },
                '& .MuiSlider-thumb': { bgcolor: '#1c2c4d' },
                '& .MuiSlider-track': { bgcolor: '#1c2c4d' }
              }}
            />
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Session Quality Metrics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 600 }}>
                Session Quality Metrics
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText
                    primary="Total Sessions Analyzed"
                    secondary={filteredData.length}
                    sx={{ 
                      '& .MuiListItemText-primary': { color: '#1c2c4d', fontWeight: 600 },
                      '& .MuiListItemText-secondary': { color: '#666' }
                    }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Average Swings per Session"
                    secondary={Math.round(
                      filteredData.reduce((sum, session) => sum + session.totalSwings, 0) / filteredData.length
                    )}
                    sx={{ 
                      '& .MuiListItemText-primary': { color: '#1c2c4d', fontWeight: 600 },
                      '& .MuiListItemText-secondary': { color: '#666' }
                    }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Data Quality Score"
                    secondary={`${Math.round((filteredData.length / progressionData.length) * 100)}%`}
                    sx={{ 
                      '& .MuiListItemText-primary': { color: '#1c2c4d', fontWeight: 600 },
                      '& .MuiListItemText-secondary': { color: '#666' }
                    }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Selected Sessions"
                    secondary={selectedSessions.length > 0 ? selectedSessions.length : 'All sessions'}
                    sx={{ 
                      '& .MuiListItemText-primary': { color: '#1c2c4d', fontWeight: 600 },
                      '& .MuiListItemText-secondary': { color: '#666' }
                    }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 600 }}>
                Performance Alerts
              </Typography>
              
              {(() => {
                const alerts = [];
                
                // Check for backsliding
                if (filteredData.length >= 3) {
                  const last3Sessions = filteredData.slice(-3);
                  const avgEvTrend = last3Sessions.map(s => s.metrics.avgEv).filter(Boolean);
                  
                  if (avgEvTrend.length >= 2) {
                    const isDeclining = avgEvTrend[0] > avgEvTrend[avgEvTrend.length - 1];
                    if (isDeclining) {
                      alerts.push({
                        type: 'warning',
                        message: 'Average Exit Velocity declining over last 3 sessions',
                        icon: <Warning sx={{ color: '#ffa726' }} />
                      });
                    }
                  }
                }

                // Check for improvement
                if (firstSession && lastSession) {
                  const improvement = ((lastSession.metrics.avgEv - firstSession.metrics.avgEv) / firstSession.metrics.avgEv) * 100;
                  if (improvement > 10) {
                    alerts.push({
                      type: 'success',
                      message: `Significant improvement: +${Math.round(improvement)}% in Avg EV`,
                      icon: <TrendingUp sx={{ color: '#43a047' }} />
                    });
                  }
                }

                // Check for optimal launch angle
                const recentSessions = filteredData.slice(-5);
                const avgLa = recentSessions
                  .map(s => s.metrics.avgLa)
                  .filter(Boolean)
                  .reduce((sum, la) => sum + la, 0) / recentSessions.length;
                
                if (avgLa && (avgLa < 8 || avgLa > 32)) {
                  alerts.push({
                    type: 'warning',
                    message: `Launch angle (${avgLa ? avgLa.toFixed(1) : 'N/A'}°) outside optimal range (8-32°)`,
                    icon: <Warning sx={{ color: '#ffa726' }} />
                  });
                }

                return alerts.length > 0 ? (
                  <List>
                    {alerts.map((alert, index) => (
                      <ListItem key={index} sx={{ 
                        mb: 1, 
                        borderRadius: 1, 
                        bgcolor: alert.type === 'warning' ? '#fff3e0' : '#e8f5e8',
                        border: alert.type === 'warning' ? '1px solid #ffa726' : '1px solid #43a047'
                      }}>
                        <ListItemIcon>{alert.icon}</ListItemIcon>
                        <ListItemText 
                          primary={alert.message}
                          sx={{ 
                            '& .MuiListItemText-primary': { color: '#1c2c4d', fontWeight: 600 }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info" sx={{ bgcolor: '#e3f2fd', color: '#1c2c4d' }}>
                    No performance alerts at this time.
                  </Alert>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Main PlayerProgression Component
const PlayerProgression = () => {
  const { playerId } = useParams();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  
  // For players, they can only see their own progression data
  // For coaches, they can see any player's progression data
  const effectivePlayerId = user?.role === 'player' ? user?.id : playerId;
  
  const { data, loading, error } = useProgressionData(effectivePlayerId);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" bgcolor="#1c2c4d">
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, bgcolor: '#1c2c4d', minHeight: '100vh' }}>
        <Alert severity="error" sx={{ bgcolor: '#ffebee', color: '#c62828' }}>
          Error loading progression data: {error}
        </Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3, bgcolor: '#1c2c4d', minHeight: '100vh' }}>
        <Alert severity="info" sx={{ bgcolor: '#e3f2fd', color: '#1c2c4d' }}>
          No progression data available for this player.
        </Alert>
      </Box>
    );
  }

  const tabs = [
    { label: 'Overview', component: OverviewTab },
    { label: 'Trends', component: TrendsTab },
    { label: 'Goals', component: GoalsTab },
    { label: 'Swing Analysis', component: SwingAnalysisTab }
  ];

  const TabComponent = tabs[tabValue].component;

  return (
    <Box sx={{ p: 3, bgcolor: '#1c2c4d', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }} gutterBottom>
            {data.player.name} - Progression Analysis
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#e0e0e0' }}>
            {data.player.level} • {data.progressionData.length} Sessions
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Chip 
            label={`${data.player.level}`} 
            sx={{ bgcolor: 'white', color: '#1c2c4d', fontWeight: 600 }}
          />
          <Chip 
            label={`${data.progressionData.length} sessions`} 
            variant="outlined" 
            sx={{ borderColor: 'white', color: 'white', fontWeight: 600 }}
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 2, borderColor: 'white', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="progression tabs"
          sx={{
            '& .MuiTab-root': {
              color: '#e0e0e0',
              fontWeight: 600,
              '&.Mui-selected': {
                color: 'white',
                fontWeight: 700
              }
            },
            '& .MuiTabs-indicator': {
              bgcolor: 'white',
              height: 3
            }
          }}
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content */}
      <TabComponent data={data} />
    </Box>
  );
};

export default PlayerProgression; 