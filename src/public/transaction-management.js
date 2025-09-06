// transaction-management.js


/**
 * Инициализация обработчиков ввода для полей сумм
 */
function initAmountInputHandlers() {
    // Обработчик для поля ввода суммы транзакции
    const totalAmountInput = document.getElementById('totalAmount');
    const usdOutput = document.getElementById('toUSD');
    
    if (totalAmountInput && usdOutput) {
        let rawValue = 0;
        let lastInputValue = '';
        
        // Сохраняем "сырое" значение во время ввода
        totalAmountInput.addEventListener('input', function(e) {
            // Сохраняем текущее значение для корректной обработки
            lastInputValue = this.value;
            
            // Чистим ввод, сохраняя цифры и разделители
            let cleanValue = this.value.replace(/[^0-9.,]/g, '')
                .replace(/(,)/g, '.') // Заменяем запятые на точки
                .replace(/(\..*)\./g, '$1'); // Удаляем лишние точки
                
            // Парсим значение
            const newRawValue = parseNumber(cleanValue);
            
            // Сохраняем сырое значение ТОЛЬКО если оно изменилось
            if (newRawValue !== rawValue) {
                rawValue = newRawValue;
                
                // Обновляем конвертацию в USD
                updateUSD(rawValue);
                
                // Форматируем отображаемое значение
                this.value = formatPKR(rawValue);
            }
        });
        
        // Восстанавливаем значение при фокусе
        totalAmountInput.addEventListener('focus', function() {
            this.value = rawValue.toString();
        });
        
        // Форматируем значение при потере фокуса
        totalAmountInput.addEventListener('blur', function() {
            if (lastInputValue === '') {
                this.value = '';
                rawValue = 0;
                updateUSD(0);
                return;
            }
            
            // Форматируем с разделителями тысяч
            this.value = formatPKR(rawValue);
        });
    }
    
    // Обработчик для поля ввода суммы платежа
    const paymentAmount = document.getElementById('paymentAmount');
    const rawPaymentAmount = document.getElementById('rawPaymentAmount');
    
    if (paymentAmount && rawPaymentAmount) {
        let rawValue = 0;
        
        // Удаляем существующие обработчики, чтобы избежать дублирования
        const newPaymentAmount = paymentAmount.cloneNode(true);
        paymentAmount.parentNode.replaceChild(newPaymentAmount, paymentAmount);
        
        // Обработчик ввода
        newPaymentAmount.addEventListener('input', function(e) {
            // Сохраняем позицию курсора
            const cursorStart = this.selectionStart;
            const cursorEnd = this.selectionEnd;
            const oldValue = this.value;
            
            // Чистим ввод, сохраняя цифры и точку
            let cleanValue = this.value.replace(/[^0-9.]/g, '');
            
            // Проверяем, что не введено больше одной точки
            const dotCount = (cleanValue.match(/\./g) || []).length;
            if (dotCount > 1) {
                cleanValue = cleanValue.replace(/\.+$/, ''); // Удаляем лишние точки в конце
            }
            
            // Сохраняем текущее значение для отслеживания изменений
            this.value = cleanValue;
            
            // Парсим значение
            const newRawValue = parseNumber(cleanValue);
            
            // Сохраняем сырое значение ТОЛЬКО если оно изменилось
            if (newRawValue !== rawValue) {
                rawValue = newRawValue;
                
                // Обновляем конвертацию в USD
                updateUSD(rawValue);
                
                // Обновляем скрытое поле
                rawPaymentAmount.value = rawValue;
            }
            
            // Корректируем позицию курсора
            const diff = this.value.length - oldValue.length;
            this.setSelectionRange(Math.max(0, cursorStart + diff), 
                                  Math.max(0, cursorEnd + diff));
        });
        
        // Форматируем значение при потере фокуса
        newPaymentAmount.addEventListener('blur', function() {
            this.value = formatPKR(rawValue);
        });
        
        // Восстанавливаем значение при фокусе
        newPaymentAmount.addEventListener('focus', function() {
            this.value = rawValue.toString();
        });
    }
}


// Функции для управления транзакциями и платежами

/**
 * Отображение документов транзакции
 * @param {Object} transaction - Данные транзакции
 */
