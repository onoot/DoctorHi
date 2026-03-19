// src/components/modals/UserModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Divider,
  Alert,
  InputAdornment,
  FormHelperText,
  useTheme,
  useMediaQuery,
  Avatar,
  Stack,
  Tooltip,
  Fade,
  Chip,
  Card,
  CardContent,
  Paper,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Skeleton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Refresh as RefreshIcon,
  Key as KeyIcon,
  VpnKey as VpnKeyIcon,
  Apartment as ApartmentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useNotification } from '../context/NotificationContext';
import { useUserModal } from '../context/UserModalContext';
import usersAPI from '../api/usersAPI';
import StatusChip from '../common/StatusChip';

// Конфигурация статусов пользователя
const USER_STATUS_CONFIG = {
  active: { color: 'success', label: 'Active' },
  archived: { color: 'default', label: 'Archived' },
  blocked: { color: 'error', label: 'Blocked' },
  pending: { color: 'warning', label: 'Pending' },
  inactive: { color: 'default', label: 'Inactive' },
};

const UserModal = ({ onUpdated }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { showNotification } = useNotification();
  const { viewUserModal, closeViewUserModal } = useUserModal();
  const { isOpen, userId } = viewUserModal;
  
  // Состояния
  const [user, setUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [userUnits, setUserUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // Состояния для таблицы объектов
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

  // Расчет сложности пароля
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    if (newPassword.length >= 6) strength += 25;
    if (newPassword.length >= 8) strength += 15;
    if (/[A-Z]/.test(newPassword)) strength += 20;
    if (/[0-9]/.test(newPassword)) strength += 20;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 20;
    
    setPasswordStrength(Math.min(strength, 100));
  }, [newPassword]);

  // Загрузка данных пользователя
  useEffect(() => {
    if (!isOpen || !userId) {
      resetState();
      return;
    }
    
    const loadUserData = async () => {
      setLoading(true);
      try {
        const userData = await usersAPI.getUserById(userId);
        setUser(userData);
        
        await loadUserUnits();
      } catch (err) {
        console.error('Error loading user:', err);
        showNotification('error', err.message || 'Failed to load user');
        handleClose();
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [isOpen, userId, showNotification]);

  const loadUserUnits = async () => {
    if (!userId) return;
    
    setLoadingUnits(true);
    try {
      const units = await usersAPI.getUserUnits(userId);
      setUserUnits(units);
    } catch (err) {
      console.warn('Failed to load user units:', err);
    } finally {
      setLoadingUnits(false);
    }
  };

  const resetState = () => {
    setUser(null);
    setNewPassword('');
    setUserUnits([]);
    setPage(0);
  };

  const handleSavePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showNotification('warning', 'Password must be at least 6 characters long');
      return;
    }
    
    setSavingPassword(true);
    try {
      await usersAPI.updateUserPassword(userId, newPassword);
      showNotification('success', 'Password updated successfully');
      setNewPassword('');
      onUpdated?.();
    } catch (err) {
      console.error('Error updating password:', err);
      showNotification('error', err.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleGeneratePassword = () => {
    const { password } = usersAPI.generateCredentials();
    setNewPassword(password);
  };

  const handleClose = () => {
    resetState();
    closeViewUserModal();
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    try {
      return new Date(isoDate).toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoDate;
    }
  };

  const formatDateShort = (isoDate) => {
    if (!isoDate) return 'N/A';
    try {
      return new Date(isoDate).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return isoDate;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 80) return 'success';
    if (passwordStrength >= 50) return 'warning';
    return 'error';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength >= 80) return 'Strong';
    if (passwordStrength >= 50) return 'Medium';
    return 'Weak';
  };

  // Обработчики для таблицы
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Сортировка объектов
  const sortedUnits = React.useMemo(() => {
    const units = [...userUnits];
    if (!units.length) return units;
    
    return units.sort((a, b) => {
      const aValue = a[orderBy] || '';
      const bValue = b[orderBy] || '';
      
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [userUnits, orderBy, order]);

  const paginatedUnits = sortedUnits.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={fullScreen}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 300 }}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          minHeight: fullScreen ? '100%' : '80vh',
          maxHeight: fullScreen ? '100%' : '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        py: 2,
        px: 3,
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PersonIcon />
          <Typography variant="h6">
            {loading ? 'Loading User...' : 'User Profile'}
          </Typography>
          {user && (
            <Chip
              label={`ID: ${user.id}`}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'inherit',
                fontWeight: 500,
              }}
            />
          )}
        </Stack>
        <IconButton onClick={handleClose} size="small" sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, bgcolor: 'grey.50' }}>
        {loading ? (
          <Box sx={{ p: 4 }}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 3 }} />
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map((i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : user ? (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header Card with Avatar */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm="auto">
                  <Avatar
                    sx={{
                      width: { xs: 80, sm: 100 },
                      height: { xs: 80, sm: 100 },
                      bgcolor: 'primary.light',
                      color: 'primary.dark',
                      fontSize: { xs: '2rem', sm: '2.5rem' },
                      fontWeight: 600,
                      border: 4,
                      borderColor: 'background.paper',
                      boxShadow: 3,
                      mx: { xs: 'auto', sm: 0 },
                    }}
                  >
                    {getInitials(user.name)}
                  </Avatar>
                </Grid>
                
                <Grid item xs>
                  <Stack spacing={1} alignItems={{ xs: 'center', sm: 'flex-start' }}>
                    <Typography variant="h4" fontWeight={600}>
                      {user.name || 'Unknown User'}
                    </Typography>
                    
                    <Stack 
                      direction="row" 
                      spacing={1} 
                      flexWrap="wrap" 
                      justifyContent={{ xs: 'center', sm: 'flex-start' }}
                    >
                      <StatusChip
                        status={user.status}
                        label={USER_STATUS_CONFIG[user.status]?.label || user.status}
                        size="small"
                      />
                      
                      {user.cnic && (
                        <Chip
                          icon={<BadgeIcon />}
                          label={user.cnic}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>

                    <Stack 
                      direction="row" 
                      spacing={2} 
                      flexWrap="wrap" 
                      divider={<Divider orientation="vertical" flexItem />}
                      justifyContent={{ xs: 'center', sm: 'flex-start' }}
                    >
                      {user.email && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2">{user.email}</Typography>
                        </Stack>
                      )}
                      
                      {user.phone && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2">{user.phone}</Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={6} sm={3}>
                <Card elevation={0} variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <ApartmentIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h5" color="primary" fontWeight={600}>
                      {loadingUnits ? '...' : userUnits.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Properties
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card elevation={0} variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <CalendarIcon color="action" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h5" fontWeight={600}>
                      {formatDateShort(user.created_at).split(' ')[2] || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Joined
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Personal Information Section */}
            <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Personal Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={user.name || ''}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="CNIC / National ID"
                    value={user.cnic || ''}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={user.email || ''}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={user.phone || ''}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={user.address || ''}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    size="small"
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Properties Section with Table */}
            <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                <InventoryIcon color="primary" />
                <Typography variant="h6">
                  Assigned Properties
                </Typography>
                {!loadingUnits && userUnits.length > 0 && (
                  <Chip
                    label={userUnits.length}
                    size="small"
                    color="primary"
                  />
                )}
              </Stack>
              
              {loadingUnits ? (
                <Box sx={{ width: '100%', py: 3 }}>
                  <LinearProgress />
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                    Loading properties...
                  </Typography>
                </Box>
              ) : userUnits.length > 0 ? (
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === 'name'}
                              direction={orderBy === 'name' ? order : 'asc'}
                              onClick={() => handleRequestSort('name')}
                            >
                              Property Name
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === 'type'}
                              direction={orderBy === 'type' ? order : 'asc'}
                              onClick={() => handleRequestSort('type')}
                            >
                              Type
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === 'category'}
                              direction={orderBy === 'category' ? order : 'asc'}
                              onClick={() => handleRequestSort('category')}
                            >
                              Category
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">Area (sq.m)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedUnits.map((unit) => (
                          <TableRow key={unit.id} hover>
                            <TableCell>
                              <Typography fontWeight={500}>
                                {unit.name || `Unit #${unit.id}`}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={unit.type}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={unit.category}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              {unit.area ? `${unit.area} m²` : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <TablePagination
                    component="div"
                    count={userUnits.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                  />
                </>
              ) : (
                <Alert severity="info" icon={<InfoIcon />}>
                  No properties assigned to this user
                </Alert>
              )}
            </Paper>

            {/* System Information */}
            <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                System Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Created"
                    value={formatDate(user.created_at)}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Updated"
                    value={formatDate(user.updated_at)}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Password Change Section */}
            <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                <LockIcon color="action" />
                <Typography variant="h6">
                  Security Settings
                </Typography>
              </Stack>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={savingPassword}
                    placeholder="Enter new password (min. 6 characters)"
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKeyIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                            disabled={savingPassword}
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                          <Tooltip title="Generate strong password">
                            <IconButton
                              onClick={handleGeneratePassword}
                              edge="end"
                              size="small"
                              disabled={savingPassword}
                              sx={{ ml: 0.5 }}
                            >
                              <RefreshIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  {newPassword && (
                    <Box sx={{ mt: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={passwordStrength}
                            color={getPasswordStrengthColor()}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                          {getPasswordStrengthText()}
                        </Typography>
                      </Stack>
                      
                      <Stack 
                        direction="row" 
                        spacing={2} 
                        flexWrap="wrap"
                        divider={<Divider orientation="vertical" flexItem />}
                      >
                        <FormHelperText 
                          sx={{ 
                            color: newPassword.length >= 6 ? 'success.main' : 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <CheckCircleIcon fontSize="inherit" />
                          Min 6 chars
                        </FormHelperText>
                        
                        <FormHelperText 
                          sx={{ 
                            color: /[A-Z]/.test(newPassword) ? 'success.main' : 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <CheckCircleIcon fontSize="inherit" />
                          Uppercase
                        </FormHelperText>
                        
                        <FormHelperText 
                          sx={{ 
                            color: /[0-9]/.test(newPassword) ? 'success.main' : 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <CheckCircleIcon fontSize="inherit" />
                          Number
                        </FormHelperText>
                        
                        <FormHelperText 
                          sx={{ 
                            color: /[^A-Za-z0-9]/.test(newPassword) ? 'success.main' : 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <CheckCircleIcon fontSize="inherit" />
                          Special char
                        </FormHelperText>
                      </Stack>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: 400,
            gap: 2,
            p: 3
          }}>
            <ErrorIcon color="error" sx={{ fontSize: 60 }} />
            <Typography variant="h6" color="error" gutterBottom>
              User not found
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              The user you're looking for doesn't exist or you don't have permission to view it.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1, borderTop: 1, borderColor: 'divider' }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={savingPassword}
        >
          Close
        </Button>
        
        {user && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSavePassword}
            disabled={!newPassword || newPassword.length < 6 || savingPassword}
            startIcon={savingPassword ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {savingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserModal;