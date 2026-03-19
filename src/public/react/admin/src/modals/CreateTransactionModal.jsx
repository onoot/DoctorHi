// src/components/modals/CreateTransactionModal.jsx
import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { useNotification } from '../context/NotificationContext';
import ActionButton from '../common/ActionButton';
import { getAllUnits } from '../api/unitsAPI.js';

// Material UI компоненты
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  PictureAsPdf as PdfIcon,
  VideoFile as VideoIcon,
  Description as DocIcon,
  Warning as WarningIcon,
  PriceCheck as PriceCheckIcon
} from '@mui/icons-material';

const PriceCalculator = ({ 
  pricePKR, 
  area, 
  onPriceChange,
  disabled = false,
  exchangeRate = 280,
  showValidationError = false
}) => {
  const [pricePerSqft, setPricePerSqft] = useState('');
  const [priceUSD, setPriceUSD] = useState('');

  useEffect(() => {
    if (area && pricePKR) {
      const perSqft = (Number(pricePKR) / Number(area)).toFixed(2);
      setPricePerSqft(isNaN(perSqft) ? '' : perSqft);
      
      const usd = (Number(pricePKR) / exchangeRate).toFixed(2);
      setPriceUSD(isNaN(usd) ? '' : usd);
    } else {
      setPricePerSqft('');
      setPriceUSD('');
    }
  }, [pricePKR, area, exchangeRate]);

  const handlePricePerSqftChange = (e) => {
    const newPricePerSqft = e.target.value;
    setPricePerSqft(newPricePerSqft);
    
    if (area && newPricePerSqft) {
      const newPrice = (Number(newPricePerSqft) * Number(area)).toFixed(2);
      if (!isNaN(newPrice)) {
        onPriceChange(newPrice);
      }
    }
  };

  const handlePriceUSDChange = (e) => {
    const newPriceUSD = e.target.value;
    setPriceUSD(newPriceUSD);
    
    if (newPriceUSD) {
      const newPrice = (Number(newPriceUSD) * exchangeRate).toFixed(2);
      if (!isNaN(newPrice)) {
        onPriceChange(newPrice);
      }
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3, borderColor: showValidationError ? 'error.main' : 'divider' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PriceCheckIcon color="primary" /> Price Calculator
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
            The selected unit doesn't have a price set. Please specify the transaction price.
          </Alert>
        )}
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Price per sqft (PKR)"
              value={pricePerSqft}
              onChange={handlePricePerSqftChange}
              disabled={!area || disabled}
              placeholder={area ? "Enter price per sqft" : "Select unit first"}
              error={showValidationError && !pricePerSqft}
              helperText={showValidationError && !pricePerSqft ? "Required field" : ""}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₨</Typography>,
              }}
            />
            {area && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Area: {area} sqft
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Price in USD"
              value={priceUSD}
              onChange={handlePriceUSDChange}
              disabled={disabled}
              placeholder="Enter price in USD"
              error={showValidationError && !priceUSD}
              helperText={showValidationError && !priceUSD ? "Required field" : ""}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Exchange rate: $1 = ₨{exchangeRate}
            </Typography>
          </Grid>
          {pricePKR && (
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexWrap: 'wrap',
                mt: 1,
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1
              }}>
                <Chip 
                  label={`Total: ₨${Number(pricePKR).toLocaleString()}`} 
                  color="primary" 
                  variant="outlined"
                />
                <Chip 
                  label={`USD: $${(Number(pricePKR) / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  color="success"
                  variant="outlined"
                />
                {area && pricePerSqft && (
                  <Chip 
                    label={`Per sqft: ₨${Number(pricePerSqft).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    color="info"
                    variant="outlined"
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

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const FileUploadSection = ({ files, onFilesChange, required = false }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e, fileType) => {
    const selectedFiles = Array.from(e.target.files);
    setUploading(true);
    
    try {
      const newFiles = selectedFiles.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        type: fileType,
        file: file,
        size: file.size,
        uploaded: new Date().toISOString()
      }));
      
      onFilesChange([...files, ...newFiles]);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = (fileId) => {
    onFilesChange(files.filter(file => file.id !== fileId));
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'agreement': return <DocIcon color="primary" />;
      case 'video': return <VideoIcon color="secondary" />;
      case 'transfer': return <PdfIcon color="error" />;
      default: return <AttachFileIcon />;
    }
  };

  const getFileTypeLabel = (fileType) => {
    switch (fileType) {
      case 'agreement': return 'Agreement';
      case 'video': return 'Video Evidence';
      case 'transfer': return 'Property Transfer Document';
      default: return fileType;
    }
  };

  const hasRequiredFileType = (fileType) => {
    return files.some(file => file.type === fileType);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Required Documents
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {required ? 'Upload the following required documents for the transaction' : 'Upload documents for the transaction'}
      </Typography>
      
      {required && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Agreement, Video Evidence, and Property Transfer Document are required
        </Alert>
      )}
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <input
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            id="agreement-upload"
            type="file"
            onChange={(e) => handleFileSelect(e, 'agreement')}
          />
          <label htmlFor="agreement-upload">
            <Button
              variant={hasRequiredFileType('agreement') ? "contained" : "outlined"}
              component="span"
              startIcon={<CloudUploadIcon />}
              fullWidth
              disabled={uploading}
              color={hasRequiredFileType('agreement') ? "success" : "primary"}
            >
              {hasRequiredFileType('agreement') ? '✓ Agreement' : 'Upload Agreement'}
            </Button>
          </label>
        </Grid>
        <Grid item xs={12} md={4}>
          <input
            accept="video/*,.mp4,.mov,.avi"
            style={{ display: 'none' }}
            id="video-upload"
            type="file"
            onChange={(e) => handleFileSelect(e, 'video')}
          />
          <label htmlFor="video-upload">
            <Button
              variant={hasRequiredFileType('video') ? "contained" : "outlined"}
              component="span"
              startIcon={<CloudUploadIcon />}
              fullWidth
              disabled={uploading}
              color={hasRequiredFileType('video') ? "success" : "primary"}
            >
              {hasRequiredFileType('video') ? '✓ Video Evidence' : 'Upload Video Evidence'}
            </Button>
          </label>
        </Grid>
        <Grid item xs={12} md={4}>
          <input
            accept=".pdf"
            style={{ display: 'none' }}
            id="transfer-upload"
            type="file"
            onChange={(e) => handleFileSelect(e, 'transfer')}
          />
          <label htmlFor="transfer-upload">
            <Button
              variant={hasRequiredFileType('transfer') ? "contained" : "outlined"}
              component="span"
              startIcon={<CloudUploadIcon />}
              fullWidth
              disabled={uploading}
              color={hasRequiredFileType('transfer') ? "success" : "primary"}
            >
              {hasRequiredFileType('transfer') ? '✓ Transfer Doc' : 'Upload Transfer Doc'}
            </Button>
          </label>
        </Grid>
      </Grid>

      {files.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Uploaded Files ({files.length})
          </Typography>
          <List dense>
            {files.map((file) => (
              <ListItem key={file.id} divider>
                <ListItemIcon>
                  {getFileIcon(file.type)}
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={`${getFileTypeLabel(file.type)} • ${(file.size / 1024).toFixed(1)} KB`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteFile(file.id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

const CreateTransactionModal = ({ isOpen, onClose, onCreated }) => {
  const { http } = useApi();
  const { showNotification } = useNotification();
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [schedulesCount, setschedulesCount] = useState(12);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [priceValidationDialog, setPriceValidationDialog] = useState(false);
  const [selectedUnitHasPrice, setSelectedUnitHasPrice] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  
  const [formData, setFormData] = useState({
    property_id: '',
    new_owner_id: '',
    total_amount: '',
    payment_type: 'full',
    full_payment_deadline: '',
    schedule_payment_day: '1',
    schedule_type: 'equal_schedules',
    interest_rate: '0',
    initial_payment: '',
    admin_notes: '',
    witness1Name: '',
    witness1CNIC: '',
    witness1Phone: '',
    witness2Name: '',
    witness2CNIC: '',
    witness2Phone: '',
  });

  // Загрузка данных при открытии модального окна
  useEffect(() => {
    if (!isOpen) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const [unitsData, usersRes] = await Promise.all([
          getAllUnits({ page: 1, limit: 1000 }),
          http.get('/v1/admin/users?status=active')
        ]);
        
        setUnits(unitsData || []);
        if (usersRes.success) {
          setUsers(usersRes.users.filter(u => u.role === 'user') || []);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        showNotification('error', 'Failed to load data: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isOpen, http, showNotification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    
    // Очистка ошибок валидации при изменении поля
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
    
    // Проверка цены при выборе объекта
    if (name === 'property_id' && value) {
      const selectedUnit = units.find(u => 
        (u.id && String(u.id) === String(value)) || 
        (u.unique_id && String(u.unique_id) === String(value))
      );
      
      const unitHasPrice = selectedUnit && (selectedUnit.price || selectedUnit.total_amount);
      setSelectedUnitHasPrice(!!unitHasPrice);
      
      if (!unitHasPrice) {
        setPriceValidationDialog(true);
      }
    }
    
    if (formData.payment_type === 'schedule') {
      if (['total_amount', 'initial_payment', 'interest_rate', 'schedule_type', 'schedule_payment_day'].includes(name)) {
        setTimeout(() => generateSchedule(newFormData), 100);
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Проверка обязательных полей
    if (!formData.property_id) errors.property_id = 'Property unit is required';
    if (!formData.new_owner_id) errors.new_owner_id = 'New owner is required';
    if (!formData.total_amount || Number(formData.total_amount) <= 0) {
      errors.total_amount = 'Valid total amount is required';
    }
    if (!formData.payment_type) errors.payment_type = 'Payment type is required';
    
    // Проверка свидетелей
    if (!formData.witness1Name || !formData.witness1CNIC) {
      errors.witnesses = 'Witness 1 information is incomplete';
    }
    if (!formData.witness2Name || !formData.witness2CNIC) {
      errors.witnesses = errors.witnesses ? `${errors.witnesses}; Witness 2 information is incomplete` : 'Witness 2 information is incomplete';
    }
    
    // Проверка цены, если объект не имеет цены
    if (!selectedUnitHasPrice && (!formData.total_amount || Number(formData.total_amount) <= 0)) {
      errors.total_amount = 'Price is required for this unit';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getSelectedUnitArea = () => {
    if (!formData.property_id) return null;
    const unit = units.find(u => (u.id && String(u.id) === String(formData.property_id)) || 
      (u.unique_id && String(u.unique_id) === String(formData.property_id)));
    return unit ? Number(unit.area) || null : null;
  };

  const getSelectedUnitPrice = () => {
    if (!formData.property_id) return null;
    const unit = units.find(u => 
      (u.id && String(u.id) === String(formData.property_id)) || 
      (u.unique_id && String(u.unique_id) === String(formData.property_id))
    );
    return unit ? Number(unit.price || unit.total_amount || 0) : 0;
  };

  const generateSchedule = (data = formData) => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация формы
    if (!validateForm()) {
      showNotification('error', 'Please fill all required fields correctly');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Подготовка данных свидетелей
      const witnessData = {
        witness1: {
          name: formData.witness1Name,
          cnic: formData.witness1CNIC,
          phone: formData.witness1Phone || null
        },
        witness2: {
          name: formData.witness2Name,
          cnic: formData.witness2CNIC,
          phone: formData.witness2Phone || null
        }
      };

      const payload = {
        ...formData,
        total_amount: parseFloat(formData.total_amount) || 0,
        initial_payment: formData.initial_payment ? parseFloat(formData.initial_payment) : null,
        interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : 0,
        payment_schedule: formData.payment_type === 'schedule' ? schedule : null,
        witnesses: witnessData
      };

      // Создание транзакции
      const transactionRes = await http.post('/v1/admin/transactions', payload);
      
      if (transactionRes.success) {
        const transactionId = transactionRes.transactionId || transactionRes.id;
        
        // Обновление цены объекта, если он не имел цены
        if (!selectedUnitHasPrice) {
          try {
            await http.put(`/v1/admin/units/${formData.property_id}`, {
              price: formData.total_amount
            });
            showNotification('info', 'Unit price has been updated');
          } catch (priceError) {
            console.warn('Failed to update unit price:', priceError);
          }
        }

        // Обновление данных свидетелей
        if (transactionId) {
          try {
            await http.put(`/v1/admin/transactions/${transactionId}/witnesses`, witnessData);
          } catch (witnessError) {
            console.warn('Failed to update witnesses:', witnessError);
          }

          // Загрузка файлов (если есть)
          if (uploadedFiles.length > 0) {
            try {
              const formDataFiles = new FormData();
              uploadedFiles.forEach((file, index) => {
                formDataFiles.append('files', file.file);
                formDataFiles.append('fileTypes', file.type);
              });
              formDataFiles.append('transactionId', transactionId);
              
              await http.post(`/v1/admin/transactions/${transactionId}/documents`, formDataFiles);
            } catch (fileError) {
              console.warn('Failed to upload files:', fileError);
            }
          }
        }

        showNotification('success', 'Transaction created successfully!');
        onCreated?.();
        handleClose();
      } else {
        throw new Error(transactionRes.message || 'Failed to create transaction');
      }
    } catch (err) {
      console.error('Error creating transaction:', err);
      showNotification('error', 'Failed to create transaction: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      property_id: '',
      new_owner_id: '',
      total_amount: '',
      payment_type: 'full',
      full_payment_deadline: '',
      schedule_payment_day: '1',
      schedule_type: 'equal_schedules',
      interest_rate: '0',
      initial_payment: '',
      admin_notes: '',
      witness1Name: '',
      witness1CNIC: '',
      witness1Phone: '',
      witness2Name: '',
      witness2CNIC: '',
      witness2Phone: '',
    });
    setSchedule([]);
    setschedulesCount(12);
    setUploadedFiles([]);
    setSelectedUnitHasPrice(true);
    setValidationErrors({});
    setPriceValidationDialog(false);
    onClose();
  };

  if (!isOpen) return null;

  const formatDateForInput = (date) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const getDefaultDeadline = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return formatDateForInput(date);
  };

  const selectedUnitArea = getSelectedUnitArea();
  const selectedUnitPrice = getSelectedUnitPrice();

  return (
    <>
      <div className="modal show">
        <div className="modal-content modal-extra-large">
          <div className="modal-header">
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              Create New Deals
            </Typography>
            <span className="modal-close" onClick={handleClose}>&times;</span>
          </div>
          
          <div className="modal-body">
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <Typography>Loading data...</Typography>
              </Box>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Property & Owner Information */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', pb: 1, borderBottom: '2px solid', borderColor: 'primary.main' }}>
                    Property & Owner Information
                  </Typography>
                  
                  {!selectedUnitHasPrice && formData.property_id && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        The selected unit doesn't have a price. You need to specify the transaction price.
                        {selectedUnitPrice > 0 && ` Current price: ₨${selectedUnitPrice.toLocaleString()}`}
                      </Typography>
                    </Alert>
                  )}
                  
                     <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Property Unit</InputLabel>
                      <Select
                        name="property_id"
                        value={formData.property_id}
                        onChange={handleChange}
                        label="Property Unit"
                        sx={{
                          minWidth: 350, 
                          '& .MuiSelect-select': {
                            whiteSpace: 'normal',
                          }
                        }}
                      >
                        <MenuItem value=""><em>Select Property Unit</em></MenuItem>
                        {units.map(unit => (
                          <MenuItem key={unit.id || unit.unique_id} value={unit.id || unit.unique_id}>
                            {unit.name} - {unit.category} ({unit.type}) {unit.area && `- ${unit.area} sqft`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>New Owner</InputLabel>
                      <Select
                        name="new_owner_id"
                        value={formData.new_owner_id}
                        onChange={handleChange}
                        label="New Owner"
                        sx={{
                          minWidth: 350,
                          '& .MuiSelect-select': {
                            whiteSpace: 'normal',
                          }
                        }}
                      >
                        <MenuItem value=""><em>Select New Owner</em></MenuItem>
                        {users.map(user => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.name} ({user.cnic})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                </Box>

                {/* Price Calculator */}
                {selectedUnitArea && (
                  <Box sx={{ mb: 4 }}>
                    <PriceCalculator
                      pricePKR={formData.total_amount}
                      area={selectedUnitArea}
                      onPriceChange={(value) => setFormData(prev => ({ ...prev, total_amount: value }))}
                      disabled={false}
                      exchangeRate={280}
                      showValidationError={!selectedUnitHasPrice}
                    />
                  </Box>
                )}

                {/* Required Total Amount Field */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', pb: 1, borderBottom: '2px solid', borderColor: 'primary.main' }}>
                    Transaction Amount
                  </Typography>
                  
                  <TextField
                    fullWidth
                    required
                    label="Total Amount (PKR)"
                    name="total_amount"
                    value={formData.total_amount}
                    onChange={handleChange}
                    type="number"
                    error={!!validationErrors.total_amount}
                    helperText={validationErrors.total_amount || "Enter the total transaction amount"}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₨</Typography>,
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  {selectedUnitPrice > 0 && selectedUnitPrice !== Number(formData.total_amount) && formData.total_amount && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Unit's current price: ₨{selectedUnitPrice.toLocaleString()}
                        {Number(formData.total_amount) > selectedUnitPrice && 
                          ` (You're setting a higher price: +₨${(Number(formData.total_amount) - selectedUnitPrice).toLocaleString()})`}
                        {Number(formData.total_amount) < selectedUnitPrice && 
                          ` (You're setting a lower price: -₨${(selectedUnitPrice - Number(formData.total_amount)).toLocaleString()})`}
                      </Typography>
                    </Alert>
                  )}
                </Box>

                {/* Payment Information */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', pb: 1, mb:2, borderBottom: '2px solid', borderColor: 'primary.main' }}>
                    Payment Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControl component="fieldset" error={!!validationErrors.payment_type}>
                        <Typography variant="subtitle1" gutterBottom>Payment Type *</Typography>
                        <RadioGroup
                          row
                          name="payment_type"
                          value={formData.payment_type}
                          onChange={handleChange}
                        >
                          <FormControlLabel value="full" control={<Radio />} label="Full Payment" />
                          <FormControlLabel value="schedule" control={<Radio />} label="schedule Plan" />
                        </RadioGroup>
                        {validationErrors.payment_type && (
                          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                            {validationErrors.payment_type}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    
                    {formData.payment_type === 'full' && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Full Payment Deadline"
                          name="full_payment_deadline"
                          type="date"
                          value={formData.full_payment_deadline || getDefaultDeadline()}
                          onChange={handleChange}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    )}

                    {formData.payment_type === 'schedule' && (
                      <>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Initial Payment (PKR)"
                            name="initial_payment"
                            value={formData.initial_payment}
                            onChange={handleChange}
                            type="number"
                            InputProps={{
                              startAdornment: <Typography sx={{ mr: 1 }}>₨</Typography>,
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Payment Day of Month</InputLabel>
                            <Select
                              name="schedule_payment_day"
                              value={formData.schedule_payment_day}
                              onChange={handleChange}
                              label="Payment Day of Month"
                            >
                              {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                                <MenuItem key={day} value={day}>{day}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Schedule Type</InputLabel>
                            <Select
                              name="schedule_type"
                              value={formData.schedule_type}
                              onChange={handleChange}
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
                            value={formData.interest_rate}
                            onChange={handleChange}
                            type="number"
                            InputProps={{
                              endAdornment: <Typography>%</Typography>,
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Number of schedules"
                            value={schedulesCount}
                            onChange={(e) => {
                              setschedulesCount(e.target.value);
                              setTimeout(() => generateSchedule(), 100);
                            }}
                            type="number"
                            inputProps={{ min: 1, max: 360 }}
                          />
                        </Grid>
                        
                        {/* Payment Schedule Table */}
                        {schedule.length > 0 && (
                          <Grid item xs={12}>
                            <Box sx={{ mt: 3 }}>
                              <Typography variant="h6" gutterBottom>
                                Payment Schedule Preview
                              </Typography>
                              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                                <Table stickyHeader size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>#</TableCell>
                                      <TableCell>Due Date</TableCell>
                                      <TableCell align="right">Amount (PKR)</TableCell>
                                      <TableCell align="right">Principal</TableCell>
                                      <TableCell align="right">Interest</TableCell>
                                      <TableCell align="right">Remaining Balance</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {schedule.map((row) => (
                                      <StyledTableRow key={row.schedule}>
                                        <TableCell>{row.schedule}</TableCell>
                                        <TableCell>{row.due_date}</TableCell>
                                        <TableCell align="right">₨{row.amount.toLocaleString()}</TableCell>
                                        <TableCell align="right">₨{row.principal.toLocaleString()}</TableCell>
                                        <TableCell align="right">₨{row.interest.toLocaleString()}</TableCell>
                                        <TableCell align="right">₨{row.balance.toLocaleString()}</TableCell>
                                      </StyledTableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  Total: ₨{schedule.reduce((sum, row) => sum + row.amount, 0).toLocaleString()}
                                </Typography>
                                <Button 
                                  variant="outlined" 
                                  size="small"
                                  onClick={() => generateSchedule()}
                                >
                                  Refresh Schedule
                                </Button>
                              </Box>
                            </Box>
                          </Grid>
                        )}
                      </>
                    )}
                  </Grid>
                </Box>

                {/* Witness Information */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', pb: 1, borderBottom: '2px solid', borderColor: 'primary.main' }}>
                    Witness Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Add at least two witnesses for the transaction (both are required)
                  </Typography>
                  
                  {validationErrors.witnesses && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {validationErrors.witnesses}
                    </Alert>
                  )}
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6} width={'100%'}>
                      <Card variant="outlined">
                        <CardContent  width={'100%'}>
                          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>👤</span> Witness 1 *
                          </Typography>
                          <TextField
                            fullWidth
                            required
                            label="Name"
                            name="witness1Name"
                            value={formData.witness1Name}
                            onChange={handleChange}
                            margin="normal"
                            size="small"
                            error={!!validationErrors.witnesses && !formData.witness1Name}
                          />
                          <TextField
                            fullWidth
                            required
                            label="CNIC"
                            name="witness1CNIC"
                            value={formData.witness1CNIC}
                            onChange={handleChange}
                            margin="normal"
                            size="small"
                            placeholder="XXXXX-XXXXXXX-X"
                            error={!!validationErrors.witnesses && !formData.witness1CNIC}
                          />
                          <TextField
                            fullWidth
                            label="Phone Number"
                            name="witness1Phone"
                            value={formData.witness1Phone}
                            onChange={handleChange}
                            margin="normal"
                            size="small"
                            placeholder="+923001234567"
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6} width={'100%'}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>👤</span> Witness 2 *
                          </Typography>
                          <TextField
                            fullWidth
                            required
                            label="Name"
                            name="witness2Name"
                            value={formData.witness2Name}
                            onChange={handleChange}
                            margin="normal"
                            size="small"
                            error={!!validationErrors.witnesses && !formData.witness2Name}
                          />
                          <TextField
                            fullWidth
                            required
                            label="CNIC"
                            name="witness2CNIC"
                            value={formData.witness2CNIC}
                            onChange={handleChange}
                            margin="normal"
                            size="small"
                            placeholder="XXXXX-XXXXXXX-X"
                            error={!!validationErrors.witnesses && !formData.witness2CNIC}
                          />
                          <TextField
                            fullWidth
                            label="Phone Number"
                            name="witness2Phone"
                            value={formData.witness2Phone}
                            onChange={handleChange}
                            margin="normal"
                            size="small"
                            placeholder="+923001234567"
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>

                {/* File Upload Section */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', pb: 1, borderBottom: '2px solid', borderColor: 'primary.main' }}>
                    Documents & Evidence
                  </Typography>
                  <FileUploadSection
                    files={uploadedFiles}
                    onFilesChange={setUploadedFiles}
                    required={true}
                  />
                </Box>

                {/* Additional Notes */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', pb: 1, borderBottom: '2px solid', borderColor: 'primary.main' }}>
                    Additional Notes
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Admin Notes"
                    name="admin_notes"
                    value={formData.admin_notes}
                    onChange={handleChange}
                    placeholder="Enter any additional notes or comments..."
                  />
                </Box>

                {/* Action Buttons */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  pt: 3,
                  borderTop: 1,
                  borderColor: 'divider'
                }}>
                  <ActionButton 
                    type="button" 
                    variant="secondary" 
                    onClick={handleClose}
                    disabled={submitting}
                    sx={{ minWidth: 120 }}
                  >
                    Cancel
                  </ActionButton>
                  
                  <ActionButton 
                    type="submit" 
                    variant="edit"
                    disabled={submitting}
                    loading={submitting}
                    sx={{ minWidth: 160 }}
                  >
                    {submitting ? 'Creating...' : 'Create Transaction'}
                  </ActionButton>
                </Box>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Диалог проверки цены */}
      <Dialog 
        open={priceValidationDialog} 
        onClose={() => setPriceValidationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            <Typography variant="h6">Price Required</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            The selected property unit doesn't have a price set in the system.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              You need to specify the transaction price. This price will be saved for future reference.
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Please use the price calculator above to set the appropriate price for this transaction.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPriceValidationDialog(false)}>
            I understand
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreateTransactionModal;