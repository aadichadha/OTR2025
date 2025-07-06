// Returns a color hex for a given grade string
export default function getGradeColor(grade) {
  switch(grade?.toLowerCase()) {
    case 'above average': return '#10B981'; // green
    case 'below average': return '#F59E0B'; // orange
    case 'average': return '#6B7280'; // gray
    default: return '#6B7280';
  }
} 