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
 * Функция для отображения документов транзакции в таблице
 * @param {Object|Array} transaction - Данные транзакции или массив файлов
 */
function displayTransactionDocuments(transaction) {
    const tableBody = document.getElementById('documentsTableBody');
    if (!tableBody) {
        console.warn('Documents table body not found. Skipping document display.');
        return;
    }

    // Очистка таблицы
    tableBody.innerHTML = '';

    let files = [];

    // Обработка разных форматов данных
    if (transaction && transaction.files) {
        // Формат: { files: { agreement: [...], video: [...], ... } }
        Object.keys(transaction.files).forEach(category => {
            if (category === 'receipt') return; // Игнорируем квитанции
            const categoryFiles = transaction.files[category];
            if (Array.isArray(categoryFiles)) {
                categoryFiles.forEach(file => {
                    files.push({
                        ...file,
                        category: category
                    });
                });
            }
        });
    } else if (Array.isArray(transaction)) {
        // Формат: массив файлов [{ id, original_name, category, ... }]
        files = transaction.filter(file => file.category !== 'receipt');
    } else if (transaction && Array.isArray(transaction.files)) {
        // Формат: { files: [...] }
        files = transaction.files.filter(file => file.category !== 'receipt');
    }

    if (files.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="4" style="text-align: center; padding: 20px;">
                No documents uploaded
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    // Сортируем файлы по категориям для порядка: agreement, video, proof_documents
    const categoryOrder = { 'agreement': 1, 'video': 2, 'proof_documents': 3 };
    files.sort((a, b) => {
        const orderA = categoryOrder[a.category] || 999;
        const orderB = categoryOrder[b.category] || 999;
        return orderA - orderB;
    });

    // Добавляем строки в таблицу
    files.forEach(file => {
        const row = document.createElement('tr');

        // Определяем человекочитаемое название категории
        const categoryMap = {
            'agreement': 'Agreement to Sell',
            'video': 'Meeting Video',
            'proof_documents': 'Proof Documents'
        };
        const categoryName = categoryMap[file.category] || file.category;
        let receiptPreview;

        // Форматируем дату
        const uploadDate = file.created_at
            ? new Date(file.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
            : 'Unknown';

        if (file?.path) {
            const receipt = file.name;
            const receiptPath = file.path;
            let cleanPath = file.path.replace(/^(\.\.\/)+/, ''); // Удаляем все ../ в начале

            const receiptUrl = `${API_BASE_URL}/v1/admin/transactions/files/${encodeURIComponent(cleanPath)}`;


            receiptPreview = `
                        <div class="receipt-preview">
                            <i class="fas fa-file-alt receipt-icon"></i>
                            <div>
                                <a href="${receiptUrl}" target="_blank" class="action-btn btn-download">
                                <i class="fas fa-download"></i> 
                                View</a>
                                
                                <button class="action-btn btn-delete" data-file-id="${file.id}" data-category="${file.category}">
                    <i class="fas fa-trash"></i> Delete
                </button>
                            </div>
                        </div>
                    `;
        } else {
            receiptPreview = '<span class="no-receipt">No files</span>';
        }

        row.innerHTML = `
            <td><h3>${categoryName}</h3></td>
            <td class="center-rd">
                <span>${file.original_name || file.name || 'Unnamed File'}</span>
            </td>
            <td>${uploadDate}</td>
            <td>
                ${receiptPreview}
            </td>
        `;

        tableBody.appendChild(row);
    });

    // Назначаем обработчики событий
    tableBody.querySelectorAll('.btn-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const fileId = e.currentTarget.dataset.fileId;
            if (fileId) {
                downloadFileById(parseInt(fileId));
            }
        });
    });

    tableBody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const fileId = e.currentTarget.dataset.fileId;
            const category = e.currentTarget.dataset.category;
            const transactionId = transaction.id || (transaction[0] && transaction[0].transaction_id);
            if (fileId && transactionId) {
                deleteFile(parseInt(fileId), parseInt(transactionId), category);
            }
        });
    });
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
 * Функция для настройки обработчиков действий с платежами
 * @param {string} transactionId - ID транзакции
 */
function setupPaymentActionHandlers(transactionId) {
    // Удаляем существующие обработчики, чтобы избежать дублирования
    document.querySelectorAll('.edit-payment-btn, .confirm-payment-btn').forEach(btn => {
        const clonedBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(clonedBtn, btn);
    });

    // Добавляем обработчики для редактирования платежей
    document.querySelectorAll('.edit-payment-btn').forEach(button => {
        button.addEventListener('click', function () {
            const paymentId = this.getAttribute('data-payment-id');
            openEditPaymentModal(paymentId, transactionId);
        });
    });

    // Добавляем обработчики для подтверждения платежей
    document.querySelectorAll('.confirm-payment-btn').forEach(button => {
        button.addEventListener('click', function () {
            const paymentId = this.getAttribute('data-payment-id');
            confirmPayment(paymentId, transactionId);
        });
    });
}

