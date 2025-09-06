// modal-handlers.js
// Функции для работы с модальными окнами

/**
 * Функция для открытия модального окна добавления платежа
 */
function openAddPaymentModal() {
    // Получаем ID текущей транзакции
    const transactionIdElement = document.getElementById('currentTransactionId');
    if (!transactionIdElement || !transactionIdElement.value) {
        showNotification('error', 'Transaction ID not found');
        return;
    }
    
    const transactionId = transactionIdElement.value;
    
    // Устанавливаем ID транзакции
    document.getElementById('paymentTransactionId').value = transactionId;
    
    // Открываем модальное окно
    openModal('addPaymentModal');
}

/**
 * Функция для открытия модального окна редактирования платежа
 * @param {string} paymentId - ID платежа
 * @param {string} transactionId - ID транзакции
 */
function openEditPaymentModal(paymentId, transactionId) {
    // Получаем ID текущей транзакции
    const transactionIdElement = document.getElementById('currentTransactionId');
    if (!transactionIdElement || !transactionIdElement.value) {
        showNotification('error', 'Transaction ID not found');
        return;
    }
    
    transactionId = transactionIdElement.value;
    
    // Загружаем данные платежа
    apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`)
        .then(response => {
            if (response.success && response.payment) {
                const payment = response.payment;
                
                // Заполняем форму
                document.getElementById('paymentId').value = payment.id;
                document.getElementById('paymentAmount').value = payment.amount;
                document.getElementById('paymentMethod').value = payment.method;
                document.getElementById('paymentStatus').value = payment.status;
                document.getElementById('paymentNotes').value = payment.notes || '';
                
                // Открываем модальное окно
                openModal('editPaymentModal');
            }
        })
        .catch(error => {
            console.error('Error loading payment details:', error);
            showNotification('error', 'Error loading payment details');
        });
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

// Экспортируем функции
export { 
    openAddPaymentModal, 
    openEditPaymentModal, 
    openViewTransactionModal,
    initModalHandlers 
};