/**
 * 20-80 Baseball Scouting Grade System
 * True baseball scouting method using level-specific benchmarks
 * Based on MLB scouting standards
 */

class Grade20to80 {
  /**
   * Convert a raw metric value to a 20-80 grade using true baseball scouting method
   * @param {number} value - The raw metric value
   * @param {number} average - Level-specific average benchmark (A)
   * @param {number} upper - Level-specific upper benchmark (U)
   * @returns {number} - Grade between 20-80
   */
  static calculateGrade(value, average, upper) {
    // Validate inputs
    if (!value || average === null || upper === null || upper <= average) {
      return 50; // Default to average if insufficient data
    }

    // Calculate increment: one third of the gap between average and upper
    const inc = (upper - average) / 3.0;
    
    // Calculate step: how many increments above/below average
    const step = Math.round((value - average) / inc);
    
    // Convert step to grade: 50 + 10*step, clamped between 20-80
    const grade = Math.max(20, Math.min(80, 50 + (10 * step)));
    
    return Math.round(grade);
  }

  /**
   * Get grade label and description
   * @param {number} grade - The 20-80 grade
   * @returns {Object} - Label and description
   */
  static getGradeInfo(grade) {
    if (grade <= 30) {
      return {
        label: 'Well Below Average',
        description: 'Significantly below level standard',
        color: '#ff4444',
        bgColor: '#ffebee'
      };
    } else if (grade <= 40) {
      return {
        label: 'Below Average',
        description: 'Below level standard',
        color: '#ff8c00',
        bgColor: '#fff3e0'
      };
    } else if (grade <= 50) {
      return {
        label: 'Average',
        description: 'At level standard',
        color: '#ffd700',
        bgColor: '#fffbf0'
      };
    } else if (grade <= 60) {
      return {
        label: 'Above Average',
        description: 'Above level standard',
        color: '#90ee90',
        bgColor: '#f1f8e9'
      };
    } else if (grade <= 70) {
      return {
        label: 'Well Above Average',
        description: 'Significantly above level standard',
        color: '#32cd32',
        bgColor: '#e8f5e8'
      };
    } else {
      return {
        label: 'Elite',
        description: 'Elite level performance',
        color: '#00ff00',
        bgColor: '#e8f5e8'
      };
    }
  }

  /**
   * Get grade emoji for visual representation
   * @param {number} grade - The 20-80 grade
   * @returns {string} - Emoji representation
   */
  static getGradeEmoji(grade) {
    if (grade <= 30) return '🔴';
    if (grade <= 40) return '🟠';
    if (grade <= 50) return '🟡';
    if (grade <= 60) return '🟢';
    if (grade <= 70) return '🔵';
    return '⭐';
  }

  /**
   * Format grade for display
   * @param {number} grade - The 20-80 grade
   * @returns {string} - Formatted grade string
   */
  static formatGrade(grade) {
    return `${grade}`;
  }

  /**
   * Calculate grade change between two values
   * @param {number} oldValue - Previous value
   * @param {number} newValue - Current value
   * @param {number} average - Level average benchmark
   * @param {number} upper - Level upper benchmark
   * @returns {Object} - Grade change information
   */
  static calculateGradeChange(oldValue, newValue, average, upper) {
    const oldGrade = this.calculateGrade(oldValue, average, upper);
    const newGrade = this.calculateGrade(newValue, average, upper);
    const change = newGrade - oldGrade;
    
    return {
      oldGrade,
      newGrade,
      change,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      magnitude: Math.abs(change)
    };
  }

  /**
   * Get coaching tips based on grade and metric
   * @param {string} metric - The metric name
   * @param {number} currentGrade - Current grade
   * @param {number} targetGrade - Target grade
   * @returns {string} - Coaching tip
   */
  static getCoachingTip(metric, currentGrade, targetGrade) {
    const tips = {
      'avgEv': {
        'power': 'Focus on lower-half sequencing and hip rotation drills',
        'contact': 'Work on barrel control and swing path consistency',
        'timing': 'Practice pitch recognition and load timing'
      },
      'maxEv': {
        'power': 'Incorporate explosive lower-body exercises and rotational power work',
        'technique': 'Refine swing mechanics for maximum bat speed transfer',
        'strength': 'Add strength training focused on rotational power'
      },
      'avgBs': {
        'speed': 'Practice quick hands and bat path efficiency',
        'strength': 'Focus on forearm and grip strength exercises',
        'technique': 'Work on swing mechanics and barrel control'
      },
      'barrelPct': {
        'contact': 'Practice hitting the ball on the sweet spot consistently',
        'timing': 'Work on pitch recognition and swing timing',
        'mechanics': 'Refine swing path and barrel control'
      }
    };

    const metricTips = tips[metric] || tips['avgEv'];
    
    if (currentGrade < 40) {
      return `To improve from ${currentGrade} to ${targetGrade}: Focus on fundamentals. ${metricTips.technique}`;
    } else if (currentGrade < 60) {
      return `To move from ${currentGrade} to ${targetGrade}: ${metricTips.power}`;
    } else {
      return `To maintain elite ${currentGrade} grade: ${metricTips.contact}`;
    }
  }

  /**
   * Calculate milestone thresholds for a metric
   * @param {string} metric - The metric name
   * @param {number} average - Level average benchmark
   * @param {number} upper - Level upper benchmark
   * @returns {Array} - Array of milestone objects
   */
  static getMilestones(metric, average, upper) {
    const milestones = [
      { grade: 40, label: 'Below Average' },
      { grade: 50, label: 'Average' },
      { grade: 60, label: 'Above Average' },
      { grade: 70, label: 'Well Above Average' },
      { grade: 80, label: 'Elite' }
    ];

    return milestones.map(milestone => {
      // Calculate the value needed for this grade
      const step = (milestone.grade - 50) / 10;
      const inc = (upper - average) / 3.0;
      const value = average + (step * inc);
      
      return {
        ...milestone,
        value: Math.round(value * 10) / 10,
        description: `Reach ${milestone.label} ${metric}`
      };
    });
  }

  /**
   * Get benchmark values for a specific level and metric
   * @param {string} level - Player level (e.g., 'College', 'High School')
   * @param {string} metric - Metric name (e.g., 'avgEv', 'maxEv', 'avgBs')
   * @returns {Object} - Average and upper benchmark values
   */
  static getBenchmarks(level, metric) {
    const benchmarks = require('../config/benchmarks');
    const levelBenchmarks = benchmarks[level] || benchmarks['High School'];
    
    // Map metric names to benchmark keys
    const metricMap = {
      'avgEv': { average: 'Avg EV', upper: 'Top 8th EV' },
      'maxEv': { average: 'Avg EV', upper: 'Top 8th EV' },
      'avgBs': { average: 'Avg BatSpeed', upper: '90th% BatSpeed' },
      'maxBs': { average: 'Avg BatSpeed', upper: '90th% BatSpeed' },
      'barrelPct': { average: 15, upper: 25 } // Default barrel percentage benchmarks
    };
    
    const mapping = metricMap[metric];
    if (!mapping) {
      return { average: null, upper: null };
    }
    
    if (typeof mapping.average === 'number') {
      return { average: mapping.average, upper: mapping.upper };
    }
    
    return {
      average: levelBenchmarks[mapping.average],
      upper: levelBenchmarks[mapping.upper]
    };
  }
}

module.exports = Grade20to80; 