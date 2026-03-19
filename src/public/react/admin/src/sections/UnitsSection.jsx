// src/sections/UnitsSection.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
  Alert,
  alpha,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Grid,
  Divider,
  Avatar,
  Stack,
  Badge,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Store as StoreIcon,
  Person as PersonIcon,
  SquareFoot as SquareFootIcon,
  AttachMoney as MoneyIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNotification } from '../context/NotificationContext';
import { getAllUnits, deleteUnit } from '../api/unitsAPI.js';
import SearchBox from '../common/SearchBox';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2)
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
    alignItems: 'stretch'
  }
}));

const SectionTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
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

const FloorHeaderRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  '& td': {
    padding: theme.spacing(1.5, 2),
    borderBottom: `2px solid ${theme.palette.primary.main}`,
    '& h5': {
      margin: 0,
      fontSize: '1rem',
      fontWeight: 600,
      color: theme.palette.primary.main,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1)
    }
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    cursor: 'pointer'
  }
}));

const ActionsCell = styled(TableCell)(({ theme }) => ({
  '& .actions-container': {
    display: 'flex',
    gap: theme.spacing(1),
    justifyContent: 'flex-end',
    opacity: 0.7,
    transition: 'opacity 0.2s',
    '&:hover': {
      opacity: 1
    },
    [theme.breakpoints.down('sm')]: {
      justifyContent: 'flex-start'
    }
  }
}));

const StyledChip = styled(Chip)(({ theme, propertytype }) => ({
  fontWeight: 500,
  ...(propertytype === 'commercial' && {
    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
    color: theme.palette.secondary.main,
    borderColor: theme.palette.secondary.main
  }),
  ...(propertytype === 'residential' && {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
    borderColor: theme.palette.primary.main
  })
}));

const EmptyState = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(8),
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
  borderRadius: theme.spacing(2),
  border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
  '& svg': {
    fontSize: 64,
    color: alpha(theme.palette.primary.main, 0.3),
    marginBottom: theme.spacing(2)
  },
  '& h6': {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1)
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

// Mobile Card Components
const MobileUnitCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: 'all 0.2s',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)'
  }
}));

const MobileCardHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  backgroundColor: alpha(theme.palette.primary.main, 0.02)
}));

const MobileCardContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2)
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
  minWidth: 80
}));

const InfoValue = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: theme.palette.text.primary
}));

const FloorHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  marginBottom: theme.spacing(2),
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  borderRadius: theme.spacing(1),
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  '& h5': {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 600,
    color: theme.palette.primary.main,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1)
  }
}));

