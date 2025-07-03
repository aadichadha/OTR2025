# FanGraphs-Style Player Profile Feature

## Overview
A comprehensive player profile section has been added to the existing Analytics page, providing FanGraphs-style statistical insights and visualizations for individual players.

## Features Added

### 1. New Player Profile Tab
- Added a third tab "Player Profile" alongside existing "Table View" and "Spray Chart" tabs
- Only appears when a player is selected from the dropdown
- Provides comprehensive player-level analytics

### 2. Statistical Overview Cards
Three main cards display key player metrics:

#### Career Stats Card
- Total Sessions
- Total Swings  
- Average Launch Angle

#### Performance Card
- Average Exit Velocity
- Maximum Exit Velocity
- Hard Hit Percentage (95+ MPH)

#### Activity Card
- First Session Date
- Last Session Date
- Days Active

### 3. Advanced Visualizations

#### Exit Velocity Trend Chart
- Line chart showing exit velocity progression over time
- Displays average and best exit velocities per session
- Helps identify performance trends

#### Launch Angle Distribution
- Pie chart showing distribution of launch angles
- Color-coded ranges: 0-10°, 10-20°, 20-30°, 30-40°, 40+°
- Helps understand hitting approach

#### Recent Session Comparison
- Bar chart comparing last 5 sessions
- Shows average exit velocity per session
- Quick visual comparison of recent performance

### 4. Session Summary Table
- Complete list of all player sessions
- Columns: Date, Session Type, Swings, Avg EV, Max EV, Notes
- Clickable rows to filter main analytics view to specific sessions
- Highlights currently selected sessions

## Technical Implementation

### Frontend Changes
- **File**: `frontend/src/pages/AnalyticsHome.jsx`
- Added new state variables for player profile data
- Created `PlayerProfileView` component
- Added data fetching functions for player analytics
- Integrated with existing session selection and filtering

### Backend Integration
- Uses existing analytics endpoints:
  - `/api/players/:playerId/analytics` - Player career statistics
  - `/api/analytics/players/:playerId/trends` - Performance trends
  - `/api/analytics/players/:playerId/benchmarks` - Benchmark comparisons
  - `/api/players/:playerId/sessions` - Session history with analytics

### Data Flow
1. User selects a player → Loads player profile data
2. User selects sessions → Updates both profile stats and existing views
3. User switches between tabs → Maintains all data and selections
4. User clicks session in summary table → Filters main view to that session

## User Experience

### Seamless Integration
- Maintains all existing functionality (session filtering, spray charts, etc.)
- No disruption to current workflow
- Player profile tab only appears when relevant

### Responsive Design
- Cards adapt to different screen sizes
- Charts are responsive and interactive
- Consistent with existing navy blue (#1976D2) and grey theme

### Interactive Elements
- Hover effects on charts and tables
- Clickable session rows for filtering
- Tooltips on charts for detailed information
- Loading states and error handling

## Usage Instructions

1. **Access Player Profile**:
   - Go to Analytics page
   - Select a player from the dropdown
   - Click "Player Profile" tab

2. **View Statistics**:
   - Review the three overview cards for key metrics
   - Examine trend charts for performance patterns
   - Check launch angle distribution for hitting approach

3. **Analyze Sessions**:
   - Scroll to session summary table
   - Click on any session row to filter main view
   - Compare recent sessions using the bar chart

4. **Switch Between Views**:
   - Use tabs to switch between Table View, Spray Chart, and Player Profile
   - All selections and filters are maintained across tabs

## Benefits

### For Coaches
- Quick overview of player development
- Identify performance trends and patterns
- Compare sessions and track progress
- Make data-driven coaching decisions

### For Players
- Visual representation of performance
- Understanding of hitting tendencies
- Motivation through progress tracking
- Clear feedback on areas for improvement

### For Analytics
- Comprehensive player-level insights
- Historical performance tracking
- Benchmark comparisons
- Trend analysis capabilities

## Future Enhancements

Potential additions to the player profile:
- Bat speed analytics (when Blast data is available)
- Position-specific benchmarks
- Goal setting and progress tracking
- Export capabilities for reports
- Advanced filtering options
- Comparison with team averages 