

// Глобальная переменная для хранения текущего ID транзакции
let currentTransactionId = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут
let exchangeRateCache = null;
let lastFetchTime = 0;
let conversionDebounce = null;

function renderUsersTable(users, tbody) {
    if (!tbody) {
        console.error('No tbody provided to renderUsersTable');
        return;
    }

    tbody.innerHTML = ''; // Очищаем

    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.cnic}</td>
            <td>${user.login}</td>
            <td>${user.properties_count || 0}</td>
            <td><span class="status-badge ${user.status}">${user.status}</span></td>
            <td class="actions-cell"></td>
        `;

        const actionsCell = row.querySelector('.actions-cell');
        let actionsHTML = '';

        if (user.status === 'archived') {
            actionsHTML = `
                <div class="actions-footer">
                    <button class="action-btn btn-view" data-id="${user.id}"><i class="fas fa-eye"></i> View</button>
                     <button class="action-btn btn-edit" data-id="${user.id}" data-action="toggle-status">
                        <i class="fas fa-sync-alt"></i> ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="action-btn btn-edit" data-id="${user.id}" data-action="restore">
                        <i class="fas fa-undo"></i> Restore
                    </button>
                </div>`;
        } else {
            actionsHTML = `
                <div class="actions-column">
                    <button class="action-btn btn-view" data-id="${user.id}"><i class="fas fa-eye"></i> View</button>
                    <button class="action-btn btn-edit" data-id="${user.id}" data-action="toggle-status">
                        <i class="fas fa-sync-alt"></i> ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="action-btn btn-delete" data-id="${user.id}" data-action="archive">
                        <i class="fas fa-archive"></i> Archive
                    </button>
                </div>`;
        }

        actionsCell.innerHTML = actionsHTML;
        tbody.appendChild(row);
    });

    // Привязываем обработчики
    document.querySelectorAll('.btn-view').forEach(button => {
        button.addEventListener('click', (e) => viewUser(e.target.dataset.id));
    });

    document.querySelectorAll('.btn-edit[data-action="toggle-status"]').forEach(button => {
        button.addEventListener('click', (e) => toggleUserStatus(e.target.dataset.id, e.target.dataset.status));
    });

    document.querySelectorAll('.btn-delete[data-action="archive"]').forEach(button => {
        button.addEventListener('click', (e) => archiveUser(e.target.dataset.id));
    });

    document.querySelectorAll('.btn-edit[data-action="restore"]').forEach(button => {
        button.addEventListener('click', (e) => restoreUser(e.target.dataset.id));
    });
}


document.querySelector('#users .search-input')?.addEventListener('input', debounce(function () {
    currentPage = 1;
    const activeSection = document.querySelector('.section.active').id;
    if (activeSection === 'users') {
        loadUsers('active');
    } else if (activeSection === 'users-archive') {
        loadUsers('archived');
    }
}, 300));

function attachActionHandlers() {
    document.body.addEventListener('click', function (e) {
        const button = e.target.closest('.action-btn');
        if (!button) return;

        const action = button.getAttribute('data-action');
        const id = button.getAttribute('data-id');

        if (!id || !action) return;

        switch (action) {
            case 'view':
                viewTransaction(id);
                break;
            case 'view_user':
                viewUser(id);
                break;
            case 'approve':
                updateTransactionStatus(id, 'approved');
                break;
            case 'reject':
                updateTransactionStatus(id, 'rejected');
                break;
            case 'block':
                toggleUserStatus(id, 'blocked');
                break;
            case 'unblock':
                toggleUserStatus(id, 'active');
                break;
        }
    });
}
// Обновление статуса пользователя
async function toggleUserStatus(userId, newStatus) {
    try {
        const response = await apiRequest(`/v1/admin/users/${userId}/status`, {
            method: 'POST',
            body: JSON.stringify({ status: newStatus })
        });

        if (response.success) {
            showNotification('success', `User status updated to: ${newStatus}`);

            // Определяем, на какой странице мы сейчас
            const activeSection = document.querySelector('.section.active').id;
            if (activeSection === 'users') {
                loadUsers('active');
            } else if (activeSection === 'users-archive') {
                loadUsers('archived');
            }
        } else {
            showNotification('error', response.message || 'Error updating user status');
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        showNotification('error', 'Error updating user status');
    }
}
// Обновление статуса сделки
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
// Загрузка документов
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

// Очистка истории сделок
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

// Поиск
function setupSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce(function () {
            currentPage = 1;
            const section = this.closest('.section').id;
            if (section === 'users') {
                loadUsers('active');
            } else if (section === 'users-archive') {
                loadUsers('archived');
            } else if (section === 'transactions') {
                loadTransactions();
            }
        }, 300));
    });
}

// Переключение между разделами
function showSection(sectionId) {
    // Скрыть все разделы
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });

    // Скрыть все ссылки навигации
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Показать выбранный раздел
    const sectionElement = document.getElementById(sectionId);
    if (!sectionElement) {
        console.error(`Section with id "${sectionId}" not found in DOM`);

        // Если раздел не найден, переключаемся на раздел транзакций
        const transactionsSection = document.getElementById('transactions');
        if (transactionsSection) {
            transactionsSection.style.display = 'block';
            transactionsSection.classList.add('active');

            // Активируем соответствующую ссылку навигации
            const navLink = document.querySelector('[href="#transactions"]');
            if (navLink) {
                navLink.classList.add('active');
            }

            // Загружаем данные для раздела транзакций
            loadTransactions();

            return;
        } else {
            console.error('Transactions section not found either');
            return;
        }
    }

    // Элемент найден, показываем его
    sectionElement.style.display = 'block';
    sectionElement.classList.add('active');

    // Активируем соответствующую ссылку навигации
    const navLink = document.querySelector(`[href="#${sectionId}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }

    // Загрузить данные для активного раздела
    if (sectionId === 'users') {
        console.log('Loading users for active users section');
        loadUsers('active');
    } else if (sectionId === 'users-archive') {
        console.log('Loading archived users');
        loadUsers('archived');
    } else if (sectionId === 'transactions') {
        console.log('Loading transactions for transactions section');
        loadTransactions();
    }
}

// Добавление элемента графика платежей
function addPaymentScheduleItem() {
    const container = document.getElementById('paymentSchedule');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'payment-schedule-item';
    itemDiv.innerHTML = `
                <div class="form-group">
                    <input type="number" name="payment_amount" placeholder="Amount" required min="0" step="0.01">
                    <input type="date" name="payment_date" required>
                    <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">Remove</button>
                </div>
            `;
    container.appendChild(itemDiv);
}

