// src/components/modals/AddPaymentModal.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Grid,
  Chip,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useApi } from '../context/ApiContext';
import { useNotification } from '../context/NotificationContext';
import { formatPKR } from '../utils/formatNumber';
import { getExchangeRate } from '../utils/currency';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import FileThumbnail from '../common/FileThumbnail';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const AddPaymentModal = ({ isOpen, onClose, transactionId, onUpdated, transactionData }) => {
  const { http } = useApi();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [usdValue, setUsdValue] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'cash',
    payment_date: new Date(),
    notes: '',
    status: 'pending',
  });

  // Рассчет USD при изменении суммы
  const calculateUSD = async (amount) => {
    try {
      const rate = await getExchangeRate();
      const usd = (parseFloat(amount) * rate).toFixed(2);
      setUsdValue(usd);
    } catch (error) {
      console.warn('Failed to calculate USD:', error);
      setUsdValue('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    
    // Очистить ошибки
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    
    // Рассчитать USD для суммы
    if (name === 'amount' && value) {
      calculateUSD(value);
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, payment_date: date }));
    if (errors.payment_date) {
      setErrors(prev => ({ ...prev, payment_date: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверка размера файла (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'File size must be less than 5MB');
        return;
      }
      
      // Проверка типа файла
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        showNotification('error', 'Only JPEG, PNG and PDF files are allowed');
        return;
      }
      
      setReceiptFile(file);
      showNotification('success', 'File selected successfully. It will be uploaded with payment.');
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0';
    }
    
    if (!formData.payment_date) {
      newErrors.payment_date = 'Payment date is required';
    }
    
    // Проверка на превышение общей суммы
    if (transactionData) {
      const paidAmount = parseFloat(transactionData.paid_amount || 0);
      const totalAmount = parseFloat(transactionData.total_amount || 0);
      const newPaymentAmount = parseFloat(formData.amount || 0);
      
      if (paidAmount + newPaymentAmount > totalAmount) {
        newErrors.amount = `Payment exceeds remaining amount. Remaining: ${formatPKR(totalAmount - paidAmount)}`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('error', 'Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('payment_method', formData.payment_method);
      formDataToSend.append('payment_date', formData.payment_date.toISOString());
      formDataToSend.append('status', formData.status);
      formDataToSend.append('notes', formData.notes || '');
      
      if (receiptFile) {
        formDataToSend.append('receipt', receiptFile);
      }
      
      const res = await http.post(`/v1/admin/transactions/${transactionId}/payments`, formDataToSend);
      
      if (res.success) {
        showNotification('success', 'Payment added successfully with receipt!');
        onUpdated?.();
        handleClose();
      } else {
        throw new Error(res.message || 'Failed to add payment');
      }
    } catch (err) {
      console.error('Error adding payment:', err);
      showNotification('error', `Failed to add payment: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount: '',
      payment_method: 'cash',
      payment_date: new Date(),
      notes: '',
      status: 'pending',
    });
    setUsdValue('');
    setReceiptFile(null);
    setErrors({});
    onClose();
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const getRemainingAmount = () => {
    if (!transactionData) return 0;
    const paid = parseFloat(transactionData.paid_amount || 0);
    const total = parseFloat(transactionData.total_amount || 0);
    return total - paid;
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online', label: 'Online Payment' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'warning' },
    { value: 'completed', label: 'Completed', color: 'success' },
    { value: 'failed', label: 'Failed', color: 'error' },
  ];

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: 'primary.main',
        color: 'primary.contrastText', 
        fontWeight: 600
      }}>
        Add New Payment
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {/* Информация о транзакции */}
          {transactionData && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Transaction: <strong>{transactionData.property_name}</strong>
              </Typography>
              <Typography variant="body2">
                Total Amount: <strong>{formatPKR(transactionData.total_amount)}</strong>
              </Typography>
              <Typography variant="body2">
                Already Paid: <strong>{formatPKR(transactionData.paid_amount || 0)}</strong>
              </Typography>
              <Typography variant="body2">
                Remaining: <strong style={{ color: 'red' }}>{formatPKR(getRemainingAmount())}</strong>
              </Typography>
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Сумма */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Amount (PKR)"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                type="number"
                error={!!errors.amount}
                helperText={errors.amount || "Enter the payment amount"}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₨</Typography>,
                  inputProps: { 
                    min: "0",
                    step: "0.01"
                  }
                }}
              />
              {usdValue && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  ≈ ${usdValue} USD
                </Typography>
              )}
            </Grid>

            {/* Дата платежа */}
            <Grid item xs={12} md={6} sx={{ minWidth: '300px' }}> 
  <FormControl fullWidth error={!!errors.payment_date}>
    <TextField
      label="Payment Date *"
      type="date"
      value={formatDateForInput(formData.payment_date)}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value) : new Date();
        handleDateChange(date);
      }}
      InputLabelProps={{ shrink: true }}
      error={!!errors.payment_date}
      helperText={errors.payment_date}
    />
  </FormControl>
</Grid>

            {/* Метод платежа */}
            <Grid item xs={12} md={6} sx={{ minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  label="Payment Method"
                >
                  {paymentMethods.map(method => (
                    <MenuItem key={method.value} value={method.value}>
                      {method.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Статус */}
            <Grid item xs={12} mt={3} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  {statusOptions.map(status => (
                    <MenuItem key={status.value} value={status.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {status.label} 
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Файл квитанции */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Receipt (Optional)
                </Typography>
                
                {/* Миниатюра загруженного файла */}
                {receiptFile && (
                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <FileThumbnail 
                        file={receiptFile} 
                        onRemove={handleRemoveFile}
                      />
                      <Box>
                        <Typography variant="body2">
                          {receiptFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(receiptFile.size / 1024).toFixed(1)} KB
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          File will be uploaded with payment
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
                
                {/* Кнопка загрузки */}
                <Button
                  component="label"
                  variant="outlined"
                  fullWidth
                  startIcon={<UploadIcon />}
                  sx={{ py: 1.5 }}
                >
                  {receiptFile ? 'Change Receipt' : 'Select Receipt File'}
                  <VisuallyHiddenInput
                    type="file"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                  />
                </Button>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Supported formats: JPG, PNG, PDF (max 5MB)
                </Typography>
              </Box>
            </Grid>

            {/* Заметки */}
            <Grid item xs={12} width={'100%'}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes (Optional)"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Enter any notes about this payment..."
                variant="outlined"
              />
            </Grid>

            {/* Важные заметки */}
            <Grid item xs={12} width={'100%'}>
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Important:</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  • File is uploaded together with payment data
                </Typography>
                <Typography variant="body2">
                  • Amount cannot exceed the remaining transaction balance
                </Typography>
                <Typography variant="body2">
                  • Payment and receipt are saved together
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Adding Payment...' : 'Add Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPaymentModal;