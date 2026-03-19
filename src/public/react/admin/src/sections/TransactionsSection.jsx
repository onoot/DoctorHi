// src/sections/TransactionsSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  Card,
  CardContent,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  InputAdornment,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Divider,
  Fade,
  Zoom,
  useMediaQuery,
  Collapse,
  SwipeableDrawer,
  BottomNavigation,
  BottomNavigationAction,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Menu,
  ListItemIcon,
  ListItemText,
  Alert,
  Snackbar,
  LinearProgress
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Add as AddIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  Apartment as ApartmentIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  Receipt as ReceiptIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  GridView as GridViewIcon,
  TableRows as TableRowsIcon,
  Sort as SortIcon,
  FilterAlt as FilterAltIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  SwapHoriz as SwapHorizIcon,
  AccountBalance as AccountBalanceIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Menu as MenuIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useApi } from '../context/ApiContext';
import { useNotification } from '../context/NotificationContext';
import SearchBox from '../common/SearchBox';
import { formatPKR } from '../utils/formatNumber';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1.5)
  }
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
    '& .MuiButton-root': {
      width: '100%'
    }
  }
}));

const SectionTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap',
  '& h2': {
    fontSize: '1.75rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
    margin: 0,
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.5rem'
    }
  }
}));

const StatsCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    borderRadius: theme.spacing(1.5)
  }
}));

const StatsGrid = styled(Grid)(({ theme }) => ({
  '& .MuiGrid-item': {
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1)
    }
  }
}));

const TransactionCard = styled(Card)(({ theme, status }) => ({
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'visible',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8]
  },
  ...(status === 'approved' && {
    borderLeft: `4px solid ${theme.palette.success.main}`
  }),
  ...(status === 'pending' && {
    borderLeft: `4px solid ${theme.palette.warning.main}`
  }),
  ...(status === 'cancelled' && {
    borderLeft: `4px solid ${theme.palette.error.main}`,
    opacity: 0.8
  }),
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(1.5)
  }
}));

const MobileTransactionCard = styled(Card)(({ theme, status }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    ...(status === 'approved' && {
      backgroundColor: theme.palette.success.main
    }),
    ...(status === 'pending' && {
      backgroundColor: theme.palette.warning.main
    }),
    ...(status === 'cancelled' && {
      backgroundColor: theme.palette.error.main
    })
  }
}));

const MobileCardHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1.5),
  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  backgroundColor: alpha(theme.palette.primary.main, 0.02)
}));

const MobileCardContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5)
}));

const InfoRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
  '&:last-child': {
    marginBottom: 0
  }
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
  minWidth: 70
}));

const InfoValue = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: theme.palette.text.primary
}));

const StyledTableRow = styled(TableRow)(({ theme, status }) => ({
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    cursor: 'pointer'
  },
  ...(status === 'approved' && {
    backgroundColor: alpha(theme.palette.success.main, 0.05)
  }),
  ...(status === 'pending' && {
    backgroundColor: alpha(theme.palette.warning.main, 0.05)
  }),
  ...(status === 'cancelled' && {
    backgroundColor: alpha(theme.palette.error.main, 0.05)
  })
}));

const StatusChip = styled(Chip)(({ theme, statuscolor }) => ({
  fontWeight: 600,
  ...(statuscolor === 'success' && {
    backgroundColor: alpha(theme.palette.success.main, 0.1),
    color: theme.palette.success.main,
    borderColor: theme.palette.success.main
  }),
  ...(statuscolor === 'warning' && {
    backgroundColor: alpha(theme.palette.warning.main, 0.1),
    color: theme.palette.warning.main,
    borderColor: theme.palette.warning.main
  }),
  ...(statuscolor === 'error' && {
    backgroundColor: alpha(theme.palette.error.main, 0.1),
    color: theme.palette.error.main,
    borderColor: theme.palette.error.main
  }),
  ...(statuscolor === 'info' && {
    backgroundColor: alpha(theme.palette.info.main, 0.1),
    color: theme.palette.info.main,
    borderColor: theme.palette.info.main
  })
}));

const AmountTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.primary.main,
  '&::before': {
    content: '"₨"',
    marginRight: '2px',
    fontSize: '0.9em',
    opacity: 0.8
  }
}));

const EmptyState = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(8),
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
  borderRadius: theme.spacing(2),
  border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(4)
  },
  '& svg': {
    fontSize: 64,
    color: alpha(theme.palette.primary.main, 0.3),
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

const FilterCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(3),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  [theme.breakpoints.down('sm')]: {
    borderRadius: theme.spacing(1.5)
  }
}));

const FilterActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center',
  flexWrap: 'wrap',
  [theme.breakpoints.down('sm')]: {
    '& .MuiButton-root': {
      flex: 1,
      fontSize: '0.8rem'
    }
  }
}));

const CardsGrid = styled(Grid)(({ theme }) => ({
  marginTop: theme.spacing(2),
  '& .MuiGrid-item': {
    display: 'flex'
  }
}));

const MobileFAB = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 1000
}));

const FilterDrawer = styled(SwipeableDrawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    borderTopLeftRadius: theme.spacing(3),
    borderTopRightRadius: theme.spacing(3),
    padding: theme.spacing(2)
  }
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1, 1, 0, 1)
}));

// Delete Confirmation Dialog
const DeleteConfirmationDialog = ({ open, onClose, onConfirm, transaction, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: 450,
          width: '100%',
          margin: theme.spacing(2)
        }
      }}
      TransitionComponent={Fade}
      fullScreen={isMobile}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        backgroundColor: alpha(theme.palette.error.main, 0.1),
        color: theme.palette.error.main,
        fontWeight: 600,
        fontSize: { xs: '1rem', sm: '1.25rem' }
      }}>
        <DeleteIcon />
        Confirm Delete
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        <DialogContentText>
          Are you sure you want to delete transaction <strong>#{transaction?.id}</strong>?
        </DialogContentText>
        
        <Card variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HomeIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Property:</strong> {transaction?.property_name || 'Unknown'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoneyIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Amount:</strong> ₨{Number(transaction?.total_amount || 0).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Buyer:</strong> {transaction?.new_owner_name || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Box sx={{ 
          mt: 3,
          p: 2, 
          bgcolor: alpha(theme.palette.error.main, 0.05),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
        }}>
          <Typography variant="body2" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon fontSize="small" />
            This action cannot be undone. All transaction data will be permanently removed.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 0, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          startIcon={<CancelIcon />}
          fullWidth={isMobile}
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          fullWidth={isMobile}
        >
          {loading ? 'Deleting...' : 'Delete Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Approve Confirmation Dialog
const ApproveConfirmationDialog = ({ open, onClose, onConfirm, transaction, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: 450,
          width: '100%',
          margin: theme.spacing(2)
        }
      }}
      TransitionComponent={Zoom}
      fullScreen={isMobile}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        backgroundColor: alpha(theme.palette.success.main, 0.1),
        color: theme.palette.success.main,
        fontWeight: 600,
        fontSize: { xs: '1rem', sm: '1.25rem' }
      }}>
        <ApproveIcon />
        Confirm Approval
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        <DialogContentText>
          Are you sure you want to approve transaction <strong>#{transaction?.id}</strong>?
        </DialogContentText>
        
        <Card variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HomeIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Property:</strong> {transaction?.property_name || 'Unknown'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoneyIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Amount:</strong> ₨{Number(transaction?.total_amount || 0).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Buyer:</strong> {transaction?.new_owner_name || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Date:</strong> {transaction?.created_at ? new Date(transaction.created_at).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Box sx={{ 
          mt: 3,
          p: 2, 
          bgcolor: alpha(theme.palette.success.main, 0.05),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
        }}>
          <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon fontSize="small" />
            After approval, this transaction will be marked as completed and visible in reports.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 0, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          startIcon={<CancelIcon />}
          fullWidth={isMobile}
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          color="success"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <ApproveIcon />}
          fullWidth={isMobile}
        >
          {loading ? 'Approving...' : 'Approve Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Mobile Filter Drawer
const MobileFilterDrawer = ({ open, onClose, statusFilter, setStatusFilter, dateFilter, setDateFilter, onClear }) => {
  const theme = useTheme();
  
  return (
    <FilterDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen={false}
    >
      <DrawerHeader>
        <Typography variant="h6" fontWeight={600}>
          Filter Transactions
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DrawerHeader>
      
      <Box sx={{ p: 1 }}>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <InputLabel>Date</InputLabel>
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            label="Date"
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
        
        <Button
          fullWidth
          variant="contained"
          onClick={() => {
            onClear();
            onClose();
          }}
          sx={{ mb: 1 }}
        >
          Apply Filters
        </Button>
        
        <Button
          fullWidth
          variant="outlined"
          onClick={onClear}
        >
          Clear All
        </Button>
      </Box>
    </FilterDrawer>
  );
};

// Mobile Sort Menu
const MobileSortMenu = ({ anchorEl, open, onClose, onSort }) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          mt: 1
        }
      }}
    >
      <MenuItem onClick={() => { onSort('date_desc'); onClose(); }}>
        <ListItemIcon>
          <CalendarIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Newest first</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { onSort('date_asc'); onClose(); }}>
        <ListItemIcon>
          <CalendarIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Oldest first</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { onSort('amount_desc'); onClose(); }}>
        <ListItemIcon>
          <MoneyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Highest amount</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { onSort('amount_asc'); onClose(); }}>
        <ListItemIcon>
          <MoneyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Lowest amount</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { onSort('name'); onClose(); }}>
        <ListItemIcon>
          <HomeIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Property name</ListItemText>
      </MenuItem>
    </Menu>
  );
};

