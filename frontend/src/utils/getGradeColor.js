// Returns a color hex for a given grade string
export default function getGradeColor(grade) {
  // Handle null, undefined, or empty values
  if (!grade || typeof grade !== 'string') {
    return '#6B7280'; // gray
  }
  
  const gradeLower = grade.toLowerCase().trim();
  
  switch(gradeLower) {
    case 'above average':
    case 'above-average':
    case 'aboveaverage':
    case 'excellent':
    case 'good':
    case 'a':
    case 'a+':
    case 'a-':
      return '#10B981'; // green
      
    case 'below average':
    case 'below-average':
    case 'belowaverage':
    case 'poor':
    case 'c':
    case 'c+':
    case 'c-':
    case 'd':
    case 'f':
      return '#F59E0B'; // orange
      
    case 'average':
    case 'b':
    case 'b+':
    case 'b-':
      return '#6B7280'; // gray
      
    default:
      // Try to parse numeric grades
      if (gradeLower.includes('percentile') || gradeLower.includes('%')) {
        const percentMatch = gradeLower.match(/(\d+)/);
        if (percentMatch) {
          const percent = parseInt(percentMatch[1]);
          if (percent >= 80) return '#10B981'; // green
          if (percent >= 60) return '#6B7280'; // gray
          return '#F59E0B'; // orange
        }
      }
      
      // Default fallback
      return '#6B7280'; // gray
  }
} 