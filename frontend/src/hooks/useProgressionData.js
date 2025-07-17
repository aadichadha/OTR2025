import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Custom hook for fetching player progression data with 20-80 grades
 * @param {string} playerId - The player ID
 * @param {Object} options - Additional options
 * @param {number} options.days - Number of days to look back (default: 365)
 * @returns {Object} - { data, loading, error, refetch }
 */
export const useProgressionData = (playerId, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { days = 365 } = options;

  const fetchData = async () => {
    if (!playerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/players/${playerId}/progression`, {
        params: { days }
      });
      
      setData(response.data.data);
    } catch (err) {
      console.error('Error fetching progression data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch progression data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [playerId, days]);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
};

/**
 * Custom hook for calculating progression trends
 * @param {Array} progressionData - Array of progression data points
 * @returns {Object} - Calculated trends
 */
export const useProgressionTrends = (progressionData) => {
  if (!progressionData || progressionData.length === 0) {
    return {};
  }

  const trends = {};
  const metrics = ['avgEv', 'maxEv', 'avgBs', 'maxBs', 'barrelPct'];

  metrics.forEach(metric => {
    const values = progressionData
      .map(session => session.metrics[metric])
      .filter(value => value !== null && value !== undefined);

    if (values.length >= 2) {
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const change = ((lastValue - firstValue) / firstValue) * 100;
      
      // Calculate recent trend (last 4 sessions)
      const recentValues = values.slice(-4);
      const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
      
      trends[metric] = {
        firstValue,
        lastValue,
        percentChange: parseFloat(change.toFixed(1)),
        recentAverage: parseFloat(recentAvg.toFixed(2)),
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        trend: change > 5 ? 'strong_up' : change > 0 ? 'up' : change < -5 ? 'strong_down' : change < 0 ? 'down' : 'stable'
      };
    }
  });

  return trends;
};

/**
 * Custom hook for calculating milestones
 * @param {Array} progressionData - Array of progression data points
 * @param {Object} levelStats - Level statistics for grading
 * @returns {Array} - Array of milestones
 */
export const useMilestones = (progressionData, levelStats) => {
  if (!progressionData || !levelStats) {
    return [];
  }

  const milestones = [];
  const metrics = ['avgEv', 'maxEv', 'avgBs', 'maxBs', 'barrelPct'];

  metrics.forEach(metric => {
    if (levelStats[metric]) {
      const { mean, sd } = levelStats[metric];
      
      // Define milestone thresholds
      const milestoneThresholds = [
        { grade: 40, label: 'Below Average' },
        { grade: 50, label: 'Average' },
        { grade: 60, label: 'Above Average' },
        { grade: 70, label: 'Well Above Average' },
        { grade: 80, label: 'Elite' }
      ];

      milestoneThresholds.forEach(threshold => {
        const targetValue = mean + ((threshold.grade - 50) / 10) * sd;
        
        // Check if player achieved this milestone
        const achievedSession = progressionData.find(session => 
          session.metrics[metric] >= targetValue
        );
        
        if (achievedSession) {
          milestones.push({
            metric,
            grade: threshold.grade,
            label: threshold.label,
            value: Math.round(targetValue * 10) / 10,
            achievedDate: achievedSession.sessionDate,
            sessionId: achievedSession.sessionId,
            description: `Reached ${threshold.label} ${metric}`
          });
        }
      });
    }
  });

  return milestones.sort((a, b) => new Date(a.achievedDate) - new Date(b.achievedDate));
};

/**
 * Custom hook for generating coaching tips
 * @param {Array} progressionData - Array of progression data points
 * @param {Object} levelStats - Level statistics for grading
 * @returns {Array} - Array of coaching tips
 */
export const useCoachingTips = (progressionData, levelStats) => {
  if (!progressionData || progressionData.length === 0 || !levelStats) {
    return [];
  }

  const latestSession = progressionData[progressionData.length - 1];
  const tips = [];
  const metrics = ['avgEv', 'maxEv', 'avgBs', 'barrelPct'];

  metrics.forEach(metric => {
    const currentGrade = latestSession.grades[metric];
    if (currentGrade && currentGrade < 60) {
      const targetGrade = Math.min(60, currentGrade + 10);
      
      // Generate coaching tip based on metric and grade
      let tip = '';
      switch (metric) {
        case 'avgEv':
          tip = currentGrade < 40 
            ? 'Focus on fundamentals and swing mechanics'
            : 'Work on lower-half sequencing and hip rotation drills';
          break;
        case 'maxEv':
          tip = currentGrade < 40
            ? 'Refine swing mechanics for maximum bat speed transfer'
            : 'Incorporate explosive lower-body exercises and rotational power work';
          break;
        case 'avgBs':
          tip = currentGrade < 40
            ? 'Work on swing mechanics and barrel control'
            : 'Practice quick hands and bat path efficiency';
          break;
        case 'barrelPct':
          tip = currentGrade < 40
            ? 'Refine swing path and barrel control'
            : 'Practice hitting the ball on the sweet spot consistently';
          break;
        default:
          tip = 'Focus on consistent practice and proper technique';
      }

      tips.push({
        metric,
        currentGrade,
        targetGrade,
        tip: `To improve from ${currentGrade} to ${targetGrade}: ${tip}`
      });
    }
  });

  return tips;
}; 