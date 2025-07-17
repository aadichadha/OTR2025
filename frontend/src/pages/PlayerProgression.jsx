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
const Sparkline = ({ data, color = '#3a7bd5', height = 30 }) => {
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
    if (progress >= 90) return '#4caf50'; // Green
    if (progress >= 70) return '#ff9800'; // Orange
    return '#f44336'; // Red
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
        <Typography variant="caption" fontWeight="bold">
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
    { key: 'avgEv', label: 'Avg Exit Velocity', unit: 'MPH', color: '#3a7bd5' },
    { key: 'maxEv', label: 'Max Exit Velocity', unit: 'MPH', color: '#ff6b6b' },
    { key: 'avgBs', label: 'Avg Bat Speed', unit: 'MPH', color: '#4ecdc4' },
    { key: 'maxBs', label: 'Max Bat Speed', unit: 'MPH', color: '#45b7d1' },
    { key: 'barrelPct', label: 'Barrel %', unit: '%', color: '#96ceb4' }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Performance Trends
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <Card sx={{ p: 2, bgcolor: 'background.paper' }}>
                        <Typography variant="subtitle2">{label}</Typography>
                        {payload.map((entry, index) => (
                          <Box key={index} sx={{ mt: 1 }}>
                            <Typography variant="body2" color={entry.color}>
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
              {metrics.map((metric) => (
                <Line
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  stroke={metric.color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {metrics.map((metric) => {
          const latestData = progressionData[progressionData.length - 1];
          const currentValue = latestData?.metrics[metric.key];
          const currentGrade = latestData?.grades[metric.key];
          const gradeInfo = currentGrade ? getGradeInfo(currentGrade) : null;
          
          // Create sparkline data (last 7 sessions)
          const sparklineData = progressionData
            .slice(-7)
            .map(session => ({
              value: session.metrics[metric.key] || 0
            }));

          return (
            <Grid item xs={12} sm={6} md={4} key={metric.key}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" color="textSecondary">
                      {metric.label}
                    </Typography>
                    {currentGrade && (
                      <Chip
                        label={`${formatGrade(currentGrade)} ${getGradeEmoji(currentGrade)}`}
                        size="small"
                        sx={{
                          bgcolor: gradeInfo?.bgColor,
                          color: gradeInfo?.color,
                          fontWeight: 'bold'
                        }}
                      />
                    )}
                  </Box>
                  
                  <Typography variant="h4" fontWeight="bold" mb={1}>
                    {currentValue ? `${currentValue} ${metric.unit}` : 'N/A'}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box flex={1}>
                      <Sparkline data={sparklineData} color={metric.color} />
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      30-day trend
                    </Typography>
                  </Box>
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
  const { trends, progressionData } = data;

  const trendMetrics = [
    { key: 'avgEv', label: 'Average Exit Velocity', unit: 'MPH' },
    { key: 'maxEv', label: 'Max Exit Velocity', unit: 'MPH' },
    { key: 'avgBs', label: 'Average Bat Speed', unit: 'MPH' },
    { key: 'maxBs', label: 'Max Bat Speed', unit: 'MPH' },
    { key: 'barrelPct', label: 'Barrel Percentage', unit: '%' }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
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
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">{metric.label}</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {isPositive && <TrendingUp color="success" />}
                      {isNegative && <TrendingDown color="error" />}
                      {!isPositive && !isNegative && <TrendingFlat color="action" />}
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Overall Change
                      </Typography>
                      <Typography 
                        variant="h5" 
                        color={isPositive ? 'success.main' : isNegative ? 'error.main' : 'text.primary'}
                        fontWeight="bold"
                      >
                        {percentChange > 0 ? '+' : ''}{percentChange}%
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Grade Change
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {gradeChange.oldGrade} → {gradeChange.newGrade}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Recent Average
                      </Typography>
                      <Typography variant="h6">
                        {recentAverage ? `${recentAverage} ${metric.unit}` : 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        First Session
                      </Typography>
                      <Typography variant="h6">
                        {trend.firstValue} {metric.unit}
                      </Typography>
                    </Grid>
                  </Grid>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Math.abs(percentChange), 100)}
                    color={isPositive ? 'success' : isNegative ? 'error' : 'primary'}
                    sx={{ mt: 2 }}
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
      <Typography variant="h6" gutterBottom>
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
        />
        <FormControlLabel
          control={
            <Switch
              checked={showUpcoming}
              onChange={(e) => setShowUpcoming(e.target.checked)}
            />
          }
          label="Show Upcoming"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Milestones */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <EmojiEvents color="primary" />
                <Typography variant="h6">Milestones</Typography>
              </Box>

              <List>
                {achievedMilestones.map((milestone, index) => (
                  <ListItem key={index} sx={{ bgcolor: 'success.light', mb: 1, borderRadius: 1 }}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={milestone.description}
                      secondary={`Achieved: ${new Date(milestone.achievedDate).toLocaleDateString()}`}
                    />
                    <Chip label={`${milestone.grade} grade`} size="small" />
                  </ListItem>
                ))}

                {upcomingMilestones.map((milestone, index) => {
                  const currentValue = latestSession?.metrics[milestone.metric];
                  const progress = currentValue ? Math.min((currentValue / milestone.value) * 100, 100) : 0;

                  return (
                    <ListItem key={index} sx={{ mb: 1, borderRadius: 1 }}>
                      <ListItemIcon>
                        <Star color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={milestone.description}
                        secondary={`Target: ${milestone.value}`}
                      />
                      <Box display="flex" alignItems="center" gap={1}>
                        <ProgressRing progress={progress} size={40} />
                        <Typography variant="caption">
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
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Lightbulb color="primary" />
                <Typography variant="h6">Coaching Tips</Typography>
              </Box>

              {coachingTips.length > 0 ? (
                <List>
                  {coachingTips.map((tip, index) => (
                    <ListItem key={index} sx={{ mb: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                      <ListItemIcon>
                        <Lightbulb color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${tip.metric.toUpperCase()} Improvement`}
                        secondary={tip.tip}
                      />
                      <Chip 
                        label={`${tip.currentGrade} → ${tip.targetGrade}`}
                        size="small"
                        color="primary"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="success">
                  Great job! All metrics are performing well above average.
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
      <Typography variant="h6" gutterBottom>
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
        />
        <FormControlLabel
          control={
            <Switch
              checked={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.checked)}
            />
          }
          label="Comparison Mode"
        />
      </Box>

      {comparisonMode && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
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
            />
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Session Quality Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Session Quality Metrics
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText
                    primary="Total Sessions Analyzed"
                    secondary={filteredData.length}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Average Swings per Session"
                    secondary={Math.round(
                      filteredData.reduce((sum, session) => sum + session.totalSwings, 0) / filteredData.length
                    )}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Data Quality Score"
                    secondary={`${Math.round((filteredData.length / progressionData.length) * 100)}%`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
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
                        icon: <Warning color="warning" />
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
                      icon: <TrendingUp color="success" />
                    });
                  }
                }

                return alerts.length > 0 ? (
                  <List>
                    {alerts.map((alert, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>{alert.icon}</ListItemIcon>
                        <ListItemText primary={alert.message} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">No performance alerts at this time.</Alert>
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading progression data: {error}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {data.player.name} - Progression Analysis
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {data.player.level} • {data.progressionData.length} Sessions
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Chip label={`${data.player.level}`} color="primary" />
          <Chip label={`${data.progressionData.length} sessions`} variant="outlined" />
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="progression tabs">
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