// Обработка создания транзакции
async function handleCreateTransaction(event) {
    event.preventDefault();

    try {
        const form = event.target;
        const formData = {
            property_id: form.querySelector('[name="property_id"]').value,
            new_owner_id: parseInt(form.querySelector('[name="new_owner_id"]').value),
            total_amount: parseFloat(form.querySelector('[name="total_amount"]').value),
            witnesses: {
                witness1: {
                    name: form.querySelector('[name="witness1Name"]').value,
                    cnic: form.querySelector('[name="witness1CNIC"]').value,
                    phone: form.querySelector('[name="witness1Phone"]').value
                },
                witness2: {
                    name: form.querySelector('[name="witness2Name"]').value,
                    cnic: form.querySelector('[name="witness2CNIC"]').value,
                    phone: form.querySelector('[name="witness2Phone"]').value
                }
            }
        };

        // Validate data
        if (!formData.property_id || isNaN(formData.new_owner_id) || isNaN(formData.total_amount)) {
            showNotification('warning', 'Please fill in all required fields correctly');
            return;
        }

        console.log('Creating transaction with data:', formData);

        const response = await fetch(`${API_BASE_URL}/v1/admin/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error creating transaction');
        }

        showNotification('success', 'Transaction created successfully');
        closeModal('createTransactionModal');
        loadTransactions();
    } catch (error) {
        console.error('Error handling transaction:', error);
        showNotification('error', error.message || 'Error handling transaction');
    }
}
function updateRemainingAmount() {
    const totalAmountText = document.getElementById('totalAmountView').textContent.replace(/,/g, '');
    const paidAmountText = document.getElementById('paidAmount').textContent.replace(/,/g, '');

    const totalAmount = parseFloat(totalAmountText) || 0;
    const paidAmount = parseFloat(paidAmountText) || 0;

    const remainingAmount = totalAmount - paidAmount;

    // Форматируем оставшуюся сумму с разделителями тысяч
    const formattedRemaining = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(remainingAmount);

    document.getElementById('remainingAmount').textContent = formattedRemaining;
}


async function updatePaymentStatus(paymentId, status) {
    try {
        let transactionId = Number(document.getElementById('currentTransactionId').value)
        const response = await fetch(API_BASE_URL + `/v1/admin/transactions/${paymentId}/payment-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ payment_status: status, transactionId: transactionId })
        });

        if (!response.ok) {
            showNotification('error', "Failed to fetch update")
            return;
        }

        const result = await response.json();

        if (result.status_updated_to_completed) {
            showNotification('success', 'Payment marked as paid and transaction status updated to Completed');
        } else {
            showNotification('success', 'Payment status updated successfully');
        }

        // Reload transaction details
        loadTransactionDetails(transactionId);

    } catch (error) {
        console.error('Error updating payment status:', error);
        showNotification('error', 'Failed to update payment status');
    }
}
async function uploadSingleFile(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const transactionId = document.getElementById('currentTransactionId')?.value;
    const category = document.getElementById('uploadCategory')?.value;

    // Добавляем обязательные поля в formData
    formData.append('type', 'single');
    formData.append('category', category || 'proof_documents');

    // Проверка обязательных элементов
    if (!transactionId) {
        showNotification('error', 'Transaction ID not found');
        return;
    }

    if (!category) {
        showNotification('error', 'Category not selected');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/v1/admin/transactions/${transactionId}/documents`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Error uploading file' }));
            throw new Error(error.message || 'Error uploading file');
        }

        const result = await response.json();

        // Проверяем, что в ответе есть файлы
        if (!result.files || result.files.length === 0) {
            throw new Error('No files returned from server');
        }

        // Проверяем наличие контейнера для файлов
        const filesContainer = document.getElementById('filesContainer');
        if (!filesContainer) {
            console.warn('Files container not found. Refreshing file list...');
            // Попробуем обновить список файлов полностью
            await loadTransactionFiles(transactionId);
            showNotification('success', 'File uploaded successfully');
            closeModal('uploadFileModal');
            return;
        }

        // Ищем или создаем категорию
        let categoryDiv = filesContainer.querySelector(`[data-category="${category}"]`);
        if (!categoryDiv) {
            categoryDiv = createCategoryDiv(category);
            filesContainer.appendChild(categoryDiv);
        }

        const filesList = categoryDiv.querySelector('.files-list') ||
            (function () {
                const list = document.createElement('div');
                list.className = 'files-list';
                categoryDiv.appendChild(list);
                return list;
            })();

        // Добавляем новый файл
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        // Используем правильный путь к файлу
        const filePath = result.files[0].file_path || result.files[0].file_name;

        fileItem.innerHTML = `
      <a href="${filePath}" target="_blank">
          ${result.files[0].originalName}
      </a>
      <span class="file-date">${new Date().toLocaleString()}</span>
      <button class="delete-file" data-file-id="${result.files[0].id}">
          <i class="fas fa-trash"></i>
      </button>
  `;

        filesList.appendChild(fileItem);

        // Добавляем обработчик удаления
        fileItem.querySelector('.delete-file').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteFile(result.files[0].id, transactionId, category);
        });

        // Если это чек платежа, обновляем таблицу платежей
        if (category === 'receipt') {
            await loadTransactionPayments(transactionId);
        }

        showNotification('success', 'File uploaded successfully');
        closeModal('uploadFileModal');
    } catch (error) {
        console.error('Error uploading file:', error);
        showNotification('error', error.message || 'Error uploading file');
    }
}

// Добавляем обработку формы
document.getElementById('newTransactionForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Собираем данные о свидетелях
    const witnesses = {
        witness1: {
            name: document.getElementById('witness1Name').value,
            cnic: document.getElementById('witness1CNIC').value,
            phone: document.getElementById('witness1Phone').value
        },
        witness2: {
            name: document.getElementById('witness2Name').value,
            cnic: document.getElementById('witness2CNIC').value,
            phone: document.getElementById('witness2Phone').value
        }
    };

    const formData = {
        witnesses: witnesses
    };

    try {
        const response = await fetch(API_BASE_URL + '/v1/admin/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to create transaction');
        }

        showNotification('success', 'Transaction created successfully');
        // Очищаем форму или перенаправляем пользователя
        this.reset();
    } catch (error) {
        console.log(error)
        showNotification('error', 'Error creating transaction: ' + error.message);
    }
});

// Функция загрузки transfer requests
async function loadTransferRequestsAdmin() {
    try {
        const status = document.getElementById('transferRequestStatus').value;
        const response = await fetch(`${API_BASE_URL}/v1/admin/transfer-requests${status ? `?status=${status}` : ''}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to load transfer requests');
        }

        const data = await response.json();
        const tbody = document.getElementById('transferRequestsTableBody');

        // Очищаем текущее содержимое
        tbody.innerHTML = '';

        // Добавляем строки с данными
        data.requests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.id}</td>
                <td>${request.property_id}</td>
                <td>${request.requester_name}</td>
                <td>${request.requester_cnic}</td>
                <td>
                    <span class="status-badge ${request.status.toLowerCase()}">
                        ${request.status}
                    </span>
                </td>
                <td>${new Date(request.created_at).toLocaleDateString()}</td>
                <td>
                    ${request.status === 'pending' ? `
                        <button class="action-btn btn-approve" data-id="${request.id}" data-action="approved">Approve</button>
                        <button class="action-btn btn-reject" data-id="${request.id}" data-action="rejected">Reject</button>
                    ` : ''}
                    <button class="action-btn btn-view" data-id="${request.id}">View Details</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Привязываем обработчик событий только один раз
        attachActionHandlers1();

    } catch (error) {
        console.error('Error loading transfer requests:', error);
        showNotification('error', 'Failed to load transfer requests');
    }
}

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

// Добавляем обработчики для кнопок действий
document.querySelectorAll('.btn-approve, .btn-reject').forEach(btn => {
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const transactionId = this.getAttribute('data-id');
        const action = this.getAttribute('data-action');

        if (action === 'approve') {
            updateTransactionStatus(transactionId, 'approved');
        } else if (action === 'reject') {
            updateTransactionStatus(transactionId, 'rejected');
        }
    });
});

// Динамические обработчики для действий с транзакциями
document.addEventListener('click', function (e) {
    const approveBtn = e.target.closest('.action-btn[data-action="approve"]');
    const rejectBtn = e.target.closest('.action-btn[data-action="reject"]');

    if (approveBtn) {
        const transactionId = approveBtn.getAttribute('data-id');
        updateTransactionStatus(transactionId, 'approved');
    } else if (rejectBtn) {
        const transactionId = rejectBtn.getAttribute('data-id');
        updateTransactionStatus(transactionId, 'rejected');
    }
});

