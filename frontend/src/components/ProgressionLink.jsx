import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  ShowChart
} from '@mui/icons-material';
import { getGradeEmoji } from '../utils/grade20to80';

/**
 * ProgressionLink component for easy navigation to player progression
 * @param {Object} props
 * @param {string} props.playerId - Player ID
 * @param {string} props.playerName - Player name
 * @param {Object} props.latestGrades - Latest 20-80 grades
 * @param {string} props.variant - 'button', 'chip', or 'icon'
 * @param {boolean} props.showTrend - Whether to show trend indicator
 * @param {string} props.trend - 'up', 'down', 'stable'
 */
const ProgressionLink = ({ 
  playerId, 
  playerName, 
  latestGrades, 
  variant = 'button',
  showTrend = false,
  trend = 'stable'
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/players/${playerId}/progression`);
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp color="success" fontSize="small" />;
      case 'down':
        return <TrendingDown color="error" fontSize="small" />;
      default:
        return <TrendingFlat color="action" fontSize="small" />;
    }
  };

  const getAverageGrade = () => {
    if (!latestGrades) return null;
    
    const grades = Object.values(latestGrades).filter(grade => grade !== null);
    if (grades.length === 0) return null;
    
    return Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length);
  };

  const averageGrade = getAverageGrade();

  if (variant === 'icon') {
    return (
      <Tooltip title={`View ${playerName}'s progression`}>
        <IconButton onClick={handleClick} size="small">
          <Badge 
            badgeContent={averageGrade} 
            color={averageGrade >= 60 ? 'success' : averageGrade >= 50 ? 'warning' : 'error'}
          >
            <ShowChart />
          </Badge>
        </IconButton>
      </Tooltip>
    );
  }

  if (variant === 'chip') {
    return (
      <Chip
        icon={<Timeline />}
        label={`Progression ${averageGrade ? `${averageGrade} ${getGradeEmoji(averageGrade)}` : ''}`}
        onClick={handleClick}
        color={averageGrade >= 60 ? 'success' : averageGrade >= 50 ? 'warning' : 'default'}
        variant="outlined"
        size="small"
      />
    );
  }

  // Default button variant
  return (
    <Button
      variant="outlined"
      startIcon={<Timeline />}
      onClick={handleClick}
      size="small"
      sx={{ 
        minWidth: 'auto',
        px: 2,
        py: 0.5
      }}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <span>Progression</span>
        {averageGrade && (
          <Chip
            label={`${averageGrade} ${getGradeEmoji(averageGrade)}`}
            size="small"
            sx={{ 
              height: 20, 
              fontSize: '0.75rem',
              bgcolor: averageGrade >= 60 ? 'success.light' : averageGrade >= 50 ? 'warning.light' : 'error.light'
            }}
          />
        )}
        {showTrend && getTrendIcon()}
      </Box>
    </Button>
  );
};

export default ProgressionLink; 