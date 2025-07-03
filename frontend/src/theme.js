import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1c2c4d', // Navy
      contrastText: '#fff',
    },
    secondary: {
      main: '#3a7bd5', // Bright blue
      contrastText: '#fff',
    },
    background: {
      default: '#1c2c4d', // Navy background
      paper: '#232f4b', // Slightly lighter navy for cards
    },
    success: {
      main: '#43a047',
    },
    error: {
      main: '#e53935',
    },
    warning: {
      main: '#ffa726',
    },
    info: {
      main: '#1976d2',
    },
    text: {
      primary: '#fff',
      secondary: '#c3cfe2',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h1: { fontWeight: 800, color: '#fff' },
    h2: { fontWeight: 700, color: '#fff' },
    h3: { fontWeight: 700, color: '#fff' },
    h4: { fontWeight: 700, color: '#fff' },
    h5: { fontWeight: 600, color: '#fff' },
    h6: { fontWeight: 600, color: '#fff' },
    button: { fontWeight: 700 },
    allVariants: { color: '#fff' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: '#232f4b',
          color: '#fff',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: '#232f4b',
          color: '#fff',
        },
      },
    },
  },
});

export default theme; 