// Функция загрузки запросов на сделку
async function loadTransferRequests() {
    try {
        const status = document.getElementById('transferRequestStatusFilter').value;

        const data = await apiRequest(`/v1/admin/transfer-requests${status !== 'all' ? `?status=${status}` : ''}`);

        const tbody = document.getElementById('transferRequestsTableBody');
        tbody.innerHTML = '';

        if (!data || !Array.isArray(data.requests) || data.requests.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">No requests found</td></tr>`;
            return;
        }

        data.requests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.id || 'N/A'}</td>
                <td>${request.property_id || 'N/A'}</td>
                <td>${request.requester_name || 'N/A'}</td>
                <td>${request.requester_cnic || 'N/A'}</td>
                <td>
                    <span class="status-badge ${request.status.toLowerCase()}">
                        ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                </td>
                <td>${new Date(request.created_at).toLocaleString() || 'N/A'}</td>
                <td class="actions-cell">
                    ${request.status === 'pending' ? `
                        <button class="action-btn btn-approve" data-id="${request.id}" data-action="approved">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="action-btn btn-reject" data-id="${request.id}" data-action="rejected">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : `
                        <span class="action-text">${request.status === 'approved' ? 'Approved' : 'Rejected'}</span>
                        ${request.admin_notes ? `
                            <i class="fas fa-info-circle" title="${request.admin_notes}"></i>
                        ` : ''}
                    `}
                </td>
            `;
            tbody.appendChild(row);
        });

        attachActionHandlers();

    } catch (error) {
        console.error('Error loading transfer requests:', error);
        showNotification('error', 'Failed to load requests');
    }
}

// Функция обработки действий с запросом
async function handleTransferRequestAction(requestId, action) {
    try {
        let notes = null;
        if (action === 'rejected') {
            notes = prompt('Please provide a reason for rejection:');
            if (notes === null) return; // Пользователь нажал "Отмена"
        }

        const response = await apiRequest(`/v1/admin/transfer-requests/${requestId}`, {
            method: 'PUT',
            body: JSON.stringify({
                status: action,
                admin_notes: notes
            })
        });

        if (response.success) {
            showNotification('success', `Request ${action} successfully`);
            await loadTransferRequests(); // Перезагружаем список запросов
        } else {
            showNotification('error', response.message || 'Error updating request');
        }
    } catch (error) {
        console.error('Error handling transfer request action:', error);
        showNotification('error', 'Error updating request');
    }
}
document.addEventListener('DOMContentLoaded', function () {
    // Закрытие модальных окон по кнопке "×"
    document.querySelectorAll('.modal-close, .close').forEach(button => {
        button.addEventListener('click', function () {
            const modalId = this.getAttribute('data-modal');
            closeModal(modalId);
        });
    });

    // Закрытие модального окна при клике вне его содержимого
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Обработчик для редактирования суммы транзакции
    document.querySelector('.edit-amount-btn')?.addEventListener('click', toggleAmountEdit);
    // Обработчик для сохранения свидетелей
    document.querySelector('.update-witnesses-btn')?.addEventListener('click', updateWitnesses);
});

// Загружаем запросы при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('transferRequestsSection')) {
        loadTransferRequests();
    }
})

// Показ деталей запроса
function showTransferRequestDetails(requestId) {
    // Здесь можно добавить модальное окно с подробной информацией
    // о запросе, включая историю изменений и комментарии
}

// Добавляем обработчики событий
document.getElementById('transferRequestStatus')?.addEventListener('change', loadTransferRequestsAdmin);

// Добавляем загрузку transfer requests при инициализации админ-панели
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('transferRequestsSection')) {
        loadTransferRequestsAdmin();
    }
});

function toggleAmountEdit() {
    const editSection = document.getElementById('amountEditSection');
    editSection.style.display = editSection.style.display === 'none' ? 'block' : 'none';
}

function cancelAmountEdit() {
    const editSection = document.getElementById('amountEditSection');
    editSection.style.display = 'none';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'PKR'
    }).format(amount);
}

function formatAmount(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function getStatusBadgeClass(status) {
    const statusClasses = {
        'pending': 'warning',
        'approved': 'success',
        'rejected': 'danger',
        'cancelled': 'secondary',
        'paid': 'success',
        'not_started': 'secondary',
        'in_progress': 'primary',
        'completed': 'success'
    };
    return statusClasses[status] || 'secondary';
}


async function getExchangeRatePKRtoUSD() {
    try {
        // Запрашиваем курс через внутренний API
        const data = await apiRequest('/v1/admin/latest/PKR', {
            method: 'GET'
        });

        // Проверяем структуру ответа
        if (data.success && typeof data.USD === 'number') {
            return data.USD;
        }

        throw new Error('Invalid API response structure');
    } catch (error) {
        console.error('Ошибка получения курса:', error);
        showNotification('error', 'Failed to retrieve the course. An approximate value is used.');
        return 0.0036; // Fallback курс
    }
}
function formatPKR(amount) {
    return new Intl.NumberFormat('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}


// Инициализация обработчиков для платежей
function initPaymentHandlers() {
    // Обработчик для кнопки "Add Payment"
    document.querySelector('[data-action="add-payment"]')?.addEventListener('click', function () {
        const transactionId = document.getElementById('currentTransactionId').value;
        if (!transactionId) {
            showNotification('error', 'Transaction ID not found');
            return;
        }

        document.getElementById('paymentTransactionId').value = transactionId;
        document.getElementById('paymentAmount').value = '';
        document.getElementById('paymentMethod').value = 'cash';
        document.getElementById('receiptFile').value = '';
        document.getElementById('receiptPreview').innerHTML = '';

        openModal('addPaymentModal');
    });

    // Обработчик для предпросмотра квитанции
    document.getElementById('receiptFile')?.addEventListener('change', function (e) {
        const file = e.target.files[0];
        const preview = document.getElementById('receiptPreview');
        if (file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 150px;">`;
                };
                reader.readAsDataURL(file);
            } else {
                preview.innerHTML = `<p>File: ${file.name}</p>`;
            }
        } else {
            preview.innerHTML = '';
        }
    });
    // Функция для чтения файла как base64
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Убираем префикс data:...
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }
    document.getElementById('addPaymentForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const transactionId = document.getElementById('paymentTransactionId').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const method = document.getElementById('paymentMethod').value;
        const receiptFile = document.getElementById('receiptFile').files[0];
        const paymentDate = new Date().toISOString().split('T')[0];
        const notes = document.getElementById('paymentNotes')?.value || '';

        if (isNaN(amount) || amount <= 0) {
            showNotification('error', 'Please enter a valid amount');
            return;
        }

        try {
            // Создаем FormData для правильной отправки файлов
            const formData = new FormData();

            // Добавляем все текстовые данные
            formData.append('amount', amount);
            formData.append('payment_date', paymentDate);
            formData.append('payment_method', method);
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
                showNotification('error', data.message || 'Failed to add payment');
            }
        } catch (error) {
            console.error("Error adding payment:", error);
            showNotification('error', 'Error: ' + error.message);
        }
    });

    // Обработчики для кнопок отмены
    document.querySelector('.cancel-payment-btn')?.addEventListener('click', function () {
        closeModal('addPaymentModal');
    });
    // Обработчики для кнопок отмены
    document.querySelector('.cancel-payment-btn')?.addEventListener('click', function () {
        closeModal('addPaymentModal');
    });
}

// Вызовите эту функцию после загрузки DOM
document.addEventListener('DOMContentLoaded', function () {
    initPaymentHandlers();
});
// Предпросмотр квитанции
document.getElementById('receiptFile')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    const preview = document.getElementById('receiptPreview');
    if (file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 150px;">`;
            }
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = `<p>File: ${file.name}</p>`;
        }
    } else {
        preview.innerHTML = '';
    }
});

