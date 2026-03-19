import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  InputAdornment, 
  IconButton,
  CircularProgress,
  Alert,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff,
  LockOutlined,
  EmailOutlined,
  ErrorOutline
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { styled } from '@mui/material/styles';

const LoginContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: theme.spacing(2),
  fontFamily: theme.typography.fontFamily,
}));

const LoginPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  width: '100%',
  maxWidth: 400,
  borderRadius: 16,
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    maxWidth: '100%',
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(4),
  '& img': {
    maxWidth: 150,
    height: 'auto',
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      maxWidth: 120,
    },
  },
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(1.5),
  fontWeight: 600,
  fontSize: '1rem',
  textTransform: 'none',
  borderRadius: 8,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 20px rgba(102, 126, 234, 0.4)',
  },
  '&:disabled': {
    background: theme.palette.grey[300],
    transform: 'none',
    boxShadow: 'none',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.25),
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'transparent', 
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#667eea',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#667eea',
      borderWidth: 2,
    },
    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.error.main,
    },
  },
  '& .MuiInputLabel-root': {
    '&.Mui-focused': {
      color: '#667eea',
    },
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
  '& .MuiFormHelperText-root': {
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
  '& .MuiOutlinedInput-input': {
    backgroundColor: 'transparent', // Убираем фон у самого input
  },
}));

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const timer = setTimeout(() => {
      const emailInput = document.getElementById('email');
      if (emailInput) {
        emailInput.focus();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    try {
      await login(email, password);
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin(e);
    }
  };

  return (
    <LoginContainer maxWidth={false}>
      <Fade in={true} timeout={600}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <LoginPaper elevation={3}>
            <LogoContainer>
              <img
                src="./wp-content/uploads/2023/12/drh-logo.png"
                alt="Doctor Heights Logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700, 
                  color: 'primary.main',
                  fontSize: isMobile ? '1.5rem' : '1.75rem'
                }}
              >
                Administrator Login
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your credentials to access the admin panel
              </Typography>
            </LogoContainer>

            <Box 
              component="form" 
              onSubmit={handleLogin} 
              noValidate
              sx={{ '& .MuiTextField-root': { mb: 2 } }}
            >
              <StyledTextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined color="action" />
                    </InputAdornment>
                  ),
                }}
                error={!!error && !password}
                helperText={error && !password ? error : ''}
              />
              
              <StyledTextField
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                error={!!error && !!password}
                helperText={error && !!password ? error : ''}
              />

              <SubmitButton
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                size="large"
                sx={{ mt: 3 }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </SubmitButton>

              {error && !email && !password && (
                <Alert 
                  severity="error" 
                  sx={{ mt: 2 }}
                  icon={<ErrorOutline />}
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              )}

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" sx={{ display: 'block', mb: 0.5 }}>
                    For security reasons, please log out after each session
                  </Box>
                  <Box component="span" sx={{ fontSize: '0.7rem', opacity: 0.7 }}>
                    Supported browsers: Chrome, Firefox, Safari, Edge
                  </Box>
                </Typography>
              </Box>
            </Box>
          </LoginPaper>
        </Box>
      </Fade>
    </LoginContainer>
  );
};

export default Login;