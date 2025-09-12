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
 * Заполняет выпадающий список свойств (properties)
 */
function populatePropertiesDropdown() {
    const propertyNameSelect = document.getElementById('propertyName');
    if (!propertyNameSelect) return;

    // Очищаем текущие опции
    propertyNameSelect.innerHTML = '<option value="">Select Property</option>';

    // Получаем properties из локального хранилища
    const propertiesData = localStorage.getItem('transactionProperties');
    if (propertiesData) {
        try {
            const properties = JSON.parse(propertiesData);

            // Проходим по всем типам properties (например, Parking)
            Object.keys(properties).forEach(category => {
                // Создаем группу опций для категории
                const optgroup = document.createElement('optgroup');
                optgroup.label = category;

                // Добавляем каждое свойство в группу
                properties[category].forEach(property => {
                    const option = document.createElement('option');
                    option.value = property.id;
                    option.textContent = `${property.name} (${property.id})`;
                    optgroup.appendChild(option);
                });

                propertyNameSelect.appendChild(optgroup);
            });
        } catch (e) {
            console.error('Error parsing properties data:', e);
        }
    }
}


/**
 * Заполняет выпадающий список свойств в модальном окне просмотра транзакции
 */
function populateViewTransactionProperties() {
    const propertySelect = document.getElementById('viewTransactionPropertySelect');
    if (!propertySelect) return;
    
    // Очищаем текущие опции
    propertySelect.innerHTML = '<option value="">Select Property</option>';
    
    // Получаем properties из localStorage
    const propertiesData = localStorage.getItem('transactionProperties');
    if (propertiesData) {
        try {
            const properties = JSON.parse(propertiesData);
            
            // Проходим по всем категориям свойств
            Object.keys(properties).forEach(category => {
                const optgroup = document.createElement('optgroup');
                optgroup.label = category;
                
                properties[category].forEach(property => {
                    const option = document.createElement('option');
                    option.value = property.id;
                    option.textContent = `${property.name} (${property.id})`;
                    optgroup.appendChild(option);
                });
                
                propertySelect.appendChild(optgroup);
            });
        } catch (e) {
            console.error('Error parsing properties:', e);
        }
    }
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
    currentTransactionId = transactionId;
    
    // Открываем модальное окно
    openModal('viewTransactionModal');
    
    // Загружаем данные транзакции и файлы
    loadTransactionDetails(transactionId);
    loadTransactionFiles(transactionId);
    loadTransactionPayments(transactionId);
    
    // ЗАПОЛНЯЕМ ВЫПАДАЮЩИЙ СПИСОК СВОЙСТВ (ЗАДАЧА 3)
    setTimeout(populateViewTransactionProperties, 300);
}
/**
 * Функция для загрузки деталей транзакции
 * @param {string} transactionId - ID транзакции
 */
