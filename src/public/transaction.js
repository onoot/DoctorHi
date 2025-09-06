// transaction.js
// Функции для работы с транзакциями

// Глобальные переменные
let transactionLoadInProgress = false;
let currentTransactionId = null;

/**
 * Функция для загрузки транзакций
 * @param {number} page - Номер страницы
 * @param {number} limit - Лимит записей на странице
 */
async function loadTransactions(page = 1, limit = 10) {
    try {
        const section = document.getElementById('transactions');
        const tbody = document.getElementById('transactionsTableBody');
        const searchInput = document.querySelector('#transactions .search-input');

        // Проверяем, что элементы существуют
        if (!section || !tbody) {
            console.warn('Transaction section or table body not found. Skipping transaction load.');
            return;
        }

        // Показываем прелоадер
        showTransactionLoader(tbody);

        // Получаем параметры поиска
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        const searchParams = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';

        // Отмечаем, что загрузка началась
        transactionLoadInProgress = true;

        // Загружаем данные
        const response = await apiRequest(`/v1/admin/transactions?page=${page}&limit=${limit}${searchParams}`);

        // Отмечаем, что загрузка завершилась
        transactionLoadInProgress = false;

        if (response.success && response.transactions) {
            // Очищаем таблицу
            tbody.innerHTML = '';

            // Проверяем, есть ли транзакции
            if (response.transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No transactions found</td></tr>';
                return;
            }

            // Заполняем таблицу данными
            response.transactions.forEach(transaction => {
                const row = document.createElement('tr');

                // Форматируем дату
                const createdAt = transaction.created_at ?
                    new Date(transaction.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }) : 'N/A';

                // Создаем кнопки действий
                const actions = `
                    <div class="actions-cell">
                        <div class="actions-column">
                            <button class="action-btn btn-view view-transaction-btn" data-id="${transaction.id}">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="action-btn btn-approve" data-id="${transaction.id}" data-action="approve">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="action-btn btn-reject" data-id="${transaction.id}" data-action="reject">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    </div>
                `;

                // Заполняем строку таблицы
                row.innerHTML = `
                    <td>${transaction.id}</td>
                    <td>${transaction.property_name || transaction.property_id || 'N/A'}</td>
                    <td>${transaction.previous_owner_name || 'N/A'}</td>
                    <td>${transaction.new_owner_name || 'N/A'}</td>
                    <td>${createdAt}</td>
                    <td><span class="status-badge ${transaction.status}">${transaction.status}</span></td>
                    <td>${actions}</td>
                `;

                tbody.appendChild(row);
            });

            // Привязываем обработчики действий
            attachTransactionActionHandlers();
        } else {
            console.error('Invalid transactions data format:', response);
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading transactions</td></tr>';
            showNotification('error', 'Failed to load transactions');
        }
    } catch (error) {
        console.error('Error loading transactions:', error);

        const tbody = document.getElementById('transactionsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading transactions</td></tr>';
        }

        showNotification('error', 'Error loading transactions');

        // Отмечаем, что загрузка завершилась
        transactionLoadInProgress = false;
    }
}

/**
 * Показывает прелоадер во время загрузки транзакций
 * @param {HTMLElement} tbody - Тело таблицы
 */
function showTransactionLoader(tbody) {
    if (!tbody) return;

    // Очищаем таблицу
    tbody.innerHTML = '';

    // Создаем прелоадер
    const loaderRow = document.createElement('tr');
    loaderRow.innerHTML = `
       <td colspan="7" class="text-center">
    <div class="spinner-container">
        <i class="fas fa-spinner fa-spin"></i>
    </div>
</td>
    `;

    tbody.appendChild(loaderRow);
}

/**
 * Привязка обработчиков действий для транзакций
 */