function displayTransactionDocuments(transaction) {
    const agreementFile = document.getElementById('agreementFile');
    const videoFile = document.getElementById('videoFile');
    const proofDocuments = document.getElementById('proofDocuments');
    
    if (!agreementFile || !videoFile || !proofDocuments) {
        console.error('Document containers not found');
        return;
    }
    
    // Очистка контейнеров
    agreementFile.innerHTML = '';
    videoFile.innerHTML = '';
    proofDocuments.innerHTML = '';
    
    // Отображение договора
    if (transaction.agreement_file) {
        const agreementLink = document.createElement('a');
        agreementLink.href = `${API_BASE_URL}/v1/admin/files/${transaction.agreement_file.id}`;
        agreementLink.target = '_blank';
        agreementLink.textContent = transaction.agreement_file.original_name;
        agreementFile.appendChild(agreementLink);
    } else {
        agreementFile.textContent = 'No agreement file uploaded';
    }
    
    // Отображение видео
    if (transaction.video_file) {
        const videoLink = document.createElement('a');
        videoLink.href = `${API_BASE_URL}/v1/admin/files/${transaction.video_file.id}`;
        videoLink.target = '_blank';
        videoLink.textContent = transaction.video_file.original_name;
        videoFile.appendChild(videoLink);
    } else {
        videoFile.textContent = 'No video file uploaded';
    }
    
    // Отображение доказательных документов
    if (transaction.proof_documents && transaction.proof_documents.length > 0) {
        transaction.proof_documents.forEach(doc => {
            const docLink = document.createElement('a');
            docLink.href = `${API_BASE_URL}/v1/admin/files/${doc.id}`;
            docLink.target = '_blank';
            docLink.textContent = doc.original_name;
            
            const docItem = document.createElement('div');
            docItem.className = 'file-item';
            docItem.appendChild(docLink);
            
            proofDocuments.appendChild(docItem);
        });
    } else {
        proofDocuments.textContent = 'No proof documents uploaded';
    }
}

/**
 * Функция для создания нового платежа
 * @param {Event} event - Событие отправки формы
 */
async function createPayment(event) {
    event.preventDefault();
    
    const transactionId = document.getElementById('currentTransactionId').value;
    const amountInput = document.getElementById('paymentAmount');
    const method = document.getElementById('paymentMethod').value;
    const status = document.getElementById('paymentStatus').value;
    const notes = document.getElementById('paymentNotes').value;
    
    // Парсим сумму
    const amount = parseNumber(amountInput.value);
    
    // Валидация
    if (isNaN(amount) || amount <= 0) {
        showNotification('error', 'Please enter a valid amount');
        return;
    }
    
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments`, {
            method: 'POST',
            body: JSON.stringify({
                amount,
                method,
                status,
                notes
            })
        });
        
        if (response.success) {
            showNotification('success', 'Payment created successfully');
            // Сброс формы
            document.getElementById('paymentAmount').value = '';
            document.getElementById('paymentMethod').value = 'cash';
            document.getElementById('paymentStatus').value = 'pending';
            document.getElementById('paymentNotes').value = '';
            
            // Закрываем модальное окно
            closeModal('addPaymentModal');
            
            // Обновляем данные транзакции
            await loadTransactionDetails(transactionId);
        } else {
            throw new Error(response.message || 'Failed to create payment');
        }
    } catch (error) {
        console.error('Error creating payment:', error);
        showNotification('error', error.message || 'Error creating payment');
    }
}

/**
 * Функция для открытия модального окна редактирования платежа
 * @param {string} paymentId - ID платежа
 * @param {string} transactionId - ID транзакции
 */
async function editPayment(paymentId, transactionId) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`);
        
        if (response.success && response.payment) {
            const payment = response.payment;
            
            // Заполняем форму
            document.getElementById('paymentId').value = payment.id;
            document.getElementById('paymentAmount').value = formatPKR(payment.amount);
            document.getElementById('paymentMethod').value = payment.method;
            document.getElementById('paymentStatus').value = payment.status;
            document.getElementById('paymentNotes').value = payment.notes || '';
            
            // Обновляем конвертацию
            await updateUSD(payment.amount);
            
            // Открываем модальное окно
            openModal('editPaymentModal');
        } else {
            throw new Error(response.message || 'Failed to load payment details');
        }
    } catch (error) {
        console.error('Error loading payment details:', error);
        showNotification('error', 'Error loading payment details');
    }
}

/**
 * Функция для сохранения изменений платежа
 * @param {Event} event - Событие отправки формы
 */
