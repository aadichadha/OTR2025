import React from 'react';
import { Box, Typography, Button, Paper, Alert, Divider } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import BugReportIcon from '@mui/icons-material/BugReport';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null
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
    
    // Track error frequency to prevent infinite loops
    const now = Date.now();
    const timeSinceLastError = this.state.lastErrorTime ? now - this.state.lastErrorTime : Infinity;
    
    this.setState(prevState => ({
      error: error,
      errorInfo: errorInfo,
      errorCount: prevState.errorCount + 1,
      lastErrorTime: now
    }));

    // If we're getting too many errors too quickly, prevent further rendering
    if (this.state.errorCount > 5 && timeSinceLastError < 10000) {
      console.error('[ERROR BOUNDARY] Too many errors detected, preventing further rendering');
      this.setState({ hasError: true, error: new Error('Too many errors detected. Please refresh the page.') });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleTryAgain = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null
    });
  };

  handleReportError = () => {
    const errorReport = {
      error: this.state.error?.toString(),
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.log('[ERROR BOUNDARY] Error report:', errorReport);
    
    // In a real app, you'd send this to your error reporting service
    // For now, we'll just log it and show a message
    alert('Error report logged to console. Please contact support if this issue persists.');
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: '#f5f5f5',
          p: 2
        }}>
          <Paper sx={{ 
            p: 4, 
            maxWidth: 600, 
            width: '100%',
            bgcolor: '#fff', 
            border: '1px solid #e0e3e8',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(28,44,77,0.08)'
          }}>
            <Box display="flex" alignItems="center" mb={3}>
              <BugReportIcon sx={{ fontSize: 40, color: '#e74c3c', mr: 2 }} />
              <Typography variant="h4" color="error" fontWeight="bold">
                Application Error
              </Typography>
            </Box>
            
            <Alert severity="error" sx={{ mb: 3 }}>
              Something went wrong in the application. This error has been logged for investigation.
            </Alert>
            
            {this.state.error && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1, color: '#1c2c4d' }}>Error Details:</Typography>
                <Paper sx={{ 
                  p: 2, 
                  bgcolor: '#f8f9fa', 
                  border: '1px solid #e0e3e8',
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  maxHeight: 200,
                  overflow: 'auto'
                }}>
                  {this.state.error.toString()}
                </Paper>
              </Box>
            )}
            
            {this.state.errorInfo && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1, color: '#1c2c4d' }}>Component Stack:</Typography>
                <Paper sx={{ 
                  p: 2, 
                  bgcolor: '#f8f9fa', 
                  border: '1px solid #e0e3e8',
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  maxHeight: 200,
                  overflow: 'auto'
                }}>
                  {this.state.errorInfo.componentStack}
                </Paper>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />
            
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button 
                variant="contained" 
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
                sx={{ 
                  bgcolor: '#1c2c4d',
                  '&:hover': { bgcolor: '#3a7bd5' }
                }}
              >
                Reload Page
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={this.handleTryAgain}
                sx={{ 
                  borderColor: '#1c2c4d',
                  color: '#1c2c4d',
                  '&:hover': { 
                    borderColor: '#3a7bd5',
                    bgcolor: 'rgba(28,44,77,0.04)'
                  }
                }}
              >
                Try Again
              </Button>
              
              <Button 
                variant="outlined" 
                startIcon={<BugReportIcon />}
                onClick={this.handleReportError}
                sx={{ 
                  borderColor: '#e74c3c',
                  color: '#e74c3c',
                  '&:hover': { 
                    borderColor: '#c0392b',
                    bgcolor: 'rgba(231,76,60,0.04)'
                  }
                }}
              >
                Report Error
              </Button>
            </Box>

            {this.state.errorCount > 1 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This is error #{this.state.errorCount}. If errors persist, please reload the page.
              </Alert>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 