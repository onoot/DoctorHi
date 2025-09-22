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
    if (form) form.reset(); // ✅ Очищаем поля
    
    document.querySelectorAll('.error-message').forEach(el => el.textContent = ''); // ✅ Очищаем ошибки
    
    if (typeof generateCredentials === 'function') generateCredentials(); // ✅ Генерируем логин/пароль
    
    populateCreateTransactionModal();
    
    openModal('createTransactionModal'); 
}

/**
 * Функция для создания новой транзакции
 */
async function createTransaction() {
    console.log('[TRANSACTION] Attempting to create new transaction');
    
    // Получаем значения из формы
    const propertyId = document.getElementById('createTransactionModal_propertyId')?.value;
    const newOwnerId = document.getElementById('createTransactionModal_newOwnerId')?.value;
    const totalAmount = parseNumber(document.getElementById('createTransactionModal_totalAmount')?.value);
    const witness1Name = document.getElementById('createTransactionModal_witness1Name')?.value;
    const witness1CNIC = document.getElementById('createTransactionModal_witness1CNIC')?.value;
    const witness1Phone = document.getElementById('createTransactionModal_witness1Phone')?.value;
    const witness2Name = document.getElementById('createTransactionModal_witness2Name')?.value;
    const witness2CNIC = document.getElementById('createTransactionModal_witness2CNIC')?.value;
    const witness2Phone = document.getElementById('createTransactionModal_witness2Phone')?.value;

    // Валидация обязательных полей
    if (!propertyId) {
        showNotification('error', 'Please select a property');
        return;
    }
    if (!newOwnerId) {
        showNotification('error', 'Please select a new owner');
        return;
    }
    if (!totalAmount || totalAmount <= 0) {
        showNotification('error', 'Please enter a valid amount greater than 0');
        return;
    }
    if (!witness1Name || !witness1CNIC) {
        showNotification('error', 'Witness 1: Name and CNIC are required');
        return;
    }
    if (!witness2Name || !witness2CNIC) {
        showNotification('error', 'Witness 2: Name and CNIC are required');
        return;
    }

    try {
        // Подготавливаем данные для отправки
        const transactionData = {
            property_id: propertyId,
            new_owner_id: newOwnerId,
            total_amount: totalAmount,
            witnesses: {
                witness1: {
                    name: witness1Name,
                    cnic: witness1CNIC,
                    phone: witness1Phone || null
                },
                witness2: {
                    name: witness2Name,
                    cnic: witness2CNIC,
                    phone: witness2Phone || null
                }
            }
        };

        console.log('[TRANSACTION] Sending data:', transactionData);

        // Отправляем запрос на создание транзакции
        const response = await apiRequest('/v1/admin/transactions', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });

        if (response.success && response.transaction) {
            showNotification('success', 'Transaction created successfully');
            closeModal('createTransactionModal');
            loadTransactions(); // Обновляем список транзакций
        } else {
            throw new Error(response.message || 'Failed to create transaction');
        }
    } catch (error) {
        console.error('[TRANSACTION] Error creating transaction:', error);
        showNotification('error', error.message || 'Error creating transaction');
    }
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


// Прикрепляем к глобальному объекту
window.openAddPaymentModal = openAddPaymentModal;
window.openCreateTransactionModal = openCreateTransactionModal;
window.openViewTransactionModal = openViewTransactionModal;
window.createTransaction = createTransaction;

const modalCreateBtn = document.querySelector('.create-transaction-btn');
if (modalCreateBtn) {
    modalCreateBtn.replaceWith(modalCreateBtn.cloneNode(true));
    const freshBtn = document.querySelector('.create-transaction-btn');
    freshBtn.addEventListener('click', function (e) {
        e.preventDefault();
        createTransaction();
    });
}