// Инициализация обработчиков событий
document.addEventListener('DOMContentLoaded', function () {
    // Закрытие модальных окон по кнопке "×"
    document.querySelectorAll('.modal-close, .close').forEach(button => {
        button.addEventListener('click', function () {
            const modalId = this.getAttribute('data-modal');
            closeModal(modalId);
        });
    });

    // Закрытие модального окна при клике вне его содержимого
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });

    // Инициализация предпросмотра файлов
    setupFilePreview();

    // Добавляем обработчик для кнопок действий с транзакцией
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
                openMultipleUploadModal();
                break;
            case 'add-payment':
                openAddPaymentModal();
                break;
            case 'edit-amount':
                document.getElementById('amountEditSection').style.display = 'block';
                document.getElementById('newTotalAmount').focus();
                break;
            case 'save-amount':
                saveTransactionAmount();
                break;
            case 'cancel-amount':
                document.getElementById('amountEditSection').style.display = 'none';
                break;
            case 'update-witnesses':
                updateWitnesses();
                break;
        }
    });

    // Обработчик формы загрузки одного файла
    document.getElementById('singleFileUploadForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const transactionId = document.getElementById('uploadTransactionId').value;
        const category = document.getElementById('uploadCategory').value;
        const file = document.getElementById('file').files[0];

        if (!file) {
            showNotification('error', 'Please select a file');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', category);

            const response = await fetch(API_BASE_URL + `/v1/admin/transactions/${transactionId}/documents`, {
                method: 'POST',
                body: formData
            });

            if (response.success) {
                closeModal('uploadFileModal');
                // Перезагружаем файлы транзакции
                loadTransactionFiles(transactionId);
                showNotification('success', 'File uploaded successfully');
            } else {
                throw new Error(response.message || 'Failed to upload file');
            }
        } catch (error) {
            showNotification('error', 'Error uploading file: ' + error.message);
        }
    });

    document.querySelector('.cancel-multi-upload-btn')?.addEventListener('click', function () {
        closeModal('multipleUploadModal');
    });

    document.querySelector('.cancel-payment-btn')?.addEventListener('click', function () {
        closeModal('addPaymentModal');
    });

    // Обработчик для кнопки сохранения суммы
    document.querySelector('.save-amount-btn')?.addEventListener('click', saveTransactionAmount);

    // Обработчик для кнопки отмены редактирования суммы
    document.querySelector('.cancel-amount-btn')?.addEventListener('click', function () {
        document.getElementById('amountEditSection').style.display = 'none';
    });

    // Обработчик для кнопки сохранения свидетелей
    document.querySelector('.update-witnesses-btn')?.addEventListener('click', updateWitnesses);
});


// Функция для получения курса обмена PKR к USD
async function getExchangeRatePKRtoUSD() {
    try {
        // Запрашиваем курс через внутренний API
        const data = await apiRequest('/v1/admin/latest/PKR', {
            method: 'GET'
        });

        // Проверяем структуру ответа
        if (data.success && typeof data.USD === 'number') {
            return data.USD;
        }

        throw new Error('Invalid API response structure');
    } catch (error) {
        console.error('Ошибка получения курса:', error);
        showNotification('error', 'Failed to retrieve the course. An approximate value is used.');
        return 0.0036; // Fallback курс
    }
}

async function getCachedExchangeRate() {
    const now = Date.now();
    if (exchangeRateCache && (now - lastFetchTime) < CACHE_DURATION) {
        return exchangeRateCache;
    }
    exchangeRateCache = await getExchangeRatePKRtoUSD();
    lastFetchTime = now;
    return exchangeRateCache;
}


// Функция для открытия модального окна загрузки одного файла
function openUploadModal(category) {
    // Получаем ID текущей транзакции из скрытого поля в модальном окне
    const transactionIdElement = document.getElementById('currentTransactionId');
    if (!transactionIdElement || !transactionIdElement.value) {
        showNotification('error', 'Transaction ID not found');
        return;
    }

    currentTransactionId = transactionIdElement.value;

    // Устанавливаем значения в скрытые поля формы
    const uploadTransactionId = document.getElementById('uploadTransactionId');
    const uploadCategory = document.getElementById('uploadCategory');

    if (uploadTransactionId) uploadTransactionId.value = currentTransactionId;
    if (uploadCategory) uploadCategory.value = category;

    // Обновляем заголовок модального окна в зависимости от категории
    const modalHeader = document.querySelector('#uploadFileModal .modal-header h2');
    if (modalHeader) {
        let title = 'Upload File';
        switch (category) {
            case 'agreement':
                title = 'Upload Agreement File';
                break;
            case 'video':
                title = 'Upload Video File';
                break;
        }
        modalHeader.textContent = title;
    }

    // Сбрасываем форму и предпросмотр
    const fileInput = document.getElementById('file');
    if (fileInput) {
        fileInput.value = '';
    }

    const imagePreview = document.getElementById('previewImage');
    if (imagePreview) {
        imagePreview.style.display = 'none';
        imagePreview.src = '';
    }

    // Открываем модальное окно
    openModal('uploadFileModal');
}

// Функция для предпросмотра изображения при выборе файла
// Функция для предпросмотра изображения при выборе файла
function setupFilePreview() {
  // Для одиночной загрузки
  const fileInput = document.getElementById('file');
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      const preview = document.getElementById('previewImage');
      if (preview) {
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
          };
          reader.readAsDataURL(file);
        } else {
          preview.style.display = 'none';
          preview.src = '';
        }
      }
    });
  }

  // Для предпросмотра квитанции платежа
  const receiptFileInput = document.getElementById('receiptFile');
  if (receiptFileInput) {
    receiptFileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      const preview = document.getElementById('receiptPreview');
      if (preview) {
        preview.innerHTML = '';
        if (file) {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
              preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 150px;">`;
            };
            reader.readAsDataURL(file);
          } else if (file.type === 'application/pdf') {
            preview.innerHTML = `<i class="fas fa-file-pdf" style="font-size: 48px; color: #dc3545;"></i>`;
          } else {
            preview.innerHTML = `<p>File: ${file.name}</p>`;
          }
        }
      }
    });
  }
}

// Функция для отмены платежа
async function cancelPayment(paymentId, transactionId) {
    if (!confirm('Are you sure you want to cancel this payment?')) {
        return;
    }

    try {
        const response = await apiRequest(
            `/v1/admin/transactions/${transactionId}/payments/${paymentId}`,
            {
                method: 'PUT',
                body: JSON.stringify({
                    status: 'cancelled',
                    notes: 'Payment cancelled by admin'
                })
            }
        );

        if (response.success) {
            showNotification('success', 'Payment cancelled successfully');
            await loadTransactionPayments(transactionId);
            await loadTransactionSummary(transactionId);
        } else {
            throw new Error(response.message || 'Failed to cancel payment');
        }
    } catch (error) {
        console.error('Error cancelling payment:', error);
        showNotification('error', error.message || 'Error cancelling payment');
    }
}