async function loadTransactionDetails(transactionId) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}`);

        // Проверяем, что response содержит данные транзакции
        if (response && response.id) {
            const transaction = response;

            // ЗАДАЧА 1 и 2: Сохраняем properties в локальное хранилище
            if (response.properties) {
                localStorage.setItem('transactionProperties', JSON.stringify(response.properties));
            }

            // Получаем элементы
            const transactionIdEl = document.getElementById('transactionId');
            const propertyNameTextEl = document.getElementById('propertyName'); // Отображение имени
            const propertySelectEl = document.getElementById('propertySelect'); // Выбор из списка
            const previousOwnerEl = document.getElementById('previousOwner');
            const newOwnerEl = document.getElementById('newOwner');
            const statusEl = document.getElementById('transactionStatus');
            const createdAtEl = document.getElementById('createdAt');
            const totalAmountViewEl = document.getElementById('totalAmountView');
            const paidAmountEl = document.getElementById('paidAmount');
            const remainingAmountEl = document.getElementById('remainingAmount');

            // Проверка на существование элементов
            if (!transactionIdEl || !propertyNameTextEl || !previousOwnerEl ||
                !newOwnerEl || !statusEl || !createdAtEl ||
                !totalAmountViewEl || !paidAmountEl || !remainingAmountEl) {
                console.error('One or more transaction detail elements not found');
                return;
            }

            // Заполняем основную информацию
            transactionIdEl.textContent = transaction.id;
            propertyNameTextEl.textContent = transaction.property_name || transaction.property_id || 'N/A';
            previousOwnerEl.textContent = transaction.previous_owner_name || 'N/A';
            newOwnerEl.textContent = transaction.new_owner_name || 'N/A';

            // Статус
            const statusBadge = document.createElement('span');
            statusBadge.className = `status-badge ${getStatusClass(transaction.status)}`;
            statusBadge.textContent = formatStatus(transaction.status);
            statusEl.innerHTML = '';
            statusEl.appendChild(statusBadge);

            // Дата
            createdAtEl.textContent = new Date(transaction.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Суммы
            const totalAmount = parseFloat(transaction.total_amount);
            totalAmountViewEl.textContent = formatPKR(totalAmount);
            paidAmountEl.textContent = formatPKR(transaction.paid_amount);
            const remainingAmount = totalAmount - parseFloat(transaction.paid_amount);
            remainingAmountEl.textContent = formatPKR(remainingAmount);

            // Отображаем свидетелей и документы
            displayWitnesses(transaction);
            displayTransactionDocuments(transaction);
            displayPaymentsWithReceipts(transaction.payments, transaction.files?.receipt);

            // === ЗАДАЧА 3: Заполняем выпадающий список свойств ===
            if (propertySelectEl) {
                // Очищаем предыдущие опции
                propertySelectEl.innerHTML = '<option value="">Select Property</option>';

                // Получаем properties из localStorage
                const propertiesData = localStorage.getItem('transactionProperties');
                if (propertiesData) {
                    try {
                        const properties = JSON.parse(propertiesData);

                        // Проходим по категориям (например, Parking)
                        Object.keys(properties).forEach(category => {
                            const optgroup = document.createElement('optgroup');
                            optgroup.label = category;

                            properties[category].forEach(property => {
                                const option = document.createElement('option');
                                option.value = property.id;
                                option.textContent = `${property.name} (${property.id})`;
                                optgroup.appendChild(option);
                            });

                            propertySelectEl.appendChild(optgroup);
                        });

                        // Устанавливаем текущее значение
                        if (transaction.property_id) {
                            propertySelectEl.value = transaction.property_id;
                        }
                    } catch (e) {
                        console.error('Error parsing properties from localStorage:', e);
                    }
                }

                // Обработчик изменения выбора
                propertySelectEl.onchange = async function () {
                    const selectedPropertyId = this.value;
                    if (selectedPropertyId) {
                        console.log('Selected property ID:', selectedPropertyId);

                        // Находим объект выбранного свойства
                        let selectedProperty = null;
                        const properties = JSON.parse(localStorage.getItem('transactionProperties') || '{}');
                        for (const category in properties) {
                            selectedProperty = properties[category].find(p => p.id === selectedPropertyId);
                            if (selectedProperty) break;
                        }

                        // Обновляем отображаемое имя
                        if (selectedProperty && propertyNameTextEl) {
                            propertyNameTextEl.textContent = selectedProperty.name;
                        }
                    } else {
                        propertyNameTextEl.textContent = 'N/A';
                    }
                };
            }

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
 * Отображение платежей в таблице с учетом чеков
 * @param {Array} payments - Массив платежей
 * @param {Array} receiptFiles - Массив файлов чеков
 */
function displayPaymentsWithReceipts(payments, receiptFiles = []) {
    const paymentsTableBody = document.querySelector('#paymentsTable tbody');
    if (!paymentsTableBody) return;

    paymentsTableBody.innerHTML = '';

    if (!payments || payments.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 20px;">
                No payments found
            </td>
        `;
        paymentsTableBody.appendChild(row);
        return;
    }

    // Создаем маппинг чеков по дате создания для быстрого поиска
    const receiptMap = new Map();
    receiptFiles.forEach(receipt => {
        // Используем timestamp как ключ для поиска
        const timestamp = new Date(receipt.created_at).getTime();
        receiptMap.set(timestamp, receipt);
    });

    payments.forEach(payment => {
        const row = document.createElement('tr');

        // ID платежа
        const idCell = document.createElement('td');
        idCell.textContent = payment.id;
        row.appendChild(idCell);

        // Сумма
        const amountCell = document.createElement('td');
        amountCell.textContent = formatPKR(payment.amount);
        row.appendChild(amountCell);

        // Метод
        const methodCell = document.createElement('td');
        methodCell.textContent = formatPaymentMethod(payment.payment_method);
        row.appendChild(methodCell);

        // Статус
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${getStatusClass(payment.status)}`;
        statusBadge.textContent = formatStatus(payment.status);
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        // Дата
        const dateCell = document.createElement('td');
        dateCell.textContent = new Date(payment.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        row.appendChild(dateCell);

        // Чек
        const receiptCell = document.createElement('td');
        receiptCell.className = 'receipt-cell';

        // Ищем чек, соответствующий платежу по дате
        const paymentTimestamp = new Date(payment.created_at).getTime();
        const matchingReceipt = receiptMap.get(paymentTimestamp);

        if (matchingReceipt) {
            receiptCell.innerHTML = `
                <div class="receipt-preview">
                    <img src="${API_BASE_URL}/v1/admin/files/${matchingReceipt.id}" 
                         alt="Receipt" class="receipt-thumbnail">
                    <div class="receipt-actions">
                        <button class="action-btn btn-view" onclick="window.open('${API_BASE_URL}/v1/admin/files/${matchingReceipt.id}', '_blank')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="action-btn btn-delete" onclick="deleteReceiptFile(${matchingReceipt.id}, ${payment.transaction_id}, 'receipt')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        } else {
            receiptCell.innerHTML = '<span class="no-receipt">No receipt</span>';
        }

        row.appendChild(receiptCell);

        // Действия
        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions-cell';

        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn btn-edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        editBtn.addEventListener('click', () => openEditPaymentModal(payment.transaction_id, payment.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn btn-delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        deleteBtn.addEventListener('click', () => deletePayment(payment.id, payment.transaction_id));

        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
        row.appendChild(actionsCell);

        paymentsTableBody.appendChild(row);
    });

    // Устанавливаем обработчики действий
    setupPaymentActionHandlers(transactionId);
}

/**
 * Удаление файла чека
 * @param {string} fileId - ID файла
 * @param {string} transactionId - ID транзакции
 * @param {string} category - Категория файла
 */
async function deleteReceiptFile(fileId, transactionId, category) {
    if (!confirm(`Вы уверены, что хотите удалить файл?`)) {
        return;
    }

    try {
        const response = await apiRequest(`/v1/admin/files/${fileId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showNotification('success', 'File deleted successfully');

            // Перезагружаем детали транзакции для обновления данных
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
 * Функция для отображения свидетелей
 * @param {Object} transaction - Данные транзакции
 */
function displayWitnesses(transaction) {
    try {
        console.log('[WITNESSES] Displaying witnesses for transaction:', transaction.id);

        // Проверяем, есть ли элементы для свидетелей в DOM
        const witness1Name = document.getElementById('witness1Name');
        const witness1CNIC = document.getElementById('witness1CNIC');
        const witness1Phone = document.getElementById('witness1Phone');
        const witness2Name = document.getElementById('witness2Name');
        const witness2CNIC = document.getElementById('witness2CNIC');
        const witness2Phone = document.getElementById('witness2Phone');

        // Если элементы не найдены, попробуем найти их в модальном окне
        if (!witness1Name || !witness1CNIC || !witness1Phone ||
            !witness2Name || !witness2CNIC || !witness2Phone) {

            console.log('[WITNESSES] Primary elements not found, searching in modal...');

            const modal = document.getElementById('witnessesModal');
            if (modal) {
                witness1Name = modal.querySelector('#witness1Name');
                witness1CNIC = modal.querySelector('#witness1CNIC');
                witness1Phone = modal.querySelector('#witness1Phone');
                witness2Name = modal.querySelector('#witness2Name');
                witness2CNIC = modal.querySelector('#witness2CNIC');
                witness2Phone = modal.querySelector('#witness2Phone');
            }
        }

        // Проверяем существование элементов
        if (!witness1Name || !witness1CNIC || !witness1Phone ||
            !witness2Name || !witness2CNIC || !witness2Phone) {
            console.error('Witness form elements not found in DOM');
            return;
        }

        console.log('[WITNESSES] Found witness elements in DOM');

        // Проверяем структуру данных
        let witnessesData = null;

        // Пытаемся найти данные о свидетелях в разных местах структуры
        if (transaction.witnesses) {
            witnessesData = transaction.witnesses;
        } else if (transaction.witness) {
            witnessesData = transaction.witness;
        } else if (transaction.data && transaction.data.witnesses) {
            witnessesData = transaction.data.witnesses;
        }

        // Если данные не найдены, создаем пустую структуру
        if (!witnessesData) {
            console.log('[WITNESSES] No witnesses data found, initializing empty structure');
            witnessesData = {
                witness1: { name: '', cnic: '', phone: '' },
                witness2: { name: '', cnic: '', phone: '' }
            };
        }

        // Убедимся, что структура данных корректна
        if (!witnessesData.witness1) witnessesData.witness1 = { name: '', cnic: '', phone: '' };
        if (!witnessesData.witness2) witnessesData.witness2 = { name: '', cnic: '', phone: '' };

        // Заполняем форму свидетелей
        witness1Name.value = witnessesData.witness1.name || '';
        witness1CNIC.value = witnessesData.witness1.cnic || '';
        witness1Phone.value = witnessesData.witness1.phone || '';

        witness2Name.value = witnessesData.witness2.name || '';
        witness2CNIC.value = witnessesData.witness2.cnic || '';
        witness2Phone.value = witnessesData.witness2.phone || '';

        console.log('[WITNESSES] Witnesses displayed successfully');
    } catch (error) {
        console.error('Error displaying witnesses:', error);
        showNotification('error', 'Error displaying witnesses information');
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
 * Функция для загрузки платежей транзакции
 * @param {string} transactionId - ID транзакции
 */
async function loadTransactionPayments(transactionId) {
    try {
        // Загружаем платежи
        const paymentsResponse = await apiRequest(`/v1/admin/transactions/${transactionId}/payments`);

        // Загружаем документы, чтобы найти чеки
        const documentsResponse = await apiRequest(`/v1/admin/transactions/${transactionId}/documents`);

        if (paymentsResponse.success && paymentsResponse.payments) {
            let payments = [...paymentsResponse.payments];

            // Если есть документы, добавляем информацию о чеках к платежам
            if (documentsResponse.success && documentsResponse.documents) {
                const receiptFiles = documentsResponse.documents.filter(file => file.category === 'receipt');

                // Связываем чеки с платежами
                payments = payments.map(payment => {
                    // Ищем чек, связанный с этим платежом
                    // Используем более точную логику - проверяем по ID платежа в метаданных чека
                    const matchingReceipt = receiptFiles.find(receipt => {
                        // Предполагаем, что в метаданных чека есть payment_id
                        // Если API не предоставляет такой связи, используем временную метку
                        return receipt.payment_id === payment.id ||
                            (new Date(receipt.created_at).getTime() === new Date(payment.created_at).getTime());
                    });

                    return {
                        ...payment,
                        receipt: matchingReceipt
                    };
                });
            }

            // Отображаем платежи с чеками
            displayPayments(payments);

            // Обновляем оставшуюся сумму
            updateRemainingAmount();
        }
    } catch (error) {
        console.error('Error loading payments:', error);
        showNotification('error', 'Error loading payments');
    }
}

/**
 * Отображение платежей в таблице
 * @param {Array} payments - Массив платежей
 */
function displayPayments(payments) {
    const paymentsTableBody = document.querySelector('#paymentsTable tbody');
    if (!paymentsTableBody) return;

    paymentsTableBody.innerHTML = '';

    if (!payments || payments.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 20px;">
                No payments found
            </td>
        `;
        paymentsTableBody.appendChild(row);
        return;
    }

    payments.forEach(payment => {
        const row = document.createElement('tr');

        // ID платежа
        const idCell = document.createElement('td');
        idCell.textContent = payment.id;
        row.appendChild(idCell);

        // Сумма
        const amountCell = document.createElement('td');
        amountCell.textContent = formatPKR(payment.amount);
        row.appendChild(amountCell);

        // Метод
        const methodCell = document.createElement('td');
        methodCell.textContent = formatPaymentMethod(payment.method);
        row.appendChild(methodCell);

        // Статус
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${getStatusClass(payment.status)}`;
        statusBadge.textContent = formatStatus(payment.status);
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        // Дата
        const dateCell = document.createElement('td');
        dateCell.textContent = new Date(payment.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        row.appendChild(dateCell);

        // Чек
        const receiptCell = document.createElement('td');
        receiptCell.className = 'receipt-cell';

        if (payment.receipt) {
            receiptCell.innerHTML = `
                <div class="receipt-preview">
                    <img src="${API_BASE_URL}/v1/admin/files/${payment.receipt.id}" 
                         alt="Receipt" class="receipt-thumbnail">
                    <div class="receipt-actions">
                        <button class="action-btn btn-view" onclick="window.open('${API_BASE_URL}/v1/admin/files/${payment.receipt.id}', '_blank')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="action-btn btn-delete" onclick="deleteFile(${payment.receipt.id}, ${payment.transaction_id}, 'receipt')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        } else {
            receiptCell.innerHTML = '<span class="no-receipt">No receipt</span>';
        }

        row.appendChild(receiptCell);

        // Действия
        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions-cell';

        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn btn-edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        editBtn.addEventListener('click', () => openEditPaymentModal(payment.transaction_id, payment.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn btn-delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        deleteBtn.addEventListener('click', () => deletePayment(payment.id, payment.transaction_id));

        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
        row.appendChild(actionsCell);

        paymentsTableBody.appendChild(row);
    });

    // После отображения платежей устанавливаем обработчики действий
    setupPaymentActionHandlers(transactionId);
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
 * Функция для настройки обработчиков действий с платежами
 * @param {string} transactionId - ID транзакции
 */
function setupPaymentActionHandlers(transactionId) {
    // Удаляем существующие обработчики, чтобы избежать дублирования
    document.querySelectorAll('.edit-payment-btn, .delete-payment-btn, .receipt-actions .action-btn').forEach(btn => {
        const clonedBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(clonedBtn, btn);
    });

    // Добавляем обработчики для редактирования платежей
    document.querySelectorAll('.edit-payment-btn').forEach(button => {
        button.addEventListener('click', function () {
            const paymentId = this.getAttribute('data-payment-id');
            openEditPaymentModal(transactionId, paymentId);
        });
    });

    // Добавляем обработчики для удаления платежей
    document.querySelectorAll('.delete-payment-btn').forEach(button => {
        button.addEventListener('click', function () {
            const paymentId = this.getAttribute('data-payment-id');
            deletePayment(paymentId, transactionId);
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

    // Обработчик для кнопки создания новой транзакции
    const createTransactionBtn = document.getElementById('create');
    if (createTransactionBtn) {
        createTransactionBtn.addEventListener('click', function () {
            openCreateTransactionModal();
        });
        console.log('[INIT] Create transaction button handler attached');
    } else {
        console.warn('[INIT] Create transaction button not found');
    }
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


/**
 * Заполняет выпадающие списки в модальном окне создания транзакции
 */
function populateCreateTransactionModal() {
    // Получаем элементы выпадающих списков
    const propertySelect = document.getElementById('createTransactionModal_propertyId');
    const ownerSelect = document.getElementById('createTransactionModal_newOwnerId');
    
    if (!propertySelect && !ownerSelect) return;
    
    // Заполняем список свойств (properties)
    if (propertySelect) {
        propertySelect.innerHTML = '<option value="">Select Property</option>';
        
        const propertiesData = localStorage.getItem('transactionProperties');
        if (propertiesData) {
            try {
                const properties = JSON.parse(propertiesData);
                
                // Проходим по всем категориям свойств
                Object.keys(properties).forEach(category => {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = category;
                    
                    properties[category].forEach(property => {
                        const option = document.createElement('option');
                        option.value = property.id;
                        option.textContent = `${property.name} (${property.id})`;
                        optgroup.appendChild(option);
                    });
                    
                    propertySelect.appendChild(optgroup);
                });
            } catch (e) {
                console.error('Error parsing properties:', e);
            }
        }
    }
    
    // Заполняем список пользователей (owners)
    if (ownerSelect) {
        ownerSelect.innerHTML = '<option value="">Select New Owner</option>';
        
        const usersData = localStorage.getItem('users');
        if (usersData) {
            try {
                const users = JSON.parse(usersData);
                
                // Фильтруем только активных пользователей с ролью "user"
                const activeUsers = users.filter(user => 
                    user.role === 'user' && user.status === 'active'
                );
                
                activeUsers.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = `${user.name} (${user.cnic})`;
                    ownerSelect.appendChild(option);
                });
            } catch (e) {
                console.error('Error parsing users:', e);
            }
        }
    }
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