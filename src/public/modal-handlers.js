// modal-handlers.js
// ТОЛЬКО открытие/закрытие модалок + заполнение выпадающих списков перед открытием

/**
 * Функция для открытия модального окна добавления платежа
 * @param {string} transactionId - ID транзакции
 */
function openAddPaymentModal(transactionId) {
    console.log(`[PAYMENT] Opening add payment modal for transaction ${transactionId}`);
    
    const paymentTransactionId = document.getElementById('paymentTransactionId');
    if (paymentTransactionId) paymentTransactionId.value = transactionId;
    
    const form = document.getElementById('addPaymentForm');
    if (form) form.reset();
    
    const receiptFileNameDisplay = document.getElementById('receiptFileNameDisplay');
    if (receiptFileNameDisplay) receiptFileNameDisplay.textContent = 'No file chosen';
    
    const receiptPreview = document.getElementById('receiptPreview');
    if (receiptPreview) receiptPreview.innerHTML = '';
    
    if (typeof openModal === 'function') openModal('addPaymentModal');
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
            
            const paymentTransactionId = document.getElementById('paymentTransactionId');
            if (paymentTransactionId) paymentTransactionId.value = transactionId;
            
            const paymentIdInput = document.getElementById('paymentId');
            if (paymentIdInput) paymentIdInput.value = payment.id;
            
            const paymentAmount = document.getElementById('paymentAmount');
            const rawPaymentAmount = document.getElementById('rawPaymentAmount');
            if (paymentAmount && window.formatPKR) paymentAmount.value = window.formatPKR(payment.amount);
            if (rawPaymentAmount) rawPaymentAmount.value = payment.amount;
            
            const paymentMethod = document.getElementById('paymentMethod');
            if (paymentMethod) paymentMethod.value = payment.payment_method || payment.method;
            
            const paymentStatus = document.getElementById('paymentStatus');
            if (paymentStatus) paymentStatus.value = payment.status;
            
            const paymentNotes = document.getElementById('paymentNotes');
            if (paymentNotes) paymentNotes.value = payment.notes || '';
            
            if (typeof updateUSD === 'function') await updateUSD(payment.amount);
            
            if (typeof openModal === 'function') openModal('editPaymentModal');
        }
    } catch (error) {
        console.error('[PAYMENT] Error loading payment details:', error);
        if (typeof showNotification === 'function') showNotification('error', 'Error loading payment details');
    }
}

/**
 * Заполняет выпадающие списки в модальном окне создания транзакции
 */
function populateCreateTransactionModal() {
    const propertySelect = document.getElementById('createTransactionModal_propertyId');
    const ownerSelect = document.getElementById('createTransactionModal_newOwnerId');
    
    if (!propertySelect && !ownerSelect) return;
    
    // === СВОЙСТВА ===
    if (propertySelect) {
        propertySelect.innerHTML = '<option value="">Select Property</option>';
        
        const propertiesData = localStorage.getItem('transactionProperties');
        if (propertiesData) {
            try {
                const properties = JSON.parse(propertiesData);
                if (typeof properties === 'object' && properties !== null) {
                    Object.keys(properties).forEach(category => {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = category;
                        if (Array.isArray(properties[category])) {
                            properties[category].forEach(property => {
                                const option = document.createElement('option');
                                option.value = property.id;
                                option.textContent = `${property.name} (${property.id})`;
                                optgroup.appendChild(option);
                            });
                        }
                        propertySelect.appendChild(optgroup);
                    });
                }
            } catch (e) {
                console.error('Error parsing properties from localStorage:', e);
                propertySelect.innerHTML = '<option value="">Error loading properties</option>';
            }
        } else {
            propertySelect.innerHTML = '<option value="">No properties available</option>';
        }
    }
    
    // === ПОЛЬЗОВАТЕЛИ ===
    if (ownerSelect) {
        ownerSelect.innerHTML = '<option value="">Select New Owner</option>';
        
        const usersData = localStorage.getItem('users');
        if (usersData) {
            try {
                const users = JSON.parse(usersData);
                if (Array.isArray(users)) {
                    const activeUsers = users.filter(user => user.role === 'user' && user.status === 'active');
                    if (activeUsers.length === 0) {
                        ownerSelect.innerHTML = '<option value="">No active users available</option>';
                    } else {
                        activeUsers.forEach(user => {
                            const option = document.createElement('option');
                            option.value = user.id;
                            option.textContent = `${user.name} (${user.cnic})`;
                            ownerSelect.appendChild(option);
                        });
                    }
                } else {
                    ownerSelect.innerHTML = '<option value="">Invalid user data format</option>';
                }
            } catch (e) {
                console.error('Error parsing users from localStorage:', e);
                ownerSelect.innerHTML = '<option value="">Error loading users</option>';
            }
        } else {
            ownerSelect.innerHTML = '<option value="">No users available</option>';
        }
    }
}

/**
 * Модифицированная функция для открытия модального окна создания транзакции
 */
function openCreateTransactionModal() {
    console.log('[TRANSACTION] Opening create transaction modal');
    
    const modal = document.getElementById('createTransactionModal');
    if (!modal) {
        console.error('[TRANSACTION] Create transaction modal not found in DOM');
        if (typeof showNotification === 'function') showNotification('error', 'Transaction modal not found');
        return;
    }
    
    const form = document.getElementById('createTransactionForm');
    if (form) form.reset();
    
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    if (typeof generateCredentials === 'function') generateCredentials();
    
    // 🔥 КРИТИЧЕСКИЙ ШАГ: ЗАПОЛНЯЕМ ВЫПАДАЮЩИЕ СПИСКИ ДО ОТКРЫТИЯ
    populateCreateTransactionModal();
    
    if (typeof openModal === 'function') openModal('createTransactionModal');
}

/**
 * Функция для открытия модального окна просмотра транзакции
 * @param {string} transactionId - ID транзакции
 */
function openViewTransactionModal(transactionId) {
    if (!transactionId) {
        if (typeof showNotification === 'function') showNotification('error', 'Transaction ID is required');
        return;
    }
    
    const currentTransactionIdElement = document.getElementById('currentTransactionId');
    if (currentTransactionIdElement) currentTransactionIdElement.value = transactionId;
    
    if (typeof openModal === 'function') openModal('viewTransactionModal');
    
    // Загрузка данных — это не задача этого файла!
    // Она делается в transaction.js → loadTransactionDetails()
}

// Универсальные функции управления модальными окнами
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

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hide');
        modal.classList.remove('show');
        setTimeout(() => modal.classList.remove('hide'), 300);
    }
}

// Инициализация обработчиков
function initModalHandlers() {
    document.querySelectorAll('.modal-close, .close').forEach(button => {
        button.addEventListener('click', () => closeModal(button.getAttribute('data-modal')));
    });

    document.addEventListener('click', event => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
    
    console.log('[MODALS] Modal handlers initialized');
}

// Прикрепляем к глобальному объекту
window.openAddPaymentModal = openAddPaymentModal;
window.openEditPaymentModal = openEditPaymentModal;
window.openCreateTransactionModal = openCreateTransactionModal;
window.openViewTransactionModal = openViewTransactionModal;
window.initModalHandlers = initModalHandlers;
window.closeModal = closeModal;
window.openModal = openModal;