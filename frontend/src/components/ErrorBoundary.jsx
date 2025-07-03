import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ERROR BOUNDARY] React error caught:', error);
    console.error('[ERROR BOUNDARY] Error info:', errorInfo);
    console.error('[ERROR BOUNDARY] Error stack:', error.stack);
    console.error('[ERROR BOUNDARY] Component stack:', errorInfo.componentStack);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Paper sx={{ p: 4, m: 2, bgcolor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <Typography variant="h5" color="error" gutterBottom>
            🚨 Application Error Detected
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Something went wrong in the application. This error has been logged to the console.
          </Typography>
          
          {this.state.error && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Error Details:</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: '#f8f9fa', p: 1, borderRadius: 1 }}>
                {this.state.error.toString()}
              </Typography>
            </Box>
          )}
          
          {this.state.errorInfo && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Component Stack:</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: '#f8f9fa', p: 1, borderRadius: 1, fontSize: '0.8rem' }}>
                {this.state.errorInfo.componentStack}
              </Typography>
            </Box>
          )}
          
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ mr: 1 }}
          >
            Reload Page
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          >
            Try Again
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 