function attachTransactionActionHandlers() {
    // Обработчик для кнопок просмотра транзакции
    document.querySelectorAll('.view-transaction-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const transactionId = this.getAttribute('data-id');
            openViewTransactionModal(transactionId);
        });
    });

    // Обработчик для кнопок одобрения транзакции
    document.querySelectorAll('.btn-approve').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const transactionId = this.getAttribute('data-id');
            updateTransactionStatus(transactionId, 'approved');
        });
    });

    // Обработчик для кнопок отклонения транзакции
    document.querySelectorAll('.btn-reject').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const transactionId = this.getAttribute('data-id');
            updateTransactionStatus(transactionId, 'rejected');
        });
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
        currentTransactionId = transactionId;
    }

    // Открываем модальное окно
    openModal('viewTransactionModal');

    // Загружаем данные транзакции и файлы
    loadTransactionDetails(transactionId);
    loadTransactionFiles(transactionId);
    loadTransactionPayments(transactionId);
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

            // Проверяем существование элементов
            if (!transactionIdEl || !propertyNameEl || !previousOwnerEl || !newOwnerEl ||
                !statusEl || !createdAtEl || !totalAmountViewEl || !paidAmountEl) {
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
            if (createdAtEl) {
                createdAtEl.textContent = new Date(transaction.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }

            // Обновляем сумму
            if (totalAmountViewEl) {
                totalAmountViewEl.textContent = formatPKR(transaction.total_amount);
            }

            if (paidAmountEl) {
                paidAmountEl.textContent = formatPKR(transaction.paid_amount);
            }

            // Обновляем оставшуюся сумму
            const remainingAmount = parseFloat(transaction.total_amount) - parseFloat(transaction.paid_amount);
            const remainingAmountEl = document.getElementById('remainingAmount');
            if (remainingAmountEl) {
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
 * Функция для отображения свидетелей
 * @param {Object} transaction - Данные транзакции
 */
function displayWitnesses(transaction) {
    try {
        // Получаем элементы
        const witness1Name = document.getElementById('witness1Name');
        const witness1CNIC = document.getElementById('witness1CNIC');
        const witness1Phone = document.getElementById('witness1Phone');
        const witness2Name = document.getElementById('witness2Name');
        const witness2CNIC = document.getElementById('witness2CNIC');
        const witness2Phone = document.getElementById('witness2Phone');

        // Проверяем существование элементов
        if (!witness1Name || !witness1CNIC || !witness1Phone ||
            !witness2Name || !witness2CNIC || !witness2Phone) {
            console.warn('Witness form elements not found. Skipping witness display.');
            return;
        }

        // Заполняем форму свидетелей в модальном окне
        if (transaction.witnesses && transaction.witnesses.witness1) {
            witness1Name.value = transaction.witnesses.witness1.name || '';
            witness1CNIC.value = transaction.witnesses.witness1.cnic || '';
            witness1Phone.value = transaction.witnesses.witness1.phone || '';
        } else {
            witness1Name.value = '';
            witness1CNIC.value = '';
            witness1Phone.value = '';
        }

        if (transaction.witnesses && transaction.witnesses.witness2) {
            witness2Name.value = transaction.witnesses.witness2.name || '';
            witness2CNIC.value = transaction.witnesses.witness2.cnic || '';
            witness2Phone.value = transaction.witnesses.witness2.phone || '';
        } else {
            witness2Name.value = '';
            witness2CNIC.value = '';
            witness2Phone.value = '';
        }
    } catch (error) {
        console.error('Error displaying witnesses:', error);
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

    // Отображение договора
    if (transaction.agreement_file) {
        const agreementLink = document.createElement('a');
        agreementLink.href = `${API_BASE_URL}/v1/admin/files/${transaction.agreement_file.id}`;
        agreementLink.target = '_blank';
        agreementLink.textContent = transaction.agreement_file.original_name || 'Agreement.pdf';
        agreementFile.appendChild(agreementLink);
    } else {
        agreementFile.textContent = 'No agreement file uploaded';
    }

    // Отображение видео
    if (transaction.video_file) {
        const videoLink = document.createElement('a');
        videoLink.href = `${API_BASE_URL}/v1/admin/files/${transaction.video_file.id}`;
        videoLink.target = '_blank';
        videoLink.textContent = transaction.video_file.original_name || 'Video.mp4';
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
            docLink.textContent = doc.original_name || 'Document';

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
 * Функция для загрузки документов транзакции
 * @param {string} transactionId - ID транзакции
 */
async function loadTransactionFiles(transactionId) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/documents`, {
            method: 'GET'
        });
        
        if (response.success && response.documents) {
            // Распределяем файлы по категориям
            // Игнорируем категорию 'receipt', так как она не должна отображаться в этом разделе
            const agreementFiles = response.documents.filter(file => file.category === 'agreement');
            const videoFiles = response.documents.filter(file => file.category === 'video');
            const proofFiles = response.documents.filter(file => file.category === 'proof');
            
            // Отображаем файлы в соответствующих контейнерах
            displayFiles(agreementFiles, 'agreementFile', 'agreement');
            displayFiles(videoFiles, 'videoFile', 'video');
            displayFiles(proofFiles, 'proofDocuments', 'proof');
        }
    } catch (error) {
        console.error('Error loading transaction files:', error);
        showNotification('error', 'Error loading files');
    }
}

/**
 * Отображение файлов в соответствующих контейнерах
 * @param {Array} files - Массив файлов
 * @param {string} containerId - ID контейнера
 * @param {string} category - Категория файлов
 */
function displayFiles(files, containerId, category) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!files || files.length === 0) {
        container.innerHTML = '<p>No files uploaded yet</p>';
        return;
    }

    files.forEach(file => {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.dataset.fileId = file.id;

        // Создаем действия с файлом
        const actions = document.createElement('div');
        actions.className = 'file-actions';

        // Кнопка просмотра
        const viewBtn = document.createElement('button');
        viewBtn.innerHTML = '<i class="fas fa-eye"></i> View';
        viewBtn.addEventListener('click', () => {
            const fileUrl = `${API_BASE_URL}/v1/admin/files/${file.id}`;
            window.open(fileUrl, '_blank');
        });
        actions.appendChild(viewBtn);

        // Кнопка удаления
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteFile(file.id, document.getElementById('currentTransactionId').value, category);
        });
        actions.appendChild(deleteBtn);

        // Создаем превью файла
        let filePreview = '';
        if (file.file_type && file.file_type.startsWith('image/')) {
            filePreview = `<div class="file-preview"><img src="${API_BASE_URL}/v1/admin/files/${file.id}" alt="${file.original_name}"></div>`;
        } else if (file.file_type && file.file_type.includes('pdf')) {
            filePreview = '<i class="fas fa-file-pdf file-icon"></i>';
        } else if (file.file_type && (file.file_type.includes('video') || file.file_type.includes('mp4'))) {
            filePreview = '<i class="fas fa-file-video file-icon"></i>';
        } else {
            filePreview = '<i class="fas fa-file file-icon"></i>';
        }

        // Формируем отображение файла
        fileElement.innerHTML = `
            ${filePreview}
            <div class="file-info">
                <span class="file-name">${file.original_name || file.file_name}</span>
                <span class="file-date">${new Date(file.created_at).toLocaleDateString()}</span>
            </div>
        `;

        fileElement.appendChild(actions);
        container.appendChild(fileElement);
    });
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

            // Обновляем отображение файлов
            if (category === 'agreement' || category === 'video' || category === 'proof') {
                await loadTransactionFiles(transactionId);
            } else if (category === 'receipt') {
                await loadTransactionPayments(transactionId);
            }
        } else {
            throw new Error(response.message || 'Failed to delete file');
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        showNotification('error', 'Error deleting file: ' + error.message);
    }
}

/**
 * Функция для загрузки платежей транзакции
 * @param {string} transactionId - ID транзакции
 */
async function loadTransactionPayments(transactionId) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments`);
        if (response.success && Array.isArray(response.payments)) {
            const payments = response.payments;
            const tableBody = document.getElementById('paymentsTableBody');

            if (tableBody) {
                if (payments.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No payments found</td></tr>';
                } else {
                    let html = '';
                    payments.forEach(payment => {
                        const paymentDate = payment.payment_date ?
                            new Date(payment.payment_date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            }) : 'N/A';

                        const amount = formatPKR(payment.amount);
                        const statusClass = getStatusClass(payment.status);

                        html += `
                            <tr>
                                <td>${payment.id}</td>
                                <td>${paymentDate}</td>
                                <td>${amount}</td>
                                <td>${formatPaymentMethod(payment.method)}</td>
                                <td class="${statusClass}">${formatStatus(payment.status)}</td>
                                <td>
                                    <button class="action-btn btn-edit edit-payment-btn" 
                                            data-payment-id="${payment.id}">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="action-btn btn-approve confirm-payment-btn" 
                                            data-payment-id="${payment.id}">
                                        <i class="fas fa-check"></i> Confirm
                                    </button>
                                </td>
                                <td>
                                    ${payment.receipt ? `
                                    <a href="${API_BASE_URL}/v1/admin/files/${payment.receipt_id}" target="_blank">
                                        <i class="fas fa-file-invoice"></i> View
                                    </a>` : 'No receipt'}
                                </td>
                            </tr>
                        `;
                    });

                    tableBody.innerHTML = html;

                    // Инициализируем обработчики действий с платежами
                    setupPaymentActionHandlers(transactionId);
                }
            }
        }
    } catch (error) {
        console.error('Error loading payments:', error);
        showNotification('error', 'Error loading payments');
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
            await updateAmountSummary(transactionId);
        } else {
            showNotification('error', 'Failed to confirm payment: ' + (response.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error confirming payment:', error);
        showNotification('error', 'Error confirming payment: ' + error.message);
    }
}

/**
 * Функция для обновления суммарной информации о платежах
 * @param {string} transactionId - ID транзакции
 */
async function updateAmountSummary(transactionId) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/summary`);
        if (response.success) {
            // Обновляем отображение сумм
            const totalAmountView = document.getElementById('totalAmountView');
            const paidAmount = document.getElementById('paidAmount');

            if (totalAmountView) {
                totalAmountView.textContent = formatPKR(response.total_amount);
            }

            if (paidAmount) {
                paidAmount.textContent = formatPKR(response.paid_amount);
            }

            const remaining = parseFloat(response.total_amount) - parseFloat(response.paid_amount);
            const remainingAmount = document.getElementById('remainingAmount');
            if (remainingAmount) {
                remainingAmount.textContent = formatPKR(remaining);
            }
        }
    } catch (error) {
        console.error('Error loading transaction summary:', error);
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
 * Функция для обновления суммы транзакции
 */
async function updateTransactionAmount() {
    const transactionId = document.getElementById('currentTransactionId')?.value;
    const newAmount = parseFloat(document.getElementById('newTotalAmount')?.value);

    if (!transactionId || isNaN(newAmount) || newAmount <= 0) {
        showNotification('error', 'Please enter a valid amount');
        return;
    }

    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/amount`, {
            method: 'PUT',
            body: JSON.stringify({ amount: newAmount })
        });

        if (response.success) {
            // Форматируем сумму с разделителями
            const formattedAmount = formatPKR(newAmount);
            const totalAmountView = document.getElementById('totalAmountView');
            if (totalAmountView) {
                totalAmountView.textContent = formattedAmount;
            }

            // Скрываем форму редактирования
            const amountEditSection = document.getElementById('amountEditSection');
            if (amountEditSection) {
                amountEditSection.style.display = 'none';
            }

            showNotification('success', 'Amount updated successfully');

            // Обновляем оставшуюся сумму
            await updateAmountSummary(transactionId);
        } else {
            throw new Error(response.message || 'Failed to update amount');
        }
    } catch (error) {
        console.error('Error updating transaction amount:', error);
        showNotification('error', 'Error updating transaction amount: ' + error.message);
    }
}

/**
 * Функция для отмены редактирования суммы
 */
function cancelAmountEdit() {
    const amountEditSection = document.getElementById('amountEditSection');
    if (amountEditSection) {
        amountEditSection.style.display = 'none';
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
        saveAmountBtn.addEventListener('click', updateTransactionAmount);
    }

    // Обработчик для кнопки отмены редактирования суммы
    const cancelAmountBtn = document.querySelector('.cancel-amount-btn');
    if (cancelAmountBtn) {
        cancelAmountBtn.addEventListener('click', cancelAmountEdit);
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
                updateTransactionAmount();
                break;
            case 'cancel-amount':
                cancelAmountEdit();
                break;
        }
    });
}

// Прикрепляем функции к глобальному объекту window
window.loadTransactions = loadTransactions;
window.loadTransactionDetails = loadTransactionDetails;
window.loadTransactionFiles = loadTransactionFiles;
window.loadTransactionPayments = loadTransactionPayments;
window.openViewTransactionModal = openViewTransactionModal;
window.displayTransactionDocuments = displayTransactionDocuments;
window.displayWitnesses = displayWitnesses;
window.updateWitnesses = updateWitnesses;
window.updateTransactionAmount = updateTransactionAmount;
window.cancelAmountEdit = cancelAmountEdit;
window.updateTransactionStatus = updateTransactionStatus;
window.initTransactionHandlers = initTransactionHandlers;
window.showTransactionLoader = showTransactionLoader;
window.attachTransactionActionHandlers = attachTransactionActionHandlers;

// Автоматическая инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function () {
    // Проверяем существование элементов транзакций
    if (document.getElementById('transactions') || document.getElementById('viewTransactionModal')) {
        initTransactionHandlers();

        // Если мы находимся на странице транзакций, загружаем данные
        const transactionsSection = document.getElementById('transactions');
        if (transactionsSection && transactionsSection.classList.contains('active')) {
            loadTransactions();
        }
    }
});