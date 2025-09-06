// payment-handlers.js
// Функции для работы с платежами

/**
 * Функция для загрузки платежей транзакции
 * @param {string} transactionId - ID транзакции
 */
async function loadTransactionPayments(transactionId) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments`);
        if (response.success && Array.isArray(response.payments)) {
            const payments = response.payments;
            const tableBody = document.getElementById('paymentsTableBody');
            
            if (tableBody) {
                if (payments.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No payments found</td></tr>';
                } else {
                    let html = '';
                    payments.forEach(payment => {
                        const paymentDate = payment.payment_date ? 
                            new Date(payment.payment_date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit', 
                                year: 'numeric'
                            }) : 'N/A';
                        
                        const amount = formatPKR(payment.amount);
                        const statusClass = getStatusClass(payment.status);
                        
                        html += `
                            <tr>
                                <td>${payment.id}</td>
                                <td>${paymentDate}</td>
                                <td>${amount}</td>
                                <td>${formatPaymentMethod(payment.method)}</td>
                                <td class="${statusClass}">${formatStatus(payment.status)}</td>
                                <td>
                                    <button class="action-btn btn-edit edit-payment-btn" 
                                            data-payment-id="${payment.id}">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="action-btn btn-approve confirm-payment-btn" 
                                            data-payment-id="${payment.id}">
                                        <i class="fas fa-check"></i> Confirm
                                    </button>
                                </td>
                                <td>
                                    ${payment.receipt ? `
                                    <a href="${API_BASE_URL}/v1/admin/files/${payment.receipt_id}" target="_blank">
                                        <i class="fas fa-file-invoice"></i> View
                                    </a>` : 'No receipt'}
                                </td>
                            </tr>
                        `;
                    });
                    
                    tableBody.innerHTML = html;
                    
                    // Инициализируем обработчики действий с платежами
                    setupPaymentActionHandlers(transactionId);
                }
            }
        }
    } catch (error) {
        console.error('Error loading payments:', error);
        showNotification('error', 'Error loading payments');
    }
}

/**
 * Функция для настройки обработчиков действий с платежами
 * @param {string} transactionId - ID транзакции
 */
function setupPaymentActionHandlers(transactionId) {
    // Удаляем существующие обработчики, чтобы избежать дублирования
    document.querySelectorAll('.edit-payment-btn, .confirm-payment-btn').forEach(btn => {
        const clonedBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(clonedBtn, btn);
    });
    
    // Добавляем обработчики для редактирования платежей
    document.querySelectorAll('.edit-payment-btn').forEach(button => {
        button.addEventListener('click', function() {
            const paymentId = this.getAttribute('data-payment-id');
            openEditPaymentModal(paymentId, transactionId);
        });
    });
    
    // Добавляем обработчики для подтверждения платежей
    document.querySelectorAll('.confirm-payment-btn').forEach(button => {
        button.addEventListener('click', function() {
            const paymentId = this.getAttribute('data-payment-id');
            confirmPayment(paymentId, transactionId);
        });
    });
}

/**
 * Функция для подтверждения платежа
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
 * Функция для обновления суммарной информации о платежах
 * @param {string} transactionId - ID транзакции
 */
async function updateAmountSummary(transactionId) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/summary`);
        if (response.success) {
            // Обновляем отображение сумм
            const totalAmountView = document.getElementById('totalAmountView');
            const paidAmount = document.getElementById('paidAmount');
            
            if (totalAmountView) {
                totalAmountView.textContent = formatPKR(response.total_amount);
            }
            
            if (paidAmount) {
                paidAmount.textContent = formatPKR(response.paid_amount);
            }
            
            const remaining = parseFloat(response.total_amount) - parseFloat(response.paid_amount);
            document.getElementById('remainingAmount').textContent = formatPKR(remaining);
        }
    } catch (error) {
        console.error('Error loading transaction summary:', error);
    }
}

/**
 * Функция для форматирования метода оплаты
 * @param {string} method - Метод оплаты
 * @returns {string} - Отформатированный метод
 */
function formatPaymentMethod(method) {
    const methods = {
        'cash': 'Cash',
        'bank_transfer': 'Bank Transfer',
        'credit_card': 'Credit Card',
        'other': 'Other'
    };
    return methods[method] || method.charAt(0).toUpperCase() + method.slice(1);
}

/**
 * Функция для форматирования статуса платежа
 * @param {string} status - Статус платежа
 * @returns {string} - Отформатированный статус
 */
function formatStatus(status) {
    const statuses = {
        'pending': 'Pending',
        'paid': 'Paid',
        'cancelled': 'Cancelled'
    };
    return statuses[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Функция для получения CSS класса статуса
 * @param {string} status - Статус платежа
 * @returns {string} - CSS класс для статуса
 */
function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'paid': 'status-paid',
        'cancelled': 'status-cancelled'
    };
    return classes[status] || '';
}

/**
 * Инициализация обработчиков платежей
 */
function initPaymentHandlers() {
    // Обработчик для кнопки добавления платежа
    document.querySelector('[data-action="add-payment"]')?.addEventListener('click', function() {
        const transactionId = document.getElementById('currentTransactionId').value;
        openAddPaymentModal(transactionId);
    });
}

// Экспортируем функции
export { 
    loadTransactionPayments,
    setupPaymentActionHandlers,
    confirmPayment,
    updateAmountSummary,
    formatPaymentMethod,
    formatStatus,
    getStatusClass,
    initPaymentHandlers
};