/**
 * Функция для подтверждения платежа
 * @param {string} paymentId - ID платежа
 * @param {string} transactionId - ID транзакции
 */
async function confirmPayment(paymentId, transactionId) {
    if (!confirm('Are you sure you want to confirm this payment?')) {
        return;
    }

    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'paid' })
        });

        if (response.success) {
            showNotification('success', 'Payment confirmed successfully');
            await loadTransactionPayments(transactionId);
            await loadTransactionDetails(transactionId);
        } else {
            showNotification('error', 'Failed to confirm payment: ' + (response.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error confirming payment:', error);
        showNotification('error', 'Error confirming payment: ' + error.message);
    }
}

/**
 * Функция для форматирования метода оплаты
 * @param {string} method - Метод оплаты
 * @returns {string} - Отформатированный метод
 */
function formatPaymentMethod(method) {
    const methods = {
        'cash': 'Cash',
        'bank_transfer': 'Bank Transfer',
        'credit_card': 'Credit Card',
        'other': 'Other'
    };
    return methods[method] || method.charAt(0).toUpperCase() + method.slice(1);
}

/**
 * Функция для форматирования статуса платежа
 * @param {string} status - Статус платежа
 * @returns {string} - Отформатированный статус
 */
function formatStatus(status) {
    const statuses = {
        'pending': 'Pending',
        'paid': 'Paid',
        'cancelled': 'Cancelled'
    };
    return statuses[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Функция для получения CSS класса статуса
 * @param {string} status - Статус платежа
 * @returns {string} - CSS класс для статуса
 */
function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'paid': 'status-paid',
        'cancelled': 'status-cancelled'
    };
    return classes[status] || '';
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
        editAmountBtn.addEventListener('click', function () {
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
        saveAmountBtn.addEventListener('click', function () {
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
        cancelAmountBtn.addEventListener('click', function () {
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
    document.addEventListener('click', function (e) {
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

/**
 * Функция для открытия модального окна загрузки одного файла
 * @param {string} category - Категория файла
 */
function openUploadModal(category) {
    // Получаем ID текущей транзакции из скрытого поля в модальном окне
    const transactionIdElement = document.getElementById('currentTransactionId');
    if (!transactionIdElement || !transactionIdElement.value) {
        showNotification('error', 'Transaction ID not found');
        return;
    }

    const transactionId = transactionIdElement.value;

    // Устанавливаем значения в скрытые поля формы
    const uploadTransactionId = document.getElementById('uploadTransactionId');
    const uploadCategory = document.getElementById('uploadCategory');

    if (uploadTransactionId && uploadCategory) {
        uploadTransactionId.value = transactionId;
        uploadCategory.value = category;

        // Обновляем заголовок модального окна
        const modalTitle = document.querySelector('#uploadFileModal .modal-title');
        if (modalTitle) {
            if (category === 'agreement') {
                modalTitle.textContent = 'Upload Agreement';
            } else if (category === 'video') {
                modalTitle.textContent = 'Upload Video';
            }
        }

        // Открываем модальное окно
        openModal('uploadFileModal');
    }
}

/**
 * Функция для открытия модального окна множественной загрузки
 */
function openMultiplUploadModal() {
    // Получаем ID текущей транзакции
    const transactionIdElement = document.getElementById('currentTransactionId');
    if (!transactionIdElement || !transactionIdElement.value) {
        showNotification('error', 'Transaction ID not found');
        return;
    }

    const transactionId = transactionIdElement.value;

    // Устанавливаем ID транзакции
    document.getElementById('multiUploadTransactionId').value = transactionId;

    // Открываем модальное окно
    openModal('multipleUploadModal');
}

/**
 * Функция для удаления файла
 * @param {string} fileId - ID файла
 * @param {string} transactionId - ID транзакции
 * @param {string} category - Категория файла
 */
async function deleteFile(fileId, transactionId, category) {
    if (!confirm(`Вы уверены, что хотите удалить файл?`)) {
        return;
    }

    try {
        const response = await apiRequest(`/v1/admin/files/${fileId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showNotification('success', 'File deleted successfully');
// Принудительная перерисовка для анимации
    void modal.offsetWidth;

            // Обновляем отображение файлов
            await loadTransactionDetails(transactionId);
        } else {
            throw new Error(response.message || 'Failed to delete file');
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        showNotification('error', 'Error deleting file: ' + error.message);
    }
}

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
 * Функция для загрузки платежей транзакции
 * @param {string} transactionId - ID транзакции
 */
async function loadTransactionPayments(transactionId) {
    try {
        // Загружаем платежи
        const paymentsResponse = await apiRequest(`/v1/admin/transactions/${transactionId}/payments`);

        // Проверяем, что ответ содержит платежи
        if (paymentsResponse && Array.isArray(paymentsResponse.payments)) {
            const payments = paymentsResponse.payments;
            const tbody = document.getElementById('paymentsTableBody');

            if (!tbody) {
                console.error('Payments table body not found');
                return;
            }

            tbody.innerHTML = '';

            if (payments.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No payments found</td></tr>';
                return;
            }

            // Загружаем документы, чтобы найти чеки
            const filesResponse = await apiRequest(`/v1/admin/transactions/${transactionId}/documents`);

            // Создаем объект для быстрого поиска чеков по payment_id
            const receiptMap = {};
            if (filesResponse && filesResponse.documents) {
                filesResponse.documents.forEach(file => {
                    if (file.category === 'receipt' && file.payment_id) {
                        receiptMap[file.payment_id] = file;
                    }
                });
            }

            // Заполняем таблицу платежей
            payments.forEach(payment => {
                const row = document.createElement('tr');

                // Форматируем дату
                const paymentDate = payment.payment_date ?
                    new Date(payment.payment_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }) : 'N/A';

                // Создаем ячейку для превью чека
                let receiptPreview = '';
                if (payment.receipt || receiptMap[payment.id]) {
                    const receipt = payment.receipt || receiptMap[payment.id];
                    const receiptPath = receipt.path || receipt.file_path;
                    const receiptUrl = `${API_BASE_URL}/v1/admin/transactions/files/${receiptPath}`;

                    receiptPreview = `
                        <div class="receipt-preview">
                            <i class="fas fa-file-alt receipt-icon"></i>
                            <div class="receipt-actions">
                                <a href="${receiptUrl}" target="_blank" class="view-receipt">View</a>
                                <a href="${receiptUrl}" download class="download-receipt">Download</a>
                            </div>
                        </div>
                    `;
                } else {
                    receiptPreview = '<span class="no-receipt">No receipt</span>';
                }

                row.innerHTML = `
                    <td>${payment.id}</td>
                    <td>${paymentDate}</td>
                    <td>${formatPKR(payment.amount)}</td>
                    <td>${formatPaymentMethod(payment.payment_method)}</td>
                    <td><span class="status-badge ${getStatusClass(payment.status)}">${formatStatus(payment.status)}</span></td>
                    <td>
                        <div class="payment-actions">
                            <button class="action-btn btn-edit edit-payment-btn" data-payment-id="${payment.id}">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            ${payment.status === 'pending' ?
                        `<button class="action-btn btn-approve confirm-payment-btn" data-payment-id="${payment.id}">
                                    <i class="fas fa-check"></i> Confirm
                                </button>` : ''}
                            ${payment.status !== 'cancelled' ?
                        `<button class="action-btn btn-delete cancel-payment-btn" data-payment-id="${payment.id}">
                                    <i class="fas fa-times"></i> Cancel
                                </button>` : ''}
                        </div>
                    </td>
                    <td class="receipt-cell">${receiptPreview}</td>
                `;

                tbody.appendChild(row);
            });

            // Настраиваем обработчики действий с платежами
            setupPaymentActionHandlers(transactionId);
        } else {
            const tbody = document.getElementById('paymentsTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading payments</td></tr>';
            }
            showNotification('error', 'Failed to load payments');
        }
    } catch (error) {
        console.error('Error loading transaction payments:', error);
        const tbody = document.getElementById('paymentsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading payments</td></tr>';
        }
        showNotification('error', 'Error loading payments: ' + error.message);
    }
}

// Вспомогательные функции, если они еще не определены
if (typeof formatPKR === 'undefined') {
    /**
     * Форматирование денег с разделителями тысяч
     * @param {number} amount - Сумма
     * @returns {string} - Отформатированная строка
     */
    function formatPKR(amount) {
        try {
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        } catch (e) {
            console.error('Error formatting PKR:', e);
            return amount.toFixed(2);
        }
    }
    window.formatPKR = formatPKR;
}

if (typeof openModal === 'undefined') {
    /**
     * Универсальная функция для открытия модальных окон
     * @param {string} modalId - ID модального окна
     * @returns {boolean} - Успешно ли открылось модальное окно
     */
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
    window.openModal = openModal;
}

// Прикрепляем функции к глобальному объекту
window.displayWitnesses = displayWitnesses;
window.displayTransactionDocuments = displayTransactionDocuments;
window.updateWitnesses = updateWitnesses;
window.loadTransactionPayments = loadTransactionPayments;
window.updateTransactionStatus = updateTransactionStatus;
window.initTransactionHandlers = initTransactionHandlers;
window.openUploadModal = openUploadModal;
window.openMultiplUploadModal = openMultiplUploadModal;
window.deleteFile = deleteFile;
window.openAddPaymentModal = openAddPaymentModal;

// Автоматическая инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function () {
    // Проверяем существование элементов транзакций
    if (document.getElementById('transactions') || document.getElementById('viewTransactionModal')) {
        initTransactionHandlers();
    }
});

console.log('[TRANSACTION HANDLERS] Initialized successfully');