async function savePaymentChanges(event) {
    event.preventDefault();
    
    const paymentId = document.getElementById('paymentId').value;
    const transactionId = document.getElementById('paymentTransactionId').value;
    const amountInput = document.getElementById('paymentAmount');
    const method = document.getElementById('paymentMethod').value;
    const status = document.getElementById('paymentStatus').value;
    const notes = document.getElementById('paymentNotes').value;
    
    // Парсим сумму
    const amount = parseNumber(amountInput.value);
    
    // Валидация
    if (isNaN(amount) || amount <= 0) {
        showNotification('error', 'Please enter a valid amount');
        return;
    }
    
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`, {
            method: 'PUT',
            body: JSON.stringify({
                amount,
                method,
                status,
                notes
            })
        });
        
        if (response.success) {
            showNotification('success', 'Payment updated successfully');
            closeModal('editPaymentModal');
            await loadTransactionDetails(transactionId);
        } else {
            throw new Error(response.message || 'Failed to update payment');
        }
    } catch (error) {
        console.error('Error updating payment:', error);
        showNotification('error', error.message || 'Error updating payment');
    }
}

/**
 * Функция для обновления суммы транзакции
 * @param {string} transactionId - ID транзакции
 * @param {number} newAmount - Новая сумма
 */
async function updateTransactionAmount(transactionId, newAmount) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/amount`, {
            method: 'PUT',
            body: JSON.stringify({ amount: newAmount })
        });
        
        if (response.success) {
            // Форматируем сумму с разделителями
            const formattedAmount = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(newAmount);
            
            const totalAmountView = document.getElementById('totalAmountView');
            if (totalAmountView) {
                totalAmountView.textContent = formattedAmount;
            }
            
            const amountEditSection = document.getElementById('amountEditSection');
            if (amountEditSection) {
                amountEditSection.style.display = 'none';
            }
            
            showNotification('success', 'Amount updated successfully');
            
            // Обновляем оставшуюся сумму
            loadTransactionDetails(transactionId);
        } else {
            throw new Error(response.message || 'Failed to update amount');
        }
    } catch (error) {
        console.error('Error updating transaction amount:', error);
        showNotification('error', error.message || 'Error updating transaction amount');
    }
}

/**
 * Функция для открытия полноразмерного предпросмотра изображения
 * @param {string} imageSrc - URL изображения
 */
function openImagePreview(imageSrc) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
    `;
    
    modal.appendChild(img);
    
    modal.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    document.body.appendChild(modal);
}

/**
 * Функция для добавления платежа
 */
async function addPayment() {
    const transactionId = document.getElementById('paymentTransactionId').value;
    const amountInput = document.getElementById('paymentAmount');
    const method = document.getElementById('paymentMethod').value;
    const status = document.getElementById('paymentStatus').value;
    const notes = document.getElementById('paymentNotes').value;
    const receiptFile = document.getElementById('receiptFile').files[0];
    
    const formData = new FormData();
    formData.append('amount', amountInput.value);
    formData.append('method', method);
    formData.append('status', status);
    formData.append('notes', notes);
    
    // Добавляем файл, если он выбран (поле должно называться 'receipt')
    if (receiptFile) {
        formData.append('receipt', receiptFile);
    }
    
    // Отправляем запрос
    const response = await fetch(API_BASE_URL + `/v1/admin/transactions/${transactionId}/payments`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
    });
    
    const data = await response.json();
    if (response.ok) {
        closeModal('addPaymentModal');
        loadTransactionPayments(transactionId);
        loadTransactionDetails(transactionId);
        showNotification('success', 'Payment added successfully');
    } else {
        showNotification('error', data.message || 'Error adding payment');
    }
}

/**
 * Обновление статуса сделки
 * @param {string} transactionId - ID транзакции
 * @param {string} status - Новый статус транзакции
 */
async function updateTransactionStatus(transactionId, status) {
    try {
        let notes = null;
        if (status === 'rejected') {
            notes = prompt('Please provide a reason for rejection:');
            if (notes === null) return;
        }

        // Исправляем имя поля с admin_notes на reason
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}`, {
            method: 'PUT',
            body: JSON.stringify({
                status,
                reason: notes
            })
        });

        // Проверяем, что response существует и имеет поле success
        if (response && response.success) {
            showNotification('success', `Transaction ${status} successfully`);
            loadTransactions();
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
 * Загрузка документов
 * @param {string} transactionId - ID транзакции
 */
async function uploadDocuments(transactionId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';

    input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        const formData = new FormData();

        files.forEach(file => {
            formData.append('documents[]', file);
        });

        const response = await fetch(`${API_BASE_URL}/v1/admin/transactions/${transactionId}/documents`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        if (response.ok) {
            showNotification('success', 'Documents uploaded successfully');
            loadTransactions();
        } else {
            showNotification('error', 'Failed to upload documents');
        }
    };

    input.click();
}

/**
 * Очистка истории сделок
 */
async function clearTransactionHistory() {
    const date = prompt('Enter date to clear history before (YYYY-MM-DD):');
    if (!date) return;

    const response = await apiRequest('/v1/admin/transactions/history/clear', {
        method: 'POST',
        body: JSON.stringify({
            older_than: date,
            status: ['approved', 'rejected', 'cancelled']
        })
    });

    if (response) {
        showNotification('success', 'Transaction history cleared successfully');
        loadTransactions();
    }
}

export { displayTransactionDocuments, editPayment, savePaymentChanges, createPayment,initAmountInputHandlers, updateTransactionAmount, openImagePreview, addPayment, updateTransactionStatus, uploadDocuments, clearTransactionHistory};