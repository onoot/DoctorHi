// transaction-handlers.js
// Функции для работы с транзакциями

/**
 * Функция для обновления суммы транзакции
 * @param {number} newAmount - Новая сумма транзакции
 */
async function updateTransactionAmount(newAmount) {
    const transactionId = document.getElementById('currentTransactionId')?.value;
    
    if (!transactionId) {
        showNotification('error', 'Transaction ID not found');
        return;
    }
    
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/amount`, {
            method: 'PUT',
            body: JSON.stringify({ amount: newAmount })
        });
        
        if (response.success) {
            // Обновляем отображение суммы
            const totalAmountView = document.getElementById('totalAmountView');
            if (totalAmountView) {
                totalAmountView.textContent = formatPKR(newAmount);
            }
            
            showNotification('success', 'Transaction amount updated successfully');
            
            // Обновляем оставшуюся сумму
            await loadTransactionDetails(transactionId);
        } else {
            throw new Error(response.message || 'Failed to update transaction amount');
        }
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
        // Проверяем наличие объекта witnesses в ответе
        if (transaction.witnesses) {
            // Заполняем форму свидетелей в модальном окне
            if (transaction.witnesses.witness1) {
                document.getElementById('witness1Name').value = transaction.witnesses.witness1.name || '';
                document.getElementById('witness1CNIC').value = transaction.witnesses.witness1.cnic || '';
                document.getElementById('witness1Phone').value = transaction.witnesses.witness1.phone || '';
            }
            
            if (transaction.witnesses.witness2) {
                document.getElementById('witness2Name').value = transaction.witnesses.witness2.name || '';
                document.getElementById('witness2CNIC').value = transaction.witnesses.witness2.cnic || '';
                document.getElementById('witness2Phone').value = transaction.witnesses.witness2.phone || '';
            }
        } else {
            console.warn('No witnesses data found in transaction');
            // Очищаем поля, если свидетелей нет
            document.getElementById('witness1Name').value = '';
            document.getElementById('witness1CNIC').value = '';
            document.getElementById('witness1Phone').value = '';
            document.getElementById('witness2Name').value = '';
            document.getElementById('witness2CNIC').value = '';
            document.getElementById('witness2Phone').value = '';
        }
    } catch (error) {
        console.error('Error displaying witnesses:', error);
        showNotification('error', 'Error displaying witnesses information');
    }
}

/**
 * Функция для отображения документов транзакции
 * @param {Object} transaction - Данные транзакции
 */
function displayTransactionDocuments(transaction) {
    const agreementFile = document.getElementById('agreementFile');
    const videoFile = document.getElementById('videoFile');
    const proofDocuments = document.getElementById('proofDocuments');
    
    if (!agreementFile || !videoFile || !proofDocuments) {
        console.warn('Document containers not found. Skipping document display.');
        return;
    }
    
    // Очистка контейнеров
    agreementFile.innerHTML = '';
    videoFile.innerHTML = '';
    proofDocuments.innerHTML = '';
    
    // Проверка наличия файлов
    if (transaction.files && transaction.files.agreement) {
        transaction.files.agreement.forEach(file => {
            const fileLink = document.createElement('a');
            fileLink.href = `${API_BASE_URL}/v1/admin/files/${file.id}`;
            fileLink.target = '_blank';
            fileLink.textContent = file.name || 'Agreement Document';
            agreementFile.appendChild(fileLink);
        });
    } else {
        agreementFile.textContent = 'No agreement files uploaded';
    }
    
    if (transaction.files && transaction.files.video) {
        transaction.files.video.forEach(file => {
            const fileLink = document.createElement('a');
            fileLink.href = `${API_BASE_URL}/v1/admin/files/${file.id}`;
            fileLink.target = '_blank';
            fileLink.textContent = file.name || 'Video Document';
            videoFile.appendChild(fileLink);
        });
    } else {
        videoFile.textContent = 'No video files uploaded';
    }
    
    if (transaction.files && transaction.files.proof) {
        transaction.files.proof.forEach(file => {
            const fileLink = document.createElement('a');
            fileLink.href = `${API_BASE_URL}/v1/admin/files/${file.id}`;
            fileLink.target = '_blank';
            fileLink.textContent = file.name || 'Proof Document';
            proofDocuments.appendChild(fileLink);
        });
    } else {
        proofDocuments.textContent = 'No proof documents uploaded';
    }
}

/**
 * Функция для обновления информации о свидетелях
 */
function updateWitnesses() {
    const transactionId = document.getElementById('currentTransactionId')?.value;
    if (!transactionId) {
        showNotification('error', 'Transaction ID not found');
        return;
    }
    
    const witness1 = {
        name: document.getElementById('witness1Name')?.value,
        cnic: document.getElementById('witness1CNIC')?.value,
        phone: document.getElementById('witness1Phone')?.value
    };
    
    const witness2 = {
        name: document.getElementById('witness2Name')?.value,
        cnic: document.getElementById('witness2CNIC')?.value,
        phone: document.getElementById('witness2Phone')?.value
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
            
            // Получаем элементы
            const transactionIdEl = document.getElementById('transactionId');
            const propertyNameEl = document.getElementById('propertyName');
            const previousOwnerEl = document.getElementById('previousOwner');
            const newOwnerEl = document.getElementById('newOwner');
            const statusEl = document.getElementById('transactionStatus');
            const createdAtEl = document.getElementById('createdAt');
            const totalAmountViewEl = document.getElementById('totalAmountView');
            const paidAmountEl = document.getElementById('paidAmount');
            const remainingAmountEl = document.getElementById('remainingAmount');
            
            // Проверяем существование элементов
            if (!transactionIdEl || !propertyNameEl || !previousOwnerEl || !newOwnerEl || 
                !statusEl || !createdAtEl || !totalAmountViewEl || !paidAmountEl || !remainingAmountEl) {
                console.error('One or more transaction detail elements not found');
                return;
            }
            
            // Заполняем основную информацию о сделке
            transactionIdEl.textContent = transaction.id;
            propertyNameEl.textContent = transaction.property_name || transaction.property_id || 'N/A';
            previousOwnerEl.textContent = transaction.previous_owner_name || 'N/A';
            newOwnerEl.textContent = transaction.new_owner_name || 'N/A';
            
            // Обновляем статус
            statusEl.textContent = transaction.status;
            statusEl.className = `status-badge ${transaction.status}`;
            
            // Обновляем дату создания
            createdAtEl.textContent = new Date(transaction.created_at).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            // Обновляем сумму
            totalAmountViewEl.textContent = formatPKR(transaction.total_amount);
            paidAmountEl.textContent = formatPKR(transaction.paid_amount);
            
            // Используем payment_summary, если доступен, иначе вычисляем вручную
            if (transaction.payment_summary) {
                remainingAmountEl.textContent = formatPKR(transaction.payment_summary.remaining_amount);
            } else {
                const remainingAmount = parseFloat(transaction.total_amount) - parseFloat(transaction.paid_amount);
                remainingAmountEl.textContent = formatPKR(remainingAmount);
            }
            
            // Отображаем свидетелей
            displayWitnesses(transaction);
            
            // Отображаем документы
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
 * Функция для обновления статуса транзакции
 * @param {string} transactionId - ID транзакции
 * @param {string} status - Новый статус транзакции
 */
async function updateTransactionStatus(transactionId, status) {
    // Добавляем подтверждение перед действием
    let confirmationMessage;
    if (status === 'approved') {
        confirmationMessage = 'Are you sure you want to approve this transaction?';
    } else if (status === 'rejected') {
        confirmationMessage = 'Are you sure you want to reject this transaction?';
    } else {
        confirmationMessage = 'Are you sure you want to update this transaction status?';
    }

    if (!confirm(confirmationMessage)) {
        return; // Отмена действия, если пользователь нажал "Cancel"
    }

    try {
        let notes = null;
        if (status === 'rejected') {
            notes = prompt('Please provide a reason for rejection:');
            if (notes === null) return; // Пользователь нажал Cancel в prompt
        }

        const response = await apiRequest(`/v1/admin/transactions/${transactionId}`, {
            method: 'PUT',
            body: JSON.stringify({
                status,
                reason: notes
            })
        });

        if (response && response.success) {
            showNotification('success', `Transaction ${status} successfully`);
            loadTransactions(); // Обновляем список транзакций
        } else {
            const errorMessage = response?.message || 'Error updating transaction';
            showNotification('error', errorMessage);
        }
    } catch (error) {
        console.error('Error updating transaction status:', error);
        showNotification('error', 'Failed to update transaction status');
    }
}

/**
 * Инициализация обработчиков для транзакций
 */
function initTransactionHandlers() {
    // Обработчик для кнопки редактирования суммы
    const editAmountBtn = document.querySelector('.edit-amount-btn');
    if (editAmountBtn) {
        editAmountBtn.addEventListener('click', function() {
            const amountEditSection = document.getElementById('amountEditSection');
            if (amountEditSection) {
                amountEditSection.style.display = amountEditSection.style.display === 'block' ? 'none' : 'block';
                
                // Если секция открыта, устанавливаем фокус на поле ввода
                if (amountEditSection.style.display === 'block') {
                    const newTotalAmount = document.getElementById('newTotalAmount');
                    if (newTotalAmount) {
                        newTotalAmount.focus();
                        newTotalAmount.select();
                    }
                }
            }
        });
    }
    
    // Обработчик для кнопки сохранения суммы
    const saveAmountBtn = document.querySelector('.save-amount-btn');
    if (saveAmountBtn) {
        saveAmountBtn.addEventListener('click', function() {
            const newAmount = parseFloat(document.getElementById('newTotalAmount')?.value);
            if (!isNaN(newAmount) && newAmount > 0) {
                updateTransactionAmount(newAmount);
                const amountEditSection = document.getElementById('amountEditSection');
                if (amountEditSection) {
                    amountEditSection.style.display = 'none';
                }
            } else {
                showNotification('error', 'Please enter a valid amount');
            }
        });
    }
    
    // Обработчик для кнопки отмены редактирования суммы
    const cancelAmountBtn = document.querySelector('.cancel-amount-btn');
    if (cancelAmountBtn) {
        cancelAmountBtn.addEventListener('click', function() {
            const amountEditSection = document.getElementById('amountEditSection');
            if (amountEditSection) {
                amountEditSection.style.display = 'none';
            }
        });
    }
    
    // Обработчик для кнопки сохранения свидетелей
    const updateWitnessesBtn = document.querySelector('.update-witnesses-btn');
    if (updateWitnessesBtn) {
        updateWitnessesBtn.addEventListener('click', updateWitnesses);
    }
    
    // Обработчик для кнопок действий с транзакцией
    document.addEventListener('click', function(e) {
        const button = e.target.closest('[data-action]');
        if (!button) return;
        
        const action = button.getAttribute('data-action');
        const category = button.getAttribute('data-category');
        
        switch (action) {
            case 'upload-modal':
                openUploadModal(category);
                break;
            case 'upload-multiple':
                openMultiplUploadModal();
                break;
            case 'edit-amount':
                const amountEditSection = document.getElementById('amountEditSection');
                if (amountEditSection) {
                    amountEditSection.style.display = amountEditSection.style.display === 'block' ? 'none' : 'block';
                }
                break;
            case 'save-amount':
                const newAmount = parseFloat(document.getElementById('newTotalAmount')?.value);
                if (!isNaN(newAmount) && newAmount > 0) {
                    updateTransactionAmount(newAmount);
                } else {
                    showNotification('error', 'Please enter a valid amount');
                }
                break;
            case 'cancel-amount':
                const cancelAmountSection = document.getElementById('amountEditSection');
                if (cancelAmountSection) {
                    cancelAmountSection.style.display = 'none';
                }
                break;
            case 'add-payment':
                openAddPaymentModal();
                break;
        }
    });
}

// Прикрепляем функции к глобальному объекту
window.updateTransactionAmount = updateTransactionAmount;
window.displayWitnesses = displayWitnesses;
window.displayTransactionDocuments = displayTransactionDocuments;
window.updateWitnesses = updateWitnesses;
window.loadTransactionDetails = loadTransactionDetails;
window.updateTransactionStatus = updateTransactionStatus;
window.initTransactionHandlers = initTransactionHandlers;

// Автоматическая инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем существование элементов транзакций
    if (document.getElementById('transactions') || document.getElementById('viewTransactionModal')) {
        initTransactionHandlers();
    }
});