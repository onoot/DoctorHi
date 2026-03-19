// src/components/modals/AddUserModal.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Paper,
  Tooltip,
  alpha,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  LocationOn as LocationIcon,
  Lock as LockIcon,
  VpnKey as KeyIcon,
  ContentCopy as CopyIcon,
  Error as ErrorIcon,
  Edit as EditIcon,
  VpnKey as VpnKeyIcon, 
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNotification } from '../context/NotificationContext';
import { getAllProperties } from '../api/propertyAPI.js';
import usersAPI from '../api/usersAPI';

// Styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    maxWidth: 800,
    width: '100%'
  }
}));

const DialogHeader = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2, 3)
}));

const CredentialsPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: alpha(theme.palette.info.main, 0.05),
  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
  borderRadius: theme.spacing(1.5),
  marginTop: theme.spacing(2)
}));

const CredentialField = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
  '& .MuiTypography-root': {
    fontFamily: 'monospace',
    fontSize: '1rem'
  }
}));

const StepIcon = styled(Box)(({ theme, active, completed }) => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: completed 
    ? theme.palette.success.main 
    : active 
      ? theme.palette.primary.main 
      : alpha(theme.palette.grey[500], 0.2),
  color: completed || active 
    ? theme.palette.common.white 
    : theme.palette.text.disabled,
  transition: 'all 0.3s'
}));

const ErrorAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1)
}));

const ValidationIndicator = styled(Box)(({ theme, valid }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.spacing(1),
  backgroundColor: valid 
    ? alpha(theme.palette.success.main, 0.1) 
    : alpha(theme.palette.error.main, 0.1),
  color: valid 
    ? theme.palette.success.main 
    : theme.palette.error.main,
  fontSize: '0.75rem'
}));

