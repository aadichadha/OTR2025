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
  Paper
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
  Fire
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
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

  const chartData = useMemo(() => {
    return progressionData.map(session => ({
      date: new Date(session.sessionDate).toLocaleDateString(),
      avgEv: session.metrics.avgEv,
      maxEv: session.metrics.maxEv,
      avgBs: session.metrics.avgBs,
      maxBs: session.metrics.maxBs,
      barrelPct: session.metrics.barrelPct,
      avgEvGrade: session.grades.avgEv,
      maxEvGrade: session.grades.maxEv,
      avgBsGrade: session.grades.avgBs,
      maxBsGrade: session.grades.maxBs,
      barrelPctGrade: session.grades.barrelPct
    }));
  }, [progressionData]);

  const metrics = [
    { key: 'avgEv', label: 'Avg Exit Velocity', unit: 'MPH', color: '#1c2c4d' },
    { key: 'maxEv', label: 'Max Exit Velocity', unit: 'MPH', color: '#3a7bd5' },
    { key: 'avgBs', label: 'Avg Bat Speed', unit: 'MPH', color: '#43a047' },
    { key: 'maxBs', label: 'Max Bat Speed', unit: 'MPH', color: '#ffa726' },
    { key: 'barrelPct', label: 'Barrel %', unit: '%', color: '#e53935' }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 600 }}>
        Performance Trends
      </Typography>
      
      <Card sx={{ mb: 3, bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
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
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {metrics.map((metric) => {
          const latestValue = chartData[chartData.length - 1]?.[metric.key];
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
                    {latestValue ? `${latestValue} ${metric.unit}` : 'N/A'}
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
                      {Math.abs(trendPercent).toFixed(1)}% 30-day trend
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
  const { progressionData } = data;
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonSlider, setComparisonSlider] = useState(50);

  // Calculate trends for each metric
  const trends = useMemo(() => {
    if (progressionData.length < 2) return {};

    const firstSession = progressionData[0];
    const lastSession = progressionData[progressionData.length - 1];
    const recentSessions = progressionData.slice(-3); // Last 3 sessions

    const trendMetrics = [
      { key: 'avgEv', label: 'Average Exit Velocity', unit: 'MPH' },
      { key: 'maxEv', label: 'Maximum Exit Velocity', unit: 'MPH' },
      { key: 'avgBs', label: 'Average Bat Speed', unit: 'MPH' },
      { key: 'maxBs', label: 'Maximum Bat Speed', unit: 'MPH' },
      { key: 'barrelPct', label: 'Barrel Percentage', unit: '%' }
    ];

    return trendMetrics.reduce((acc, metric) => {
      const firstValue = firstSession.metrics[metric.key];
      const lastValue = lastSession.metrics[metric.key];
      const recentAverage = recentSessions
        .map(s => s.metrics[metric.key])
        .filter(Boolean)
        .reduce((sum, val) => sum + val, 0) / recentSessions.length;

      if (!firstValue || !lastValue) return acc;

      const percentChange = ((lastValue - firstValue) / firstValue) * 100;
      const direction = percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'flat';

      // Calculate grade changes
      const oldGrade = firstSession.grades[metric.key];
      const newGrade = lastSession.grades[metric.key];

      acc[metric.key] = {
        percentChange: Math.round(percentChange * 10) / 10,
        direction,
        recentAverage: Math.round(recentAverage * 10) / 10,
        firstValue: Math.round(firstValue * 10) / 10,
        lastValue: Math.round(lastValue * 10) / 10,
        gradeChange: {
          oldGrade: oldGrade ? formatGrade(oldGrade) : 'N/A',
          newGrade: newGrade ? formatGrade(newGrade) : 'N/A'
        }
      };

      return acc;
    }, {});
  }, [progressionData]);

  const trendMetrics = [
    { key: 'avgEv', label: 'Average Exit Velocity', unit: 'MPH' },
    { key: 'maxEv', label: 'Maximum Exit Velocity', unit: 'MPH' },
    { key: 'avgBs', label: 'Average Bat Speed', unit: 'MPH' },
    { key: 'maxBs', label: 'Maximum Bat Speed', unit: 'MPH' },
    { key: 'barrelPct', label: 'Barrel Percentage', unit: '%' }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 600 }}>
        Performance Trends & Changes
      </Typography>

      <Grid container spacing={3}>
        {trendMetrics.map((metric) => {
          const trend = trends[metric.key];
          if (!trend) return null;

          const { percentChange, gradeChange, direction, recentAverage } = trend;
          const isPositive = direction === 'up';
          const isNegative = direction === 'down';

          return (
            <Grid item xs={12} md={6} key={metric.key}>
              <Card sx={{ bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 600 }}>{metric.label}</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {isPositive && <TrendingUp sx={{ color: '#43a047' }} />}
                      {isNegative && <TrendingDown sx={{ color: '#e53935' }} />}
                      {!isPositive && !isNegative && <TrendingFlat sx={{ color: '#757575' }} />}
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Overall Change
                      </Typography>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          color: isPositive ? '#43a047' : isNegative ? '#e53935' : '#1c2c4d',
                          fontWeight: 700
                        }}
                      >
                        {percentChange > 0 ? '+' : ''}{percentChange}%
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Grade Change
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#1c2c4d', fontWeight: 700 }}>
                        {gradeChange.oldGrade} → {gradeChange.newGrade}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Recent Average
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#1c2c4d' }}>
                        {recentAverage ? `${recentAverage} ${metric.unit}` : 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        First Session
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#1c2c4d' }}>
                        {trend.firstValue} {metric.unit}
                      </Typography>
                    </Grid>
                  </Grid>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Math.abs(percentChange), 100)}
                    sx={{ 
                      mt: 2, 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: isPositive ? '#43a047' : isNegative ? '#e53935' : '#1c2c4d'
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

// Goals Tab Component
const GoalsTab = ({ data }) => {
  const { milestones, coachingTips, progressionData } = data;
  const [showAchieved, setShowAchieved] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(true);

  const latestSession = progressionData[progressionData.length - 1];
  const achievedMilestones = milestones.filter(m => m.achievedDate);
  const upcomingMilestones = milestones.filter(m => !m.achievedDate);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 600 }}>
        Goals & Milestones
      </Typography>

      <Box display="flex" gap={2} mb={3}>
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
        <FormControlLabel
          control={
            <Switch
              checked={showUpcoming}
              onChange={(e) => setShowUpcoming(e.target.checked)}
            />
          }
          label="Show Upcoming"
          sx={{ color: '#1c2c4d' }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Milestones */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'white', border: '2px solid #1c2c4d', borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <EmojiEvents sx={{ color: '#1c2c4d' }} />
                <Typography variant="h6" sx={{ color: '#1c2c4d', fontWeight: 600 }}>Milestones</Typography>
              </Box>

              <List>
                {achievedMilestones.map((milestone, index) => (
                  <ListItem key={index} sx={{ bgcolor: '#e8f5e8', mb: 1, borderRadius: 1, border: '1px solid #43a047' }}>
                    <ListItemIcon>
                      <CheckCircle sx={{ color: '#43a047' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={milestone.description}
                      secondary={`Achieved: ${new Date(milestone.achievedDate).toLocaleDateString()}`}
                      sx={{ 
                        '& .MuiListItemText-primary': { color: '#1c2c4d', fontWeight: 600 },
                        '& .MuiListItemText-secondary': { color: '#666' }
                      }}
                    />
                    <Chip 
                      label={`${milestone.grade} grade`} 
                      size="small" 
                      sx={{ bgcolor: '#43a047', color: 'white', fontWeight: 600 }}
                    />
                  </ListItem>
                ))}

                {upcomingMilestones.map((milestone, index) => {
                  const currentValue = latestSession?.metrics[milestone.metric];
                  const progress = currentValue ? Math.min((currentValue / milestone.value) * 100, 100) : 0;

                  return (
                    <ListItem key={index} sx={{ mb: 1, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                      <ListItemIcon>
                        <Star sx={{ color: '#ffa726' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={milestone.description}
                        secondary={`Target: ${milestone.value}`}
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
    </Box>
  );
};

// Swing Analysis Tab Component
const SwingAnalysisTab = ({ data }) => {
  const { progressionData } = data;
  const [qualityFilter, setQualityFilter] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonSlider, setComparisonSlider] = useState(50);

  const filteredData = useMemo(() => {
    if (!qualityFilter) return progressionData;

    return progressionData.filter(session => {
      // Filter out sessions with poor quality swings
      const hasGoodAttackAngles = session.metrics.avgBs && 
        session.metrics.avgBs > 45; // Minimum bat speed threshold
      return hasGoodAttackAngles;
    });
  }, [progressionData, qualityFilter]);

  const firstSession = filteredData[0];
  const lastSession = filteredData[filteredData.length - 1];

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#1c2c4d', fontWeight: 600 }}>
        Swing Analysis & Quality Control
      </Typography>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" bgcolor="white">
        <CircularProgress sx={{ color: '#1c2c4d' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2, bgcolor: '#ffebee', color: '#c62828' }}>
        Error loading progression data: {error}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert severity="info" sx={{ m: 2, bgcolor: '#e3f2fd', color: '#1c2c4d' }}>
        No progression data available for this player.
      </Alert>
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
    <Box sx={{ p: 3, bgcolor: 'white', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ color: '#1c2c4d', fontWeight: 700 }} gutterBottom>
            {data.player.name} - Progression Analysis
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#666' }}>
            {data.player.level} • {data.progressionData.length} Sessions
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Chip 
            label={`${data.player.level}`} 
            sx={{ bgcolor: '#1c2c4d', color: 'white', fontWeight: 600 }}
          />
          <Chip 
            label={`${data.progressionData.length} sessions`} 
            variant="outlined" 
            sx={{ borderColor: '#1c2c4d', color: '#1c2c4d', fontWeight: 600 }}
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 2, borderColor: '#1c2c4d', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="progression tabs"
          sx={{
            '& .MuiTab-root': {
              color: '#666',
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#1c2c4d',
                fontWeight: 700
              }
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#1c2c4d',
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