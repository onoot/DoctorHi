// modal-handlers.js
// Функции для работы с модальными окнами

/**
 * Функция для открытия модального окна добавления платежа
 * @param {string} transactionId - ID транзакции
 */
function openAddPaymentModal(transactionId) {
    console.log(`[PAYMENT] Opening add payment modal for transaction ${transactionId}`);
    
    // Устанавливаем ID транзакции
    document.getElementById('paymentTransactionId').value = transactionId;
    
    // Сбрасываем форму
    const form = document.getElementById('addPaymentForm');
    if (form) {
        form.reset();
    }
    
    // Обновляем отображение
    document.getElementById('receiptFileNameDisplay').textContent = 'No file chosen';
    document.getElementById('receiptPreview').innerHTML = '';
    
    // Открываем модальное окно
    openModal('addPaymentModal');
}

/**
 * Функция для открытия модального окна редактирования платежа
 * @param {string} transactionId - ID транзакции
 * @param {string} paymentId - ID платежа
 */
async function openEditPaymentModal(transactionId, paymentId) {
    console.log(`[PAYMENT] Opening edit payment modal for transaction ${transactionId}, payment ${paymentId}`);
    
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`);
        if (response.success && response.payment) {
            const payment = response.payment;
            
            // Заполняем форму
            document.getElementById('paymentTransactionId').value = transactionId;
            document.getElementById('paymentId').value = payment.id;
            document.getElementById('paymentAmount').value = formatPKR(payment.amount);
            document.getElementById('rawPaymentAmount').value = payment.amount;
            document.getElementById('paymentMethod').value = payment.method;
            document.getElementById('paymentStatus').value = payment.status;
            document.getElementById('paymentNotes').value = payment.notes || '';
            
            // Обновляем конвертацию в USD
            await updateUSD(payment.amount);
            
            // Открываем модальное окно
            openModal('editPaymentModal');
        }
    } catch (error) {
        console.error('[PAYMENT] Error loading payment details:', error);
        showNotification('error', 'Error loading payment details');
    }
}

/**
 * Функция для открытия модального окна создания транзакции
 */
function openCreateTransactionModal() {
    console.log('[TRANSACTION] Opening create transaction modal');
    
    // Проверяем существование модального окна
    const modal = document.getElementById('createTransactionModal');
    if (!modal) {
        console.error('[TRANSACTION] Create transaction modal not found in DOM');
        showNotification('error', 'Transaction modal not found');
        return;
    }
    
    // Сбрасываем форму
    const form = document.getElementById('createTransactionForm');
    if (form) {
        form.reset();
    }
    
    // Сбрасываем сообщения об ошибках
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
    
    // Генерируем логин и пароль
    generateCredentials();
    
    // Открываем модальное окно
    openModal('createTransactionModal');
}

/**
 * Функция для открытия модального окна просмотра транзакции
 * @param {string} transactionId - ID транзакции
 */
function openViewTransactionModal(transactionId) {
    if (!transactionId) {
        showNotification('error', 'Transaction ID is required');
        return;
    }
    
    // Устанавливаем ID транзакции в скрытое поле
    const currentTransactionIdElement = document.getElementById('currentTransactionId');
    if (currentTransactionIdElement) {
        currentTransactionIdElement.value = transactionId;
    }
    
    // Открываем модальное окно
    openModal('viewTransactionModal');
    
    // Загружаем данные транзакции
    loadTransactionDetails(transactionId);
}

/**
 * Инициализация обработчиков модальных окон
 */
function initModalHandlers() {
    // КРИТИЧЕСКИ ВАЖНЫЙ обработчик для кнопки "New Transaction"
    const createBtn = document.getElementById('createTransaction');
    if (createBtn) {
        createBtn.addEventListener('click', openCreateTransactionModal);
        console.log('[MODALS] Create transaction button handler attached');
    } else {
        console.warn('[MODALS] Create transaction button not found');
    }
    
    // Обработчик для отправки формы создания транзакции
    const submitCreateBtn = document.getElementById('submitCreateTransaction');
    if (submitCreateBtn) {
        submitCreateBtn.addEventListener('click', async function() {
            const form = document.getElementById('createTransactionForm');
            if (!form) {
                console.error('[MODALS] Create transaction form not found');
                return;
            }
            
            // Валидация формы
            let isValid = true;
            const requiredFields = form.querySelectorAll('[required]');
            const errorMessages = {
                propertyId: 'Please select a property',
                totalAmount: 'Please enter a valid amount'
            };
            
            requiredFields.forEach(field => {
                if (!field.value) {
                    isValid = false;
                    const errorElement = document.getElementById(`${field.id}Error`);
                    if (errorElement) {
                        errorElement.textContent = errorMessages[field.id] || 'This field is required';
                    }
                } else {
                    const errorElement = document.getElementById(`${field.id}Error`);
                    if (errorElement) {
                        errorElement.textContent = '';
                    }
                }
            });
            
            if (!isValid) {
                showNotification('error', 'Please fill in all required fields');
                return;
            }
            
            try {
                const formData = {
                    property_id: document.getElementById('propertyId').value,
                    new_owner_id: document.getElementById('newOwnerId').value,
                    total_amount: parseNumber(document.getElementById('totalAmount').value),
                    witnesses: {
                        witness1: {
                            name: document.getElementById('witness1Name').value,
                            cnic: document.getElementById('witness1CNIC').value,
                            phone: document.getElementById('witness1Phone').value
                        },
                        witness2: {
                            name: document.getElementById('witness2Name').value,
                            cnic: document.getElementById('witness2CNIC').value,
                            phone: document.getElementById('witness2Phone').value
                        }
                    }
                };
                
                const response = await apiRequest('/v1/admin/transactions', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                
                if (response.success) {
                    showNotification('success', 'Transaction created successfully');
                    closeModal('createTransactionModal');
                    // Перезагружаем список транзакций
                    if (typeof loadTransactions === 'function') {
                        await loadTransactions();
                    }
                } else {
                    throw new Error(response.message || 'Failed to create transaction');
                }
            } catch (error) {
                console.error('Error creating transaction:', error);
                showNotification('error', 'Error creating transaction: ' + error.message);
            }
        });
    }
    
    // Обработчик для кнопок отмены
    document.querySelectorAll('.cancel-payment-btn, .cancel-transaction-btn, .cancel-user-btn').forEach(button => {
        button.addEventListener('click', () => {
            closeModal('addPaymentModal');
            closeModal('editPaymentModal');
            closeModal('createTransactionModal');
            closeModal('addUserModal');
        });
    });
}

// Прикрепляем функции к глобальному объекту
window.openAddPaymentModal = openAddPaymentModal;
window.openEditPaymentModal = openEditPaymentModal;
window.openCreateTransactionModal = openCreateTransactionModal;
window.openViewTransactionModal = openViewTransactionModal;
window.initModalHandlers = initModalHandlers;

// Автоматическая инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    initModalHandlers();
});