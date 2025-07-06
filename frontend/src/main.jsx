import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// 🚧 TEMPORARY BYPASS - REMOVE WHEN LOGIN IS FIXED
localStorage.setItem('user', JSON.stringify({
  id: 1,
  email: 'admin@otr.com',
  name: 'Admin User',
  role: 'admin'
}));
localStorage.setItem('token', 'dev-token');

// Import Montserrat font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
