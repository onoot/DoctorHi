// init-handlers.js
// Инициализация всех обработчиков

/**
 * Инициализация всех обработчиков приложения
 */
function initAllHandlers() {
    console.log('[HANDLERS] Initializing all handlers');
    
    // Проверяем существование функций перед вызовом
    if (typeof initModalHandlers === 'function') {
        initModalHandlers();
    } else {
        console.warn('[HANDLERS] initModalHandlers function not available');
    }
    
    if (typeof initUserModalHandlers === 'function') {
        initUserModalHandlers();
    }
    
    if (typeof initTransactionHandlers === 'function') {
        initTransactionHandlers();
    }
    
    if (typeof initFileHandlers === 'function') {
        initFileHandlers();
    }
    
    if (typeof initPaymentHandlers === 'function') {
        initPaymentHandlers();
    }
    
    if (typeof initTransferRequestHandlers === 'function') {
        initTransferRequestHandlers();
    }
    
    if (typeof initSearchHandlers === 'function') {
        initSearchHandlers();
    }
    
    if (typeof initAuthHandlers === 'function') {
        initAuthHandlers();
    }
    
    if (typeof initCurrencyConverter === 'function') {
        initCurrencyConverter();
    }
    
    if (typeof initPaymentScheduleHandlers === 'function') {
        initPaymentScheduleHandlers();
    }
    
    if (typeof initActionHandlers === 'function') {
        initActionHandlers();
    }
    
    console.log('[HANDLERS] All handlers initialized successfully');
}

/**
 * Инициализация приложения после полной загрузки DOM
 */
function initApp() {
    console.log('[APP] Initializing application...');
    
    // Инициализация навигации
    if (typeof initNavigation === 'function') {
        initNavigation();
    } else {
        console.warn('[APP] initNavigation function not available');
    }
    
    // Инициализация всех обработчиков
    initAllHandlers();
    
    // Инициализация начальной секции
    const initialSection = 'transactions';
    console.log(`[NAVIGATION] Setting initial section: ${initialSection}`);
    
    if (typeof navigateToSection === 'function') {
        navigateToSection(initialSection);
    } else {
        console.error('[NAVIGATION] navigateToSection function not available');
    }
    
    console.log('[APP] Application initialized successfully');
}

/**
 * Генерация логина и пароля для пользователя
 */
function generateCredentials() {
    const userLogin = document.getElementById('userLogin');
    const userPassword = document.getElementById('userPassword');
    
    if (userLogin) {
        // Генерация логина (буквы и цифры, 8 символов)
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let login = '';
        for (let i = 0; i < 8; i++) {
            login += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        userLogin.value = login;
    }
    
    if (userPassword) {
        // Генерация пароля (буквы, цифры и символы, 12 символов)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        userPassword.value = password;
    }
}

// Прикрепляем функции к глобальному объекту
window.initAllHandlers = initAllHandlers;
window.initApp = initApp;
window.generateCredentials = generateCredentials;

// Запуск приложения после полной загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('[APP] DOM content loaded, initializing app');
    
    // Инициализация приложения
    initApp();
    
    // Добавляем обработчик для кнопки "New Transaction"
    const createTransactionBtn = document.getElementById('createTransaction');
    if (createTransactionBtn) {
        createTransactionBtn.addEventListener('click', function() {
            if (typeof openCreateTransactionModal === 'function') {
                openCreateTransactionModal();
            } else {
                console.error('openCreateTransactionModal function is not defined');
                if (typeof showNotification === 'function') {
                    showNotification('error', 'Transaction modal function not available');
                }
            }
        });
        console.log('[INIT] Create transaction button handler attached');
    } else {
        console.warn('[INIT] Create transaction button not found');
    }
    
    // Инициализация генератора учетных данных
    if (document.getElementById('userLogin') || document.getElementById('userPassword')) {
        generateCredentials();
    }
    
    // Обработчик для кнопок регенерации учетных данных
    document.querySelector('.regenerate-login-btn')?.addEventListener('click', function() {
        generateCredentials();
    });
    
    document.querySelector('.regenerate-password-btn')?.addEventListener('click', function() {
        generateCredentials();
    });
});

