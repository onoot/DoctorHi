// modal-handlers.js
// Функции для работы с модальными окнами

/**
 * Функция для открытия модального окна добавления платежа
 * @param {string} transactionId - ID транзакции
 */
function openAddPaymentModal(transactionId) {
    console.log(`[PAYMENT] Opening add payment modal for transaction ${transactionId}`);
    
    // Устанавливаем ID транзакции
    const paymentTransactionId = document.getElementById('paymentTransactionId');
    if (paymentTransactionId) {
        paymentTransactionId.value = transactionId;
    }
    
    // Сбрасываем форму
    const form = document.getElementById('addPaymentForm');
    if (form) {
        form.reset();
    }
    
    // Обновляем отображение
    const receiptFileNameDisplay = document.getElementById('receiptFileNameDisplay');
    if (receiptFileNameDisplay) {
        receiptFileNameDisplay.textContent = 'No file chosen';
    }
    
    const receiptPreview = document.getElementById('receiptPreview');
    if (receiptPreview) {
        receiptPreview.innerHTML = '';
    }
    
    // Открываем модальное окно
    if (typeof openModal === 'function') {
        openModal('addPaymentModal');
    }
}

/**
 * Функция для открытия модального окна редактирования платежа
 * @param {string} transactionId - ID транзакции
 * @param {string} paymentId - ID платежа
 */
async function openEditPaymentModal(transactionId, paymentId) {
    console.log(`[PAYMENT] Opening edit payment modal for transaction ${transactionId}, payment ${paymentId}`);
    
    try {
        const response = await window.apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`);
        if (response.success && response.payment) {
            const payment = response.payment;
            
            // Устанавливаем ID транзакции
            const paymentTransactionId = document.getElementById('paymentTransactionId');
            if (paymentTransactionId) {
                paymentTransactionId.value = transactionId;
            }
            
            // Устанавливаем ID платежа
            const paymentIdInput = document.getElementById('paymentId');
            if (paymentIdInput) {
                paymentIdInput.value = payment.id;
            }
            
            // Устанавливаем сумму
            const paymentAmount = document.getElementById('paymentAmount');
            const rawPaymentAmount = document.getElementById('rawPaymentAmount');
            if (paymentAmount && window.formatPKR) {
                paymentAmount.value = window.formatPKR(payment.amount);
            }
            if (rawPaymentAmount) {
                rawPaymentAmount.value = payment.amount;
            }
            
            // Устанавливаем метод оплаты
            const paymentMethod = document.getElementById('paymentMethod');
            if (paymentMethod) {
                paymentMethod.value = payment.payment_method || payment.method;
            }
            
            // Устанавливаем статус
            const paymentStatus = document.getElementById('paymentStatus');
            if (paymentStatus) {
                paymentStatus.value = payment.status;
            }
            
            // Устанавливаем примечания
            const paymentNotes = document.getElementById('paymentNotes');
            if (paymentNotes) {
                paymentNotes.value = payment.notes || '';
            }
            
            // Обновляем конвертацию в USD
            if (typeof updateUSD === 'function') {
                await updateUSD(payment.amount);
            }
            
            // Открываем модальное окно
            if (typeof openModal === 'function') {
                openModal('editPaymentModal');
            }
        }
    } catch (error) {
        console.error('[PAYMENT] Error loading payment details:', error);
        if (typeof showNotification === 'function') {
            showNotification('error', 'Error loading payment details');
        }
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
        if (typeof showNotification === 'function') {
            showNotification('error', 'Transaction modal not found');
        }
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
    if (typeof generateCredentials === 'function') {
        generateCredentials();
    }
    
    // Открываем модальное окно
    if (typeof openModal === 'function') {
        openModal('createTransactionModal');
    }
}

/**
 * Функция для открытия модального окна просмотра транзакции
 * @param {string} transactionId - ID транзакции
 */
function openViewTransactionModal(transactionId) {
    if (!transactionId) {
        if (typeof showNotification === 'function') {
            showNotification('error', 'Transaction ID is required');
        }
        return;
    }
    
    // Устанавливаем ID транзакции в скрытое поле
    const currentTransactionIdElement = document.getElementById('currentTransactionId');
    if (currentTransactionIdElement) {
        currentTransactionIdElement.value = transactionId;
    }
    
    // Открываем модальное окно
    if (typeof openModal === 'function') {
        openModal('viewTransactionModal');
    }
    
    // Загружаем данные транзакции
    if (typeof loadTransactionDetails === 'function') {
        loadTransactionDetails(transactionId);
    }
}

/**
 * Инициализация обработчиков модальных окон
 */
function initModalHandlers() {
    console.log('[MODALS] Initializing modal handlers');
    
    // КРИТИЧЕСКИ ВАЖНЫЙ обработчик для кнопки "New Transaction"
    const createBtn = document.getElementById('createTransaction');
    if (createBtn) {
        createBtn.addEventListener('click', function() {
            if (typeof openCreateTransactionModal === 'function') {
                openCreateTransactionModal();
            } else {
                console.error('openCreateTransactionModal function is not defined');
                if (typeof showNotification === 'function') {
                    showNotification('error', 'Transaction modal function not available');
                }
            }
        });
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
                newOwnerId: 'Please select a new owner',
                totalAmount: 'Please enter a valid amount',
                witness1Name: 'Witness 1 name is required',
                witness1CNIC: 'Witness 1 CNIC is required',
                witness2Name: 'Witness 2 name is required',
                witness2CNIC: 'Witness 2 CNIC is required'
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
                if (typeof showNotification === 'function') {
                    showNotification('error', 'Please fill in all required fields');
                }
                return;
            }
            
            try {
                const formData = {
                    property_id: document.getElementById('propertyId').value,
                    new_owner_id: document.getElementById('newOwnerId').value,
                    total_amount: window.parseNumber ? window.parseNumber(document.getElementById('totalAmount').value) : parseFloat(document.getElementById('totalAmount').value),
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
                
                const response = await window.apiRequest('/v1/admin/transactions', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                
                if (response.success) {
                    if (typeof showNotification === 'function') {
                        showNotification('success', 'Transaction created successfully');
                    }
                    if (typeof closeModal === 'function') {
                        closeModal('createTransactionModal');
                    }
                    // Перезагружаем список транзакций
                    if (typeof loadTransactions === 'function') {
                        await loadTransactions();
                    }
                } else {
                    throw new Error(response.message || 'Failed to create transaction');
                }
            } catch (error) {
                console.error('Error creating transaction:', error);
                if (typeof showNotification === 'function') {
                    showNotification('error', 'Error creating transaction: ' + error.message);
                }
            }
        });
    }
    
    // Обработчик для кнопок отмены
    document.querySelectorAll('.cancel-payment-btn, .cancel-transaction-btn, .cancel-user-btn').forEach(button => {
        button.addEventListener('click', () => {
            if (typeof closeModal === 'function') {
                closeModal('addPaymentModal');
                closeModal('editPaymentModal');
                closeModal('createTransactionModal');
                closeModal('addUserModal');
            }
        });
    });
    
    console.log('[MODALS] Modal handlers initialized');
}

// Прикрепляем функции к глобальному объекту
window.openAddPaymentModal = openAddPaymentModal;
window.openEditPaymentModal = openEditPaymentModal;
window.openCreateTransactionModal = openCreateTransactionModal;
window.openViewTransactionModal = openViewTransactionModal;
window.initModalHandlers = initModalHandlers;