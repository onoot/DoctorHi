import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#a5b4fc',
      dark: '#5a67d8',
    },
    secondary: {
      main: '#764ba2',
      light: '#9c7bbd',
      dark: '#5d3a7e',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    error: {
      main: '#ef4444',
    },
    success: {
      main: '#10b981',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
      'system-ui'
    ].join(','),
    h4: {
      fontWeight: 700,
      fontSize: '1.75rem',
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#64748b',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '0.75rem',
      color: '#94a3b8',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@font-face': {
          fontFamily: 'system-ui',
          fontStyle: 'normal',
          fontWeight: 'normal',
          src: 'local("-apple-system"), local("BlinkMacSystemFont"), local("Segoe UI"), local("Roboto"), local("Helvetica Neue"), local("Arial"), local("sans-serif")',
        },
        body: {
          fontFeatureSettings: '"kern", "liga", "clig", "calt"',
          fontKerning: 'normal',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            backgroundImage: 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#667eea',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#667eea',
              borderWidth: 2,
            },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#667eea',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#667eea',
          },
        },
        input: {
          '&::placeholder': {
            opacity: 0.6,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'box-shadow 0.3s ease-in-out',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
        elevation3: {
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          alignItems: 'center',
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          animationDuration: '0.8s',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  transitions: {
    duration: {
      enteringScreen: 300,
      leavingScreen: 200,
    },
  },
});

export default theme;