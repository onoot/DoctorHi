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

// Универсальная функция для открытия модальных окон
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        modal.classList.remove('hide');
        return true;
    }
    console.error(`Modal with ID "${modalId}" not found`);
    return false;
}

// Универсальная функция для закрытия модальных окон
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hide');
        modal.classList.remove('show');
        
        // Удаляем класс hide после завершения анимации
        setTimeout(() => {
            modal.classList.remove('hide');
        }, 300);
    }
}

// Инициализация обработчиков для модальных окон
function initModalHandlers() {
    // Обработчик для кнопок закрытия модальных окон
    document.querySelectorAll('.modal-close, .close').forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            closeModal(modalId);
        });
    });

    // Закрытие модального окна при клике на overlay
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
    
    // Другие обработчики модальных окон
    console.log('[MODALS] Modal handlers initialized');
}

// Прикрепляем функции к глобальному объекту
window.openAddPaymentModal = openAddPaymentModal;
window.openEditPaymentModal = openEditPaymentModal;
window.openCreateTransactionModal = openCreateTransactionModal;
window.openViewTransactionModal = openViewTransactionModal;
window.initModalHandlers = initModalHandlers;
window.closeModal = closeModal;
window.openModal = openModal;