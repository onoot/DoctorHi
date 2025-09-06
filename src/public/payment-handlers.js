// payment-handlers.js
// Обработчики для работы с платежами

/**
 * Добавление платежа
 */
async function addPayment() {
    const transactionId = document.getElementById('paymentTransactionId').value;
    const amountInput = document.getElementById('paymentAmount');
    const method = document.getElementById('paymentMethod').value;
    const status = document.getElementById('paymentStatus').value;
    const notes = document.getElementById('paymentNotes').value;
    const receiptFile = document.getElementById('receiptFile').files[0];
    
    const formData = new FormData();
    formData.append('amount', amountInput.value);
    formData.append('method', method);
    formData.append('status', status);
    formData.append('notes', notes);
    
    // Добавляем файл, если он выбран (поле должно называться 'receipt')
    if (receiptFile) {
        formData.append('receipt', receiptFile);
    }
    
    try {
        const response = await fetch(API_BASE_URL + `/v1/admin/transactions/${transactionId}/payments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const data = await response.json();
        if (response.ok) {
            closeModal('addPaymentModal');
            loadTransactionPayments(transactionId);
            loadTransactionDetails(transactionId);
            showNotification('success', 'Payment added successfully');
        } else {
            showNotification('error', data.message || 'Error adding payment');
        }
    } catch (error) {
        console.error('Error adding payment:', error);
        showNotification('error', error.message || 'Error adding payment');
    }
}

/**
 * Редактирование платежа
 * @param {string} paymentId - ID платежа
 * @param {string} transactionId - ID транзакции
 */
async function editPayment(paymentId, transactionId) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`);
        
        if (response.success && response.payment) {
            const payment = response.payment;
            
            // Заполняем форму
            document.getElementById('paymentId').value = payment.id;
            document.getElementById('paymentAmount').value = formatPKR(payment.amount);
            document.getElementById('paymentMethod').value = payment.method;
            document.getElementById('paymentStatus').value = payment.status;
            document.getElementById('paymentNotes').value = payment.notes || '';
            
            // Обновляем конвертацию в USD
            await updateUSD(payment.amount);
            
            // Открываем модальное окно
            openModal('editPaymentModal');
        } else {
            throw new Error(response.message || 'Failed to load payment details');
        }
    } catch (error) {
        console.error('Error loading payment details:', error);
        showNotification('error', 'Error loading payment details');
    }
}

/**
 * Сохранение изменений платежа
 */
async function savePaymentChanges() {
    const paymentId = document.getElementById('paymentId').value;
    const transactionId = document.getElementById('paymentTransactionId').value;
    const amountInput = document.getElementById('paymentAmount');
    const method = document.getElementById('paymentMethod').value;
    const status = document.getElementById('paymentStatus').value;
    const notes = document.getElementById('paymentNotes').value;
    
    // Парсим сумму
    const amount = parseNumber(amountInput.value);
    
    // Валидация
    if (isNaN(amount) || amount <= 0) {
        showNotification('error', 'Please enter a valid amount');
        return;
    }
    
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`, {
            method: 'PUT',
            body: JSON.stringify({
                amount,
                method,
                status,
                notes
            })
        });
        
        if (response.success) {
            showNotification('success', 'Payment updated successfully');
            closeModal('editPaymentModal');
            await loadTransactionPayments(transactionId);
            await updateAmountSummary(transactionId);
        } else {
            throw new Error(response.message || 'Failed to update payment');
        }
    } catch (error) {
        console.error('Error updating payment:', error);
        showNotification('error', error.message || 'Error updating payment');
    }
}

/**
 * Подтверждение платежа
 * @param {string} paymentId - ID платежа
 * @param {string} transactionId - ID транзакции
 */
async function confirmPayment(paymentId, transactionId) {
    if (!confirm('Are you sure you want to confirm this payment?')) {
        return;
    }
    
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'paid' })
        });
        
        if (response.success) {
            showNotification('success', 'Payment confirmed successfully');
            await loadTransactionPayments(transactionId);
            await updateAmountSummary(transactionId);
        } else {
            showNotification('error', 'Failed to confirm payment: ' + (response.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error confirming payment:', error);
        showNotification('error', 'Error confirming payment: ' + error.message);
    }
}

/**
 * Инициализация обработчиков для платежей
 */
function initPaymentHandlers() {
    // Обработчик для кнопки "Add Payment"
    document.querySelector('[data-action="add-payment"]')?.addEventListener('click', function() {
        const transactionId = document.getElementById('currentTransactionId').value;
        openAddPaymentModal(transactionId);
    });
    
    // Обработчик формы добавления платежа
    document.getElementById('addPaymentForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        addPayment();
    });
    
    // Обработчик формы редактирования платежа
    document.getElementById('editPaymentForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        savePaymentChanges();
    });
    
    // Обработчики для кнопок отмены
    document.querySelectorAll('.cancel-payment-btn').forEach(button => {
        button.addEventListener('click', () => {
            closeModal('editPaymentModal');
        });
    });
    
    // Инициализация обработчиков действий с платежами
    initPaymentActionHandlers();
}

/**
 * Инициализация обработчиков действий с платежами
 */
function initPaymentActionHandlers() {
    // Удаляем существующие обработчики, чтобы избежать дублирования
    document.querySelectorAll('.edit-payment-btn, .confirm-payment-btn').forEach(btn => {
        const clonedBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(clonedBtn, btn);
    });
    
    // Добавляем обработчики для редактирования платежей
    document.querySelectorAll('.edit-payment-btn').forEach(button => {
        button.addEventListener('click', function() {
            const paymentId = this.getAttribute('data-payment-id');
            const transactionId = document.getElementById('currentTransactionId').value;
            editPayment(paymentId, transactionId);
        });
    });
    
    // Добавляем обработчики для подтверждения платежей
    document.querySelectorAll('.confirm-payment-btn').forEach(button => {
        button.addEventListener('click', function() {
            const paymentId = this.getAttribute('data-payment-id');
            const transactionId = document.getElementById('currentTransactionId').value;
            confirmPayment(paymentId, transactionId);
        });
    });
}

// Экспортируем функции
export { 
    addPayment, 
    editPayment, 
    savePaymentChanges, 
    confirmPayment,
    initPaymentHandlers,
    initPaymentActionHandlers 
};