const TransactionsSection = ({ 
  onOpenCreateTransaction, 
  onOpenViewTransaction, 
  onOpenUploadFile, 
  onOpenAddPayment 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const { http } = useApi();
  const { showNotification } = useNotification();
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [abortController, setAbortController] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // Default to cards on mobile
  
  // Mobile specific states
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [sortBy, setSortBy] = useState('date_desc');
  const [expandedCard, setExpandedCard] = useState(null);

  const loadTransactions = useCallback(async (query = '', status = 'all') => {
    if (abortController) {
      abortController.abort();
    }

    const controller = new AbortController();
    setAbortController(controller);

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (status !== 'all') params.append('status', status);
      
      const res = await http.get(`/v1/admin/transactions?${params.toString()}`, {
        signal: controller.signal
      });
      
      if (res.success) {
        setTransactions(res.transactions || []);
      } else {
        throw new Error(res.message || 'Failed to load transactions');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[TRANSACTIONS] Request was cancelled');
        return; 
      }
      console.error('[TRANSACTIONS] Load error:', err);
      showNotification('error', err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [http, showNotification]);

  useEffect(() => {
    loadTransactions(searchQuery, statusFilter);
  }, [searchQuery, statusFilter, loadTransactions]);

  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  // Sort transactions
  const sortedTransactions = useCallback(() => {
    const sorted = [...transactions];
    
    switch(sortBy) {
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'amount_desc':
        return sorted.sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0));
      case 'amount_asc':
        return sorted.sort((a, b) => (a.total_amount || 0) - (b.total_amount || 0));
      case 'name':
        return sorted.sort((a, b) => (a.property_name || '').localeCompare(b.property_name || ''));
      default:
        return sorted;
    }
  }, [transactions, sortBy]);

  const refreshTransactions = useCallback(() => {
    loadTransactions(searchQuery, statusFilter);
  }, [loadTransactions, searchQuery, statusFilter]);

  const handleView = (transaction) => {
    onOpenViewTransaction(transaction);
  };

  const handleDeleteClick = (transaction) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const handleApproveClick = (transaction) => {
    setSelectedTransaction(transaction);
    setApproveDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTransaction) return;
    
    setActionLoading(true);
    try {
      const res = await http.delete(`/v1/admin/transactions/${selectedTransaction.id}`);
      
      if (res.success) {
        showNotification('success', 'Transaction deleted successfully');
        setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));
        setDeleteDialogOpen(false);
        setSelectedTransaction(null);
      } else {
        throw new Error(res.message || 'Failed to delete transaction');
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
      showNotification('error', `Failed to delete transaction: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveConfirm = async () => {
    if (!selectedTransaction) return;
    
    setActionLoading(true);
    try {
      const res = await http.put(`/v1/admin/transactions/${selectedTransaction.id}`, {
        status: 'approved'
      });
      
      if (res.success) {
        showNotification('success', 'Transaction approved successfully');
        setTransactions(prev => prev.map(t => 
          t.id === selectedTransaction.id 
            ? { ...t, status: 'approved' } 
            : t
        ));
        setApproveDialogOpen(false);
        setSelectedTransaction(null);
      } else {
        throw new Error(res.message || 'Failed to approve transaction');
      }
    } catch (err) {
      console.error('Error approving transaction:', err);
      showNotification('error', `Failed to approve transaction: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedTransaction(null);
  };

  const handleApproveCancel = () => {
    setApproveDialogOpen(false);
    setSelectedTransaction(null);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
    setSortBy('date_desc');
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    return new Date(isoDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleCreate = () => {
    onOpenCreateTransaction(refreshTransactions);
  };

  const formatAmount = (amount) => {
    if (!amount) return '0';
    return `${Number(amount).toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPropertyIcon = (type) => {
    switch(type) {
      case 'commercial':
        return <StoreIcon />;
      case 'residential':
        return <HomeIcon />;
      default:
        return <ApartmentIcon />;
    }
  };

  // Статистика
  const stats = {
    total: transactions.length,
    approved: transactions.filter(t => t.status === 'approved').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    totalAmount: transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
  };

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0) + (dateFilter !== 'all' ? 1 : 0);

  // Mobile render
  const renderMobileCards = () => {
    const sorted = sortedTransactions();
    
    return (
      <Box sx={{ mt: 2 }}>
        {sorted.map((t) => (
          <MobileTransactionCard 
            key={t.id} 
            variant="outlined" 
            status={t.status}
            onClick={() => handleView(t)}
          >
            <MobileCardHeader>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), width: 32, height: 32 }}>
                  {getPropertyIcon(t.property_type)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {t.property_name || 'Unknown Property'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: #{t.id}
                  </Typography>
                </Box>
              </Box>
              <StatusChip
                label={t.status || 'Pending'}
                statuscolor={getStatusColor(t.status)}
                size="small"
              />
            </MobileCardHeader>
            
            <MobileCardContent>
              <InfoRow>
                <PersonIcon fontSize="small" color="action" />
                <InfoLabel>From:</InfoLabel>
                <InfoValue>{t.previous_owner_name || 'N/A'}</InfoValue>
              </InfoRow>
              
              <InfoRow>
                <PersonIcon fontSize="small" color="action" />
                <InfoLabel>To:</InfoLabel>
                <InfoValue fontWeight={600}>{t.new_owner_name || 'N/A'}</InfoValue>
              </InfoRow>
              
              <InfoRow>
                <MoneyIcon fontSize="small" color="action" />
                <InfoLabel>Amount:</InfoLabel>
                <InfoValue fontWeight={600} color="primary.main">
                  ₨{formatAmount(t.total_amount)}
                </InfoValue>
              </InfoRow>
              
              <InfoRow>
                <CalendarIcon fontSize="small" color="action" />
                <InfoLabel>Date:</InfoLabel>
                <InfoValue>{formatDate(t.created_at)}</InfoValue>
              </InfoRow>
              
              <Divider sx={{ my: 1.5 }} />
              
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-around' }}>
                <Tooltip title="View Details">
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(t);
                    }}
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(t);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                {t.status !== 'approved' && (
                  <Tooltip title="Approve">
                    <IconButton 
                      size="small" 
                      color="success"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApproveClick(t);
                      }}
                    >
                      <ApproveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </MobileCardContent>
          </MobileTransactionCard>
        ))}
      </Box>
    );
  };

  // Desktop render
  const renderDesktopTable = () => (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflowX: 'auto' }}>
      <Table size="medium">
        <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Property</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Previous Owner</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>New Owner</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedTransactions().map((t) => (
            <StyledTableRow 
              key={t.id} 
              status={t.status}
              onClick={() => handleView(t)}
            >
              <TableCell>
                <Typography fontWeight={500}>#{t.id}</Typography>
              </TableCell>
              
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getPropertyIcon(t.property_type)}
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {t.property_name || 'Unknown Property'}
                    </Typography>
                    {t.property_type && (
                      <Chip 
                        label={t.property_type} 
                        size="small" 
                        sx={{ mt: 0.5, height: 20 }}
                        color={t.property_type === 'commercial' ? 'primary' : 'secondary'}
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              </TableCell>
              
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {t.previous_owner_name || 'N/A'}
                  </Typography>
                </Box>
              </TableCell>
              
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight={500}>
                    {t.new_owner_name || 'N/A'}
                  </Typography>
                </Box>
              </TableCell>
              
              <TableCell>
                <AmountTypography variant="body2">
                  {formatAmount(t.total_amount)}
                </AmountTypography>
              </TableCell>
              
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {formatDate(t.created_at)}
                  </Typography>
                </Box>
              </TableCell>
              
              <TableCell>
                <StatusChip
                  label={t.status || 'Pending'}
                  statuscolor={getStatusColor(t.status)}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              
              <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(t);
                      }}
                      sx={{ color: 'primary.main' }}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Delete">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(t);
                      }}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  {t.status !== 'approved' && (
                    <Tooltip title="Approve">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveClick(t);
                        }}
                        sx={{ color: 'success.main' }}
                      >
                        <ApproveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <>
      <StyledPaper elevation={0}>
        <SectionHeader>
          <SectionTitle>
            <AssignmentIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: 'primary.main' }} />
            <Typography variant={isMobile ? "h5" : "h4"} component="h2" fontWeight={600}>
              Deals
            </Typography>
            <Chip 
              label={`${transactions.length} total`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </SectionTitle>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshTransactions}
              disabled={loading}
              size={isMobile ? "small" : "medium"}
              fullWidth={isMobile}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              sx={{ borderRadius: 2 }}
              size={isMobile ? "small" : "medium"}
              fullWidth={isMobile}
            >
              Add Deal
            </Button>
          </Box>
        </SectionHeader>

        {/* Stats Cards */}
        <StatsCard>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <StatsGrid container spacing={2}>
              <Grid item xs={6} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant={isMobile ? "h5" : "h4"} color="primary.main" fontWeight={600}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant={isMobile ? "h5" : "h4"} color="success.main" fontWeight={600}>
                    {stats.approved}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant={isMobile ? "h5" : "h4"} color="warning.main" fontWeight={600}>
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant={isMobile ? "h6" : "h5"} color="primary.main" fontWeight={600}>
                    ₨ {formatPKR(stats.totalAmount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Value
                  </Typography>
                </Box>
              </Grid>
            </StatsGrid>
          </CardContent>
        </StatsCard>

        {/* Filters - Desktop */}
        {!isMobile ? (
          <FilterCard variant="outlined">
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by property, owner, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: searchQuery && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchQuery('')}>
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="all">All Statuses</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Date</InputLabel>
                    <Select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      label="Date"
                    >
                      <MenuItem value="all">All Time</MenuItem>
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="week">This Week</MenuItem>
                      <MenuItem value="month">This Month</MenuItem>
                      <MenuItem value="year">This Year</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FilterActions>
                    <Button
                      variant={viewMode === 'table' ? 'contained' : 'outlined'}
                      onClick={() => setViewMode('table')}
                      startIcon={<TableRowsIcon />}
                      size={isMobile ? "small" : "medium"}
                    >
                      Table
                    </Button>
                    
                    <Button
                      variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                      onClick={() => setViewMode('cards')}
                      startIcon={<GridViewIcon />}
                      size={isMobile ? "small" : "medium"}
                    >
                      Cards
                    </Button>
                    
                    <Box sx={{ flex: 1 }} />
                    
                    {activeFiltersCount > 0 && (
                      <Tooltip title="Clear filters">
                        <IconButton onClick={handleClearFilters} color="primary" size="small">
                          <Badge badgeContent={activeFiltersCount} color="primary">
                            <FilterIcon />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                    )}
                  </FilterActions>
                </Grid>
              </Grid>
            </CardContent>
          </FilterCard>
        ) : (
          // Mobile Search Bar
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={() => setFilterDrawerOpen(true)}
                      color={activeFiltersCount > 0 ? 'primary' : 'default'}
                    >
                      <Badge badgeContent={activeFiltersCount} color="primary">
                        <FilterAltIcon />
                      </Badge>
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                    >
                      <SortIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        )}

        {loading ? (
          <SpinnerContainer>
            <CircularProgress size={24} />
            <Typography variant="body1" color="text.secondary">
              Loading Deals...
            </Typography>
          </SpinnerContainer>
        ) : transactions.length === 0 ? (
          <EmptyState>
            <AssignmentIcon />
            <Typography variant="h6">No Deals found</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {activeFiltersCount > 0 ? 'Try adjusting your filters' : 'Get started by creating your first transaction'}
            </Typography>
            {activeFiltersCount > 0 ? (
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
              >
                Create Transaction
              </Button>
            )}
          </EmptyState>
        ) : (
          isMobile ? renderMobileCards() : 
          (viewMode === 'table' ? renderDesktopTable() : (
            <CardsGrid container spacing={2}>
              {sortedTransactions().map((t) => (
                <Grid item xs={12} sm={6} md={4} key={t.id}>
                  <TransactionCard 
                    variant="outlined" 
                    status={t.status}
                    onClick={() => handleView(t)}
                  >
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                            {getPropertyIcon(t.property_type)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600} fontSize={{ xs: '0.8rem', sm: '0.875rem' }}>
                              #{t.id} - {t.property_name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(t.created_at)}
                            </Typography>
                          </Box>
                        </Box>
                        <StatusChip
                          label={t.status || 'Pending'}
                          statuscolor={getStatusColor(t.status)}
                          size="small"
                        />
                      </Box>

                      <Divider sx={{ my: 1.5 }} />

                      <Grid container spacing={1}>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              <strong>From:</strong> {t.previous_owner_name || 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              <strong>To:</strong> {t.new_owner_name || 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {/* <MoneyIcon fontSize="small" color="action" /> */}
                            <Typography variant="body2" fontWeight={600} color="primary.main">
                              ₨{formatAmount(t.total_amount)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleView(t); }}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteClick(t); }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {t.status !== 'approved' && (
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handleApproveClick(t); }}>
                              <ApproveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </CardContent>
                  </TransactionCard>
                </Grid>
              ))}
            </CardsGrid>
          ))
        )}
      </StyledPaper>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        onClear={handleClearFilters}
      />

      {/* Mobile Sort Menu */}
      <MobileSortMenu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
        onSort={setSortBy}
      />

      {/* Mobile FAB for adding transaction */}
      {isMobile && (
        <MobileFAB color="primary" onClick={handleCreate}>
          <AddIcon />
        </MobileFAB>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        transaction={selectedTransaction}
        loading={actionLoading}
      />

      {/* Approve Confirmation Dialog */}
      <ApproveConfirmationDialog
        open={approveDialogOpen}
        onClose={handleApproveCancel}
        onConfirm={handleApproveConfirm}
        transaction={selectedTransaction}
        loading={actionLoading}
      />
    </>
  );
};

export default TransactionsSection;