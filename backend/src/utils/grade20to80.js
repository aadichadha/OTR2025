/**
 * 20-80 Baseball Scouting Grade System
 * Converts raw metrics to standardized baseball scouting grades using z-scores
 */

class Grade20to80 {
  /**
   * Convert a raw metric value to a 20-80 grade using z-score
   * @param {number} value - The raw metric value
   * @param {number} mean - The mean for the player's level
   * @param {number} sd - The standard deviation for the player's level
   * @returns {number} - Grade between 20-80
   */
  static calculateGrade(value, mean, sd) {
    if (!value || !mean || !sd || sd === 0) {
      return 50; // Default to average if insufficient data
    }

    // Calculate z-score
    const zScore = (value - mean) / sd;
    
    // Convert to grade: grade = 50 + 10 * z
    let grade = 50 + (10 * zScore);
    
    // Clamp between 20-80
    grade = Math.min(80, Math.max(20, grade));
    
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
        color: '#ff4444'
      };
    } else if (grade <= 40) {
      return {
        label: 'Below Average',
        description: 'Below level standard',
        color: '#ff8c00'
      };
    } else if (grade <= 50) {
      return {
        label: 'Average',
        description: 'At level standard',
        color: '#ffd700'
      };
    } else if (grade <= 60) {
      return {
        label: 'Above Average',
        description: 'Above level standard',
        color: '#90ee90'
      };
    } else if (grade <= 70) {
      return {
        label: 'Well Above Average',
        description: 'Significantly above level standard',
        color: '#32cd32'
      };
    } else {
      return {
        label: 'Elite',
        description: 'Elite level performance',
        color: '#00ff00'
      };
    }
  }

  /**
   * Calculate grade change between two values
   * @param {number} oldValue - Previous value
   * @param {number} newValue - Current value
   * @param {number} mean - Level mean
   * @param {number} sd - Level standard deviation
   * @returns {Object} - Grade change information
   */
  static calculateGradeChange(oldValue, newValue, mean, sd) {
    const oldGrade = this.calculateGrade(oldValue, mean, sd);
    const newGrade = this.calculateGrade(newValue, mean, sd);
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
   * @param {number} mean - Level mean
   * @param {number} sd - Level standard deviation
   * @returns {Array} - Array of milestone objects
   */
  static getMilestones(metric, mean, sd) {
    const milestones = [
      { grade: 40, label: 'Below Average' },
      { grade: 50, label: 'Average' },
      { grade: 60, label: 'Above Average' },
      { grade: 70, label: 'Well Above Average' },
      { grade: 80, label: 'Elite' }
    ];

    return milestones.map(milestone => {
      const value = mean + ((milestone.grade - 50) / 10) * sd;
      return {
        ...milestone,
        value: Math.round(value * 10) / 10,
        description: `Reached ${milestone.label} ${metric}`
      };
    });
  }
}

module.exports = Grade20to80; 