// src/components/modals/TransactionModal.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Grid,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  Badge,
  DialogContentText,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Menu,
  MenuItem,
  LinearProgress,
  Collapse,
  Alert,
  FormControl,
  InputLabel,
  Select,
  RadioGroup,
  FormControlLabel,
  Radio,
  useMediaQuery,
  useTheme,
  Snackbar
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  AttachFile as FileIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
  AccountBalanceWallet as WalletIcon,
  MonetizationOn as MoneyIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
  Approval as ApprovalIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  ViewModule as GridIcon,
  ViewList as ListIcon,
  DateRange as DateIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Description as DocIcon,
  Receipt as ReceiptIcon,
  AccessTime as TimeIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  PriceChange as PriceChangeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useApi } from '../context/ApiContext';
import { useNotification } from '../context/NotificationContext';
import { formatPKR } from '../utils/formatNumber';
import { getExchangeRate } from '../utils/currency';
import transactionsAPI from '../api/transactionsAPI';
import paymentsAPI from '../api/paymentsAPI';
import filesAPI from '../api/filesAPI';
import unitsAPI from '../api/unitsAPI';
import StatusChip from '../common/StatusChip';
import ProgressBarWithLabel from '../common/ProgressBarWithLabel';
import EditPaymentModal from './EditPaymentModal';
import AddPaymentModal from './AddPaymentModal';
import WitnessForm from '../common/WitnessForm';

// Styled components
const PaymentTableRow = styled(TableRow)(({ theme, status }) => ({
  ...(status === 'completed' && {
    backgroundColor: theme.palette.success.light + '15',
    '&:hover': {
      backgroundColor: theme.palette.success.light + '25',
    },
  }),
  ...(status === 'pending' && {
    backgroundColor: theme.palette.warning.light + '15',
    '&:hover': {
      backgroundColor: theme.palette.warning.light + '25',
    },
  }),
}));

const ThumbnailContainer = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
  [theme.breakpoints.down('sm')]: {
    width: 30,
    height: 30,
  },
}));

const ThumbnailImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

const FileCard = styled(Card)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'visible',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
    '& .file-actions': {
      opacity: 1,
      transform: 'translateY(0)',
    }
  },
  [theme.breakpoints.down('sm')]: {
    '&:hover': {
      transform: 'none',
    },
  },
}));

const FileThumbnailContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 160,
  position: 'relative',
  backgroundColor: theme.palette.grey[100],
  borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('sm')]: {
    height: 120,
  },
}));

const FileThumbnailImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
});

const FileIconLarge = styled(Box)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  [theme.breakpoints.down('sm')]: {
    fontSize: 48,
  },
}));

const CategoryChip = styled(Chip)(({ theme, categorycolor }) => ({
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 1,
  fontWeight: 500,
  backdropFilter: 'blur(4px)',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  boxShadow: theme.shadows[2],
  ...(categorycolor === 'primary' && {
    borderLeft: `3px solid ${theme.palette.primary.main}`,
  }),
  ...(categorycolor === 'secondary' && {
    borderLeft: `3px solid ${theme.palette.secondary.main}`,
  }),
  ...(categorycolor === 'success' && {
    borderLeft: `3px solid ${theme.palette.success.main}`,
  }),
  ...(categorycolor === 'info' && {
    borderLeft: `3px solid ${theme.palette.info.main}`,
  }),
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.625rem',
    height: 20,
  },
}));

const FileActions = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 8,
  right: 8,
  display: 'flex',
  gap: 4,
  opacity: 0,
  transform: 'translateY(10px)',
  transition: 'all 0.2s ease-in-out',
  zIndex: 2,
  [theme.breakpoints.down('sm')]: {
    opacity: 1,
    transform: 'none',
    '& .MuiIconButton-root': {
      padding: 4,
    },
  },
}));

const FileInfo = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
  },
}));

const FilterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}));

const SearchField = styled(TextField)({
  flex: 1,
  minWidth: 200,
  '& .MuiOutlinedInput-root': {
    borderRadius: 20,
  },
});

const MobileActionStack = styled(Stack)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    width: '100%',
    '& .MuiButton-root': {
      width: '100%',
      marginLeft: 0,
      marginRight: 0,
    },
  },
}));

const ResponsiveGrid = styled(Grid)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    '& .MuiGrid-item': {
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },
  },
}));

// Helper functions
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return 'Unknown size';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

const getFileIcon = (fileName, size = 'medium') => {
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';
  const iconSize = size === 'large' ? 64 : 40;
  
  const iconMap = {
    pdf: <PdfIcon sx={{ fontSize: iconSize, color: '#f44336' }} />,
    jpg: <ImageIcon sx={{ fontSize: iconSize, color: '#2196f3' }} />,
    jpeg: <ImageIcon sx={{ fontSize: iconSize, color: '#2196f3' }} />,
    png: <ImageIcon sx={{ fontSize: iconSize, color: '#4caf50' }} />,
    gif: <ImageIcon sx={{ fontSize: iconSize, color: '#ff9800' }} />,
    webp: <ImageIcon sx={{ fontSize: iconSize, color: '#9c27b0' }} />,
    bmp: <ImageIcon sx={{ fontSize: iconSize, color: '#607d8b' }} />,
    svg: <ImageIcon sx={{ fontSize: iconSize, color: '#ff5722' }} />,
    mp4: <VideoIcon sx={{ fontSize: iconSize, color: '#e91e63' }} />,
    avi: <VideoIcon sx={{ fontSize: iconSize, color: '#e91e63' }} />,
    mov: <VideoIcon sx={{ fontSize: iconSize, color: '#e91e63' }} />,
    mkv: <VideoIcon sx={{ fontSize: iconSize, color: '#e91e63' }} />,
    wmv: <VideoIcon sx={{ fontSize: iconSize, color: '#e91e63' }} />,
    doc: <DocIcon sx={{ fontSize: iconSize, color: '#2196f3' }} />,
    docx: <DocIcon sx={{ fontSize: iconSize, color: '#2196f3' }} />,
    xls: <DocIcon sx={{ fontSize: iconSize, color: '#4caf50' }} />,
    xlsx: <DocIcon sx={{ fontSize: iconSize, color: '#4caf50' }} />,
    ppt: <DocIcon sx={{ fontSize: iconSize, color: '#ff9800' }} />,
    pptx: <DocIcon sx={{ fontSize: iconSize, color: '#ff9800' }} />,
    txt: <DocIcon sx={{ fontSize: iconSize, color: '#9e9e9e' }} />,
  };
  
  return iconMap[ext] || <FileIcon sx={{ fontSize: iconSize, color: '#757575' }} />;
};

const getFileCategoryColor = (category) => {
  const colors = {
    agreement: 'primary',
    video: 'secondary',
    proof_documents: 'success',
    receipt: 'info',
    other: 'default',
  };
  return colors[category] || 'default';
};

const getFileCategoryLabel = (category) => {
  const labels = {
    agreement: 'Agreement',
    video: 'Video',
    proof_documents: 'Documents',
    receipt: 'Receipt',
    other: 'Other',
  };
  return labels[category] || category;
};

