// src/components/modals/EditPaymentModal.jsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Grid,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import { useApi } from '../context/ApiContext';
import { useNotification } from '../context/NotificationContext';
import { formatPKR } from '../utils/formatNumber';
import { getExchangeRate } from '../utils/currency';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import FileThumbnail from '../common/FileThumbnail';
import paymentsAPI from '../api/paymentsAPI';

// Константы для выбора
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'online', label: 'Online Payment' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'paid', label: 'Paid', color: 'success' },
  { value: 'failed', label: 'Failed', color: 'error' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
];

// Стилизованный компонент для загрузки файлов
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

const EditPaymentModal = ({ open, onClose, transactionId, paymentId, onUpdated, transactionData }) => {
  const { showNotification } = useNotification();
  
  // Состояния
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payment, setPayment] = useState(null);
  const [usdValue, setUsdValue] = useState('');
  
  // Форма
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: '',
    payment_method: '',
    status: '',
    notes: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [receiptFile, setReceiptFile] = useState(null);
  const [removeExistingReceipt, setRemoveExistingReceipt] = useState(false);
  
  // Ref для debounce
  const exchangeRateTimer = useRef(null);
  const exchangeRateCache = useRef(null);

  // Сброс формы
  const resetForm = useCallback(() => {
    setFormData({
      amount: '',
      payment_date: '',
      payment_method: '',
      status: '',
      notes: ''
    });
    setFormErrors({});
    setReceiptFile(null);
    setRemoveExistingReceipt(false);
    setUsdValue('');
  }, []);

  // Загрузка платежа
  useEffect(() => {
    if (!open || !paymentId) return;

    const loadPayment = async () => {
      try {
        setLoading(true);
        
        // Сначала проверяем, есть ли платеж в transactionData
        if (transactionData?.payments) {
          const existingPayment = transactionData.payments.find(p => p.id == paymentId);
          
          if (existingPayment) {
            setPayment(existingPayment);
            setFormData({
              amount: existingPayment.amount || '',
              payment_date: existingPayment.payment_date ? existingPayment.payment_date.split('T')[0] : '',
              payment_method: existingPayment.payment_method || '',
              status: existingPayment.status || '',
              notes: existingPayment.notes || ''
            });
            
            if (existingPayment.amount) {
              try {
                // Используем кэш курса валют
                if (!exchangeRateCache.current) {
                  exchangeRateCache.current = await getExchangeRate();
                }
                const usd = (parseFloat(existingPayment.amount) * exchangeRateCache.current).toFixed(2);
                setUsdValue(usd);
              } catch (rateError) {
                console.warn('Failed to get exchange rate:', rateError);
              }
            }
            return;
          }
        }

        // Если нет в transactionData, загружаем через API
        const paymentData = await paymentsAPI.getPaymentById(transactionId, paymentId);
        setPayment(paymentData);
        setFormData({
          amount: paymentData.amount || '',
          payment_date: paymentData.payment_date ? paymentData.payment_date.split('T')[0] : '',
          payment_method: paymentData.payment_method || '',
          status: paymentData.status || '',
          notes: paymentData.notes || ''
        });
        
        if (paymentData.amount) {
          try {
            // Используем кэш курса валют
            if (!exchangeRateCache.current) {
              exchangeRateCache.current = await getExchangeRate();
            }
            const usd = (parseFloat(paymentData.amount) * exchangeRateCache.current).toFixed(2);
            setUsdValue(usd);
          } catch (rateError) {
            console.warn('Failed to get exchange rate:', rateError);
          }
        }
      } catch (err) {
        console.error('Error loading payment:', err);
        showNotification('error', err.message || 'Failed to load payment');
      } finally {
        setLoading(false);
      }
    };
    
    if (open) {
      resetForm();
      loadPayment();
    }
    
    // Cleanup
    return () => {
      if (exchangeRateTimer.current) {
        clearTimeout(exchangeRateTimer.current);
      }
    };
  }, [open, paymentId, transactionId, transactionData, showNotification, resetForm]);

  // Получение объекта существующей квитанции
  const existingReceiptFile = useMemo(() => {
    if (!payment || removeExistingReceipt) return null;
    
    const receiptPath = payment.receipt?.path || payment.file_path;
    
    if (!receiptPath) {
      return null;
    }
    
    const receiptName = payment.receipt?.name || receiptPath?.split('/').pop() || 'receipt';
    const receiptType = payment.receipt?.type || 'application/octet-stream';
    const receiptSize = payment.receipt?.size || 0;
    
    let previewUrl = receiptPath;
    if (previewUrl.startsWith('../') || previewUrl.startsWith('./')) {
      previewUrl = previewUrl.replace(/^\.\.\/|^\.\//, '');
    }
    if (previewUrl.startsWith('/')) {
      previewUrl = previewUrl.substring(1);
    }
    
    const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    previewUrl = `${apiBaseUrl}/uploads/${previewUrl}`;
    
    return {
      name: receiptName,
      type: receiptType,
      size: receiptSize,
      previewUrl: previewUrl,
      path: receiptPath
    };
  }, [payment, removeExistingReceipt]);

  // Валидация формы
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!formData.amount) {
      errors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Amount must be a positive number';
    }
    
    if (!formData.payment_date) {
      errors.payment_date = 'Payment date is required';
    }
    
    if (!formData.payment_method) {
      errors.payment_method = 'Payment method is required';
    }
    
    if (!formData.status) {
      errors.status = 'Status is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.amount, formData.payment_date, formData.payment_method, formData.status]);

  // Функция обновления USD значения с debounce
  const updateUsdValue = useCallback(async (amount) => {
    if (!amount || isNaN(amount)) {
      setUsdValue('');
      return;
    }

    // Отменяем предыдущий таймер
    if (exchangeRateTimer.current) {
      clearTimeout(exchangeRateTimer.current);
    }

    // Устанавливаем новый таймер
    exchangeRateTimer.current = setTimeout(async () => {
      try {
        // Используем кэш курса валют или получаем новый
        if (!exchangeRateCache.current) {
          exchangeRateCache.current = await getExchangeRate();
        }
        const usd = (parseFloat(amount) * exchangeRateCache.current).toFixed(2);
        setUsdValue(usd);
      } catch (rateError) {
        console.warn('Failed to get exchange rate:', rateError);
        setUsdValue('');
      }
    }, 500); // Ждем 500мс после последнего изменения
  }, []);

  // Обработчик изменения полей
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newFormData = { ...prev, [name]: value };
      
      // Очищаем ошибку для этого поля
      if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: undefined }));
      }
      
      // Обновляем USD значение при изменении суммы
      if (name === 'amount') {
        updateUsdValue(value);
      }
      
      return newFormData;
    });
  }, [formErrors, updateUsdValue]);

  // Обработчик загрузки файла
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setRemoveExistingReceipt(false);
    }
  }, []);

  // Замена файла
  const handleReplaceFile = useCallback(() => {
    document.getElementById('receipt-file-input').click();
  }, []);

  // Удаление файла
  const handleRemoveFile = useCallback(() => {
    setReceiptFile(null);
    if (existingReceiptFile) {
      setRemoveExistingReceipt(true);
    }
  }, [existingReceiptFile]);

  // Сохранение изменений
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }
    
    try {
      setSaving(true);
      
      // Подготавливаем данные для отправки
      const paymentData = {
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        status: formData.status,
        notes: formData.notes || ''
      };
      
      // Если нужно удалить существующую квитанцию
      if (removeExistingReceipt) {
        paymentData.remove_receipt = true;
      }
      
      // Отправляем запрос
      const updatedPayment = await paymentsAPI.updatePayment(
        transactionId,
        paymentId,
        paymentData,
        receiptFile
      );
      
      showNotification('success', 'Payment updated successfully');
      
      if (onUpdated) {
        onUpdated(updatedPayment);
      }
      
      onClose();
    } catch (err) {
      console.error('Error updating payment:', err);
      showNotification('error', err.message || 'Failed to update payment');
    } finally {
      setSaving(false);
    }
  }, [formData, removeExistingReceipt, receiptFile, transactionId, paymentId, onUpdated, onClose, showNotification, validateForm]);

  const handleClose = useCallback(() => {
    // Очищаем таймеры при закрытии
    if (exchangeRateTimer.current) {
      clearTimeout(exchangeRateTimer.current);
    }
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  if (!open) {
    return null;
  }

  // Определяем, показывать ли кнопку замены файла
  const showReplaceButton = existingReceiptFile && !receiptFile && !removeExistingReceipt;
  const showNewFilePreview = receiptFile;
  const showNoFile = !existingReceiptFile && !receiptFile && !removeExistingReceipt;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, minHeight: 500 }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6">
          Payment #{paymentId}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : payment ? (
          <Box sx={{ mt: 2 }}>
            {/* Информация о платеже */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Payment ID: <strong>#{payment.id}</strong>
              </Typography>
              <Typography variant="body2">
                Created: <strong>{payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'}</strong>
              </Typography>
              <Typography variant="body2">
                Last Updated: <strong>{payment.updated_at ? new Date(payment.updated_at).toLocaleDateString() : 'N/A'}</strong>
              </Typography>
            </Alert>

            {/* Секция квитанции */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Receipt
              </Typography>
              
              <Stack spacing={2}>
                {/* Существующая квитанция */}
                {!removeExistingReceipt && existingReceiptFile && !receiptFile && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Current Receipt
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FileThumbnail 
                        file={existingReceiptFile}
                        onRemove={handleRemoveFile}
                        showRemove={true}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {existingReceiptFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {existingReceiptFile.size ? `${(existingReceiptFile.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            href={existingReceiptFile.previewUrl}
                            target="_blank"
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            href={existingReceiptFile.previewUrl}
                            download
                          >
                            Download
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={handleReplaceFile}
                            startIcon={<AttachFileIcon />}
                          >
                            Replace
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Новая загруженная квитанция */}
                {receiptFile && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      New Receipt
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FileThumbnail 
                        file={receiptFile}
                        onRemove={handleRemoveFile}
                        showRemove={true}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {receiptFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {(receiptFile.size / 1024).toFixed(1)} KB
                        </Typography>
                        <Typography variant="caption" color="success.main" display="block">
                          Ready to upload
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Нет квитанции - показываем кнопку загрузки */}
                {showNoFile && (
                  <Box>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<AttachFileIcon />}
                      disabled={saving}
                    >
                      Upload Receipt
                      <VisuallyHiddenInput 
                        id="receipt-file-input"
                        type="file" 
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png,.gif"
                      />
                    </Button>
                    <FormHelperText>
                      Accepted formats: PDF, JPG, PNG, GIF
                    </FormHelperText>
                  </Box>
                )}

                {/* Скрытый инпут для замены файла */}
                <VisuallyHiddenInput 
                  id="receipt-file-input"
                  type="file" 
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  style={{ display: 'none' }}
                />
              </Stack>
            </Box>

            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Payment Details
              </Typography>
            </Divider>

            <Grid container spacing={3}>
              {/* Сумма */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  name="amount"
                  label="Amount (PKR)"
                  type="number"
                  value={formData.amount}
                  onChange={handleChange}
                  error={!!formErrors.amount}
                  helperText={formErrors.amount}
                  disabled={saving}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₨</Typography>,
                  }}
                />
                {usdValue && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    ≈ ${usdValue} USD
                  </Typography>
                )}
              </Grid>

              {/* Дата платежа */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  name="payment_date"
                  label="Payment Date"
                  type="date"
                  value={formData.payment_date}
                  onChange={handleChange}
                  error={!!formErrors.payment_date}
                  helperText={formErrors.payment_date}
                  disabled={saving}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Метод платежа */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!formErrors.payment_method}>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    label="Payment Method"
                    disabled={saving}
                  >
                    {PAYMENT_METHODS.map(method => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.payment_method && (
                    <FormHelperText>{formErrors.payment_method}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Статус */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!formErrors.status}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    label="Status"
                    disabled={saving}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip 
                          label={STATUS_OPTIONS.find(s => s.value === selected)?.label || selected}
                          size="small" 
                          color={STATUS_OPTIONS.find(s => s.value === selected)?.color || 'default'}
                          sx={{ height: 24 }}
                        />
                      </Box>
                    )}
                  >
                    {STATUS_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        <Chip 
                          label={option.label}
                          size="small" 
                          color={option.color}
                          sx={{ height: 24 }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.status && (
                    <FormHelperText>{formErrors.status}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Заметки */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="notes"
                  label="Notes"
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="Add any additional notes here..."
                />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to load payment details. Please try again.
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          color="inherit"
          disabled={saving}
          startIcon={<CloseIcon />}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={saving || loading}
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPaymentModal;