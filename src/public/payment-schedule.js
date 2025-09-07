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
            <label>Amount (PKR)</label>
            <div class="amount-input-container">
                <span class="currency-prefix">PKR</span>
                <input type="text" name="payment_amount" class="formatted-amount" placeholder="0.00" required>
            </div>
            <label>Due Date</label>
            <input type="date" name="payment_date" required>
            <button type="button" class="action-btn btn-delete remove-schedule-item" style="margin-top: 8px;">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
    `;
    
    container.appendChild(itemDiv);
    
    // Инициализируем обработчик для новой кнопки удаления
    const removeBtn = itemDiv.querySelector('.remove-schedule-item');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            this.closest('.payment-schedule-item').remove();
        });
    }
    
    // Инициализируем обработчик форматирования суммы
    const amountInput = itemDiv.querySelector('[name="payment_amount"]');
    if (amountInput) {
        amountInput.addEventListener('input', function() {
            const value = this.value.replace(/[^0-9.]/g, '');
            if (value) {
                this.value = formatPKR(value);
            }
        });
    }
}

/**
 * Инициализация обработчиков графика платежей
 */
function initPaymentScheduleHandlers() {
    // Обработчик для добавления элементов графика платежей
    const addScheduleBtn = document.querySelector('.add-payment-schedule-item');
    if (addScheduleBtn) {
        addScheduleBtn.addEventListener('click', addPaymentScheduleItem);
    }
    
    // Инициализация начального элемента графика платежей
    const scheduleContainer = document.getElementById('paymentSchedule');
    if (scheduleContainer && scheduleContainer.children.length === 0) {
        addPaymentScheduleItem();
    }
    
    // Инициализация обработчиков для существующих кнопок удаления
    document.querySelectorAll('.remove-schedule-item').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.payment-schedule-item').remove();
        });
    });
}

/**
 * Функция для сохранения графика платежей
 * @param {string} transactionId - ID транзакции
 */
async function savePaymentSchedule(transactionId) {
    try {
        const scheduleItems = [];
        document.querySelectorAll('#paymentSchedule .payment-schedule-item').forEach(item => {
            const amountInput = item.querySelector('[name="payment_amount"]');
            const dateInput = item.querySelector('[name="payment_date"]');
            
            if (amountInput && dateInput) {
                const amount = parseNumber(amountInput.value);
                const date = dateInput.value;
                
                if (amount > 0 && date) {
                    scheduleItems.push({
                        amount: amount,
                        due_date: date
                    });
                }
            }
        });
        
        if (scheduleItems.length === 0) {
            showNotification('error', 'Please add at least one payment schedule item');
            return false;
        }
        
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/schedule`, {
            method: 'POST',
            body: JSON.stringify({ schedule: scheduleItems })
        });
        
        if (response.success) {
            showNotification('success', 'Payment schedule saved successfully');
            return true;
        } else {
            throw new Error(response.message || 'Failed to save payment schedule');
        }
    } catch (error) {
        console.error('Error saving payment schedule:', error);
        showNotification('error', 'Error saving payment schedule: ' + error.message);
        return false;
    }
}

/**
 * Функция для загрузки и отображения графика платежей
 * @param {string} transactionId - ID транзакции
 */
async function loadPaymentSchedule(transactionId) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/schedule`);
        
        if (response.success && response.schedule && response.schedule.length > 0) {
            const scheduleContainer = document.getElementById('paymentSchedule');
            if (scheduleContainer) {
                // Очищаем контейнер
                scheduleContainer.innerHTML = '';
                
                // Добавляем элементы графика
                response.schedule.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'payment-schedule-item';
                    itemDiv.innerHTML = `
                        <div class="form-group">
                            <label>Amount (PKR)</label>
                            <div class="amount-input-container">
                                <span class="currency-prefix">PKR</span>
                                <input type="text" name="payment_amount" class="formatted-amount" 
                                       value="${formatPKR(item.amount)}" required>
                            </div>
                            <label>Due Date</label>
                            <input type="date" name="payment_date" value="${item.due_date}" required>
                            <button type="button" class="action-btn btn-delete remove-schedule-item" style="margin-top: 8px;">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    `;
                    scheduleContainer.appendChild(itemDiv);
                });
                
                // Инициализируем обработчики для новых элементов
                document.querySelectorAll('.remove-schedule-item').forEach(btn => {
                    btn.addEventListener('click', function() {
                        this.closest('.payment-schedule-item').remove();
                    });
                });
                
                // Инициализируем обработчики форматирования суммы
                document.querySelectorAll('#paymentSchedule [name="payment_amount"]').forEach(input => {
                    input.addEventListener('input', function() {
                        const value = this.value.replace(/[^0-9.]/g, '');
                        if (value) {
                            this.value = formatPKR(value);
                        }
                    });
                });
            }
        }
    } catch (error) {
        console.error('Error loading payment schedule:', error);
        // Не показываем ошибку, так как график платежей может отсутствовать
    }
}

/**
 * Функция для отображения текущего статуса графика платежей
 * @param {string} transactionId - ID транзакции
 */
async function displayPaymentScheduleStatus(transactionId) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/schedule/status`);
        
        if (response.success) {
            const statusContainer = document.getElementById('paymentScheduleStatus');
            if (statusContainer) {
                let html = '';
                
                if (response.upcoming_payments && response.upcoming_payments.length > 0) {
                    html += '<h4>Upcoming Payments:</h4><ul>';
                    response.upcoming_payments.forEach(payment => {
                        html += `<li>${new Date(payment.due_date).toLocaleDateString('en-GB')} - ${formatPKR(payment.amount)}</li>`;
                    });
                    html += '</ul>';
                }
                
                if (response.overdue_payments && response.overdue_payments.length > 0) {
                    html += '<h4 style="color: var(--danger);">Overdue Payments:</h4><ul>';
                    response.overdue_payments.forEach(payment => {
                        const overdueDays = Math.floor((new Date() - new Date(payment.due_date)) / (1000 * 60 * 60 * 24));
                        html += `<li style="color: var(--danger);">${new Date(payment.due_date).toLocaleDateString('en-GB')} - ${formatPKR(payment.amount)} (${overdueDays} days overdue)</li>`;
                    });
                    html += '</ul>';
                }
                
                if (!html) {
                    html = '<p>No payment schedule defined or all payments completed.</p>';
                }
                
                statusContainer.innerHTML = html;
            }
        }
    } catch (error) {
        console.error('Error loading payment schedule status:', error);
        const statusContainer = document.getElementById('paymentScheduleStatus');
        if (statusContainer) {
            statusContainer.innerHTML = '<p class="text-danger">Error loading payment schedule status</p>';
        }
    }
}

// Прикрепляем функции к глобальному объекту
window.addPaymentScheduleItem = addPaymentScheduleItem;
window.initPaymentScheduleHandlers = initPaymentScheduleHandlers;
window.savePaymentSchedule = savePaymentSchedule;
window.loadPaymentSchedule = loadPaymentSchedule;
window.displayPaymentScheduleStatus = displayPaymentScheduleStatus;

// Автоматическая инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('paymentSchedule')) {
        initPaymentScheduleHandlers();
    }
});