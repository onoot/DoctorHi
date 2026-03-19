// src/components/sections/UsersSection.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Badge,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  InputAdornment,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  Person as PersonIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Restore as RestoreIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Badge as BadgeIcon,
  Archive as ArchiveIcon,
  History as HistoryIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useApi } from '../context/ApiContext';
import { useNotification } from '../context/NotificationContext';
import { useUserModal } from '../context/UserModalContext';
import { getAllUnits } from '../api/unitsAPI.js';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  flexWrap: 'wrap',
  gap: theme.spacing(2)
}));

const SectionTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  '& h2': {
    fontSize: '1.75rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
    margin: 0
  }
}));

const FiltersCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  borderRadius: theme.spacing(2)
}));

const SearchField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: 20,
  }
});

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04)
  },
  backgroundColor: alpha(theme.palette.grey[500], 0.02)
}));

const UnitChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: alpha(theme.palette.info.main, 0.1),
  borderColor: alpha(theme.palette.info.main, 0.3),
  '& .MuiChip-label': {
    fontWeight: 500
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 600,
  ...(status === 'archived' && {
    backgroundColor: alpha(theme.palette.grey[500], 0.1),
    color: theme.palette.grey[700],
    borderColor: theme.palette.grey[500]
  })
}));

const EmptyState = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(8),
  backgroundColor: alpha(theme.palette.grey[500], 0.02),
  borderRadius: theme.spacing(2),
  border: `2px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
  '& svg': {
    fontSize: 64,
    color: alpha(theme.palette.grey[500], 0.3),
    marginBottom: theme.spacing(2)
  }
}));

const SpinnerContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(8),
  '& .MuiCircularProgress-root': {
    marginRight: theme.spacing(2)
  }
}));

const InfoBadge = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2),
  backgroundColor: alpha(theme.palette.grey[500], 0.05),
  borderRadius: theme.spacing(4),
  color: theme.palette.text.secondary,
  fontSize: '0.875rem'
}));

const ArchiveHeader = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.grey[500], 0.05),
  padding: theme.spacing(2, 3),
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`
}));