// Функция для сохранения информации о свидетелях
async function saveWitnesses(transactionId) {
    try {
        const witness1Name = document.getElementById('witness1Name').value;
        const witness1CNIC = document.getElementById('witness1CNIC').value;
        const witness1Phone = document.getElementById('witness1Phone').value;
        const witness2Name = document.getElementById('witness2Name').value;
        const witness2CNIC = document.getElementById('witness2CNIC').value;
        const witness2Phone = document.getElementById('witness2Phone').value;

        // Валидация данных
        if (!witness1Name || !witness1CNIC) {
            showNotification('error', 'Witness 1 name and CNIC are required');
            return;
        }

        if (!witness2Name || !witness2CNIC) {
            showNotification('error', 'Witness 2 name and CNIC are required');
            return;
        }

        const response = await apiRequest(
            `/v1/admin/transactions/${transactionId}/witnesses`,
            {
                method: 'PUT',
                body: JSON.stringify({
                    witness1: {
                        name: witness1Name,
                        cnic: witness1CNIC,
                        phone: witness1Phone
                    },
                    witness2: {
                        name: witness2Name,
                        cnic: witness2CNIC,
                        phone: witness2Phone
                    }
                })
            }
        );

        if (response.success) {
            showNotification('success', 'Witness information updated successfully');
        } else {
            throw new Error(response.message || 'Failed to update witness information');
        }
    } catch (error) {
        console.error('Error saving witnesses:', error);
        showNotification('error', error.message || 'Error saving witness information');
    }
}
// Функция для обновления общей информации о платежах
async function loadTransactionSummary(transactionId) {
    try {
        const response = await apiRequest(
            `/v1/admin/transactions/${transactionId}/payments/summary`
        );

        if (response.total_amount) {
            document.getElementById('totalAmountView').textContent =
                `PKR ${parseFloat(response.total_amount).toFixed(2)}`;
        }

        if (response.paid_amount) {
            document.getElementById('paidAmount').textContent =
                `PKR ${parseFloat(response.paid_amount).toFixed(2)}`;

            const remaining = parseFloat(response.total_amount) - parseFloat(response.paid_amount);
            document.getElementById('remainingAmount').textContent =
                `PKR ${remaining.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error loading transaction summary:', error);
    }
}

// Функция для отмены платежа
async function cancelPayment(paymentId, transactionId) {
    if (!confirm('Are you sure you want to cancel this payment?')) {
        return;
    }

    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'cancelled' })
        });

        if (response.success) {
            showNotification('success', 'Payment cancelled successfully');
            await loadTransactionPayments(transactionId);
            await loadTransactionSummary(transactionId);
        } else {
            throw new Error(response.message || 'Failed to cancel payment');
        }
    } catch (error) {
        console.error('Error cancelling payment:', error);
        showNotification('error', error.message || 'Error cancelling payment');
    }
}

// Функции для обработки действий с платежами
function viewPaymentDetails(paymentId, transactionId) {
    // Реализация просмотра деталей платежа
    console.log(`Viewing payment ${paymentId} for transaction ${transactionId}`);

    // Загрузка данных платежа
    apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`)
        .then(response => response.json())
        .then(data => {
            if (data.payment) {
                // Заполнение модального окна данными
                document.getElementById('viewPaymentId').textContent = data.payment.id;
                document.getElementById('viewPaymentAmount').textContent = parseFloat(data.payment.amount).toFixed(2);
                document.getElementById('viewPaymentMethod').textContent = data.payment.payment_method;
                document.getElementById('viewPaymentStatus').textContent = data.payment.status;
                document.getElementById('viewPaymentDate').textContent = new Date(data.payment.payment_date).toLocaleDateString();
                document.getElementById('viewPaymentNotes').textContent = data.payment.notes || '-';

                // Отображение ссылки на квитанцию
                const receiptLink = document.getElementById('viewReceiptLink');
                if (data.payment.receipt && data.payment.receipt.file_path) {
                    receiptLink.href = `/uploads/${data.payment.receipt.file_path}`;
                    receiptLink.style.display = 'inline';
                    receiptLink.textContent = data.payment.receipt.original_name;
                } else {
                    receiptLink.style.display = 'none';
                }

                // Открытие модального окна
                openModal('viewPaymentModal');
            }
        })
        .catch(error => {
            console.error('Error loading payment details:', error);
            showNotification('error', 'Failed to load payment details');
        });
}

function confirmDeletePayment(paymentId, transactionId) {
    // Реализация подтверждения удаления платежа
    if (confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
        deletePayment(paymentId, transactionId);
    }
}

function deletePayment(paymentId, transactionId) {
    apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`, {
        method: 'DELETE'
    })
        .then(async response => {
            const data = await response.json();
            if (response.ok && (data.success || data.message)) {
                showNotification('success', 'Payment deleted successfully');
                loadTransactionPayments(transactionId);
                loadTransactionDetails(transactionId);
            } else {
                throw new Error(data.message || 'Failed to delete payment');
            }
        })
        .catch(error => {
            console.error('Error deleting payment:', error);
            showNotification('error', error.message);
        });
}

// Функция для открытия модального окна просмотра транзакции
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

    // Загружаем данные транзакции и файлы
    loadTransactionDetails(transactionId);
    loadTransactionFiles(transactionId);
    loadTransactionPayments(transactionId);
}

// Функция для загрузки транзакций
async function loadTransactions(page = 1, limit = 10) {
    try {
        const section = document.getElementById('transactions');
        const tbody = document.getElementById('transactionsTableBody');
        
        if (!tbody) {
            console.error('Transactions tbody not found');
            return;
        }
        
        // Показываем индикатор загрузки
         tbody.innerHTML = `
    <tr>
        <td colspan="7" class="text-center loading-spinner-cell">
            <div class="spinner-container">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
        </td>
    </tr>
`;
        
        const searchInput = section.querySelector('.search-input');
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        const searchParams = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
        
        const response = await apiRequest(`/v1/admin/transactions?page=${page}&limit=${limit}${searchParams}`);
        
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
                
                row.innerHTML = `
                    <td>${transaction.id}</td>
                    <td>${transaction.property_name || transaction.property_id}</td>
                    <td>${transaction.previous_owner_name || 'N/A'}</td>
                    <td>${transaction.new_owner_name || 'N/A'}</td>
                    <td>${createdAt}</td>
                    <td><span class="status-badge ${transaction.status}">${transaction.status}</span></td>
                    <td>
                        <div class="actions-cell">
                            <div class="actions-column">
                                <button class="action-btn btn-view view-transaction-btn" data-id="${transaction.id}">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
            
            // Добавляем пагинацию
            const paginationContainer = document.querySelector('.pagination-container');
            if (paginationContainer) {
                const pagination = createPagination(response.total, page, limit, loadTransactions);
                if (pagination) {
                    paginationContainer.innerHTML = ''; // Очищаем перед добавлением
                    paginationContainer.appendChild(pagination);
                }
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading transactions</td></tr>';
            console.error('Error loading transactions:', response);
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactionsTableBody').innerHTML = 
            '<tr><td colspan="7" class="text-center">Error loading transactions</td></tr>';
    }
}

// Универсальная функция для создания компонента пагинации
function createPagination(totalItems, currentPage, itemsPerPage, loadFunction, status = '') {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Проверяем существование контейнера пагинации
    const paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) return null;
    
    // Очищаем контейнер
    paginationContainer.innerHTML = '';
    
    // Если всего одна страница, не показываем пагинацию
    if (totalPages <= 1) {
        return null;
    }
    
    // Создаем контейнер для пагинации
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    // Кнопка "Назад"
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.setAttribute('data-page', currentPage - 1);
        prevBtn.addEventListener('click', () => loadFunction(currentPage - 1, itemsPerPage, status));
        pagination.appendChild(prevBtn);
    } else {
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = true;
        pagination.appendChild(prevBtn);
    }
    
    // Всегда показываем первую страницу
    const firstPageBtn = document.createElement('button');
    firstPageBtn.textContent = '1';
    firstPageBtn.setAttribute('data-page', '1');
    if (currentPage === 1) {
        firstPageBtn.classList.add('active');
    } else {
        firstPageBtn.addEventListener('click', () => loadFunction(1, itemsPerPage, status));
    }
    pagination.appendChild(firstPageBtn);
    
    // Показываем многоточие, если текущая страница далеко от начала
    if (currentPage > 3) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.className = 'ellipsis';
        pagination.appendChild(ellipsis);
    }
    
    // Показываем страницы вокруг текущей
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.setAttribute('data-page', i);
        if (i === currentPage) {
            pageBtn.classList.add('active');
        } else {
            pageBtn.addEventListener('click', () => loadFunction(i, itemsPerPage, status));
        }
        pagination.appendChild(pageBtn);
    }
    
    // Показываем многоточие, если текущая страница далеко от конца
    if (currentPage < totalPages - 2) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.className = 'ellipsis';
        pagination.appendChild(ellipsis);
    }
    
    // Всегда показываем последнюю страницу
    if (totalPages > 1) {
        const lastPageBtn = document.createElement('button');
        lastPageBtn.textContent = totalPages;
        lastPageBtn.setAttribute('data-page', totalPages);
        if (currentPage === totalPages) {
            lastPageBtn.classList.add('active');
        } else {
            lastPageBtn.addEventListener('click', () => loadFunction(totalPages, itemsPerPage, status));
        }
        pagination.appendChild(lastPageBtn);
    }
    
    // Кнопка "Вперед"
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.setAttribute('data-page', currentPage + 1);
        nextBtn.addEventListener('click', () => loadFunction(currentPage + 1, itemsPerPage, status));
        pagination.appendChild(nextBtn);
    } else {
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = true;
        pagination.appendChild(nextBtn);
    }
    
    return pagination;
}