// Обработчик формы добавления платежа
document.addEventListener('DOMContentLoaded', function() {
    const addPaymentForm = document.getElementById('addPaymentForm');
    if (addPaymentForm) {
        addPaymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const transactionId = document.getElementById('paymentTransactionId')?.value;
            // Исправлено: используем правильный id поля и парсим число корректно
            const amountInput = document.getElementById('addPaymentModal_paymentAmount');
            let amount = amountInput ? amountInput.value : '';
            amount = window.parseNumber ? window.parseNumber(amount) : parseFloat(amount.replace(/[^\d.\-]/g, ''));
            const payment_method = document.getElementById('addPaymentModal_paymentMethod')?.value;
            const status = document.getElementById('addPaymentModal_paymentStatus')?.value;
            const notes = document.getElementById('addPaymentModal_paymentNotes')?.value;
            const receiptFile = document.getElementById('addPaymentModal_receiptFile')?.files[0];

            if (!transactionId) {
                if (typeof showNotification === 'function') {
                    showNotification('error', 'Transaction ID not found');
                }
                return;
            }

            if (!amount || isNaN(amount) || amount <= 0) {
                if (typeof showNotification === 'function') {
                    showNotification('error', 'Amount must be greater than 0');
                }
                return;
            }

            try {
                let paymentResponse;
                if (receiptFile) {
                    const formData = new FormData();
                    formData.append('amount', amount);
                    formData.append('payment_method', payment_method);
                    formData.append('status', status);
                    formData.append('notes', notes || '');
                    formData.append('receipt', receiptFile);
                    paymentResponse = await fetch(`${window.API_BASE_URL}/v1/admin/transactions/${transactionId}/payments`, {
                        method: 'POST',
                        credentials: 'include',
                        body: formData
                    }).then(r => r.json());
                } else {
                    const paymentData = { amount, payment_method, status, notes };
                    paymentResponse = await window.apiRequest(`/v1/admin/transactions/${transactionId}/payments`, {
                        method: 'POST',
                        body: JSON.stringify(paymentData)
                    });
                }
                if (paymentResponse.success && paymentResponse.payment) {
                    if (typeof showNotification === 'function') {
                        showNotification('success', 'Payment added successfully');
                    }
                    if (typeof closeModal === 'function') {
                        closeModal('addPaymentModal');
                    }
                    if (typeof loadTransactionPayments === 'function') {
                        await loadTransactionPayments(transactionId);
                    }
                }
            } catch (error) {
                console.error('Error adding payment:', error);
                if (typeof showNotification === 'function') {
                    showNotification('error', error.message || 'Error adding payment');
                }
            }
        });
    }
});

// Обработчик для кнопки сохранения платежа
const savePaymentBtn = document.getElementById('savePayment');
if (savePaymentBtn) {
    savePaymentBtn.addEventListener('click', async function() {
        const transactionId = document.getElementById('paymentTransactionId')?.value;
        const paymentId = document.getElementById('paymentId')?.value;
        const amount = parseNumber(document.getElementById('paymentAmount')?.value);
        const method = document.getElementById('paymentMethod')?.value;
        const status = document.getElementById('paymentStatus')?.value;
        const notes = document.getElementById('paymentNotes')?.value;
        const receiptFile = document.getElementById('receiptFile')?.files[0];
        if (!transactionId) {
            showNotification('error', 'Transaction ID not found');
            return;
        }
        if (amount <= 0) {
            showNotification('error', 'Amount must be greater than 0 payment');
            return;
        }
        try {
            let response;
            if (paymentId) {
                // Обновление платежа (оставим как есть, можно доработать аналогично)
                const paymentData = { amount, payment_method: method, status, notes };
                response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`, {
                    method: 'PUT',
                    body: JSON.stringify(paymentData)
                });
                if (response.success) {
                    showNotification('success', 'Payment updated successfully');
                    // Можно реализовать обновление чека через PUT с FormData, если нужно
                    closeModal('editPaymentModal');
                    await loadTransactionDetails(transactionId);
                } else {
                    throw new Error(response.message || 'Failed to update payment');
                }
            } else {
                // СОЗДАНИЕ платежа: если есть файл — отправляем FormData
                if (receiptFile) {
                    const formData = new FormData();
                    formData.append('amount', amount);
                    formData.append('payment_method', method);
                    formData.append('status', status);
                    formData.append('notes', notes || '');
                    formData.append('receipt', receiptFile);
                    response = await fetch(`${API_BASE_URL}/v1/admin/transactions/${transactionId}/payments`, {
                        method: 'POST',
                        credentials: 'include',
                        body: formData
                    }).then(r => r.json());
                } else {
                    const paymentData = { amount, payment_method: method, status, notes };
                    response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments`, {
                        method: 'POST',
                        body: JSON.stringify(paymentData)
                    });
                }
                if (response.success && response.payment) {
                    showNotification('success', 'Payment added successfully');
                    closeModal('addPaymentModal');
                    await loadTransactionDetails(transactionId);
                } else {
                    throw new Error(response.message || 'Failed to create payment');
                }
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            showNotification('error', 'Error processing payment: ' + error.message);
        }
    });
}