const AddUserModal = ({ isOpen, onClose, onCreated }) => {
  const theme = useTheme();
  const { showNotification } = useNotification();
  
  // Используем useRef для отслеживания состояния загрузки
  const loadingRef = useRef(false);
  const loadAttemptedRef = useRef(false);
  const credentialsGenerated = useRef(false);
  
  const [formData, setFormData] = useState({
    name: '',
    cnic: '',
    phone: '',
    address: '',
    email: '',
    login: '',
    password: '',
    property_id: '',
    confirmPassword: ''
  });
  
  const [properties, setProperties] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [copiedField, setCopiedField] = useState(null);
  
  // Состояния для валидации пароля
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Загрузка свойств при открытии - с защитой от повторных запросов
  useEffect(() => {
    if (!isOpen) return;
    
    // Если уже загружали или загружаем - не делаем новый запрос
    if (loadAttemptedRef.current || loadingRef.current) {
      return;
    }
    
    let isMounted = true;
    
    const loadProperties = async () => {
      // Помечаем, что начали загрузку
      loadingRef.current = true;
      loadAttemptedRef.current = true;
      setLoading(true);
      setLoadError(null);
      
      try {
        console.log('Loading properties...');
        const props = await getAllProperties();
        
        if (isMounted) {
          console.log('Properties loaded:', props?.length || 0);
          setProperties(props || []);
        }
      } catch (err) {
        console.error('Failed to load properties:', err);
        
        if (isMounted) {
          setLoadError(err.message || 'Failed to load properties');
          // Показываем уведомление только один раз
          showNotification('error', 'Could not load properties. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        loadingRef.current = false;
      }
    };
    
    loadProperties();
    
    return () => {
      isMounted = false;
    };
  }, [isOpen, showNotification]);

  // Генерация credentials только при открытии и если еще не генерировали
  useEffect(() => {
    if (isOpen && !credentialsGenerated.current) {
      generateCredentials();
      credentialsGenerated.current = true;
    }
  }, [isOpen]);

  // Сброс формы при закрытии
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      credentialsGenerated.current = false;
      loadAttemptedRef.current = false; // Сбрасываем флаг попытки загрузки
      loadingRef.current = false;
      setLoadError(null);
    }
  }, [isOpen]);

  // Проверка сложности пароля
  useEffect(() => {
    const password = formData.password || '';
    
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  }, [formData.password]);

  const resetForm = () => {
    setFormData({
      name: '',
      cnic: '',
      phone: '',
      address: '',
      email: '',
      login: '',
      password: '',
      property_id: '',
      confirmPassword: ''
    });
    setErrors({});
    setTouched({});
    setActiveStep(0);
    setCopiedField(null);
  };

  const generateCredentials = useCallback(() => {
    const { login, password } = usersAPI.generateCredentials();
    setFormData(prev => ({ 
      ...prev, 
      login, 
      password,
      confirmPassword: password 
    }));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку для этого поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Специальная проверка для confirmPassword
    if (name === 'confirmPassword' || name === 'password') {
      if (name === 'password' && formData.confirmPassword) {
        if (value !== formData.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        } else {
          setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
      } else if (name === 'confirmPassword' && formData.password) {
        if (value !== formData.password) {
          setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        } else {
          setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
      }
    }
  }, [errors, formData.password, formData.confirmPassword]);

  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Валидация полей
    if (field === 'name' && !formData.name) {
      setErrors(prev => ({ ...prev, name: 'Name is required' }));
    } else if (field === 'address' && !formData.address) {
      setErrors(prev => ({ ...prev, address: 'Address is required' }));
    } else if (field === 'property_id' && !formData.property_id) {
      setErrors(prev => ({ ...prev, property_id: 'Property is required' }));
    } else if (field === 'login' && !formData.login) {
      setErrors(prev => ({ ...prev, login: 'Login is required' }));
    } else if (field === 'login' && formData.login && formData.login.length < 3) {
      setErrors(prev => ({ ...prev, login: 'Login must be at least 3 characters' }));
    } else if (field === 'password' && !formData.password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
    } else if (field === 'password' && formData.password) {
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
      
      if (formData.password.length < 8) {
        setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
      } else if (!(hasUpperCase && hasLowerCase && hasNumber && hasSpecial)) {
        setErrors(prev => ({ ...prev, password: 'Password must include uppercase, lowercase, number and special character' }));
      } else {
        setErrors(prev => ({ ...prev, password: '' }));
      }
    } else if (field === 'confirmPassword' && formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else if (field === 'email' && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Invalid email format' }));
    } else {
      // Очищаем ошибку если все хорошо
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [formData]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.property_id) newErrors.property_id = 'Property is required';
    if (!formData.login) newErrors.login = 'Login is required';
    else if (formData.login.length < 3) newErrors.login = 'Login must be at least 3 characters';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else {
      if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      else {
        const hasUpperCase = /[A-Z]/.test(formData.password);
        const hasLowerCase = /[a-z]/.test(formData.password);
        const hasNumber = /[0-9]/.test(formData.password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
        
        if (!(hasUpperCase && hasLowerCase && hasNumber && hasSpecial)) {
          newErrors.password = 'Password must include uppercase, lowercase, number and special character';
        }
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    // CNIC и Phone не валидируем строго - принимаем любой формат
    if (!formData.cnic) newErrors.cnic = 'CNIC is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleCopy = useCallback((field, value) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    showNotification('info', `${field} copied to clipboard`);
  }, [showNotification]);

  const handleNext = useCallback(() => {
    let stepValid = true;
    
    switch (activeStep) {
      case 0:
        if (!formData.name) {
          showNotification('warning', 'Name is required');
          stepValid = false;
        } else if (!formData.cnic) {
          showNotification('warning', 'CNIC is required');
          stepValid = false;
        } else if (!formData.phone) {
          showNotification('warning', 'Phone number is required');
          stepValid = false;
        } else if (!formData.address) {
          showNotification('warning', 'Address is required');
          stepValid = false;
        }
        break;
      case 1:
        if (!formData.property_id) {
          showNotification('warning', 'Please select a property');
          stepValid = false;
        }
        break;
      case 2:
        if (!formData.login) {
          showNotification('warning', 'Login is required');
          stepValid = false;
        } else if (formData.login.length < 3) {
          showNotification('warning', 'Login must be at least 3 characters');
          stepValid = false;
        } else if (!formData.password) {
          showNotification('warning', 'Please set a password');
          stepValid = false;
        } else if (formData.password.length < 8) {
          showNotification('warning', 'Password must be at least 8 characters');
          stepValid = false;
        } else {
          const hasUpperCase = /[A-Z]/.test(formData.password);
          const hasLowerCase = /[a-z]/.test(formData.password);
          const hasNumber = /[0-9]/.test(formData.password);
          const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
          
          if (!(hasUpperCase && hasLowerCase && hasNumber && hasSpecial)) {
            showNotification('warning', 'Password must include uppercase, lowercase, number and special character');
            stepValid = false;
          } else if (formData.password !== formData.confirmPassword) {
            showNotification('warning', 'Passwords do not match');
            stepValid = false;
          }
        }
        break;
      default:
        break;
    }
    
    if (stepValid) {
      setActiveStep(prev => prev + 1);
    }
  }, [activeStep, formData, showNotification]);

  const handleBack = useCallback(() => {
    setActiveStep(prev => prev - 1);
  }, []);

  const handleRetryLoad = useCallback(() => {
    // Сбрасываем флаги для повторной попытки
    loadAttemptedRef.current = false;
    loadingRef.current = false;
    setLoadError(null);
    
    // Запускаем загрузку заново
    if (isOpen) {
      setTimeout(() => {
        const event = new CustomEvent('retryLoadProperties');
        window.dispatchEvent(event);
      }, 100);
    }
  }, [isOpen]);

  // Слушаем событие ретрая
  useEffect(() => {
    const handleRetry = () => {
      if (isOpen && !loadingRef.current) {
        loadAttemptedRef.current = false;
        const loadProperties = async () => {
          loadingRef.current = true;
          loadAttemptedRef.current = true;
          setLoading(true);
          setLoadError(null);
          
          try {
            const props = await getAllProperties();
            setProperties(props || []);
          } catch (err) {
            setLoadError(err.message || 'Failed to load properties');
            showNotification('error', 'Retry failed. Please try again later.');
          } finally {
            setLoading(false);
            loadingRef.current = false;
          }
        };
        loadProperties();
      }
    };
    
    window.addEventListener('retryLoadProperties', handleRetry);
    return () => {
      window.removeEventListener('retryLoadProperties', handleRetry);
    };
  }, [isOpen, showNotification]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('error', 'Please fill in all required fields correctly');
      
      // Показываем первую ошибку
      const firstError = Object.values(errors)[0];
      if (firstError) {
        showNotification('warning', firstError);
      }
      return;
    }
    
    setSubmitting(true);
    try {
      const userData = {
        name: formData.name,
        cnic: formData.cnic,
        phone: formData.phone,
        address: formData.address,
        login: formData.login,
        password: formData.password,
        property_id: formData.property_id
      };
      
      if (formData.email) {
        userData.email = formData.email;
      }
      
      const result = await usersAPI.createUser(userData);
      
      showNotification('success', `User "${formData.name}" created successfully`);
      
      if (onCreated) {
        onCreated(result);
      }
      
      onClose();
    } catch (err) {
      console.error('Error creating user:', err);
      showNotification('error', err.message || 'Failed to create user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [formData, errors, validateForm, showNotification, onCreated, onClose]);

  const getStepContent = useCallback((step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                name="name"
                label="Full Name"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur('name')}
                error={touched.name && !!errors.name}
                helperText={touched.name && errors.name}
                disabled={submitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonAddIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                name="cnic"
                label="CNIC"
                value={formData.cnic}
                onChange={handleChange}
                onBlur={() => handleBlur('cnic')}
                error={touched.cnic && !!errors.cnic}
                helperText={touched.cnic && errors.cnic || 'Any format accepted'}
                placeholder="Enter CNIC"
                disabled={submitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                onBlur={() => handleBlur('phone')}
                error={touched.phone && !!errors.phone}
                helperText={touched.phone && errors.phone || 'Any format accepted'}
                placeholder="Enter phone number"
                disabled={submitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="email"
                label="Email (Optional)"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                error={touched.email && !!errors.email}
                helperText={touched.email && errors.email}
                placeholder="user@example.com"
                disabled={submitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleChange}
                onBlur={() => handleBlur('address')}
                error={touched.address && !!errors.address}
                helperText={touched.address && errors.address}
                multiline
                rows={2}
                disabled={submitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <Box>
            {loadError ? (
              <ErrorAlert 
                severity="error"
                action={
                  <Button 
                    color="inherit" 
                    size="small"
                    onClick={handleRetryLoad}
                    startIcon={<RefreshIcon />}
                  >
                    Retry
                  </Button>
                }
              >
                <Typography variant="body2">
                  <ErrorIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                  Failed to load properties: {loadError}
                </Typography>
              </ErrorAlert>
            ) : (
              <FormControl fullWidth required error={touched.property_id && !!errors.property_id}>
                <InputLabel>Property (Unit)</InputLabel>
                <Select
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleChange}
                  onBlur={() => handleBlur('property_id')}
                  label="Property (Unit)"
                  disabled={submitting || loading}
                >
                  <MenuItem value="">
                    <em>Select Property</em>
                  </MenuItem>
                  {loading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} /> Loading properties...
                    </MenuItem>
                  ) : properties.length > 0 ? (
                    properties.map((unit) => (
                      <MenuItem key={unit.id} value={unit.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <HomeIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {unit.name} ({unit.area} sqft)
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No properties available</MenuItem>
                  )}
                </Select>
                {touched.property_id && errors.property_id && (
                  <FormHelperText error>{errors.property_id}</FormHelperText>
                )}
              </FormControl>
            )}
            
            {formData.property_id && !loadError && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  User will be assigned to the selected property unit.
                  {properties.find(p => p.id === formData.property_id)?.name && (
                    <strong> {properties.find(p => p.id === formData.property_id)?.name}</strong>
                  )}
                </Typography>
              </Alert>
            )}
          </Box>
        );
        
      case 2:
        return (
          <Box>
            <CredentialsPaper>
              <Typography variant="subtitle2" color="info.main" gutterBottom>
                <KeyIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                Login Credentials
              </Typography>
              
              <Grid container spacing={3}>
                {/* Login Field */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    name="login"
                    label="Login"
                    value={formData.login}
                    onChange={handleChange}
                    onBlur={() => handleBlur('login')}
                    error={touched.login && !!errors.login}
                    helperText={touched.login && errors.login || 'Minimum 3 characters'}
                    disabled={submitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKeyIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title={copiedField === 'login' ? 'Copied!' : 'Copy login'}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleCopy('login', formData.login)}
                              edge="end"
                            >
                              {copiedField === 'login' ? <CheckCircleIcon color="success" /> : <CopyIcon />}
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                
                {/* Password Field */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    error={touched.password && !!errors.password}
                    helperText={touched.password && errors.password}
                    disabled={submitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <ValidationIndicator valid={passwordStrength.length}>
                        {passwordStrength.length ? '✓' : '○'} 8+ chars
                      </ValidationIndicator>
                      <ValidationIndicator valid={passwordStrength.uppercase}>
                        {passwordStrength.uppercase ? '✓' : '○'} Uppercase
                      </ValidationIndicator>
                      <ValidationIndicator valid={passwordStrength.lowercase}>
                        {passwordStrength.lowercase ? '✓' : '○'} Lowercase
                      </ValidationIndicator>
                      <ValidationIndicator valid={passwordStrength.number}>
                        {passwordStrength.number ? '✓' : '○'} Number
                      </ValidationIndicator>
                      <ValidationIndicator valid={passwordStrength.special}>
                        {passwordStrength.special ? '✓' : '○'} Special
                      </ValidationIndicator>
                    </Box>
                  )}
                </Grid>
                
                {/* Confirm Password Field */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    error={touched.confirmPassword && !!errors.confirmPassword}
                    helperText={touched.confirmPassword && errors.confirmPassword}
                    disabled={submitting}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  You can edit login and password manually
                </Typography>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={generateCredentials}
                  disabled={submitting}
                  variant="outlined"
                >
                  Generate New
                </Button>
              </Box>
            </CredentialsPaper>
            
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="caption">
                Make sure to save these credentials. They will not be shown again after creation.
              </Typography>
            </Alert>
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  }, [
    formData, 
    errors, 
    touched, 
    submitting, 
    loading, 
    properties, 
    loadError,
    copiedField, 
    showPassword,
    passwordStrength,
    handleChange,
    handleBlur,
    handleCopy,
    generateCredentials,
    handleRetryLoad
  ]);

  if (!isOpen) return null;

  // Calculate if credentials step is valid
  const isCredentialsValid = formData.login && 
    formData.login.length >= 3 &&
    formData.password && 
    formData.password.length >= 8 &&
    passwordStrength.uppercase &&
    passwordStrength.lowercase &&
    passwordStrength.number &&
    passwordStrength.special &&
    formData.password === formData.confirmPassword;

  return (
    <StyledDialog
      open={isOpen}
      onClose={submitting ? null : onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon />
          <Typography variant="h6">Add New User</Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          size="small" 
          sx={{ color: 'inherit' }}
          disabled={submitting}
        >
          <CloseIcon />
        </IconButton>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} orientation="vertical" nonLinear>
            <Step>
              <StepLabel
                optional={<Typography variant="caption">Personal Information</Typography>}
                StepIconComponent={() => (
                  <StepIcon 
                    active={activeStep === 0} 
                    completed={activeStep > 0 || (formData.name && formData.cnic && formData.phone && formData.address)}
                  >
                    {activeStep > 0 ? <CheckCircleIcon fontSize="small" /> : 1}
                  </StepIcon>
                )}
              >
                <Typography variant="subtitle2">Personal Information</Typography>
              </StepLabel>
              <StepContent>
                {getStepContent(0)}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!formData.name || !formData.cnic || !formData.phone || !formData.address}
                  >
                    Continue
                  </Button>
                </Box>
              </StepContent>
            </Step>

            <Step>
              <StepLabel
                optional={<Typography variant="caption">Property Assignment</Typography>}
                StepIconComponent={() => (
                  <StepIcon 
                    active={activeStep === 1} 
                    completed={activeStep > 1 || formData.property_id}
                  >
                    {activeStep > 1 ? <CheckCircleIcon fontSize="small" /> : 2}
                  </StepIcon>
                )}
              >
                <Typography variant="subtitle2">Property Assignment</Typography>
              </StepLabel>
              <StepContent>
                {getStepContent(1)}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!formData.property_id || !!loadError}
                  >
                    Continue
                  </Button>
                </Box>
              </StepContent>
            </Step>

            <Step>
              <StepLabel
                optional={<Typography variant="caption">Login Credentials</Typography>}
                StepIconComponent={() => (
                  <StepIcon 
                    active={activeStep === 2} 
                    completed={activeStep > 2 || isCredentialsValid}
                  >
                    {activeStep > 2 ? <CheckCircleIcon fontSize="small" /> : 3}
                  </StepIcon>
                )}
              >
                <Typography variant="subtitle2">Login Credentials</Typography>
              </StepLabel>
              <StepContent>
                {getStepContent(2)}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button onClick={handleBack}>
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={
              submitting || 
              !formData.name || 
              !formData.cnic || 
              !formData.phone || 
              !formData.address || 
              !formData.property_id || 
              !isCredentialsValid ||
              !!loadError
            }
            startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {submitting ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </form>
    </StyledDialog>
  );
};

export default AddUserModal;