// Функция для открытия модального окна просмотра пользователя
async function openViewUserModal(userId) {
    try {
        const response = await apiRequest(`/v1/admin/users/${userId}`);
        if (response.success && response.user) {
            const user = response.user;
            const modalBody = document.getElementById('userModal');
            
            if (modalBody) {
                // Форматируем дату создания
                const createdAt = user.created_at ? 
                    new Date(user.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric'
                    }) : 'N/A';
                
                // Заполняем содержимое модального окна
                modalBody.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">User Details</h3>
                            <button class="modal-close" data-modal="userModal">×</button>
                        </div>
                        <div class="modal-body">
                            <div class="user-details">
                                <p><strong>ID:</strong> ${user.id}</p>
                                <p><strong>Name:</strong> ${user.name || 'N/A'}</p>
                                <p><strong>CNIC:</strong> ${user.cnic || 'N/A'}</p>
                                <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
                                <p><strong>Address:</strong> ${user.address || 'N/A'}</p>
                                <p><strong>Login:</strong> ${user.login || 'N/A'}</p>
                                <p><strong>Status:</strong> 
                                    <span class="status-badge ${user.is_active ? 'active' : 'blocked'}">
                                        ${user.is_active ? 'Active' : 'Blocked'}
                                    </span>
                                </p>
                                <p><strong>Properties:</strong> ${user.properties ? user.properties.length : 0}</p>
                                <p><strong>Created:</strong> ${createdAt}</p>
                            </div>
                        </div>
                    </div>
                `;
                
                // Открываем модальное окно
                openModal('userModal');
                
                // Добавляем обработчик для закрытия модального окна
                const closeBtn = modalBody.querySelector('.modal-close');
                if (closeBtn) {
                    closeBtn.onclick = () => closeModal('userModal');
                }
            }
        }
    } catch (error) {
        console.error('Error loading user details:', error);
        showNotification('error', 'Error loading user details');
    }
}

// Инициализация обработчиков для модальных окон
function initModalHandlers() {
    // Обработчик для кнопок просмотра пользователей
    document.addEventListener('click', function(e) {
        const viewUserBtn = e.target.closest('.view-user-btn');
        if (viewUserBtn) {
            e.preventDefault();
            const userId = viewUserBtn.getAttribute('data-id');
            if (userId) {
                viewUser(userId);
            }
            return;
        }
        
        // Обработчик для кнопки добавления пользователя
        const addUserBtn = e.target.closest('#openAddUserModal');
        if (addUserBtn) {
            e.preventDefault();
            openAddUserModal();
            return;
        }
        
        // Остальные обработчики...
    });
    
    // Закрытие модальных окон по кнопке "×"
    document.querySelectorAll('.modal-close, .close').forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            closeModal(modalId);
        });
    });
    
    // Закрытие модального окна при клике вне его содержимого
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
}

// Функция для обработки действий в модальном окне транзакции
function handleTransactionAction(transactionId, action) {
    switch(action) {
        case 'upload-modal':
            const category = event.target.getAttribute('data-category');
            openUploadFileModal(transactionId, category);
            break;
        case 'upload-multiple':
            openMultipleUploadModal(transactionId);
            break;
        case 'add-payment':
            openAddPaymentModal(transactionId);
            break;
        default:
            console.error(`Unknown transaction action: ${action}`);
    }
}

// Универсальная функция для безопасного получения элемента
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with ID "${id}" not found`);
    }
    return element;
}

// Функция для безопасного обновления содержимого элемента
function updateElementContent(id, content) {
    const element = getElement(id);
    if (element) {
        element.innerHTML = content;
        return true;
    }
    return false;
}

// Обработчик ошибок API
function handleApiError(error, defaultMessage = 'An error occurred') {
    console.error('API Error:', error);
    
    let message = defaultMessage;
    if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
    } else if (error.message) {
        message = error.message;
    }
    
    showNotification('error', message);
}

// Функция для загрузки архивных пользователей
async function loadArchivedUsers(page = 1, limit = 10) {
    try {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.textContent = 'Loading archived users...';
        document.getElementById('archivedUsersTableBody').innerHTML = '';
        document.getElementById('archivedUsersTableBody').appendChild(loadingIndicator);

        const response = await apiRequest(`/v1/admin/users/archive?page=${page}&limit=${limit}`);

        if (response.success && response.users) {
            const tbody = document.getElementById('archivedUsersTableBody');
            tbody.innerHTML = '';

            response.users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.cnic}</td>
                    <td>${user.login}</td>
                    <td>${user.properties_count || 0}</td>
                    <td><span class="status-badge ${user.status}">${user.status}</span></td>
                    <td>
                        <button class="action-btn btn-view view-user-btn" data-id="${user.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Добавляем пагинацию
            const paginationContainer = document.querySelector('.pagination-container');
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
                paginationContainer.appendChild(
                    createPagination(response.total, page, limit)
                );
            }
        } else {
            document.getElementById('archivedUsersTableBody').innerHTML = '<tr><td colspan="7" class="text-center">No archived users found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading archived users:', error);
        document.getElementById('archivedUsersTableBody').innerHTML = '<tr><td colspan="7" class="text-center">Error loading archived users</td></tr>';
    }
}

// Функция для открытия модального окна просмотра пользователя
async function openViewUserModal(userId) {
  try {
    const response = await apiRequest(`/v1/admin/users/${userId}`);
    if (response.success && response.user) {
      const user = response.user;
      
      // Сначала заполняем содержимое модального окна
      const modalBody = document.getElementById('userModalBody');
      if (modalBody) {
        // Форматируем дату создания
        const createdAt = user.created_at ? 
          new Date(user.created_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
          }) : 'N/A';
          
        modalBody.innerHTML = `
                <div class="user-details">
                    <p><strong>ID:</strong> ${user.id}</p>
                    <p><strong>Name:</strong> ${user.name}</p>
                    <p><strong>CNIC:</strong> ${user.cnic}</p>
                    <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
                    <p><strong>Address:</strong> ${user.address}</p>
                    <p><strong>Login:</strong> ${user.login}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${user.status}">${user.status}</span></p>
                    <p><strong>Properties:</strong> ${user.properties_count || 0}</p>
                    <p><strong>Created At:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
                </div>
                <div class="user-actions">
                    <button class="action-btn btn-approve activate-user-btn" data-id="${user.id}">
                        <i class="fas fa-check"></i> Activate
                    </button>
                    <button class="action-btn btn-reject block-user-btn" data-id="${user.id}">
                        <i class="fas fa-ban"></i> Block
                    </button>
                </div>
            `;
        
        const modalOpened = openModal('userModal');
        if (!modalOpened) {
          console.error('Failed to open user modal');
          showNotification('error', 'Error opening user details');
        }
      }
    }
  } catch (error) {
    console.error('Error loading user details:', error);
    showNotification('error', 'Error loading user details');
  }
}

