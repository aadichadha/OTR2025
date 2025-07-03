const benchmarks = require('../config/benchmarks');

/**
 * Calculate mean of an array of numbers
 */
function calculateMean(values) {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate quantile of an array of numbers
 */
function calculateQuantile(values, q) {
  if (!values || values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = q * (sorted.length - 1);
  
  if (Number.isInteger(index)) {
    return sorted[index];
  } else {
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}

/**
 * Grade a metric against benchmarks
 * @param {number} metric - The calculated metric value
 * @param {number} benchmark - The benchmark value to compare against
 * @param {Object} options - Grading options
 * @param {boolean} options.lowerIsBetter - Whether lower values are better (e.g., time to contact)
 * @param {boolean} options.specialEV - Whether to use special exit velocity grading
 * @returns {string} Grade (A+, A, A-, B+, B, B-, C+, C, C-, D, or N/A)
 */
function grade(metric, benchmark, { lowerIsBetter = false, specialEV = false } = {}) {
  if (metric === 0 || benchmark === 0) return 'N/A';
  
  const ratio = metric / benchmark;
  
  if (specialEV) {
    // Special grading for exit velocity
    if (ratio >= 1.1) return 'A+';
    if (ratio >= 1.05) return 'A';
    if (ratio >= 1.0) return 'A-';
    if (ratio >= 0.95) return 'B+';
    if (ratio >= 0.9) return 'B';
    if (ratio >= 0.85) return 'B-';
    if (ratio >= 0.8) return 'C+';
    if (ratio >= 0.75) return 'C';
    if (ratio >= 0.7) return 'C-';
    return 'D';
  }
  
  if (lowerIsBetter) {
    // For metrics where lower is better (like time to contact)
    if (ratio <= 0.9) return 'A+';
    if (ratio <= 0.95) return 'A';
    if (ratio <= 1.0) return 'A-';
    if (ratio <= 1.05) return 'B+';
    if (ratio <= 1.1) return 'B';
    if (ratio <= 1.15) return 'B-';
    if (ratio <= 1.2) return 'C+';
    if (ratio <= 1.25) return 'C';
    if (ratio <= 1.3) return 'C-';
    return 'D';
  } else {
    // For metrics where higher is better
    if (ratio >= 1.1) return 'A+';
    if (ratio >= 1.05) return 'A';
    if (ratio >= 1.0) return 'A-';
    if (ratio >= 0.95) return 'B+';
    if (ratio >= 0.9) return 'B';
    if (ratio >= 0.85) return 'B-';
    if (ratio >= 0.8) return 'C+';
    if (ratio >= 0.75) return 'C';
    if (ratio >= 0.7) return 'C-';
    return 'D';
  }
}

/**
 * Get available player levels from benchmarks
 */
function getAvailableLevels() {
  return Object.keys(benchmarks);
}

/**
 * Validate if a player level exists in benchmarks
 */
function isValidLevel(level) {
  return benchmarks.hasOwnProperty(level);
}

/**
 * Get benchmark values for a specific player level
 */
function getBenchmarksForLevel(level) {
  return benchmarks[level] || benchmarks['High School'];
}

module.exports = {
  calculateMean,
  calculateQuantile,
  grade,
  getAvailableLevels,
  isValidLevel,
  getBenchmarksForLevel,
  benchmarks
}; 