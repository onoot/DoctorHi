// payment-handlers.js
// Функции для работы с платежами

/**
 * Отображение платежей в таблице с учетом чеков
 * @param {Array} payments - Массив платежей
 * @param {Array} receiptFiles - Массив файлов чеков
 */
function displayPaymentsWithReceipts(payments, receiptFiles = []) {
    const tableBody = document.getElementById('paymentsTableBody');
    if (!tableBody) return;

    // Создаем маппинг чеков по временной метке для быстрого поиска
    const receiptMap = new Map();
    receiptFiles.forEach(receipt => {
        // Используем timestamp как ключ для поиска
        const timestamp = new Date(receipt.created_at).getTime();
        receiptMap.set(timestamp, receipt);
    });

    if (!payments || payments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No payments found</td></tr>';
        return;
    }

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
        const statusText = formatStatus(payment.status);

        // Ищем чек, соответствующий платежу по дате
        const paymentTimestamp = new Date(payment.created_at).getTime();
        const matchingReceipt = receiptMap.get(paymentTimestamp);

        let receiptHtml = '<span class="no-receipt">No receipt</span>';
        if (matchingReceipt) {
            receiptHtml = `
                <div class="receipt-preview">
                    <img src="${API_BASE_URL}/v1/admin/files/${matchingReceipt.id}" 
                         alt="Receipt" class="receipt-thumbnail">
                    <div class="receipt-actions">
                        <button class="action-btn btn-view" 
                                onclick="window.open('${API_BASE_URL}/v1/admin/files/${matchingReceipt.id}', '_blank')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="action-btn btn-delete" 
                                onclick="deleteReceiptFile(${matchingReceipt.id}, ${payment.transaction_id}, 'receipt')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }

        html += `
            <tr>
                <td>${payment.id}</td>
                <td>${amount}</td>
                <td>${formatPaymentMethod(payment.payment_method)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${new Date(payment.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}</td>
                <td>${receiptHtml}</td>
                <td>
                    <button class="action-btn btn-edit edit-payment-btn" 
                            data-payment-id="${payment.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn btn-delete delete-payment-btn" 
                            data-payment-id="${payment.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;

    // Инициализируем обработчики действий с платежами
    setupPaymentActionHandlers(payment.transaction_id);
}

/**
 * Удаление файла чека
 * @param {string} fileId - ID файла
 * @param {string} transactionId - ID транзакции
 * @param {string} category - Категория файла
 */
async function deleteReceiptFile(fileId, transactionId, category) {
    if (!confirm(`Вы уверены, что хотите удалить файл?`)) {
        return;
    }

    try {
        const response = await apiRequest(`/v1/admin/files/${fileId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showNotification('success', 'File deleted successfully');

            // Перезагружаем детали транзакции для обновления данных
            await loadTransactionDetails(transactionId);
            // Принудительная перерисовка для анимации
    void modal.offsetWidth;

        } else {
            throw new Error(response.message || 'Failed to delete file');
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        showNotification('error', 'Error deleting file: ' + error.message);
    }
}

/**
 * Функция для удаления платежа
 * @param {string} paymentId - ID платежа
 * @param {string} transactionId - ID транзакции
 */
async function deletePayment(paymentId, transactionId) {
    if (!confirm('Are you sure you want to delete this payment?')) {
        return;
    }

    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showNotification('success', 'Payment deleted successfully');
            // Перезагружаем платежи и обновляем сумму
            await loadTransactionPayments(transactionId);
            await updateAmountSummary(transactionId);
        } else {
            throw new Error(response.message || 'Failed to delete payment');
        }
    } catch (error) {
        console.error('Error deleting payment:', error);
        showNotification('error', 'Error deleting payment: ' + error.message);
    }
}

/**
 * Функция для настройки обработчиков действий с платежами
 * @param {string} transactionId - ID транзакции
 */
function setupPaymentActionHandlers(transactionId) {
    // Удаляем существующие обработчики, чтобы избежать дублирования
    document.querySelectorAll('.edit-payment-btn, .delete-payment-btn').forEach(btn => {
        const clonedBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(clonedBtn, btn);
    });

    // Добавляем обработчики для редактирования платежей
    document.querySelectorAll('.edit-payment-btn').forEach(button => {
        button.addEventListener('click', function () {
            const paymentId = this.getAttribute('data-payment-id');
            openEditPaymentModal(transactionId, paymentId);
        });
    });

    // Добавляем обработчики для удаления платежей
    document.querySelectorAll('.delete-payment-btn').forEach(button => {
        button.addEventListener('click', function () {
            const paymentId = this.getAttribute('data-payment-id');
            deletePayment(paymentId, transactionId);
        });
    });
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
    const addPaymentBtn = document.querySelector('[data-action="add-payment"]');
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', function () {
            const transactionId = document.getElementById('currentTransactionId')?.value;
            if (transactionId) {
                openAddPaymentModal(transactionId);
            } else {
                showNotification('error', 'Transaction ID not found');
            }
        });
    }
   
    // Обработчик для кнопки отмены в модальных окнах платежей
    document.querySelectorAll('.cancel-payment-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            closeModal('addPaymentModal');
            closeModal('editPaymentModal');
        });
    });
}

// Прикрепляем функции к глобальному объекту
window.displayPaymentsWithReceipts = displayPaymentsWithReceipts;
window.deleteReceiptFile = deleteReceiptFile;
window.deletePayment = deletePayment;
window.setupPaymentActionHandlers = setupPaymentActionHandlers;
window.updateAmountSummary = updateAmountSummary;
window.formatPaymentMethod = formatPaymentMethod;
window.formatStatus = formatStatus;
window.getStatusClass = getStatusClass;
window.initPaymentHandlers = initPaymentHandlers;
window.openAddPaymentModal = openAddPaymentModal;
window.openEditPaymentModal = openEditPaymentModal;

// Автоматическая инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('paymentsTableBody')) {
        initPaymentHandlers();
    }

    // Назначаем обработчик для кнопки сохранения изменений платежа только один раз
    const saveEditPaymentBtn = document.querySelector('.save-payment-btn');
    if (saveEditPaymentBtn) {
        saveEditPaymentBtn.addEventListener('click', async function () {
            const transactionId = document.getElementById('editPaymentModal_transactionId')?.value;
            const paymentId = document.getElementById('editPaymentModal_paymentId')?.value;
            const amount = parseNumber(document.getElementById('editPaymentModal_paymentAmount')?.value);
            const method = document.getElementById('editPaymentModal_paymentMethod')?.value;
            const status = document.getElementById('editPaymentModal_paymentStatus')?.value;
            const notes = document.getElementById('editPaymentModal_paymentNotes')?.value;

            if (!transactionId || !paymentId) {
                showNotification('error', 'Transaction or Payment ID not found');
                return;
            }

            if (amount <= 0) {
                showNotification('error', 'Amount must be greater than 0');
                return;
            }

            try {
                const paymentData = {
                    amount,
                    payment_method: method,
                    status,
                    notes
                };

                const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`, {
                    method: 'PUT',
                    body: JSON.stringify(paymentData)
                });

                if (response.success) {
                    showNotification('success', 'Payment updated successfully');
                    closeModal('editPaymentModal');
                    await loadTransactionDetails(transactionId); // Обновляем данные
                } else {
                    throw new Error(response.message || 'Failed to update payment');
                }
            } catch (error) {
                console.error('Error updating payment:', error);
                showNotification('error', 'Error updating payment: ' + error.message);
            }
        });
    }
});