// Confirmation Dialog Component
const DeleteConfirmationDialog = ({ open, onClose, onConfirm, unitName, loading }) => {
  const theme = useTheme();
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: 400,
          width: '100%',
          margin: theme.spacing(2)
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        backgroundColor: alpha(theme.palette.error.main, 0.1),
        color: theme.palette.error.main,
        fontWeight: 600
      }}>
        <WarningIcon />
        Confirm Delete
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        <DialogContentText>
          Are you sure you want to delete <strong>"{unitName}"</strong>?
        </DialogContentText>
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          bgcolor: alpha(theme.palette.error.main, 0.05),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
        }}>
          <Typography variant="body2" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon fontSize="small" />
            This action cannot be undone. All data associated with this unit will be permanently removed.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 0, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          fullWidth
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          fullWidth
        >
          {loading ? 'Deleting...' : 'Delete Unit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const UnitsSection = ({ onOpenAddUnit, onEditUnit, onOpenViewUnit, reloadKey = 0 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showNotification } = useNotification();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState({});
  
  // Состояния для диалога подтверждения
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Загрузка объектов недвижимости
  const loadUnits = async (query = '') => {
    setLoading(true);
    try {
      const list = await getAllUnits();
      if (query) {
        const q = query.trim().toLowerCase();
        setUnits(list.filter(u => 
          (u.name || '').toLowerCase().includes(q) || 
          (u.id || '').toLowerCase().includes(q) || 
          (u.category || '').toLowerCase().includes(q) ||
          (u.type || '').toLowerCase().includes(q)
        ));
      } else {
        setUnits(list || []);
      }
    } catch (err) {
      console.error('[UNITS] Load error:', err);
      showNotification('error', err.message || 'Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits(searchQuery);
  }, [searchQuery, reloadKey]);

  const handleView = (unit) => {
    if (typeof onOpenViewUnit === 'function') {
      onOpenViewUnit(unit);
    } else {
      window.dispatchEvent(new CustomEvent('openUnitModal', { detail: { id: unit.id } }));
    }
  };

  const handleEdit = (unit) => {
    if (typeof onEditUnit === 'function') {
      onEditUnit(unit);
    } else {
      onOpenAddUnit?.();
    }
  };

  // Открытие диалога подтверждения удаления
  const handleDeleteClick = (unit) => {
    setUnitToDelete(unit);
    setDeleteDialogOpen(true);
  };

  // Подтверждение удаления
  const handleDeleteConfirm = async () => {
    if (!unitToDelete) return;
    
    setDeleting(true);
    try {
      await deleteUnit(unitToDelete.id);
      showNotification('success', `Unit "${unitToDelete.name}" deleted successfully`);
      loadUnits(searchQuery);
      setDeleteDialogOpen(false);
      setUnitToDelete(null);
    } catch (err) {
      console.error('[UNITS] Delete error:', err);
      showNotification('error', err.message || 'Failed to delete unit');
    } finally {
      setDeleting(false);
    }
  };

  // Закрытие диалога без удаления
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUnitToDelete(null);
  };

  // Получение иконки для типа недвижимости
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

  // Получение цвета для типа
  const getTypeColor = (type) => {
    switch(type) {
      case 'commercial':
        return 'secondary';
      case 'residential':
        return 'primary';
      default:
        return 'default';
    }
  };

  // Toggle card expansion
  const toggleCardExpansion = (unitId) => {
    setExpandedCards(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  // Группировка по этажам (category)
  const groupedUnits = units.reduce((acc, unit) => {
    let floor = unit.category || 'Other';
    if (!isNaN(floor)) floor = Number(floor);
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(unit);
    return acc;
  }, {});

  const sortedFloors = Object.keys(groupedUnits).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return Number(a) - Number(b);
  });

  // Mobile render
  const renderMobile = () => (
    <Box>
      {sortedFloors.map(floor => (
        <Box key={floor} sx={{ mb: 3 }}>
          <FloorHeader>
            <FilterIcon fontSize="small" />
            <Typography variant="h5" component="h5">
              {floor === 'Other' ? 'Other Units' : `Floor ${floor}`}
            </Typography>
            <Chip 
              label={`${groupedUnits[floor].length} units`}
              size="small"
              sx={{ ml: 1 }}
            />
          </FloorHeader>
          
          {groupedUnits[floor].map(unit => (
            <MobileUnitCard key={unit.id}>
              <MobileCardHeader>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    {getPropertyIcon(unit.type)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {unit.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: #{unit.id}
                    </Typography>
                  </Box>
                </Box>
                <IconButton 
                  size="small" 
                  onClick={() => toggleCardExpansion(unit.id)}
                >
                  {expandedCards[unit.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </MobileCardHeader>
              
              <Collapse in={expandedCards[unit.id]}>
                <MobileCardContent>
                  <InfoRow>
                    <CategoryIcon fontSize="small" color="action" />
                    <InfoLabel>Type:</InfoLabel>
                    <InfoValue>
                      <Chip
                        label={unit.type || '—'}
                        size="small"
                        color={getTypeColor(unit.type)}
                        variant="outlined"
                      />
                    </InfoValue>
                  </InfoRow>
                  
                  <InfoRow>
                    <SquareFootIcon fontSize="small" color="action" />
                    <InfoLabel>Area:</InfoLabel>
                    <InfoValue>{unit.area ? `${unit.area} sqft` : '—'}</InfoValue>
                  </InfoRow>
                  
                  <InfoRow>
                    <FilterIcon fontSize="small" color="action" />
                    <InfoLabel>Floor:</InfoLabel>
                    <InfoValue>
                      <Chip
                        label={unit.category || '—'}
                        size="small"
                        variant="outlined"
                      />
                    </InfoValue>
                  </InfoRow>
                  
                  <InfoRow>
                    <PersonIcon fontSize="small" color="action" />
                    <InfoLabel>Owner:</InfoLabel>
                    <InfoValue>{unit.owner?.name || '—'}</InfoValue>
                  </InfoRow>
                  
                  {unit.owner?.phone && (
                    <InfoRow>
                      <PhoneIcon fontSize="small" color="action" />
                      <InfoLabel>Phone:</InfoLabel>
                      <InfoValue>{unit.owner.phone}</InfoValue>
                    </InfoRow>
                  )}
                  
                  <InfoRow>
                    {/* <MoneyIcon fontSize="small" color="action" /> */}
                    <InfoLabel>Price:</InfoLabel>
                    <InfoValue fontWeight={600} color="primary.main">
                      {unit.price ? `PKR ${Number(unit.price).toLocaleString()}` : '—'}
                    </InfoValue>
                  </InfoRow>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-around' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="info"
                      startIcon={<ViewIcon />}
                      onClick={() => handleView(unit)}
                      fullWidth
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(unit)}
                      fullWidth
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteClick(unit)}
                      fullWidth
                    >
                      Delete
                    </Button>
                  </Box>
                </MobileCardContent>
              </Collapse>
            </MobileUnitCard>
          ))}
        </Box>
      ))}
    </Box>
  );

  // Desktop render
  const renderDesktop = () => (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflowX: 'auto' }}>
      <Table>
        <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Unit Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Area</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Floor</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Owner</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Price (PKR)</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedFloors.map(floor => (
            <React.Fragment key={floor}>
              <FloorHeaderRow>
                <TableCell colSpan={7}>
                  <Typography variant="h5" component="h5">
                    <FilterIcon fontSize="small" />
                    {floor === 'Other' ? 'Other Units' : `Floor ${floor}`}
                    <Chip 
                      label={`${groupedUnits[floor].length} units`}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </TableCell>
              </FloorHeaderRow>
              
              {groupedUnits[floor].map(unit => (
                <StyledTableRow 
                  key={unit.id}
                  onClick={() => handleView(unit)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getPropertyIcon(unit.type)}
                      <Typography fontWeight={500}>
                        {unit.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SquareFootIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {unit.area ? `${unit.area} sqft` : '—'}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <StyledChip
                      label={unit.type || '—'}
                      size="small"
                      propertytype={unit.type}
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={unit.category || '—'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {unit.owner?.name || '—'}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {/* <MoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} /> */}
                      <Typography variant="body2" fontWeight={500}>
                        {unit.price ? Number(unit.price).toLocaleString() : '—'}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <ActionsCell align="right">
                    <Box className="actions-container">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(unit);
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(unit);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(unit);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ActionsCell>
                </StyledTableRow>
              ))}
            </React.Fragment>
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
            <HomeIcon sx={{ fontSize: { xs: 28, sm: 32 }, color: 'primary.main' }} />
            <Typography variant="h4" component="h2" fontWeight={600} sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
              Property Units
            </Typography>
            <Chip 
              label={`${units.length} units`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </SectionTitle>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onOpenAddUnit}
            sx={{ borderRadius: 2 }}
            fullWidth={isMobile}
          >
            Add Unit
          </Button>
        </SectionHeader>

        <Box sx={{ mb: 3 }}>
          <SearchBox 
            onSearch={setSearchQuery} 
            placeholder="Search by name, ID, floor or type..." 
          />
        </Box>

        {loading ? (
          <SpinnerContainer>
            <CircularProgress size={24} />
            <Typography variant="body1" color="text.secondary">
              Loading units...
            </Typography>
          </SpinnerContainer>
        ) : units.length === 0 ? (
          <EmptyState>
            <HomeIcon />
            <Typography variant="h6">No units found</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first property unit'}
            </Typography>
            {!searchQuery && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onOpenAddUnit}
              >
                Add First Unit
              </Button>
            )}
          </EmptyState>
        ) : (
          isMobile ? renderMobile() : renderDesktop()
        )}
      </StyledPaper>

      {/* Диалог подтверждения удаления */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        unitName={unitToDelete?.name}
        loading={deleting}
      />
    </>
  );
};

export default UnitsSection;