// payment-schedule.js
// Функции для работы с графиком платежей

/**
 * Добавление элемента графика платежей
 */
function addPaymentScheduleItem() {
    const container = document.getElementById('paymentSchedule');
    if (!container) {
        console.error('Payment schedule container not found');
        return;
    }
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'payment-schedule-item';
    itemDiv.innerHTML = `
        <div class="form-group">
            <input type="number" name="payment_amount" placeholder="Amount" required min="0" step="0.01">
            <input type="date" name="payment_date" required>
            <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">Remove</button>
        </div>
    `;
    
    container.appendChild(itemDiv);
}

/**
 * Обновление оставшейся суммы
 */
function updateRemainingAmount() {
    const totalAmountText = document.getElementById('totalAmountView')?.textContent?.replace(/,/g, '') || '0';
    const paidAmountText = document.getElementById('paidAmount')?.textContent?.replace(/,/g, '') || '0';

    const totalAmount = parseFloat(totalAmountText) || 0;
    const paidAmount = parseFloat(paidAmountText) || 0;
    const remainingAmount = totalAmount - paidAmount;

    // Форматируем оставшуюся сумму с разделителями тысяч
    const formattedRemaining = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(remainingAmount);

    const remainingAmountElement = document.getElementById('remainingAmount');
    if (remainingAmountElement) {
        remainingAmountElement.textContent = formattedRemaining;
    }
}

/**
 * Обновление статуса платежа
 * @param {string} paymentId - ID платежа
 * @param {string} status - Новый статус платежа
 */
async function updatePaymentStatus(paymentId, status) {
    try {
        const transactionId = document.getElementById('currentTransactionId')?.value;
        if (!transactionId) {
            showNotification('error', 'Transaction ID not found');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/v1/admin/transactions/${paymentId}/payment-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ 
                payment_status: status, 
                transactionId: transactionId 
            })
        });

        if (!response.ok) {
            showNotification('error', "Failed to update payment status");
            return;
        }

        const result = await response.json();

        if (result.status_updated_to_completed) {
            showNotification('success', 'Payment marked as paid and transaction status updated to Completed');
        } else {
            showNotification('success', 'Payment status updated successfully');
        }

        // Обновляем детали транзакции
        await loadTransactionDetails(transactionId);
        await updateRemainingAmount();
    } catch (error) {
        console.error('Error updating payment status:', error);
        showNotification('error', 'Failed to update payment status');
    }
}

/**
 * Инициализация обработчиков графика платежей
 */
function initPaymentScheduleHandlers() {
    // Обработчик для добавления элементов графика платежей
    document.querySelector('.add-payment-schedule-item')?.addEventListener('click', addPaymentScheduleItem);
    
    // Инициализация начального элемента графика платежей
    if (document.getElementById('paymentSchedule') && 
        document.getElementById('paymentSchedule').children.length === 0) {
        addPaymentScheduleItem();
    }
}