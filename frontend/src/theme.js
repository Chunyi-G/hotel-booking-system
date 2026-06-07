import { createTheme } from '@mui/material'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f766e',
    },
    secondary: {
      main: '#334155',
    },
    background: {
      default: '#f7f9fb',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: ['Inter', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'].join(','),
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      letterSpacing: 0,
    },
    h2: {
      fontSize: '1.25rem',
      fontWeight: 700,
      letterSpacing: 0,
    },
  },
})