// Dialog for restoring user
const RestoreConfirmationDialog = ({ open, onClose, onConfirm, userName, loading }) => {
  const theme = useTheme();
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: 450,
          width: '100%'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        backgroundColor: alpha(theme.palette.success.main, 0.1),
        color: theme.palette.success.main,
        fontWeight: 600
      }}>
        <RestoreIcon />
        Confirm Restore User
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        <DialogContentText>
          Are you sure you want to restore <strong>"{userName}"</strong>?
        </DialogContentText>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          <AlertTitle>What happens when you restore a user?</AlertTitle>
          <Box component="ul" sx={{ mt: 0, pl: 2 }}>
            <li>User will be able to log in again</li>
            <li>User will appear in active users list</li>
            <li>All user data and units remain intact</li>
          </Box>
        </Alert>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          startIcon={<CancelIcon />}
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          color="success"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <RestoreIcon />}
        >
          {loading ? 'Restoring...' : 'Restore User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const UsersSection = ({ onOpenAddUser, reloadKey = 0 }) => {
  const theme = useTheme();
  const { http } = useApi();
  const { showNotification } = useNotification();
  const { openViewUserModal } = useUserModal();
  
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [showUsersWithoutUnits, setShowUsersWithoutUnits] = useState(false);
  const [userUnitsMap, setUserUnitsMap] = useState({});
  
  // Состояния для диалога восстановления
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [userToRestore, setUserToRestore] = useState(null);
  const [restoring, setRestoring] = useState(false);

  // Загрузка всех пользователей
  const loadUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({ status: 'archived' });
      const res = await http.get(`/v1/admin/users?${queryParams.toString()}`);
      
      if (res.success) {
        const usersData = res.users || [];
        setAllUsers(usersData);
        setUsers(usersData);
        
        // Загружаем информацию о недвижимости для каждого пользователя
        const unitsMap = {};
        for (const user of usersData) {
          try {
            const unitsRes = await http.get(`/v1/admin/users/${user.id}/units`);
            if (unitsRes.success && unitsRes.units) {
              unitsMap[user.id] = unitsRes.units;
            }
          } catch (err) {
            console.error(`Error loading units for user ${user.id}:`, err);
            unitsMap[user.id] = [];
          }
        }
        setUserUnitsMap(unitsMap);
      } else {
        showNotification?.('error', res.message || 'Failed to load users');
        setAllUsers([]);
        setUsers([]);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      showNotification?.('error', err.message || 'Failed to load users');
      setAllUsers([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [reloadKey]);

  // Загрузка всех единиц недвижимости для фильтра
  useEffect(() => {
    const loadAllUnits = async () => {
      setLoadingUnits(true);
      try {
        const unitsData = await getAllUnits({
          page: 1,
          limit: 1000
        });
        setUnits(unitsData);
      } catch (err) {
        console.error('Error loading units:', err);
        showNotification?.('error', 'Failed to load units');
        setUnits([]);
      } finally {
        setLoadingUnits(false);
      }
    };
    
    loadAllUnits();
  }, []);

  // Фильтрация пользователей
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Фильтрация по выбранной единице недвижимости
    if (selectedUnitId) {
      filtered = filtered.filter(user => {
        const userUnits = userUnitsMap[user.id] || [];
        return userUnits.some(unit => 
          unit.unique_id === selectedUnitId || 
          unit.id === selectedUnitId
        );
      });
    }

    // Фильтрация по пользователям без недвижимости
    if (showUsersWithoutUnits) {
      filtered = filtered.filter(user => {
        const userUnits = userUnitsMap[user.id] || [];
        return userUnits.length === 0;
      });
    }

    // Поиск по всем полям
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(user => {
        const userFields = [
          user.id?.toString().toLowerCase(),
          user.name?.toLowerCase(),
          user.cnic?.toLowerCase(),
          user.email?.toLowerCase(),
          user.phone?.toLowerCase(),
          user.address?.toLowerCase()
        ].some(field => field && field.includes(searchLower));

        if (userFields) return true;

        const userUnits = userUnitsMap[user.id] || [];
        return userUnits.some(unit => {
          const unitSearchFields = [
            unit.name?.toLowerCase(),
            unit.unique_id?.toLowerCase(),
            unit.id?.toLowerCase(),
            unit.type?.toLowerCase(),
            unit.category?.toLowerCase()
          ];
          return unitSearchFields.some(field => field && field.includes(searchLower));
        });
      });
    }

    return filtered;
  }, [users, search, selectedUnitId, showUsersWithoutUnits, userUnitsMap]);

  const handleRestoreClick = (user) => {
    setUserToRestore(user);
    setRestoreDialogOpen(true);
  };

  const handleRestoreConfirm = async () => {
    if (!userToRestore) return;
    
    setRestoring(true);
    try {
      const res = await http.put(`/v1/admin/users/${userToRestore.id}`, { status: 'active' });
      if (res.success) {
        showNotification?.('success', `User "${userToRestore.name}" restored successfully`);
        loadUsers();
        setRestoreDialogOpen(false);
        setUserToRestore(null);
      } else {
        showNotification?.('error', res.message || 'Failed to restore user');
      }
    } catch (err) {
      console.error('Error restoring user:', err);
      showNotification?.('error', 'Failed to restore user: ' + (err.message || 'Unknown error'));
    } finally {
      setRestoring(false);
    }
  };

  const handleRestoreCancel = () => {
    setRestoreDialogOpen(false);
    setUserToRestore(null);
  };

  const handleClearFilters = () => {
    setSelectedUnitId('');
    setShowUsersWithoutUnits(false);
    setSearch('');
  };

  const getUserUnits = (userId) => {
    return userUnitsMap[userId] || [];
  };

  const activeFiltersCount = (selectedUnitId ? 1 : 0) + (showUsersWithoutUnits ? 1 : 0) + (search ? 1 : 0);

  return (
    <>
      <StyledPaper elevation={0}>
        <SectionHeader>
          <SectionTitle>
            <ArchiveIcon sx={{ fontSize: 32, color: 'grey.600' }} />
            <Typography variant="h4" component="h2" fontWeight={600}>
              Archived Users
            </Typography>
            <Chip 
              label={`${filteredUsers.length} archived`}
              size="small"
              color="default"
              variant="outlined"
            />
          </SectionTitle>
        </SectionHeader>

        <ArchiveHeader>
          <InfoIcon color="action" />
          <Typography variant="body2" color="text.secondary">
            Archived users are hidden from active lists but their data is preserved. 
            You can restore them at any time to give them access again.
          </Typography>
        </ArchiveHeader>

        <FiltersCard variant="outlined">
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <SearchField
                  fullWidth
                  size="small"
                  placeholder="Search archived users by name, CNIC, email, phone, or unit names..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: search && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearch('')}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl 
                  fullWidth 
                  size="small"
                  sx={{ minWidth: 250 }} 
                >
                  <InputLabel>Filter by Unit</InputLabel>
                  <Select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    label="Filter by Unit"
                    disabled={loadingUnits}
                  >
                    <MenuItem value="" 
                    
                    >
                      <em>All Units</em>
                    </MenuItem>
                    {loadingUnits ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} /> Loading units...
                      </MenuItem>
                    ) : units.length > 0 ? (
                      units.map(unit => (
                        <MenuItem key={unit.id || unit.unique_id} value={unit.id || unit.unique_id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ApartmentIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {unit.name} ({unit.category})
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No units available</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6} >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center'}}>
                  <Button
                    variant={showUsersWithoutUnits ? "contained" : "outlined"}
                    color="info"
                    onClick={() => setShowUsersWithoutUnits(!showUsersWithoutUnits)}
                    startIcon={<HomeIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    Users without units
                  </Button>

                  {activeFiltersCount > 0 && (
                    <Button
                      variant="text"
                      color="primary"
                      onClick={handleClearFilters}
                      startIcon={<ClearIcon />}
                      size="small"
                    >
                      Clear Filters ({activeFiltersCount})
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <InfoBadge>
                <FilterIcon fontSize="small" />
                <span>
                  Showing {filteredUsers.length} of {users.length} archived users
                  {activeFiltersCount > 0 && ' (filtered)'}
                </span>
              </InfoBadge>
            </Box>
          </CardContent>
        </FiltersCard>

        {loading ? (
          <SpinnerContainer>
            <CircularProgress size={24} />
            <Typography variant="body1" color="text.secondary">
              Loading archived users...
            </Typography>
          </SpinnerContainer>
        ) : filteredUsers.length === 0 ? (
          <EmptyState>
            <ArchiveIcon />
            <Typography variant="h6">No archived users found</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {activeFiltersCount > 0 ? 'Try adjusting your filters' : 'No users have been archived yet'}
            </Typography>
            {activeFiltersCount > 0 && (
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
              >
                Clear Filters
              </Button>
            )}
          </EmptyState>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: alpha(theme.palette.grey[500], 0.05) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>CNIC</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Assigned Units</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => {
                  const userUnits = getUserUnits(user.id);
                  const unitsCount = userUnits.length;
                  
                  return (
                    <StyledTableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.grey[500], 0.1) }}>
                            <PersonIcon sx={{ color: theme.palette.grey[600] }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight={600}>
                              {user.name || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: #{user.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BadgeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {user.cnic || '—'}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {user.email || '—'}
                            </Typography>
                          </Box>
                          {user.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {user.phone}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </TableCell>
                      
                      <TableCell>
                        {unitsCount > 0 ? (
                          <Box>
                            <Chip
                              label={`${unitsCount} unit${unitsCount !== 1 ? 's' : ''}`}
                              size="small"
                              color="default"
                              variant="outlined"
                              sx={{ mb: 1 }}
                            />
                            <Box sx={{ maxWidth: 250 }}>
                              {userUnits.slice(0, 2).map((unit, idx) => (
                                <UnitChip
                                  key={idx}
                                  label={unit.name || unit.id || unit.unique_id}
                                  size="small"
                                  icon={<ApartmentIcon />}
                                  variant="outlined"
                                />
                              ))}
                              {unitsCount > 2 && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  +{unitsCount - 2} more units
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            No units assigned
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <StatusChip
                          label="archived"
                          status="archived"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => openViewUserModal(user.id)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Restore User">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleRestoreClick(user)}
                            >
                              <RestoreIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </StyledTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </StyledPaper>

      {/* Диалог подтверждения восстановления */}
      <RestoreConfirmationDialog
        open={restoreDialogOpen}
        onClose={handleRestoreCancel}
        onConfirm={handleRestoreConfirm}
        userName={userToRestore?.name}
        loading={restoring}
      />
    </>
  );
};

export default UsersSection;