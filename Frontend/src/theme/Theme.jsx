import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1A237E',
      dark: '#311B92',
      light: '#EEF2FF',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#311B92',
    },
    background: {
      default: '#F4F7FE',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: '#1A237E',
          '&:hover': { backgroundColor: '#311B92' },
        },
      },
    },
  },
});

export default theme;