// Price Calculator Component
const PriceCalculator = ({ 
  pricePKR, 
  area, 
  onPriceChange,
  disabled = false,
  exchangeRate = 0.00357,
  showValidationError = false
}) => {
  const [pricePerSqft, setPricePerSqft] = useState('');
  const [priceUSD, setPriceUSD] = useState('');
  const inputRef = useRef(null);

  // Форматирование числа с разделителями разрядов
  const formatCurrency = (value) => {
    if (!value || value === '') return '';
    
    // Убираем все кроме цифр и точки
    const cleanValue = value.toString().replace(/[^\d.]/g, '');
    
    // Разделяем целую и дробную части
    const [integerPart, decimalPart] = cleanValue.split('.');
    
    // Добавляем запятые каждые 3 цифры в целой части
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Возвращаем с дробной частью, если она есть (максимум 2 знака)
    if (decimalPart !== undefined) {
      return `${formattedInteger}.${decimalPart.slice(0, 2)}`;
    }
    return formattedInteger;
  };

  // Очистка от форматирования для вычислений
  const unformatCurrency = (value) => {
    return value.replace(/,/g, '');
  };

 useEffect(() => {
  if (area && pricePKR) {
    const perSqft = (Number(pricePKR) / Number(area)).toFixed(2);
    setPricePerSqft(perSqft);
    
    const usd = (Number(pricePKR) * exchangeRate).toFixed(2);
    setPriceUSD(usd);
  } else {
    setPricePerSqft('');
    setPriceUSD('');
  }
}, [pricePKR, area, exchangeRate]);

  const handlePricePerSqftChange = (e) => {
    const input = e.target;
    const rawValue = input.value;
    const cursorPosition = input.selectionStart;
    
    // Убираем всё кроме цифр и точки
    let cleaned = rawValue.replace(/[^\d.]/g, '');
    
    // Предотвращаем множественные точки
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1) {
      cleaned = cleaned.replace(/\.+$/, '');
    }
    
    // Ограничиваем дробную часть 2 знаками
    if (cleaned.includes('.')) {
      const [integer, decimal] = cleaned.split('.');
      cleaned = `${integer}.${(decimal || '').slice(0, 2)}`;
    }
    
    // Сохраняем неформатированное значение для вычислений
    setPricePerSqft(cleaned);
    
    // Вычисляем новую цену
    if (area && cleaned) {
      const newPrice = (Number(cleaned) * Number(area)).toFixed(2);
      if (!isNaN(newPrice)) {
        onPriceChange(newPrice);
      }
    }
    
    // Восстанавливаем позицию курсора после рендера
    setTimeout(() => {
      if (inputRef.current) {
        const newPosition = Math.min(cursorPosition, inputRef.current.value.length);
        inputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  return (
    <Card variant="outlined" sx={{ mb: 3, borderColor: showValidationError ? 'error.main' : 'divider' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PriceChangeIcon color="primary" /> Price Calculator
          </Typography>
          {showValidationError && (
            <Chip 
              label="Price required" 
              color="error" 
              size="small"
              icon={<WarningIcon />}
            />
          )}
        </Box>
        
        {showValidationError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            The unit doesn't have a price set. Please specify the transaction price.
          </Alert>
        )}
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Price per sqft (PKR)"
              value={pricePerSqft ? formatCurrency(pricePerSqft) : ''}
              onChange={handlePricePerSqftChange}
              disabled={!area || disabled}
              placeholder={area ? "Enter price per sqft" : "Area not available"}
              error={showValidationError && !pricePerSqft}
              helperText={showValidationError && !pricePerSqft ? "Required field" : ""}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₨</Typography>,
              }}
              size="small"
              inputRef={inputRef}
              inputMode="decimal"
            />
            {area && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Area: {formatCurrency(area)} sqft
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Price in USD"
              value={priceUSD ? formatCurrency(priceUSD) : ''}
              disabled={true}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
              size="small"
              sx={{
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: theme => theme.palette.text.primary,
                  backgroundColor: theme => theme.palette.action.hover,
                  borderRadius: 1,
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
  Exchange rate: $1 = ₨{formatCurrency(1 / exchangeRate)}
</Typography>
          </Grid>
          {pricePKR && (
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                flexWrap: 'wrap',
                mt: 1,
                p: { xs: 1, sm: 2 },
                bgcolor: 'grey.50',
                borderRadius: 1
              }}>
                <Chip 
                  label={`Total: ₨${formatCurrency(Number(pricePKR).toFixed(2))}`} 
                  color="primary" 
                  variant="outlined"
                  size="small"
                />
                <Chip 
                  label={`USD: $${formatCurrency(priceUSD)}`}
                  color="success"
                  variant="outlined"
                  size="small"
                />
                {area && pricePerSqft && (
                  <Chip 
                    label={`Per sqft: ₨${formatCurrency(pricePerSqft)}`}
                    color="info"
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

// File Preview Component
const FilePreviewComponent = ({ file, expandedFileId, onExpand, onUpload }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const isExpanded = expandedFileId === file.path;
  
  const fileCategory = getFileCategoryLabel(file.category);
  const categoryColor = getFileCategoryColor(file.category);
  const fileUrl = filesAPI.getFileUrl(file.path);
  const thumbnailUrl = filesAPI.getThumbnailUrl(file.path);
  const isImage = thumbnailUrl !== null && !imageError;
  const fileName = file.name || file.filename || 'Unknown file';
  const fileSize = formatFileSize(file.size);
  const uploadedDate = formatDate(file.created_at);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = () => {
    switch (file.category) {
      case 'agreement': return <DocIcon />;
      case 'video': return <VideoIcon />;
      case 'proof_documents': return <DocIcon />;
      case 'receipt': return <ReceiptIcon />;
      default: return <FileIcon />;
    }
  };

  return (
    <FileCard variant="outlined">
      <Box sx={{ position: 'relative' }}>
        <CategoryChip
          label={fileCategory}
          size="small"
          categorycolor={categoryColor}
          icon={getCategoryIcon()}
        />
        
        <FileThumbnailContainer>
          {isImage ? (
            <FileThumbnailImage
              src={thumbnailUrl}
              alt={fileName}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <FileIconLarge>
              {getFileIcon(fileName, 'large')}
            </FileIconLarge>
          )}
          
          <FileActions className="file-actions">
            <Tooltip title="View">
              <IconButton
                size="small"
                href={fileUrl}
                target="_blank"
                sx={{ 
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  '&:hover': { bgcolor: 'background.paper' }
                }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton
                size="small"
                onClick={handleDownload}
                disabled={loading}
                sx={{ 
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  '&:hover': { bgcolor: 'background.paper' }
                }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </FileActions>
        </FileThumbnailContainer>
      </Box>

      <FileInfo>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              fontWeight={500}
              noWrap
              title={fileName}
              sx={{ mb: 0.5 }}
            >
              {fileName}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {fileSize}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {uploadedDate}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <IconButton 
            size="small"
            onClick={() => onExpand(file.path)}
            sx={{ ml: 1 }}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={isExpanded}>
          <Divider sx={{ my: 1.5 }} />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Type:
              </Typography>
              <Typography variant="caption" fontWeight={500}>
                {file.type || 'Unknown'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Size:
              </Typography>
              <Typography variant="caption" fontWeight={500}>
                {fileSize}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Uploaded:
              </Typography>
              <Typography variant="caption" fontWeight={500}>
                {new Date(file.created_at).toLocaleString()}
              </Typography>
            </Box>
            
            {file.category === 'receipt' && onUpload && (
              <Box sx={{ mt: 1 }}>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => onUpload('receipt')}
                >
                  Upload New Receipt
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>
      </FileInfo>

      {loading && (
        <LinearProgress sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      )}
    </FileCard>
  );
};

const TransactionModal = ({ isOpen, onClose, transactionId, initialTransaction = null, onOpenUploadFile, onUpdated }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showNotification } = useNotification();
  const { http } = useApi();
  
  // Состояния
  const [transaction, setTransaction] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [usdTotal, setUsdTotal] = useState('');
  const [witnesses, setWitnesses] = useState({
    witness1: { name: '', cnic: '', phone: '' },
    witness2: { name: '', cnic: '', phone: '' },
  });
  const [loading, setLoading] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState(null);
  const [pricePerSqft, setPricePerSqft] = useState({ pkr: 0, usd: 0 });
  const [expandedSection, setExpandedSection] = useState(['payments', 'files']);
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [loadingPaymentEdit, setLoadingPaymentEdit] = useState(false);
  
  // Состояния для редактирования транзакции
  const [isEditingTransaction, setIsEditingTransaction] = useState(false);
  const [editFormData, setEditFormData] = useState({
    total_amount: '',
    payment_type: 'full',
    full_payment_deadline: '',
    schedule_payment_day: '1',
    schedule_type: 'equal_schedules',
    interest_rate: '0',
    initial_payment: '',
    admin_notes: '',
    status: ''
  });
  const [schedule, setSchedule] = useState([]);
  const [schedulesCount, setSchedulesCount] = useState(12);
  const [exchangeRate, setExchangeRate] = useState(0.00357);
  const [updatingTransaction, setUpdatingTransaction] = useState(false);
  const [priceValidationDialog, setPriceValidationDialog] = useState(false);
  const [selectedUnitHasPrice, setSelectedUnitHasPrice] = useState(true);
  const [unitArea, setUnitArea] = useState(null);
  
  // Состояния для диалогов подтверждения
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Состояния для фильтрации файлов
  const [fileFilter, setFileFilter] = useState({ 
    categories: ['agreement', 'video', 'proof_documents', 'other'],
    types: [], 
    search: '' 
  });
  const [fileViewMode, setFileViewMode] = useState('grid');
  const [fileSortBy, setFileSortBy] = useState('date');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [expandedFileId, setExpandedFileId] = useState(null);

  // Получение курса валют
  useEffect(() => {
    const loadExchangeRate = async () => {
      try {
        const rate = await getExchangeRate();
        setExchangeRate(rate);
      } catch (error) {
        console.warn('Failed to load exchange rate:', error);
      }
    };
    loadExchangeRate();
  }, []);

  // Мемоизированные функции фильтрации и сортировки
  const filterFiles = useCallback((files, filter) => {
    if (!files || files.length === 0) return [];
    
    return files.filter(file => {
      if (filter.categories.length > 0 && !filter.categories.includes(file.category)) {
        return false;
      }
      
      if (filter.types.length > 0) {
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.path);
        const isPdf = /\.pdf$/i.test(file.path);
        const isVideo = /\.(mp4|avi|mov|mkv)$/i.test(file.path);
        const isDocument = /\.(doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(file.path);
        
        const typeMatch = 
          (filter.types.includes('image') && isImage) ||
          (filter.types.includes('pdf') && isPdf) ||
          (filter.types.includes('video') && isVideo) ||
          (filter.types.includes('document') && isDocument);
        
        if (filter.types.length > 0 && !typeMatch) return false;
      }
      
      if (filter.search) {
        const fileName = (file.name || file.filename || '').toLowerCase();
        if (!fileName.includes(filter.search.toLowerCase())) return false;
      }
      
      return true;
    });
  }, []);

  const sortFiles = useCallback((files, sortBy) => {
    if (!files || files.length === 0) return [];
    
    const sorted = [...files];
    
    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'date_asc':
        sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'name':
        sorted.sort((a, b) => {
          const nameA = (a.name || a.filename || '').toLowerCase();
          const nameB = (b.name || b.filename || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
      case 'name_desc':
        sorted.sort((a, b) => {
          const nameA = (a.name || a.filename || '').toLowerCase();
          const nameB = (b.name || b.filename || '').toLowerCase();
          return nameB.localeCompare(nameA);
        });
        break;
      case 'size':
        sorted.sort((a, b) => (b.size || 0) - (a.size || 0));
        break;
      case 'size_asc':
        sorted.sort((a, b) => (a.size || 0) - (b.size || 0));
        break;
      default:
        break;
    }
    
    return sorted;
  }, []);

  // Получаем список файлов с мемоизацией
  const files = useMemo(() => {
    if (!transaction?.files) return [];
    const fileList = [];
    
    if (Array.isArray(transaction.files)) {
      return transaction.files;
    } else if (typeof transaction.files === 'object') {
      Object.entries(transaction.files).forEach(([category, fileData]) => {
        if (Array.isArray(fileData)) {
          fileData.forEach(file => {
            fileList.push({
              ...file,
              category: category
            });
          });
        } else if (fileData && typeof fileData === 'object') {
          fileList.push({
            ...fileData,
            category: category
          });
        }
      });
    }
    
    return fileList;
  }, [transaction?.files]);

  // Мемоизируем отфильтрованные и отсортированные файлы
  const filteredAndSortedFiles = useMemo(() => {
    return sortFiles(filterFiles(files, fileFilter), fileSortBy);
  }, [files, fileFilter, fileSortBy, filterFiles, sortFiles]);

  // Генерация графика платежей
  const generateSchedule = useCallback((data) => {
    const total = Number(data.total_amount) || 0;
    const initial = Number(data.initial_payment) || 0;
    const principal = Math.max(0, total - initial);
    const months = schedulesCount;
    const monthlyRate = (Number(data.interest_rate) || 0) / 12 / 100;
    const dayOfMonth = Number(data.schedule_payment_day) || 1;
    
    if (principal <= 0 || months <= 0) {
      setSchedule([]);
      return;
    }

    let rows = [];
    let balance = principal;
    const today = new Date();

    if (data.schedule_type === 'equal_schedules') {
      let monthlyPayment = 0;
      if (monthlyRate === 0) {
        monthlyPayment = principal / months;
      } else {
        const r = monthlyRate;
        monthlyPayment = principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
      }

      for (let i = 1; i <= months; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, Math.min(dayOfMonth, 28));
        const interest = Number((balance * monthlyRate).toFixed(2));
        let principalPayment = Number((monthlyPayment - interest).toFixed(2));
        if (i === months) {
          principalPayment = Number(balance.toFixed(2));
        }
        const paymentAmount = Number((principalPayment + interest).toFixed(2));
        balance = Number((balance - principalPayment).toFixed(2));
        rows.push({
          schedule: i,
          due_date: date.toISOString().split('T')[0],
          amount: paymentAmount,
          principal: principalPayment,
          interest,
          balance
        });
      }
    } else if (data.schedule_type === 'decreasing_fixed') {
      const fixedPrincipal = Number((principal / months).toFixed(2));
      for (let i = 1; i <= months; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, Math.min(dayOfMonth, 28));
        const interest = Number((balance * monthlyRate).toFixed(2));
        let principalPayment = fixedPrincipal;
        if (i === months) principalPayment = Number(balance.toFixed(2));
        const paymentAmount = Number((principalPayment + interest).toFixed(2));
        balance = Number((balance - principalPayment).toFixed(2));
        rows.push({
          schedule: i,
          due_date: date.toISOString().split('T')[0],
          amount: paymentAmount,
          principal: principalPayment,
          interest,
          balance
        });
      }
    } else if (data.schedule_type === 'increasing_fixed') {
      const basePayment = Number((principal * 0.8 / months).toFixed(2));
      for (let i = 1; i <= months; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, Math.min(dayOfMonth, 28));
        const interest = Number((balance * monthlyRate).toFixed(2));
        let principalPayment = Number((basePayment * (1 + i * 0.02)).toFixed(2));
        if (i === months) principalPayment = Number(balance.toFixed(2));
        const paymentAmount = Number((principalPayment + interest).toFixed(2));
        balance = Number((balance - principalPayment).toFixed(2));
        rows.push({
          schedule: i,
          due_date: date.toISOString().split('T')[0],
          amount: paymentAmount,
          principal: principalPayment,
          interest,
          balance
        });
      }
    }

    setSchedule(rows);
  }, [schedulesCount]);

  // Загрузка транзакции
  const loadTransaction = useCallback(async () => {
    if (!transactionId) return;
    setLoading(true);
    try {
      const t = await transactionsAPI.getTransactionById(transactionId);
      setTransaction(t);
      setAdminNotes(t.admin_notes || '');
      
      // ИСПРАВЛЕНО: Проверяем все возможные источники данных свидетелей
      // 1. Сначала проверяем поле witnesses (из таблицы transaction_witnesses)
      // 2. Если нет, проверяем прямые поля witness1_name, witness1_cnic, witness1_phone и т.д.
      
      const witnessData = {
        witness1: { name: '', cnic: '', phone: '' },
        witness2: { name: '', cnic: '', phone: '' }
      };
      
      // Пытаемся получить данные из поля witnesses (если есть)
      if (t.witnesses) {
        if (t.witnesses.witness1) {
          witnessData.witness1 = {
            name: t.witnesses.witness1.name || '',
            cnic: t.witnesses.witness1.cnic || '',
            phone: t.witnesses.witness1.phone || ''
          };
        }
        if (t.witnesses.witness2) {
          witnessData.witness2 = {
            name: t.witnesses.witness2.name || '',
            cnic: t.witnesses.witness2.cnic || '',
            phone: t.witnesses.witness2.phone || ''
          };
        }
      }
      
      // Если в witnesses нет данных, проверяем прямые поля из таблицы transactions
      if ((!witnessData.witness1.name || !witnessData.witness1.cnic) && t.witness1_name) {
        witnessData.witness1 = {
          name: t.witness1_name || '',
          cnic: t.witness1_cnic || '',
          phone: t.witness1_phone || ''
        };
      }
      
      if ((!witnessData.witness2.name || !witnessData.witness2.cnic) && t.witness2_name) {
        witnessData.witness2 = {
          name: t.witness2_name || '',
          cnic: t.witness2_cnic || '',
          phone: t.witness2_phone || ''
        };
      }
      
      setWitnesses(witnessData);

      // Загружаем информацию о юните
      if (t.property_id) {
        try {
          const units = await unitsAPI.getAllUnits({ search: t.property_id });
          const unit = units.find(u => u.id === t.property_id || u.unique_id === t.property_id);
          if (unit && unit.area) {
            setUnitArea(unit.area);
          }
        } catch (err) {
          console.warn('Failed to load unit info:', err);
        }
      }

      try {
        const rate = await getExchangeRate();
        setUsdTotal((t.total_amount * rate).toFixed(2));
        
        if (t.property_area && t.total_amount) {
          const sqftPricePKR = t.total_amount / t.property_area;
          const sqftPriceUSD = sqftPricePKR * rate;
          setPricePerSqft({
            pkr: sqftPricePKR,
            usd: sqftPriceUSD
          });
        }
      } catch (rateError) {
        console.warn('Failed to get exchange rate:', rateError);
        setUsdTotal('N/A');
      }
      
      // Инициализируем форму редактирования
      setEditFormData({
        total_amount: t.total_amount || '',
        payment_type: t.payment_type || 'full',
        full_payment_deadline: t.full_payment_deadline || '',
        schedule_payment_day: t.schedule_payment_day || '1',
        schedule_type: t.schedule_type || 'equal_schedules',
        interest_rate: t.interest_rate || '0',
        initial_payment: t.initial_payment || '',
        admin_notes: t.admin_notes || '',
        status: t.status || 'pending'
      });
      
      if (t.payment_type === 'schedule' && t.total_amount) {
        setTimeout(() => generateSchedule({
          total_amount: t.total_amount,
          initial_payment: t.initial_payment,
          interest_rate: t.interest_rate,
          schedule_type: t.schedule_type,
          schedule_payment_day: t.schedule_payment_day
        }), 100);
      }
    } catch (err) {
      console.error('[TRANSACTION MODAL] Load error:', err);
      showNotification('error', err.message || 'Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  }, [transactionId, showNotification, generateSchedule]);

  useEffect(() => {
    if (isOpen && transactionId) {
      if (initialTransaction) {
        setTransaction(initialTransaction);
        setAdminNotes(initialTransaction.admin_notes || '');
        
        // ИСПРАВЛЕНО: Аналогичная проверка для initialTransaction
        const witnessData = {
          witness1: { name: '', cnic: '', phone: '' },
          witness2: { name: '', cnic: '', phone: '' }
        };
        
        if (initialTransaction.witnesses) {
          if (initialTransaction.witnesses.witness1) {
            witnessData.witness1 = {
              name: initialTransaction.witnesses.witness1.name || '',
              cnic: initialTransaction.witnesses.witness1.cnic || '',
              phone: initialTransaction.witnesses.witness1.phone || ''
            };
          }
          if (initialTransaction.witnesses.witness2) {
            witnessData.witness2 = {
              name: initialTransaction.witnesses.witness2.name || '',
              cnic: initialTransaction.witnesses.witness2.cnic || '',
              phone: initialTransaction.witnesses.witness2.phone || ''
            };
          }
        }
        
        if ((!witnessData.witness1.name || !witnessData.witness1.cnic) && initialTransaction.witness1_name) {
          witnessData.witness1 = {
            name: initialTransaction.witness1_name || '',
            cnic: initialTransaction.witness1_cnic || '',
            phone: initialTransaction.witness1_phone || ''
          };
        }
        
        if ((!witnessData.witness2.name || !witnessData.witness2.cnic) && initialTransaction.witness2_name) {
          witnessData.witness2 = {
            name: initialTransaction.witness2_name || '',
            cnic: initialTransaction.witness2_cnic || '',
            phone: initialTransaction.witness2_phone || ''
          };
        }
        
        setWitnesses(witnessData);
        
        (async () => {
          try {
            const rate = await getExchangeRate();
            setUsdTotal((initialTransaction.total_amount * rate).toFixed(2));
            if (initialTransaction.property_area && initialTransaction.total_amount) {
              const sqftPricePKR = initialTransaction.total_amount / initialTransaction.property_area;
              const sqftPriceUSD = sqftPricePKR * rate;
              setPricePerSqft({ pkr: sqftPricePKR, usd: sqftPriceUSD });
            }
          } catch (rateError) {
            setUsdTotal('N/A');
          }
        })();
        
        setEditFormData({
          total_amount: initialTransaction.total_amount || '',
          payment_type: initialTransaction.payment_type || 'full',
          full_payment_deadline: initialTransaction.full_payment_deadline || '',
          schedule_payment_day: initialTransaction.schedule_payment_day || '1',
          schedule_type: initialTransaction.schedule_type || 'equal_schedules',
          interest_rate: initialTransaction.interest_rate || '0',
          initial_payment: initialTransaction.initial_payment || '',
          admin_notes: initialTransaction.admin_notes || '',
          status: initialTransaction.status || 'pending'
        });
      }
      loadTransaction();
    } else {
      // Сброс состояния при закрытии
      setTransaction(null);
      setPricePerSqft({ pkr: 0, usd: 0 });
      setUsdTotal('');
      setIsEditingNotes(false);
      setIsEditingTransaction(false);
      setEditPaymentId(null);
      setAddPaymentModalOpen(false);
      setLoadingPaymentEdit(false);
      setDeleteDialogOpen(false);
      setApproveDialogOpen(false);
      setSelectedPayment(null);
      setWitnesses({
        witness1: { name: '', cnic: '', phone: '' },
        witness2: { name: '', cnic: '', phone: '' },
      });
      setFileFilter({ 
        categories: ['agreement', 'video', 'proof_documents', 'other'], 
        types: [], 
        search: '' 
      });
      setFileViewMode('grid');
      setFileSortBy('date');
      setSchedule([]);
      setUnitArea(null);
    }
  }, [isOpen, transactionId, initialTransaction, loadTransaction]);

  // Мемоизированные обработчики
  const handleSaveNotes = useCallback(async () => {
    try {
      await transactionsAPI.updateTransaction(transactionId, { admin_notes: adminNotes });
      setIsEditingNotes(false);
      showNotification('success', 'Notes saved successfully');
    } catch (err) {
      showNotification('error', err.message || 'Failed to save notes');
    }
  }, [transactionId, adminNotes, showNotification]);

  const handleWitnessChange = useCallback((prefix, field, value) => {
    setWitnesses((prev) => ({
      ...prev,
      [prefix]: { ...prev[prefix], [field]: value },
    }));
  }, []);

  const handleSaveWitnesses = useCallback(async () => {
    try {
      await transactionsAPI.updateTransaction(transactionId, {
        witnesses: witnesses,
      });
      showNotification('success', 'Witnesses updated successfully');
    } catch (err) {
      showNotification('error', err.message || 'Failed to save witnesses');
    }
  }, [transactionId, witnesses, showNotification]);

  const formatDateTime = useCallback((isoDate) => {
    if (!isoDate) return 'N/A';
    return new Date(isoDate).toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const handleUpload = useCallback((category) => {
    if (onOpenUploadFile) {
      onOpenUploadFile(transactionId, category);
    }
    onClose();
  }, [onOpenUploadFile, transactionId, onClose]);

  const handleAddPayment = useCallback(() => {
    setAddPaymentModalOpen(true);
  }, []);

  const handleEditPayment = useCallback((paymentId) => {
    setEditPaymentId(paymentId);
  }, []);

  const handleDeletePaymentClick = useCallback((payment) => {
    setSelectedPayment(payment);
    setDeleteDialogOpen(true);
  }, []);

  const handleApprovePaymentClick = useCallback((payment) => {
    setSelectedPayment(payment);
    setApproveDialogOpen(true);
  }, []);

  const handleDeletePaymentConfirm = useCallback(async () => {
    if (!selectedPayment) return;

    setLoadingPaymentEdit(true);
    try {
      await paymentsAPI.deletePayment(transactionId, selectedPayment.id);
      
      showNotification('success', 'Payment deleted successfully');
      if (transaction) {
        setTransaction(prev => ({
          ...prev,
          payments: prev.payments.filter(p => p.id !== selectedPayment.id),
          paid_amount: prev.paid_amount - (selectedPayment.status === 'paid' ? parseFloat(selectedPayment.amount || 0) : 0)
        }));
      }
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
      onUpdated?.();
    } catch (err) {
      console.error('Error deleting payment:', err);
      showNotification('error', err.message || 'Failed to delete payment');
    } finally {
      setLoadingPaymentEdit(false);
    }
  }, [selectedPayment, transactionId, transaction, showNotification, onUpdated]);

  const handleApprovePaymentConfirm = useCallback(async () => {
    if (!selectedPayment) return;

    setLoadingPaymentEdit(true);
    try {
      await paymentsAPI.updatePayment(transactionId, selectedPayment.id, {
        status: 'paid'
      });
      
      showNotification('success', 'Payment approved successfully');
      if (transaction) {
        setTransaction(prev => ({
          ...prev,
          payments: prev.payments.map(p => 
            p.id === selectedPayment.id ? { ...p, status: 'paid' } : p
          ),
          paid_amount: prev.paid_amount + parseFloat(selectedPayment.amount || 0)
        }));
      }
      setApproveDialogOpen(false);
      setSelectedPayment(null);
      onUpdated?.();
    } catch (err) {
      console.error('Error approving payment:', err);
      showNotification('error', err.message || 'Failed to approve payment');
    } finally {
      setLoadingPaymentEdit(false);
    }
  }, [selectedPayment, transactionId, transaction, showNotification, onUpdated]);

  const handleAccordionChange = useCallback((section) => {
    setExpandedSection((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  }, []);

  const getPaymentStatusIcon = useCallback((status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <CheckCircleIcon color="success" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'not_started':
        return <ScheduleIcon color="disabled" />;
      default:
        return <PendingIcon />;
    }
  }, []);

  const getPaymentReceiptUrl = useCallback((payment) => {
    if (!payment) return '';
    
    const receiptPath = 
      payment.file_path || 
      payment.receipt_path ||
      payment.path || 
      (payment.receipt && payment.receipt.path) ||
      (payment.files?.receipt && payment.files.receipt[0]?.path) ||
      (payment.files && payment.files[0]?.path);
    
    return filesAPI.getFileUrl(receiptPath);
  }, []);

  const getPaymentReceiptThumbnailUrl = useCallback((payment) => {
    const receiptPath = 
      payment.file_path || 
      payment.receipt_path ||
      payment.path || 
      (payment.receipt && payment.receipt.path) ||
      (payment.files?.receipt && payment.files.receipt[0]?.path) ||
      (payment.files && payment.files[0]?.path);
    
    return filesAPI.getThumbnailUrl(receiptPath);
  }, []);

  // Обработчики редактирования транзакции
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    
    // Пересчет графика при изменении параметров
    if (['total_amount', 'initial_payment', 'interest_rate', 'schedule_type', 'schedule_payment_day'].includes(name)) {
      if (editFormData.payment_type === 'schedule') {
        setTimeout(() => generateSchedule({
          ...editFormData,
          [name]: value
        }), 100);
      }
    }
  };

  const handleSaveTransaction = async () => {
    try {
      setUpdatingTransaction(true);
      
      const updateData = {
        total_amount: parseFloat(editFormData.total_amount) || 0,
        payment_type: editFormData.payment_type,
        full_payment_deadline: editFormData.full_payment_deadline || null,
        schedule_payment_day: editFormData.schedule_payment_day ? parseInt(editFormData.schedule_payment_day) : null,
        schedule_type: editFormData.schedule_type,
        interest_rate: editFormData.interest_rate ? parseFloat(editFormData.interest_rate) : 0,
        initial_payment: editFormData.initial_payment ? parseFloat(editFormData.initial_payment) : null,
        admin_notes: editFormData.admin_notes,
        status: editFormData.status,
        payment_schedule: editFormData.payment_type === 'schedule' ? schedule : null
      };
      
      const updated = await transactionsAPI.updateTransaction(transactionId, updateData);
      
      showNotification('success', 'Transaction updated successfully');
      
      // Обновляем локальное состояние
      setTransaction(prev => ({
        ...prev,
        ...updated,
        total_amount: updateData.total_amount,
        payment_type: updateData.payment_type,
        full_payment_deadline: updateData.full_payment_deadline,
        schedule_payment_day: updateData.schedule_payment_day,
        schedule_type: updateData.schedule_type,
        interest_rate: updateData.interest_rate,
        initial_payment: updateData.initial_payment,
        admin_notes: updateData.admin_notes,
        status: updateData.status
      }));
      
      // Обновляем курс USD
      try {
        const rate = await getExchangeRate();
        setUsdTotal((updateData.total_amount * rate).toFixed(2));
        
        if (transaction?.property_area && updateData.total_amount) {
          const sqftPricePKR = updateData.total_amount / transaction.property_area;
          const sqftPriceUSD = sqftPricePKR * rate;
          setPricePerSqft({
            pkr: sqftPricePKR,
            usd: sqftPriceUSD
          });
        }
      } catch (rateError) {
        console.warn('Failed to get exchange rate:', rateError);
      }
      
      setIsEditingTransaction(false);
      onUpdated?.();
    } catch (err) {
      console.error('Error updating transaction:', err);
      showNotification('error', err.message || 'Failed to update transaction');
    } finally {
      setUpdatingTransaction(false);
    }
  };

  const handleCancelEdit = () => {
    if (transaction) {
      setEditFormData({
        total_amount: transaction.total_amount || '',
        payment_type: transaction.payment_type || 'full',
        full_payment_deadline: transaction.full_payment_deadline || '',
        schedule_payment_day: transaction.schedule_payment_day || '1',
        schedule_type: transaction.schedule_type || 'equal_schedules',
        interest_rate: transaction.interest_rate || '0',
        initial_payment: transaction.initial_payment || '',
        admin_notes: transaction.admin_notes || '',
        status: transaction.status || 'pending'
      });
      
      if (transaction.payment_type === 'schedule' && transaction.total_amount) {
        setTimeout(() => generateSchedule({
          total_amount: transaction.total_amount,
          initial_payment: transaction.initial_payment,
          interest_rate: transaction.interest_rate,
          schedule_type: transaction.schedule_type,
          schedule_payment_day: transaction.schedule_payment_day
        }), 100);
      }
    }
    setIsEditingTransaction(false);
  };

  useEffect(() => {
  if (files.length > 0) {
    setFileFilter({
      categories: ['agreement', 'video', 'proof_documents', 'other'],
      types: [],
      search: ''
    });
  }
}, [files.length]);

  // Мемоизированные render функции
  const renderPaymentSummary = useMemo(() => {
    if (!transaction) return null;
    
    const paidAmount = parseFloat(transaction.paid_amount || 0);
    const totalAmount = parseFloat(transaction.total_amount || 0);
    const remaining = totalAmount - paidAmount;

    return (
      <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WalletIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6">Payment Summary</Typography>
            </Box>
            {!isEditingTransaction && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setIsEditingTransaction(true)}
              >
                Edit Deal
              </Button>
            )}
          </Box>
          
          <ResponsiveGrid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Amount
                </Typography>
                <Typography variant={isMobile ? "h5" : "h4"} color="primary" gutterBottom>
                  {formatPKR(totalAmount)} PKR
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ≈ ${usdTotal} USD
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: { xs: 1, sm: 3 }, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Paid Amount
                  </Typography>
                  <Typography variant={isMobile ? "h6" : "h5"} color="success.main">
                    {formatPKR(paidAmount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Remaining Amount
                  </Typography>
                  <Typography variant={isMobile ? "h6" : "h5"} color="error.main">
                    {formatPKR(remaining)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Payment Progress
                </Typography>
                <ProgressBarWithLabel value={paidAmount} total={totalAmount} />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={<MoneyIcon />}
                  label={`${transaction.completed_payments || 0} of ${transaction.total_payments || 0} payments`}
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                />
                <StatusChip
                  icon={getPaymentStatusIcon(transaction.payment_status)}
                  status={transaction.payment_status}
                />
              </Box>
            </Grid>
          </ResponsiveGrid>
        </CardContent>
      </Card>
    );
  }, [transaction, usdTotal, getPaymentStatusIcon, isEditingTransaction, isMobile]);

  const renderTransactionDetails = useMemo(() => {
    if (!transaction) return null;
    
    return (
      <Card sx={{ mb: 3 }} width={'100%'}>
        <CardContent width={'100%'}>
          <Typography variant="h6" gutterBottom>
            Meta Data
          </Typography>
          <ResponsiveGrid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                ID
              </Typography>
              <Typography variant="body1" gutterBottom>
                #{transaction.id}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <StatusChip status={transaction.status} />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDateTime(transaction.created_at)}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Updated
              </Typography>
              <Typography variant="body1">
                {formatDateTime(transaction.updated_at)}
              </Typography>
            </Grid>
          </ResponsiveGrid>
        </CardContent>
      </Card>
    );
  }, [transaction, formatDateTime]);

  const renderPropertyInfo = useMemo(() => {
    if (!transaction) return null;
    
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <HomeIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Property Information</Typography>
          </Box>
          
          <ResponsiveGrid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1" gutterBottom>
                {transaction.property_name || '—'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Type
              </Typography>
              <Chip
                label={transaction.property_type === 'commercial' ? 'Commercial' : 'Residential'}
                size="small"
                sx={{ mt: 0.5 }}
                color={transaction.property_type === 'commercial' ? 'primary' : 'secondary'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Area
              </Typography>
              <Typography variant="body1" gutterBottom>
                {transaction.property_area || '—'} sq.ft
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Price per sq.ft
              </Typography>
              <Typography variant="body1">
                {pricePerSqft.pkr ? formatPKR(pricePerSqft.pkr) : '—'} PKR
                {pricePerSqft.usd > 0 && (
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    (≈ ${pricePerSqft.usd.toFixed(2)} USD)
                  </Typography>
                )}
              </Typography>
            </Grid>
          </ResponsiveGrid>
        </CardContent>
      </Card>
    );
  }, [transaction, pricePerSqft]);

  const renderOwnerInfo = useMemo(() => {
    if (!transaction) return null;
    
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Owners</Typography>
          </Box>
          
          <ResponsiveGrid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Seller
              </Typography>
              <Typography variant="body1">
                {transaction.previous_owner_name || 'Not specified'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Buyer
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {transaction.new_owner_name || '—'}
              </Typography>
            </Grid>
          </ResponsiveGrid>
        </CardContent>
      </Card>
    );
  }, [transaction]);

  const renderPaymentSchedule = useMemo(() => {
    if (!transaction?.calculated_schedule?.length) return null;
    
    return (
      <Accordion
        expanded={expandedSection.includes('schedule')}
        onChange={() => handleAccordionChange('schedule')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <CalendarIcon />
            <Typography>Payment Schedule</Typography>
            <Chip label={transaction.calculated_schedule.length} size="small" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell>#</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Remaining</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transaction.calculated_schedule.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{new Date(item.due_date).toLocaleDateString()}</TableCell>
                    <TableCell align="right">{formatPKR(item.amount)}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status || 'pending'}
                        size="small"
                        color={item.status === 'paid' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{formatPKR(item.remaining_balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    );
  }, [transaction?.calculated_schedule, expandedSection, handleAccordionChange]);

  const renderPaymentsTable = useMemo(() => {
    const payments = transaction?.payments || [];
    
    return (
      <Accordion
        expanded={expandedSection.includes('payments')}
        onChange={() => handleAccordionChange('payments')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', flexWrap: 'wrap' }}>
            <MoneyIcon />
            <Typography>Payments</Typography>
            <Chip
              label={`${payments.length}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' }, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleAddPayment}
              size={isMobile ? "small" : "medium"}
              disabled={loadingPaymentEdit}
              fullWidth={isMobile}
            >
              Add Payment
            </Button>
          </Box>
          
          {payments.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Receipt</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => {
                    const displayDate = payment.payment_date || payment.due_date || payment.created_at;
                    const receiptUrl = getPaymentReceiptUrl(payment);
                    const thumbnailUrl = getPaymentReceiptThumbnailUrl(payment);
                    const hasReceipt = !!receiptUrl && receiptUrl !== filesAPI.getFileUrl('');
                    const isImageReceipt = thumbnailUrl !== null;
                    
                    return (
                      <PaymentTableRow key={payment.id} status={payment.status}>
                        <TableCell>{payment.id}</TableCell>
                        <TableCell>{formatDateTime(displayDate)}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="500">
                            {formatPKR(payment.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payment.payment_method || '—'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StatusChip
                              status={payment.status}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          {hasReceipt ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {isImageReceipt ? (
                                <Tooltip title="View receipt">
                                  <ThumbnailContainer
                                    component="a"
                                    href={receiptUrl}
                                    target="_blank"
                                    sx={{ display: 'inline-block' }}
                                  >
                                    <ThumbnailImage
                                      src={thumbnailUrl}
                                      alt="Receipt"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  </ThumbnailContainer>
                                </Tooltip>
                              ) : (
                                <FileIcon color="action" sx={{ fontSize: 20 }} />
                              )}
                              <Button
                                size="small"
                                href={receiptUrl}
                                target="_blank"
                                variant="text"
                                sx={{ ml: 1 }}
                              >
                                View
                              </Button>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              None
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <MobileActionStack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Details">
                              <IconButton
                                size="small"
                                onClick={() => handleEditPayment(payment.id)}
                                disabled={loadingPaymentEdit}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeletePaymentClick(payment)}
                                color="error"
                                disabled={loadingPaymentEdit}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            {payment?.status === "pending" && (
                              <Tooltip title="Approve">
                                <IconButton
                                  size="small"
                                  onClick={() => handleApprovePaymentClick(payment)}
                                  color="success"
                                  disabled={loadingPaymentEdit}
                                >
                                  <ApprovalIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </MobileActionStack>
                        </TableCell>
                      </PaymentTableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PendingIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary" gutterBottom>
                No payments
              </Typography>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleAddPayment}
                sx={{ mt: 2 }}
                disabled={loadingPaymentEdit}
                fullWidth={isMobile}
              >
                Add First Payment
              </Button>
            </Box>
          )}
          
          {loadingPaymentEdit && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    );
  }, [transaction?.payments, expandedSection, handleAccordionChange, handleAddPayment, handleEditPayment, 
      handleDeletePaymentClick, handleApprovePaymentClick, loadingPaymentEdit, formatDateTime, 
      getPaymentReceiptUrl, getPaymentReceiptThumbnailUrl, isMobile]);

  const renderFilesSection = useMemo(() => {
    const categories = [
      { value: 'agreement', label: 'Agreement', icon: <DocIcon />, color: 'primary' },
      { value: 'video', label: 'Video', icon: <VideoIcon />, color: 'secondary' },
      { value: 'proof_documents', label: 'Documents', icon: <DocIcon />, color: 'success' },
      { value: 'receipt', label: 'Receipt', icon: <ReceiptIcon />, color: 'info' },
      { value: 'other', label: 'Other', icon: <FileIcon />, color: 'default' },
    ];

    const fileTypes = [
      { value: 'image', label: 'Images', icon: <ImageIcon />, count: files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f.path)).length },
      { value: 'pdf', label: 'PDFs', icon: <PdfIcon />, count: files.filter(f => /\.pdf$/i.test(f.path)).length },
      { value: 'video', label: 'Videos', icon: <VideoIcon />, count: files.filter(f => /\.(mp4|avi|mov|mkv)$/i.test(f.path)).length },
      { value: 'document', label: 'Documents', icon: <DocIcon />, count: files.filter(f => /\.(doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(f.path)).length },
    ];

    const sortOptions = [
      { value: 'date', label: 'Date (newest first)', icon: <DateIcon /> },
      { value: 'date_asc', label: 'Date (oldest first)', icon: <DateIcon /> },
      { value: 'name', label: 'Name (A-Z)', icon: <SortIcon /> },
      { value: 'name_desc', label: 'Name (Z-A)', icon: <SortIcon /> },
      { value: 'size', label: 'Size (largest)', icon: <SortIcon /> },
      { value: 'size_asc', label: 'Size (smallest)', icon: <SortIcon /> },
    ];

    const handleCategoryToggle = (category) => {
      setFileFilter(prev => {
        const newCategories = prev.categories.includes(category)
          ? prev.categories.filter(c => c !== category)
          : [...prev.categories, category];
        
        return { ...prev, categories: newCategories };
      });
    };

    const handleTypeToggle = (type) => {
      setFileFilter(prev => ({
        ...prev,
        types: prev.types.includes(type)
          ? prev.types.filter(t => t !== type)
          : [...prev.types, type]
      }));
    };

    const handleSearchChange = (e) => {
      setFileFilter(prev => ({ ...prev, search: e.target.value }));
    };

    const handleClearFilters = () => {
      setFileFilter({ categories: [], types: [], search: '' });
    };

    const activeFiltersCount = fileFilter.categories.length + fileFilter.types.length + (fileFilter.search ? 1 : 0);

    const getGridTemplate = () => {
      if (filteredAndSortedFiles.length === 0) return null;
      
      return (
        <Grid container spacing={2}>
          {filteredAndSortedFiles.map((file, index) => (
            <Grid item xs={12} sm={6} md={fileViewMode === 'grid' ? 4 : 12} key={index}>
              <FilePreviewComponent 
                file={file}
                expandedFileId={expandedFileId}
                onExpand={(id) => setExpandedFileId(expandedFileId === id ? null : id)}
                onUpload={handleUpload}
              />
            </Grid>
          ))}
        </Grid>
      );
    };

    const getListTemplate = () => {
      if (filteredAndSortedFiles.length === 0) return null;
      
      return (
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell>File</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Size</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedFiles.map((file, index) => {
                const fileUrl = filesAPI.getFileUrl(file.path);
                const fileName = file.name || file.filename || 'Unknown';
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.path);
                
                return (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isImage ? (
                          <Avatar 
                            src={filesAPI.getThumbnailUrl(file.path)}
                            sx={{ width: 32, height: 32 }}
                            variant="rounded"
                          />
                        ) : (
                          <Avatar 
                            sx={{ width: 32, height: 32, bgcolor: 'grey.200' }}
                            variant="rounded"
                          >
                            {file.category === 'agreement' ? <DocIcon /> :
                             file.category === 'video' ? <VideoIcon /> :
                             file.category === 'receipt' ? <ReceiptIcon /> :
                             <FileIcon />}
                          </Avatar>
                        )}
                        <Typography variant="body2" noWrap>
                          {fileName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={file.category}
                        size="small"
                        color={
                          file.category === 'agreement' ? 'primary' :
                          file.category === 'video' ? 'secondary' :
                          file.category === 'proof_documents' ? 'success' :
                          file.category === 'receipt' ? 'info' : 'default'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {file.size ? `${(file.size / 1024).toFixed(1)} KB` : '—'}
                    </TableCell>
                    <TableCell>
                      {file.created_at ? new Date(file.created_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            href={fileUrl}
                            target="_blank"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            href={fileUrl}
                            download={fileName}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      );
    };

    return (
      <Accordion
        expanded={expandedSection.includes('files')}
        onChange={() => handleAccordionChange('files')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', flexWrap: 'wrap' }}>
            <FileIcon />
            <Typography>Files</Typography>
            <Badge badgeContent={files.length} color="primary">
              <Typography component="span"></Typography>
            </Badge>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          {/* Upload buttons */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DocIcon />}
              onClick={() => handleUpload('agreement')}
              fullWidth={isMobile}
            >
              Agreement
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<VideoIcon />}
              onClick={() => handleUpload('video')}
              fullWidth={isMobile}
            >
              Video
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DocIcon />}
              onClick={() => handleUpload('proof_documents')}
              fullWidth={isMobile}
            >
              Documents
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ReceiptIcon />}
              onClick={() => handleUpload('receipt')}
              fullWidth={isMobile}
            >
              Receipt
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileIcon />}
              onClick={() => handleUpload('other')}
              fullWidth={isMobile}
            >
              Other
            </Button>
          </Box>

          {/* Filters */}
          {files.length > 0 && (
            <FilterPaper elevation={0}>
              <SearchField
                size="small"
                placeholder="Search files..."
                value={fileFilter.search}
                onChange={handleSearchChange}
                fullWidth={isMobile}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: fileFilter.search && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setFileFilter(prev => ({ ...prev, search: '' }))}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Tooltip title="Filter by category">
                  <IconButton
                    onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                    color={fileFilter.categories.length || fileFilter.types.length ? 'primary' : 'default'}
                  >
                    <Badge badgeContent={fileFilter.categories.length + fileFilter.types.length} color="primary">
                      <FilterIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>

                <Tooltip title="Sort">
                  <IconButton onClick={(e) => setSortAnchorEl(e.currentTarget)}>
                    <SortIcon />
                  </IconButton>
                </Tooltip>

                <ToggleButtonGroup
                  value={fileViewMode}
                  exclusive
                  onChange={(e, val) => val && setFileViewMode(val)}
                  size="small"
                >
                  <ToggleButton value="grid">
                    <GridIcon />
                  </ToggleButton>
                  <ToggleButton value="list">
                    <ListIcon />
                  </ToggleButton>
                </ToggleButtonGroup>

                {activeFiltersCount > 0 && (
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={handleClearFilters}
                    color="primary"
                  >
                    Clear ({activeFiltersCount})
                  </Button>
                )}
              </Box>

              {/* Category Filter Menu */}
              <Menu
                anchorEl={filterAnchorEl}
                open={Boolean(filterAnchorEl)}
                onClose={() => setFilterAnchorEl(null)}
                PaperProps={{ sx: { maxHeight: 300, width: 250 } }}
              >
                <MenuItem disabled>
                  <Typography variant="subtitle2" color="text.secondary">
                    Filter by Category
                  </Typography>
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem 
                    key={cat.value}
                    onClick={() => handleCategoryToggle(cat.value)}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      bgcolor: fileFilter.categories.includes(cat.value) ? 'action.selected' : 'transparent'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {cat.icon}
                      <Typography>{cat.label}</Typography>
                    </Box>
                    {fileFilter.categories.includes(cat.value) && (
                      <CheckIcon fontSize="small" color="primary" />
                    )}
                  </MenuItem>
                ))}

                <Divider sx={{ my: 1 }} />
                
                <MenuItem disabled>
                  <Typography variant="subtitle2" color="text.secondary">
                    Filter by Type
                  </Typography>
                </MenuItem>
                {fileTypes.map((type) => (
                  <MenuItem 
                    key={type.value}
                    onClick={() => handleTypeToggle(type.value)}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      bgcolor: fileFilter.types.includes(type.value) ? 'action.selected' : 'transparent'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {type.icon}
                      <Typography>{type.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({type.count})
                      </Typography>
                    </Box>
                    {fileFilter.types.includes(type.value) && (
                      <CheckIcon fontSize="small" color="primary" />
                    )}
                  </MenuItem>
                ))}
              </Menu>

              {/* Sort Menu */}
              <Menu
                anchorEl={sortAnchorEl}
                open={Boolean(sortAnchorEl)}
                onClose={() => setSortAnchorEl(null)}
              >
                <MenuItem disabled>
                  <Typography variant="subtitle2" color="text.secondary">
                    Sort by
                  </Typography>
                </MenuItem>
                {sortOptions.map((opt) => (
                  <MenuItem 
                    key={opt.value}
                    onClick={() => {
                      setFileSortBy(opt.value);
                      setSortAnchorEl(null);
                    }}
                    selected={fileSortBy === opt.value}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {opt.icon}
                      <Typography>{opt.label}</Typography>
                    </Box>
                    {fileSortBy === opt.value && (
                      <CheckIcon fontSize="small" sx={{ ml: 1 }} color="primary" />
                    )}
                  </MenuItem>
                ))}
              </Menu>
            </FilterPaper>
          )}

          {/* Files display */}
          {files.length > 0 ? (
            <>
              {fileViewMode === 'grid' ? getGridTemplate() : getListTemplate()}
              
              {filteredAndSortedFiles.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary" gutterBottom>
                    No files match your filters
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    sx={{ mt: 1 }}
                  >
                    Clear Filters
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary" gutterBottom>
                No files uploaded
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload agreement, video or documents for this transaction
              </Typography>
              <Button
                variant="contained"
                startIcon={<FileIcon />}
                onClick={() => handleUpload('agreement')}
                fullWidth={isMobile}
              >
                Upload First File
              </Button>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    );
  }, [files, filteredAndSortedFiles, fileFilter, fileViewMode, fileSortBy, expandedSection, 
      expandedFileId, filterAnchorEl, sortAnchorEl, handleAccordionChange, handleUpload, isMobile]);

  const renderEditMode = useMemo(() => {
    if (!transaction) return null;
    
    return (
      <Box sx={{ p: 3 }}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditIcon /> Edit Transaction
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancelEdit}
                  disabled={updatingTransaction}
                  size={isMobile ? "small" : "medium"}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={updatingTransaction ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSaveTransaction}
                  disabled={updatingTransaction}
                  size={isMobile ? "small" : "medium"}
                >
                  {updatingTransaction ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>

            {/* Status */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Transaction Status</InputLabel>
              <Select
                name="status"
                value={editFormData.status}
                onChange={handleEditChange}
                label="Transaction Status"
                size="small"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            {/* Price Calculator */}
            {unitArea && (
              <PriceCalculator
                pricePKR={editFormData.total_amount}
                area={unitArea}
                onPriceChange={(value) => setEditFormData(prev => ({ ...prev, total_amount: value }))}
                disabled={false}
                exchangeRate={exchangeRate}
                showValidationError={false}
              />
            )}

            {/* Payment Information */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Payment Information
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    name="payment_type"
                    value={editFormData.payment_type}
                    onChange={handleEditChange}
                  >
                    <FormControlLabel value="full" control={<Radio />} label="Full Payment" />
                    <FormControlLabel value="schedule" control={<Radio />} label="Schedule Plan" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              
              {editFormData.payment_type === 'full' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Payment Deadline"
                    name="full_payment_deadline"
                    type="date"
                    value={editFormData.full_payment_deadline || ''}
                    onChange={handleEditChange}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
              )}

              {editFormData.payment_type === 'schedule' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Initial Payment (PKR)"
                      name="initial_payment"
                      value={editFormData.initial_payment}
                      onChange={handleEditChange}
                      type="number"
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>₨</Typography>,
                      }}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Payment Day of Month</InputLabel>
                      <Select
                        name="schedule_payment_day"
                        value={editFormData.schedule_payment_day}
                        onChange={handleEditChange}
                        label="Payment Day of Month"
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                          <MenuItem key={day} value={day}>{day}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Schedule Type</InputLabel>
                      <Select
                        name="schedule_type"
                        value={editFormData.schedule_type}
                        onChange={handleEditChange}
                        label="Schedule Type"
                      >
                        <MenuItem value="equal_schedules">Equal schedules</MenuItem>
                        <MenuItem value="decreasing_fixed">Decreasing Fixed</MenuItem>
                        <MenuItem value="increasing_fixed">Increasing Fixed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Interest Rate (%)"
                      name="interest_rate"
                      value={editFormData.interest_rate}
                      onChange={handleEditChange}
                      type="number"
                      InputProps={{
                        endAdornment: <Typography>%</Typography>,
                      }}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Number of schedules"
                      value={schedulesCount}
                      onChange={(e) => {
                        setSchedulesCount(e.target.value);
                        setTimeout(() => generateSchedule(editFormData), 100);
                      }}
                      type="number"
                      inputProps={{ min: 1, max: 360 }}
                      size="small"
                    />
                  </Grid>
                  
                  {/* Payment Schedule Preview */}
                  {schedule.length > 0 && (
                    <Grid item xs={12}>
                      <Box sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6">
                            Payment Schedule Preview
                          </Typography>
                          <IconButton size="small" onClick={() => generateSchedule(editFormData)}>
                            <RefreshIcon />
                          </IconButton>
                        </Box>
                        <TableContainer component={Paper} sx={{ maxHeight: 400, overflowX: 'auto' }}>
                          <Table stickyHeader size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Due Date</TableCell>
                                <TableCell align="right">Amount (PKR)</TableCell>
                                <TableCell align="right">Principal</TableCell>
                                <TableCell align="right">Interest</TableCell>
                                <TableCell align="right">Balance</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {schedule.map((row) => (
                                <TableRow key={row.schedule}>
                                  <TableCell>{row.schedule}</TableCell>
                                  <TableCell>{row.due_date}</TableCell>
                                  <TableCell align="right">₨{row.amount.toLocaleString()}</TableCell>
                                  <TableCell align="right">₨{row.principal.toLocaleString()}</TableCell>
                                  <TableCell align="right">₨{row.interest.toLocaleString()}</TableCell>
                                  <TableCell align="right">₨{row.balance.toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Total: ₨{schedule.reduce((sum, row) => sum + row.amount, 0).toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Interest Total: ₨{schedule.reduce((sum, row) => sum + row.interest, 0).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </>
              )}
            </Grid>

            {/* Admin Notes */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Admin Notes"
              name="admin_notes"
              value={editFormData.admin_notes}
              onChange={handleEditChange}
              placeholder="Enter any additional notes or comments..."
              sx={{ mb: 3 }}
              size="small"
            />
          </CardContent>
        </Card>
      </Box>
    );
  }, [transaction, editFormData, updatingTransaction, schedule, schedulesCount, unitArea, exchangeRate, isMobile, generateSchedule, handleSaveTransaction, handleCancelEdit, handleEditChange]);

  const renderAdminNotes = useMemo(() => {
    return (
      <Card sx={{ mb: 3 }} width={'100%'}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Admin Notes</Typography>
            {!isEditingNotes && !isEditingTransaction && (
              <IconButton size="small" onClick={() => setIsEditingNotes(true)}>
                <EditIcon />
              </IconButton>
            )}
          </Box>
          
          {isEditingNotes ? (
            <Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter notes..."
                variant="outlined"
                size="small"
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveNotes}
                  size="small"
                >
                  Save
                </Button>
                <Button onClick={() => setIsEditingNotes(false)} size="small">
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Paper
              variant="outlined"
              sx={{ 
                p: 2, 
                minHeight: 100,
                backgroundColor: adminNotes ? 'grey.50' : 'transparent',
                cursor: 'pointer'
              }}
              onClick={() => !isEditingTransaction && setIsEditingNotes(true)}
            >
              <Typography color={adminNotes ? 'text.primary' : 'text.secondary'}>
                {adminNotes || 'Click to add notes...'}
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>
    );
  }, [adminNotes, isEditingNotes, isEditingTransaction, handleSaveNotes]);

  const renderWitnesses = useMemo(() => {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Witnesses
          </Typography>
          
          <WitnessForm
            witness={witnesses.witness1}
            onChange={handleWitnessChange}
            index={1}
          />
          <Divider sx={{ my: 2 }} />
          <WitnessForm
            witness={witnesses.witness2}
            onChange={handleWitnessChange}
            index={2}
          />
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveWitnesses}
              fullWidth
            >
              Save Witnesses
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }, [witnesses, handleWitnessChange, handleSaveWitnesses]);

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { 
            minHeight: isMobile ? '100%' : '80vh',
            maxHeight: isMobile ? '100%' : '90vh',
            borderRadius: isMobile ? 0 : 2
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          pr: 2,
          py: isMobile ? 1.5 : 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WalletIcon />
            <Typography variant={isMobile ? "subtitle1" : "h6"}>
              Deal/#{transaction?.id || transactionId}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: isMobile ? 1 : 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : !transaction ? (
            <Typography color="error" sx={{ p: 3 }}>
              Failed to load transaction data
            </Typography>
          ) : isEditingTransaction ? (
            renderEditMode
          ) : (
            <Box sx={{ p: isMobile ? 1 : 3 }}>
              {renderPaymentSummary}
              
              <ResponsiveGrid container spacing={3} width={'100%'}>
                <Grid item xs={12} md={8} width={'100%'}>
                  {renderTransactionDetails}
                  {renderOwnerInfo}
                  {renderPropertyInfo}
                  {renderPaymentSchedule}
                  {renderPaymentsTable}
                  {renderFilesSection}
                </Grid>
                
                <Grid item xs={12} md={4} width={'100%'}>
                  {renderAdminNotes}
                  {renderWitnesses}
                </Grid>
              </ResponsiveGrid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: isMobile ? 1 : 3, py: isMobile ? 1 : 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={onClose} variant="outlined" fullWidth={isMobile}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <AddPaymentModal
        isOpen={addPaymentModalOpen}
        onClose={() => setAddPaymentModalOpen(false)}
        transactionId={transactionId}
        transactionData={transaction}
        onUpdated={() => {
          loadTransaction();
          onUpdated?.();
        }}
      />

      <EditPaymentModal
        open={!!editPaymentId}
        onClose={() => setEditPaymentId(null)}
        transactionId={transactionId}
        paymentId={editPaymentId}
        onUpdated={() => {
          loadTransaction();
          onUpdated?.();
          setEditPaymentId(null);
        }}
      />

      {/* Диалог подтверждения удаления платежа */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !loadingPaymentEdit && setDeleteDialogOpen(false)}
        fullScreen={isMobile}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete payment #{selectedPayment?.id}?
            <br />
            <strong>Amount:</strong> {selectedPayment && formatPKR(selectedPayment.amount)}
            <br />
            <strong>Date:</strong> {selectedPayment && formatDateTime(selectedPayment.payment_date || selectedPayment.created_at)}
            <br />
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={loadingPaymentEdit}
            fullWidth={isMobile}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeletePaymentConfirm} 
            color="error" 
            variant="contained"
            disabled={loadingPaymentEdit}
            startIcon={loadingPaymentEdit ? <CircularProgress size={20} /> : <DeleteIcon />}
            fullWidth={isMobile}
          >
            {loadingPaymentEdit ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения подтверждения платежа */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => !loadingPaymentEdit && setApproveDialogOpen(false)}
        fullScreen={isMobile}
      >
        <DialogTitle>Confirm Approval</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to approve payment #{selectedPayment?.id}?
            <br />
            <strong>Amount:</strong> {selectedPayment && formatPKR(selectedPayment.amount)}
            <br />
            <strong>Date:</strong> {selectedPayment && formatDateTime(selectedPayment.payment_date || selectedPayment.created_at)}
            <br />
            <strong>Method:</strong> {selectedPayment?.payment_method || 'Not specified'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setApproveDialogOpen(false)} 
            disabled={loadingPaymentEdit}
            fullWidth={isMobile}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApprovePaymentConfirm} 
            color="success" 
            variant="contained"
            disabled={loadingPaymentEdit}
            startIcon={loadingPaymentEdit ? <CircularProgress size={20} /> : <ApprovalIcon />}
            fullWidth={isMobile}
          >
            {loadingPaymentEdit ? 'Approving...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TransactionModal;