// Функция для обновления статуса пользователя
async function updateUserStatus(userId, status) {
    try {
        const response = await apiRequest(`/v1/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });

        if (response.success) {
            showNotification('success', `User ${status} successfully`);
            closeModal('userModal');
            loadUsers();
        } else {
            throw new Error(response.message || 'Failed to update user status');
        }
    } catch (error) {
        showNotification('error', 'Error updating user status: ' + error.message);
    }
}

// Функция для сохранения суммы транзакции
async function saveTransactionAmount() {
    const transactionId = document.getElementById('currentTransactionId').value;
    const newAmount = parseFloat(document.getElementById('newTotalAmount').value);

    if (isNaN(newAmount) || newAmount <= 0) {
        showNotification('error', 'Please enter a valid amount');
        return;
    }

    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/update-amount`, {
            method: 'PUT',
            body: JSON.stringify({ total_amount: newAmount })
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
        showNotification('error', 'Error updating amount: ' + error.message);
    }
}

// Функция для инициализации обработчиков событий
function initEventHandlers() {
    // Обработчик навигации
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            navigateToSection(sectionId);
        });
    });

    // Обработчик кнопки создания транзакции
    document.getElementById('create')?.addEventListener('click', openCreateTransactionModal);

    // Обработчик кнопки добавления пользователя
    document.getElementById('openAddUserModal')?.addEventListener('click', openAddUserModal);

    // Обработчик формы создания транзакции
    document.getElementById('createTransactionForm')?.addEventListener('submit', createTransaction);

    // Обработчик формы добавления пользователя
    document.getElementById('addUserForm')?.addEventListener('submit', createUser);

    // Обработчик кнопки генерации логина
    document.querySelector('.regenerate-login-btn')?.addEventListener('click', regenerateLogin);

    // Обработчик кнопки генерации пароля
    document.querySelector('.regenerate-password-btn')?.addEventListener('click', regeneratePassword);

    // Закрытие модальных окон по кнопке "×"
    document.querySelectorAll('.modal-close, .close').forEach(button => {
        button.addEventListener('click', function () {
            const modalId = this.getAttribute('data-modal');
            closeModal(modalId);
        });
    });

    // Закрытие модального окна при клике вне его содержимого
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });

    // Инициализация предпросмотра файлов
    setupFilePreview();

    // Добавляем обработчик для кнопок действий с транзакцией
    document.addEventListener('click', function (e) {
        const button = e.target.closest('[data-action]');
        if (!button) return;

        e.preventDefault(); // Предотвращаем всплытие события

        const action = button.getAttribute('data-action');
        const category = button.getAttribute('data-category');

        switch (action) {
            case 'upload-modal':
                openUploadModal(category);
                break;
            case 'upload-multiple':
                openMultiplUploadModal();
                break;
            case 'add-payment':
                openAddPaymentModal();
                break;
            case 'edit-amount':
                const amountEditSection = document.getElementById('amountEditSection');
                if (amountEditSection) {
                    amountEditSection.style.display = 'block';
                    const newTotalAmount = document.getElementById('newTotalAmount');
                    if (newTotalAmount) newTotalAmount.focus();
                }
                break;
            case 'save-amount':
                saveTransactionAmount();
                break;
            case 'cancel-amount':
                const amountEditSectionCancel = document.getElementById('amountEditSection');
                if (amountEditSectionCancel) {
                    amountEditSectionCancel.style.display = 'none';
                }
                break;
            case 'update-witnesses':
                updateWitnesses();
                break;
        }
    });

    // Обработчик формы загрузки одного файла
    const singleFileUploadForm = document.getElementById('singleFileUploadForm');
    if (singleFileUploadForm) {
        singleFileUploadForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const transactionId = document.getElementById('uploadTransactionId').value;
            const category = document.getElementById('uploadCategory').value;
            const file = document.getElementById('file').files[0];

            if (!file) {
                showNotification('error', 'Please select a file');
                return;
            }

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('category', category);

                const response = await fetch(API_BASE_URL + `/v1/admin/transactions/${transactionId}/documents`, {
                    method: 'POST',
                    body: formData
                });

                if (response.success) {
                    closeModal('uploadFileModal');
                    // Перезагружаем файлы транзакции
                    loadTransactionFiles(transactionId);
                    showNotification('success', 'File uploaded successfully');
                } else {
                    throw new Error(response.message || 'Failed to upload file');
                }
            } catch (error) {
                showNotification('error', 'Error uploading file: ' + error.message);
            }
        });
    }


    document.querySelector('.cancel-multi-upload-btn')?.addEventListener('click', function () {
        closeModal('multipleUploadModal');
    });

    document.querySelector('.cancel-payment-btn')?.addEventListener('click', function () {
        closeModal('addPaymentModal');
    });

    // Обработчик для кнопки сохранения суммы
    document.querySelector('.save-amount-btn')?.addEventListener('click', saveTransactionAmount);

    // Обработчик для кнопки отмены редактирования суммы
    document.querySelector('.cancel-amount-btn')?.addEventListener('click', function () {
        const amountEditSection = document.getElementById('amountEditSection');
        if (amountEditSection) {
            amountEditSection.style.display = 'none';
        }
    });

    // Обработчик для кнопки сохранения свидетелей
    document.querySelector('.update-witnesses-btn')?.addEventListener('click', updateWitnesses);

    // Динамические обработчики для просмотра транзакций и пользователей
    document.addEventListener('click', function (e) {
        const viewTransactionBtn = e.target.closest('.view-transaction-btn');
        if (viewTransactionBtn) {
            const transactionId = viewTransactionBtn.getAttribute('data-id');
            openViewTransactionModal(transactionId);
        }

        const viewUserBtn = e.target.closest('.view-user-btn');
        if (viewUserBtn) {
            const userId = viewUserBtn.getAttribute('data-id');
            openViewUserModal(userId);
        }
    });

    // Инициализация конвертера валют
    attachCurrencyConverter();
}

// Инициализация обработчиков для платежей
function initPaymentHandlers() {
    // Обработчик для кнопки "Add Payment"
    document.querySelector('.transaction-actions [data-action="add-payment"]')?.addEventListener('click', () => {
        const transactionId = document.getElementById('currentTransactionId').value;
        if (!transactionId) {
            showNotification('error', 'Transaction ID not found');
            return;
        }

        document.getElementById('paymentTransactionId').value = transactionId;
        document.getElementById('paymentAmount').value = '';
        document.getElementById('paymentMethod').value = 'cash';
        document.getElementById('rawPaymentAmount').value = '';
        document.getElementById('receiptFileNameDisplay').textContent = 'No file chosen';
        document.getElementById('receiptPreview').innerHTML = '';

        openModal('addPaymentModal');
    });

    // Обработчик для загрузки файла квитанции
    document.getElementById('receiptFile')?.addEventListener('change', function (e) {
        const file = e.target.files[0];
        const preview = document.getElementById('receiptPreview');
        const fileNameDisplay = document.getElementById('receiptFileNameDisplay');

        if (file) {
            fileNameDisplay.textContent = file.name;

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 150px;">`;
                };
                reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf') {
                preview.innerHTML = `<i class="fas fa-file-pdf" style="font-size: 48px; color: #dc3545;"></i>`;
            } else {
                preview.innerHTML = `<i class="fas fa-file-alt" style="font-size: 48px;"></i>`;
            }
        } else {
            fileNameDisplay.textContent = 'No file chosen';
            preview.innerHTML = '';
        }
    });

    // Обработчик для формы добавления платежа
    document.getElementById('addPaymentForm')?.addEventListener('submit', createPayment);

    // Обработчик для формы редактирования платежа
    document.getElementById('editPaymentForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const transactionId = document.getElementById('paymentTransactionId').value;
        const paymentId = document.getElementById('paymentId').value;
        const amount = document.getElementById('rawPaymentAmount').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const status = document.getElementById('paymentStatus').value;
        const notes = document.getElementById('paymentNotes').value;

        try {
            const response = await apiRequest(
                `/v1/admin/transactions/${transactionId}/payments/${paymentId}`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        amount,
                        payment_method: paymentMethod,
                        status,
                        notes
                    })
                }
            );

            if (response.success) {
                showNotification('success', 'Payment updated successfully');
                closeModal('editPaymentModal');
                await loadTransactionPayments(transactionId);
                await loadTransactionSummary(transactionId);
            } else {
                throw new Error(response.message || 'Failed to update payment');
            }
        } catch (error) {
            console.error('Error updating payment:', error);
            showNotification('error', error.message || 'Error updating payment');
        }
    });

    // Обработчики для кнопок отмены
    document.querySelectorAll('.cancel-payment-btn, .cancel-transaction-btn, .cancel-user-btn').forEach(button => {
        button.addEventListener('click', () => {
            closeModal('addPaymentModal');
            closeModal('editPaymentModal');
            closeModal('createTransactionModal');
            closeModal('addUserModal');
        });
    });
}

