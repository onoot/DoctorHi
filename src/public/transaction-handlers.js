// transaction-handlers.js
// Функции для работы с транзакциями

/**
 * Функция для обновления суммы транзакции
 * @param {number} newAmount - Новая сумма транзакции
 */
async function updateTransactionAmount(newAmount) {
    const transactionId = document.getElementById('currentTransactionId').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/v1/admin/transactions/${transactionId}/amount`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ amount: newAmount })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update transaction amount');
        }
        
        const data = await response.json();
        
        // Обновляем отображение суммы
        const totalAmountView = document.getElementById('totalAmountView');
        if (totalAmountView) {
            totalAmountView.textContent = formatPKR(newAmount);
        }
        
        showNotification('success', 'Transaction amount updated successfully');
        
        // Обновляем оставшуюся сумму
        updateRemainingAmount();
        
    } catch (error) {
        console.error('Error updating transaction amount:', error);
        showNotification('error', 'Error updating transaction amount: ' + error.message);
    }
}

/**
 * Функция для отображения свидетелей
 * @param {Object} transaction - Данные транзакции
 */
function displayWitnesses(transaction) {
    try {
        // Заполняем форму свидетелей в модальном окне
        if (transaction.witness1) {
            document.getElementById('witness1Name').value = transaction.witness1.name || '';
            document.getElementById('witness1CNIC').value = transaction.witness1.cnic || '';
            document.getElementById('witness1Phone').value = transaction.witness1.phone || '';
        }
        
        if (transaction.witness2) {
            document.getElementById('witness2Name').value = transaction.witness2.name || '';
            document.getElementById('witness2CNIC').value = transaction.witness2.cnic || '';
            document.getElementById('witness2Phone').value = transaction.witness2.phone || '';
        }
    } catch (error) {
        console.error('Error displaying witnesses:', error);
    }
}

/**
 * Функция для обновления информации о свидетелях
 */
function updateWitnesses() {
    const transactionId = document.getElementById('currentTransactionId').value;
    
    const witness1 = {
        name: document.getElementById('witness1Name').value,
        cnic: document.getElementById('witness1CNIC').value,
        phone: document.getElementById('witness1Phone').value
    };
    
    const witness2 = {
        name: document.getElementById('witness2Name').value,
        cnic: document.getElementById('witness2CNIC').value,
        phone: document.getElementById('witness2Phone').value
    };
    
    try {
        apiRequest(`/v1/admin/transactions/${transactionId}/witnesses`, {
            method: 'PUT',
            body: JSON.stringify({ witness1, witness2 })
        })
        .then(response => {
            if (response.success) {
                showNotification('success', 'Witnesses updated successfully');
            } else {
                throw new Error(response.message || 'Failed to update witnesses');
            }
        })
        .catch(error => {
            console.error('Error updating witnesses:', error);
            showNotification('error', 'Error updating witnesses: ' + error.message);
        });
    } catch (error) {
        console.error('Error updating witnesses:', error);
        showNotification('error', 'Error updating witnesses: ' + error.message);
    }
}

/**
 * Функция для загрузки деталей транзакции
 * @param {string} transactionId - ID транзакции
 */
async function loadTransactionDetails(transactionId) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}`);
        
        if (response.success && response.transaction) {
            const transaction = response.transaction;
            const totalAmountView = document.getElementById('totalAmountView');
            const paidAmount = document.getElementById('paidAmount');
            
            // Обновляем отображение сумм
            if (totalAmountView) {
                totalAmountView.textContent = formatPKR(transaction.total_amount);
            }
            
            if (paidAmount) {
                paidAmount.textContent = formatPKR(transaction.paid_amount);
            }
            
            const remainingAmount = parseFloat(transaction.total_amount) - parseFloat(transaction.paid_amount);
            document.getElementById('remainingAmount').textContent = formatPKR(remainingAmount);
            
            // Вызываем функцию для отображения свидетелей
            displayWitnesses(transaction);
            displayTransactionDocuments(transaction);
        } else {
            console.error('Invalid transaction data format:', response);
            showNotification('error', 'Failed to load transaction details');
        }
    } catch (error) {
        console.error('Error loading transaction details:', error);
        showNotification('error', 'Error loading transaction details');
    }
}

/**
 * Инициализация обработчиков для транзакций
 */
function initTransactionHandlers() {
    // Обработчик для кнопки редактирования суммы
    document.querySelector('.edit-amount-btn')?.addEventListener('click', function() {
        document.getElementById('amountEditSection').style.display = 'block';
    });
    
    // Обработчик для кнопки сохранения суммы
    document.querySelector('.save-amount-btn')?.addEventListener('click', function() {
        const newAmount = parseFloat(document.getElementById('newTotalAmount').value);
        if (!isNaN(newAmount) && newAmount > 0) {
            updateTransactionAmount(newAmount);
            document.getElementById('amountEditSection').style.display = 'none';
        } else {
            alert('Please enter a valid amount');
        }
    });
    
    // Обработчик для кнопки отмены редактирования суммы
    document.querySelector('.cancel-amount-btn')?.addEventListener('click', function() {
        document.getElementById('amountEditSection').style.display = 'none';
    });
    
    // Обработчик для кнопки сохранения свидетелей
    document.querySelector('.update-witnesses-btn')?.addEventListener('click', updateWitnesses);
}