// Функция для инициализации денежного форматирования
function initPaymentFormFields() {
    const paymentAmount = document.getElementById('paymentAmount');
    const rawPaymentAmount = document.getElementById('rawPaymentAmount');
    const usdConversion = document.getElementById('usdConversion');

    if (!paymentAmount || !rawPaymentAmount || !usdConversion) {
        console.warn('Payment form elements not found. Modal might not be created yet.');
        return;
    }

    let rawValue = 0;

    // Инициализация значения
    if (paymentAmount.value) {
        rawValue = parseNumber(paymentAmount.value);
        paymentAmount.value = formatPKR(rawValue);
        rawPaymentAmount.value = rawValue;
        updateUSD(rawValue);
    } else {
        paymentAmount.value = '0.00';
        rawPaymentAmount.value = 0;
        updateUSD(0);
    }

    // Удаляем существующие обработчики, чтобы избежать дублирования
    const newPaymentAmount = paymentAmount.cloneNode(true);
    paymentAmount.parentNode.replaceChild(newPaymentAmount, paymentAmount);

    // Обработчик ввода
    newPaymentAmount.addEventListener('input', function (e) {
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
        this.setSelectionRange(
            Math.max(0, cursorStart + diff),
            Math.max(0, cursorEnd + diff)
        );
    });

    // Обработчик потери фокуса - форматируем окончательное значение
    newPaymentAmount.addEventListener('blur', function () {
        if (!this.value || this.value === '.') {
            this.value = '0.00';
            rawValue = 0;
        } else {
            rawValue = parseNumber(this.value);
            this.value = formatPKR(rawValue);
        }

        // Обновляем скрытое поле
        rawPaymentAmount.value = rawValue;
        updateUSD(rawValue);
    });

    // Обработчик фокуса - показываем "сырое" значение для редактирования
    newPaymentAmount.addEventListener('focus', function () {
        // Сохраняем позицию курсора
        const cursorPosition = this.selectionStart;

        // Показываем значение без форматирования для удобства редактирования
        if (this.value === '0.00') {
            this.value = '';
        } else {
            this.value = rawValue.toString();
        }

        // Устанавливаем курсор в конец
        setTimeout(() => {
            this.setSelectionRange(this.value.length, this.value.length);
        }, 0);
    });
}

// Запускаем приложение после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});
attachCurrencyConverter();


function initPaymentFormFields() {
    const paymentAmount = document.getElementById('paymentAmount');
    const rawPaymentAmount = document.getElementById('rawPaymentAmount');
    const usdConversion = document.getElementById('usdConversion');

    if (!paymentAmount || !rawPaymentAmount || !usdConversion) {
        console.warn('Элементы формы платежа не найдены. Возможно, модальное окно еще не создано.');
        return;
    }

    let rawValue = 0;

    // Функция форматирования PKR
    const formatPKR = (amount) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Функция парсинга числа
    const parseNumber = (value) => {
        const cleanValue = value.replace(/[^\d.]/g, '');
        if (!cleanValue) return 0;

        // Обрабатываем случай, когда пользователь ввел только точку
        if (cleanValue === '.') return 0;

        // Разделяем на целую и дробную части
        const parts = cleanValue.split('.');
        const integerPart = parts[0];
        let decimalPart = parts.length > 1 ? parts.slice(1).join('') : '00';

        // Ограничиваем до 2 знаков после запятой
        decimalPart = decimalPart.slice(0, 2);

        // Если дробная часть короче 2 знаков, дополняем нулями
        if (decimalPart.length === 1) decimalPart += '0';
        if (decimalPart.length === 0) decimalPart = '00';

        return parseFloat(`${integerPart}.${decimalPart}`) || 0;
    };

    // Функция обновления конвертации в USD
    const updateUSD = async (amountInPKR) => {
        try {
            const response = await fetch('api/v1/admin/latest/PKR');
            const data = await response.json();

            let exchangeRate;
            if (data.success && data.USD) {
                exchangeRate = data.USD;
            } else {
                // Fallback-курс, если API не отвечает
                exchangeRate = 0.0036;
            }

            const usdAmount = amountInPKR * exchangeRate;

            usdConversion.innerHTML = `
        ≈ ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(usdAmount)}
        <span style="font-size: 0.8em; display: block; opacity: 0.7; margin-top: 3px">
          (1 PKR = ${exchangeRate.toFixed(6)} USD)
        </span>
      `;
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            const exchangeRate = 0.0036;
            const usdAmount = amountInPKR * exchangeRate;

            usdConversion.innerHTML = `
        ≈ ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(usdAmount)}
        <span style="font-size: 0.8em; display: block; opacity: 0.7; margin-top: 3px; color: #dc3545">
          Using fallback rate (API error)
        </span>
      `;
        }
    };

    // Инициализация значения
    if (paymentAmount.value) {
        rawValue = parseNumber(paymentAmount.value);
        paymentAmount.value = formatPKR(rawValue);
        rawPaymentAmount.value = rawValue;
        updateUSD(rawValue);
    } else {
        paymentAmount.value = '0.00';
        rawPaymentAmount.value = 0;
        updateUSD(0);
    }

    // Удаляем существующие обработчики, чтобы избежать дублирования
    const newPaymentAmount = paymentAmount.cloneNode(true);
    paymentAmount.parentNode.replaceChild(newPaymentAmount, paymentAmount);

    // Обработчик ввода
    newPaymentAmount.addEventListener('input', function (e) {
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
        this.setSelectionRange(
            Math.max(0, cursorStart + diff),
            Math.max(0, cursorEnd + diff)
        );
    });

    // Обработчик потери фокуса - форматируем окончательное значение
    newPaymentAmount.addEventListener('blur', function () {
        if (!this.value || this.value === '.') {
            this.value = '0.00';
            rawValue = 0;
        } else {
            rawValue = parseNumber(this.value);
            this.value = formatPKR(rawValue);
        }

        // Обновляем скрытое поле
        rawPaymentAmount.value = rawValue;
        updateUSD(rawValue);
    });

    // Обработчик фокуса - показываем "сырое" значение для редактирования
    newPaymentAmount.addEventListener('focus', function () {
        // Сохраняем позицию курсора
        const cursorPosition = this.selectionStart;

        // Показываем значение без форматирования для удобства редактирования
        if (this.value === '0.00') {
            this.value = '';
        } else {
            this.value = rawValue.toString();
        }

        // Устанавливаем курсор в конец
        setTimeout(() => {
            this.setSelectionRange(this.value.length, this.value.length);
        }, 0);
    });
}

// Инициализация полей для редактирования платежа
document.addEventListener('DOMContentLoaded', function () {
    // Инициализация формы редактирования платежа
    const editPaymentForm = document.getElementById('editPaymentForm');
    if (editPaymentForm) {
        editPaymentForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const transactionId = document.getElementById('paymentTransactionId').value;
            const paymentId = document.getElementById('paymentId').value;
            const amount = document.getElementById('rawPaymentAmount').value;
            const paymentMethod = document.getElementById('paymentMethod').value;
            const status = document.getElementById('paymentStatus').value;
            const notes = document.getElementById('paymentNotes').value;

            try {
                const response = await apiRequest(
                    `/v1/admin/transactions/${transactionId}/payments/${paymentId}`,
                    {
                        method: 'PUT',
                        body: JSON.stringify({
                            amount,
                            payment_method: paymentMethod,
                            status,
                            notes
                        })
                    }
                );

                if (response.success) {
                    showNotification('success', 'Payment updated successfully');
                    closeModal('editPaymentModal');
                    await loadTransactionPayments(transactionId);
                    await loadTransactionSummary(transactionId);
                } else {
                    throw new Error(response.message || 'Failed to update payment');
                }
            } catch (error) {
                console.error('Error updating payment:', error);
                showNotification('error', error.message || 'Error updating payment');
            }
        });

        // Обработчики для кнопок отмены
        document.querySelectorAll('.cancel-payment-btn').forEach(button => {
            button.addEventListener('click', () => {
                closeModal('editPaymentModal');
            });
        });
    }

    // Инициализация полей денежного формата
    initPaymentFormFields();
});
