const totalAmountInput = document.getElementById('totalAmount');


const API_BASE_URL = `https://${window?.location?.host}/api`;
let currentPage = 1;
let itemsPerPage = 10;

// Функция для выполнения API запросов
async function apiRequest(endpoint, options = {}) {
    console.log('Making API request to:', endpoint);
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'include'
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            },
            credentials: 'include',
        });

        console.log('API response status:', response.status);

        // Пытаемся распарсить ответ как JSON
        let data = null;
        try {
            data = await response.json();
        } catch (e) {
            // Если не удалось распарсить JSON, используем текстовый ответ
            const text = await response.text();
            console.log('API response text:', text);
            data = { message: text || 'Unknown error' };
        }

        console.log('API response data:', data);

        if (!response.ok) {
            console.log('API request failed:', data);
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}
// Предопределенный массив объектов недвижимости
const properties = {
    'Parking': [
        { id: 'DH01', name: 'Parking DH01', type: 'parking' },
        { id: 'DH02', name: 'Parking DH02', type: 'parking' },
        { id: 'DH03', name: 'Parking DH03', type: 'parking' }
    ], "Lower Basement": [
        { "id": "LB01", "name": "Parking LB01", "type": "parking" },
        { "id": "LB02", "name": "Parking LB02", "type": "parking" },
        { "id": "LB03", "name": "Parking LB03", "type": "parking" },
        { "id": "LB04", "name": "Parking LB04", "type": "parking" },
        { "id": "LB05", "name": "Parking LB05", "type": "parking" },
        { "id": "LB06", "name": "Parking LB06", "type": "parking" },
        { "id": "LB07", "name": "Parking LB07", "type": "parking" },
        { "id": "LB08", "name": "Parking LB08", "type": "parking" },
        { "id": "LB09", "name": "Parking LB09", "type": "parking" },
        { "id": "LB10", "name": "Parking LB10", "type": "parking" },
        { "id": "LB11", "name": "Parking LB11", "type": "parking" },
        { "id": "LB12", "name": "Parking LB12", "type": "parking" }
    ],
    "Upper Basement": [
        { "id": "UB01", "name": "Parking UB01", "type": "parking" },
        { "id": "UB02", "name": "Parking UB02", "type": "parking" },
        { "id": "UB03", "name": "Parking UB03", "type": "parking" },
        { "id": "UB04", "name": "Parking UB04", "type": "parking" },
        { "id": "UB05", "name": "Parking UB05", "type": "parking" },
        { "id": "UB06", "name": "Parking UB06", "type": "parking" },
        { "id": "UB07", "name": "Parking UB07", "type": "parking" },
        { "id": "UB08", "name": "Parking UB08", "type": "parking" },
        { "id": "UB09", "name": "Parking UB09", "type": "parking" },
        { "id": "UB10", "name": "Parking UB10", "type": "parking" },
        { "id": "UB11", "name": "Parking UB11", "type": "parking" },
        { "id": "UB12", "name": "Parking UB12", "type": "parking" }
    ],
    'Ground Floor': [
        { id: 'DH01', name: 'Shop DH01', type: 'commercial' },
        { id: 'DH02', name: 'Shop DH02', type: 'commercial' },
        { id: 'DH03', name: 'Shop DH03', type: 'commercial' }
    ],
    '1st Floor': [
        { id: 'DH101', name: 'Office DH101', type: 'commercial' },
        { id: 'DH102', name: 'Office DH102', type: 'commercial' },
        { id: 'DH103', name: 'Office DH103', type: 'commercial' }
    ],
    '2nd Floor': [
        { id: 'DH201', name: 'Office DH201', type: 'commercial' },
        { id: 'DH202', name: 'Office DH202', type: 'commercial' },
        { id: 'DH203', name: 'Office DH203', type: 'commercial' }
    ],
    '3rd Floor': [
        { id: 'DH301', name: 'Apartment DH301 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH302', name: 'Apartment DH302 (973.7 Sft)', type: 'residential' },
        { id: 'DH303', name: 'Apartment DH303 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH304', name: 'Apartment DH304 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH305', name: 'Apartment DH305 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH306', name: 'Apartment DH306 (1,686.00 Sft)', type: 'residential' }
    ],
    '4th Floor': [
        { id: 'DH401', name: 'Apartment DH401 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH402', name: 'Apartment DH402 (973.7 Sft)', type: 'residential' },
        { id: 'DH403', name: 'Apartment DH403 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH404', name: 'Apartment DH404 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH405', name: 'Apartment DH405 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH406', name: 'Apartment DH406 (1,686.00 Sft)', type: 'residential' }
    ],
    '5th Floor': [
        { id: 'DH501', name: 'Apartment DH501 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH502', name: 'Apartment DH502 (973.7 Sft)', type: 'residential' },
        { id: 'DH503', name: 'Apartment DH503 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH504', name: 'Apartment DH504 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH505', name: 'Apartment DH505 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH506', name: 'Apartment DH506 (1,686.00 Sft)', type: 'residential' }
    ],
    '6th Floor': [
        { id: 'DH601', name: 'Apartment DH601 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH602', name: 'Apartment DH602 (973.7 Sft)', type: 'residential' },
        { id: 'DH603', name: 'Apartment DH603 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH604', name: 'Apartment DH604 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH605', name: 'Apartment DH605 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH606', name: 'Apartment DH606 (1,686.00 Sft)', type: 'residential' }
    ],
    '7th Floor': [
        { id: 'DH701', name: 'Apartment DH701 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH702', name: 'Apartment DH702 (973.7 Sft)', type: 'residential' },
        { id: 'DH703', name: 'Apartment DH703 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH704', name: 'Apartment DH704 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH705', name: 'Apartment DH705 (1,198.3 Sft)', type: 'residential' },
        { id: 'DH706', name: 'Apartment DH706 (1,686.00 Sft)', type: 'residential' }
    ],
    'Penthouse': [
        { id: 'PH', name: 'Penthouse (7,350.00 Sft)', type: 'penthouse' }
    ]
};

// Проверка авторизации при загрузке страницы
document.addEventListener('DOMContentLoaded', async function () {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/admin/validate`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Not authenticated');
        }

        const userData = await response.json();
        const currentUser = userData.user;

        // Настройка обработчиков для навигации
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const sectionId = this.getAttribute('href').substring(1);
                showSection(sectionId);
            });
        });

        // Настраиваем поиск
        setupSearch();

        // Проверяем, существует ли элемент с id="users-archive"
        if (!document.getElementById('users-archive')) {
            // Создаем элемент для архивных пользователей, если его нет
            const usersArchiveSection = document.createElement('div');
            usersArchiveSection.id = 'users-archive';
            usersArchiveSection.className = 'section';
            usersArchiveSection.style.display = 'none';
            usersArchiveSection.innerHTML = `
        <div class="section-header">
          <h2 class="section-title">Archived Users</h2>
        </div>
        <div class="search-box">
          <input type="text" class="search-input" placeholder="Search archived users...">
          <button class="search-btn">
            <i class="fas fa-search"></i> Search
          </button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>CNIC</th>
              <th>Email</th>
              <th>Properties</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="usersTableBody"></tbody>
        </table>
      `;
            document.querySelector('.main-content').appendChild(usersArchiveSection);
        }

        // Определяем, какой раздел показать по умолчанию
        const urlParams = new URLSearchParams(window.location.search);
        const initialSection = urlParams.get('section') || 'transactions';

        // Проверяем, существует ли элемент с таким id
        if (document.getElementById(initialSection)) {
            showSection(initialSection);
        } else {
            console.error(`Initial section "${initialSection}" not found, defaulting to transactions`);
            showSection('transactions');
        }

        // Добавляем обработчик для поиска
        document.querySelector('#users .search-input')?.addEventListener('input', debounce(function () {
            currentPage = 1;
            const activeSection = document.querySelector('.section.active')?.id;
            if (activeSection === 'users') {
                loadUsers('active');
            } else if (activeSection === 'users-archive') {
                loadUsers('archived');
            }
        }, 300));

    } catch (error) {
        console.error('Authentication error:', error);
        window.location.href = '/login.html';
    }
});

// Функция выхода
async function logout() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        window.location.href = '/login.html';
    }
}


// Функция загрузки текущего раздела
function loadCurrentSection() {
    const activeSection = document.querySelector('.section.active');
    if (!activeSection) return;

    switch (activeSection.id) {
        case 'transactions':
            loadTransactions();
            break;
        case 'users':
            loadUsers('active');
            break;
        case 'users-archive':
            loadUsers('archived');
            break;
    }
}

// Архивация пользователя
async function archiveUser(userId) {
    if (!confirm('Are you sure you want to archive this user?')) {
        return;
    }

    try {
        const response = await apiRequest(`/v1/admin/users/${userId}/archive`, {
            method: 'POST'
        });

        if (response.success) {
            showNotification('success', 'User archived successfully');
            // Перезагружаем список пользователей с учетом текущего раздела
            const activeSection = document.querySelector('.section.active').id;
            if (activeSection === 'users') {
                loadUsers('active');
            } else if (activeSection === 'users-archive') {
                loadUsers('archived');
            }
        } else {
            showNotification('error', response.message || 'Error archiving user');
        }
    } catch (error) {
        console.error('Archive error:', error);
        showNotification('error', 'Error archiving user');
    }
}

// Восстановление пользователя из архива
async function restoreUser(userId) {
    if (!confirm('Are you sure you want to restore this user from archive?')) {
        return;
    }

    try {
        const response = await apiRequest(`/v1/admin/users/${userId}/unarchive`, {
            method: 'POST'
        });

        if (response.success) {
            showNotification('success', 'User restored successfully');
            // Перезагружаем список пользователей с учетом текущего раздела
            const activeSection = document.querySelector('.section.active').id;
            if (activeSection === 'users') {
                loadUsers('active');
            } else if (activeSection === 'users-archive') {
                loadUsers('archived');
            }
        } else {
            showNotification('error', response.message || 'Error restoring user');
        }
    } catch (error) {
        console.error('Restore error:', error);
        showNotification('error', 'Error restoring user');
    }
}

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


async function loadUsers(status = 'active') {
    // Определяем, в каком разделе мы находимся
    const section = status === 'archived'
        ? document.getElementById('users-archive')
        : document.getElementById('users');

    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading users...';

    // Удаляем предыдущий индикатор загрузки, если он есть
    const existingLoader = section.querySelector('.loading-indicator');
    if (existingLoader) {
        existingLoader.remove();
    }

    // Добавляем новый индикатор загрузки
    section.appendChild(loadingIndicator);

    try {
        const searchInput = section.querySelector('.search-input');
        const searchParams = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage
        });

        // Добавляем параметр статуса только если он не 'all'
        if (status && status !== 'all') {
            searchParams.append('status', status);
        }

        if (searchInput && searchInput.value) {
            searchParams.append('search', searchInput.value);
        }

        console.log('Loading users with params:', searchParams.toString());
        const data = await apiRequest(`/v1/admin/users?${searchParams.toString()}`);

        // Удаляем индикатор загрузки
        loadingIndicator.remove();

        // --- ОПРЕДЕЛЯЕМ УНИКАЛЬНЫЙ ID ДЛЯ tbody ---
        const tbodyId = status === 'archived' ? 'archivedUsersTableBody' : 'usersTableBody';

        // Находим или создаем таблицу
        let table = section.querySelector('.data-table');
        if (!table) {
            // Если таблицы нет, создаем новую структуру
            const tableContainer = document.createElement('div');
            tableContainer.className = 'table-container';

            table = document.createElement('table');
            table.className = 'data-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>CNIC</th>
                        <th>Login</th>
                        <th>Properties</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="${tbodyId}"></tbody>
            `;

            tableContainer.appendChild(table);

            // Проверяем, есть ли уже пагинация
            const existingPagination = section.querySelector('.pagination');
            if (existingPagination) {
                section.insertBefore(tableContainer, existingPagination);
            } else {
                section.appendChild(tableContainer);
            }
        }

        const tbody = document.getElementById(tbodyId);
        if (!tbody) {
            console.error(`Failed to find tbody with id: ${tbodyId}`);
            return;
        }

        if (data && Array.isArray(data)) {
            // Простой массив
            renderUsersTable(data, tbody);
            const pagination = createPagination(data.length, currentPage, itemsPerPage);
            const existingPagination = section.querySelector('.pagination');
            if (existingPagination) {
                existingPagination.replaceWith(pagination);
            } else {
                section.appendChild(pagination);
            }
        } else if (data && Array.isArray(data.users)) {
            // Структурированный ответ
            renderUsersTable(data.users, tbody);
            const pagination = createPagination(data.total, currentPage, itemsPerPage);
            const existingPagination = section.querySelector('.pagination');
            if (existingPagination) {
                existingPagination.replaceWith(pagination);
            } else {
                section.appendChild(pagination);
            }
        } else {
            console.error('Invalid users data format:', data);
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found or error loading data</td></tr>';
        }

        // Привязываем обработчики событий
        attachActionHandlers();
    } catch (error) {
        console.error('Error loading users:', error);
        loadingIndicator.remove();

        let errorContainer = section.querySelector('.error-message');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'error-message';
            errorContainer.style = 'color: #dc3545; padding: 15px; background: #f8d7da; border-radius: 4px; margin: 10px 0;';
            section.appendChild(errorContainer);
        }

        errorContainer.innerHTML = `
            <i class="fas fa-exclamation-circle"></i> Error loading users: ${error.message || 'Unknown error'}
            <button class="retry-btn" style="margin-left: 10px; background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                Retry
            </button>
        `;

        const retryBtn = errorContainer.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                errorContainer.remove();
                loadUsers(status);
            });
        }
    }
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
function attachActionHandlers3() {
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
document.addEventListener('DOMContentLoaded', function () {
    // Закрытие модалов
    document.querySelectorAll('.modal-close, .close').forEach(button => {
        button.addEventListener('click', function () {
            const modalId = this.getAttribute('data-modal');
            closeModal(modalId);
        });
    });

    // Закрытие модального окна при клике вне содержимого
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Форма добавления пользователя
    document.getElementById('addUserForm')?.addEventListener('submit', function (e) {
        e.preventDefault();
        createUser(e);
    });

    // Регенерация логина и пароля
    document.querySelector('.regenerate-login-btn')?.addEventListener('click', regenerateLogin);
    document.querySelector('.regenerate-password-btn')?.addEventListener('click', regeneratePassword);

    // Форма создания транзакции
    document.getElementById('createTransactionForm')?.addEventListener('submit', function (e) {
        e.preventDefault();
        handleCreateTransaction(e);
    });

    // Форма загрузки одного файла
    document.getElementById('singleFileUploadForm')?.addEventListener('submit', function (e) {
        e.preventDefault();
        uploadSingleFile(e);
    });

    // Форма множественной загрузки файлов
    document.getElementById('multipleFileUploadForm')?.addEventListener('submit', function (e) {
        e.preventDefault();
        uploadMultipleFiles(e);
    });
    // Закрытие модальных окон по кнопке "×"
    document.querySelectorAll('.close').forEach(button => {
        button.addEventListener('click', function () {
            const modalId = this.getAttribute('data-modal');
            closeModal(modalId);
        });
    });

    // Закрытие модального окна при клике вне содержимого
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Редактирование суммы транзакции
    document.querySelector('.edit-amount-btn')?.addEventListener('click', toggleAmountEdit);

    // Сохранение новой суммы
    document.querySelector('.save-amount-btn')?.addEventListener('click', updateTransactionAmount);

    // Отмена редактирования суммы
    document.querySelector('.cancel-amount-btn')?.addEventListener('click', cancelAmountEdit);

    // Сохранение информации о свидетелях
    document.querySelector('.update-witnesses-btn')?.addEventListener('click', updateWitnesses);
});
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

// Вспомогательные функции
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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
// Переключение категорий объектов
function toggleCategory(header) {
    const category = header.parentElement;
    category.classList.toggle('active');
}
// Закрытие модального окна при клике вне его содержимого
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
});

// Просмотр деталей пользователя
async function viewUser(userId) {
    const data = await apiRequest(`/v1/admin/users/${userId}`);
    if (!data) return;

    const modalBody = document.getElementById('userModalBody');
    modalBody.innerHTML = `
                <div class="user-details">
                    <p><strong>ID:</strong> ${data.id}</p>
                    <p><strong>Name:</strong> ${data.name}</p>
                    <p><strong>CNIC:</strong> ${data.cnic}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${data.status.toLowerCase()}">${data.status}</span></p>
                    <p><strong>Created:</strong> ${new Date(data.created_at).toLocaleString()}</p>
                    
                    <h4>Properties</h4>
                    ${data.properties && data.properties.length > 0 ? `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.properties.map(p => `
                                    <tr>
                                        <td>${p.id}</td>
                                        <td>${p.name}</td>
                                        <td>${p.type}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>No properties owned</p>'}
                </div>
            `;

    openModal('userModal');
}

// Просмотр деталей сделки
async function viewTransaction(transactionId) {
    try {
        // Устанавливаем ID текущей транзакции
        document.getElementById('currentTransactionId').value = transactionId;

        const response = await fetch(`${API_BASE_URL}/v1/admin/transactions/${transactionId}`, {
            credentials: 'include'
        });

        if (!response.ok)
            throw new Error('Error load data');

        const transaction = await response.json();

        // Заполняем данные в модальном окне
        document.getElementById('transactionId').textContent = transaction.id;
        document.getElementById('propertyName').textContent = transaction.property_id;
        document.getElementById('previousOwner').textContent = transaction.previous_owner_name || 'N/A';
        document.getElementById('newOwner').textContent = transaction.new_owner_name;
        document.getElementById('transactionStatus').textContent = transaction.status;
        document.getElementById('totalAmount').textContent = `${transaction.total_amount} PKR`;
        document.getElementById('paidAmount').textContent = `${transaction.paid_amount} PKR`;
        document.getElementById('remainingAmount').textContent = `${transaction.total_amount - transaction.paid_amount} PKR`;
        document.getElementById('createdAt').textContent = new Date(transaction.created_at).toLocaleString();

        // Заполняем данные свидетелей из объекта witnesses
        const { witness1, witness2 } = transaction.witnesses || {};

        // Заполняем поля для первого свидетеля
        document.getElementById('witness1Name').value = witness1 ? witness1.name : 'Not assigned';
        document.getElementById('witness1CNIC').value = witness1 ? witness1.cnic : 'Not assigned';
        document.getElementById('witness1Phone').value = witness1 ? (witness1.phone || '') : '';

        // Заполняем поля для второго свидетеля
        document.getElementById('witness2Name').value = witness2 ? witness2.name : 'Not assigned';
        document.getElementById('witness2CNIC').value = witness2 ? witness2.cnic : 'Not assigned';
        document.getElementById('witness2Phone').value = witness2 ? (witness2.phone || '') : '';

        // Загружаем платежи и файлы
        await loadTransactionPayments(transactionId),
        await loadTransactionFiles(transactionId)

        openModal('viewTransactionModal');
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Error load data');
    }
}

// Функция для создания нового платежа
async function createPayment(event) {
    event.preventDefault();

    const transactionId = document.getElementById('paymentTransactionId').value;
    if (!transactionId) {
        showNotification('warning', 'Transaction ID not found');
        return;
    }

    const formData = new FormData();
    formData.append('amount', document.getElementById('paymentAmount').value);
    formData.append('payment_date', document.getElementById('paymentDate').value);
    formData.append('payment_method', document.getElementById('paymentMethod').value);
    formData.append('notes', document.getElementById('paymentNotes')?.value || '');

    const receiptFile = document.getElementById('paymentReceipt').files[0];
    if (receiptFile) {
        formData.append('receipt', receiptFile);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/v1/admin/transactions/${transactionId}/payments`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error creating payment');
        }

        showNotification('success', 'Payment created successfully');
        document.getElementById('addPaymentForm').reset();
        closeModal('addPaymentModal');
        loadTransactionPayments(transactionId);
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', error.message || 'Error creating payment');
    }
}

// Функция для создания элемента файла
function createFileElement(file) {
    const fileContainer = document.createElement('div');
    fileContainer.className = 'file-item';
    fileContainer.dataset.fileId = file.id;

    // Создаем превью файла
    if (file.file_type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = `${API_BASE_URL}/uploads/${file.file_name}`;
        img.alt = file.original_name;
        img.className = 'file-preview';
        fileContainer.appendChild(img);
    } else {
        const icon = document.createElement('i');
        icon.className = 'fas fa-file-alt file-icon';
        fileContainer.appendChild(icon);
    }

    // Информация о файле
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';
    fileInfo.innerHTML = `
                <p class="file-name">${file.original_name}</p>
                <p class="file-type">${file.file_type}</p>
                <p class="file-date">Загружен: ${new Date(file.created_at).toLocaleString()}</p>
            `;

    // Кнопки действий
    const actions = document.createElement('div');
    actions.className = 'file-actions';

    // Кнопка просмотра
    const viewBtn = document.createElement('button');
    viewBtn.innerHTML = '<i class="fas fa-eye"></i> Просмотр';
    viewBtn.onclick = () => window.open(`${API_BASE_URL}/uploads/${file.file_name}`, '_blank');
    actions.appendChild(viewBtn);

    // Кнопка скачивания
    const downloadBtn = document.createElement('button');
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> Скачать';
    downloadBtn.onclick = () => downloadFile(file);
    actions.appendChild(downloadBtn);

    // Кнопка удаления
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Удалить';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = () => deleteFile(file);
    actions.appendChild(deleteBtn);

    fileContainer.appendChild(fileInfo);
    fileContainer.appendChild(actions);

    return fileContainer;
}

// Функция для скачивания файла
async function downloadFile(file) {
    if (!file || !file.file_name) {
        showNotification('error', 'File not fount');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/uploads/${encodeURIComponent(file.file_name)}?download=true`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Download failed');

        // Создаем ссылку для скачивания
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.original_name || file.file_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showNotification('success', 'Success');
    } catch (error) {
        console.error('Download error:', error);
        showNotification('error', 'Error load');
    }
}

// Функция для удаления файла
async function deleteFile(file) {
    if (!confirm(`Вы уверены, что хотите удалить файл "${file.original_name}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/uploads/${file.file_name}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Delete failed');

        // Обновляем список файлов
        const fileElement = document.querySelector(`[data-file-id="${file.id}"]`);
        if (fileElement) {
            fileElement.remove();
        }
        showNotification('success', 'Deleted');
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('error', 'Error');
    }
}

// Добавляем функцию предпросмотра изображения при выборе файла
document.getElementById('file')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        const previewImage = document.getElementById('previewImage');

        reader.onload = function (e) {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
        }

        reader.readAsDataURL(file);
    }
});

// Функция для открытия предпросмотра изображения в полном размере
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
    document.body.appendChild(modal);

    modal.onclick = () => modal.remove();
}
document.getElementById("openAddUserModal").addEventListener("click", function () {
    openAddUserModal();
});
// Функции для работы с новыми пользователями
function openAddUserModal() {
    generateLoginCredentials();
    openModal('addUserModal');
}

function generateLoginCredentials() {
    regenerateLogin();
    regeneratePassword();
}

function regenerateLogin() {
    const nameInput = document.getElementById('userName');
    const fullName = nameInput.value || '';

    let login = '';
    if (fullName) {
        const nameParts = fullName.toLowerCase().split(' ').filter(part => part.length > 0);

        if (nameParts.length > 0) {
            if (nameParts.length === 1) {
                login = nameParts[0];
            }
            else if (nameParts.length === 2) {
                login = `${nameParts[0]}_${nameParts[1][0]}`;
            }
            else {
                login = nameParts[0] + '_' + nameParts.slice(1).map(part => part[0]).join('');
            }
        }
    }

    if (!login) {
        login = 'user';
    }

    const timestamp = Date.now().toString().slice(-4);
    login = `${login}_${timestamp}`;

    login = login.toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_');

    document.getElementById('userLogin').value = login;
}

function regeneratePassword() {
    const length = 10;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    document.getElementById('userPassword').value = password;
}

async function createUser(event) {
    event.preventDefault();

    const formData = {
        name: document.getElementById('userName').value,
        cnic: document.getElementById('userCnic').value,
        phone: document.getElementById('userPhone').value,
        address: document.getElementById('userAddress').value,
        login: document.getElementById('userLogin').value,
        password: document.getElementById('userPassword').value
    };

    const response = await apiRequest('/v1/admin/users', {
        method: 'POST',
        body: JSON.stringify(formData)
    });

    if (response) {
        showNotification('success', 'User created successfully');
        closeModal('addUserModal');
        loadUsers('active');
    }
}

// Обновляем генерацию логина при вводе имени
document.getElementById('userName')?.addEventListener('input', regenerateLogin);

// Функции для работы со сделками
async function openCreateTransactionModal() {
    try {
        // Очищаем селекты перед загрузкой новых данных
        document.getElementById('propertyId').innerHTML = '<option value="">Загрузка...</option>';
        document.getElementById('newOwnerId').innerHTML = '<option value="">Загрузка...</option>';

        // Открываем модальное окно
        openModal('createTransactionModal');

        // Загружаем данные параллельно
        loadProperties();
    } catch (error) {
        console.error('Error opening transaction modal:', error);
        showNotification('error', 'Error modal');
    }
}

// Загрузка списка пользователей для селектов
async function loadUsersForSelect() {
    try {
        const response = await fetch(`${API_BASE_URL}/v1/admin/users?limit=100`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to load users');
        }

        const data = await response.json();
        const newOwnerSelect = document.getElementById('newOwnerId');

        if (!newOwnerSelect) {
            console.error('New owner select element not found');
            return;
        }

        // Очищаем селект
        newOwnerSelect.innerHTML = '<option value="">Select New Owner</option>';

        // Проверяем наличие пользователей в ответе
        if (data && data.users && Array.isArray(data.users)) {
            data.users.forEach(user => {
                if (user && user.id && user.name) {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = `${user.name}${user.cnic ? ` (${user.cnic})` : ''}`;
                    newOwnerSelect.appendChild(option);
                }
            });
        } else {
            console.error('Invalid users data structure:', data);
            throw new Error('Invalid users data received');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('error', "Couldn't load user list:" + error.message);
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

function createCategoryDiv(category) {
    const filesContainer = document.getElementById('filesContainer');
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'files-category';
    categoryDiv.setAttribute('data-category', category);
    categoryDiv.innerHTML = `
                <h4 class="category-title">${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                <div class="files-list"></div>
            `;
    filesContainer.appendChild(categoryDiv);
    return categoryDiv;
}

async function uploadMultipleFiles(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const transactionId = document.getElementById('multiUploadTransactionId').value;

    try {
        const response = await fetch(`${API_BASE_URL}/v1/admin/transactions/${transactionId}/documents`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error uploading files');
        }

        const result = await response.json();
        showNotification('success', 'Files uploaded successfully');
        closeModal('multipleUploadModal');
        await loadTransactionFiles(transactionId);
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', error.message || 'Error uploading files');
    }
}


// Предпросмотр квитанции
document.getElementById('receiptFile')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    const preview = document.getElementById('receiptPreview');

    if (file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Receipt preview" style="max-width: 200px; margin-top: 10px;">`;
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            preview.innerHTML = '<i class="fas fa-file-pdf" style="font-size: 48px; color: #dc3545;"></i>';
        }
    } else {
        preview.innerHTML = '';
    }
});

// Функция для загрузки свойств
async function loadProperties() {
    try {
        const propertySelect = document.getElementById('propertyId');
        if (propertySelect) {
            propertySelect.innerHTML = '<option value="">Select Property</option>';

            Object.entries(properties).forEach(([category, items]) => {
                const group = document.createElement('optgroup');
                group.label = category.charAt(0).toUpperCase() + category.slice(1);

                items.forEach(property => {
                    const option = document.createElement('option');
                    option.value = property.id;
                    option.textContent = `${property.name} (${property.type})`;
                    group.appendChild(option);
                });

                propertySelect.appendChild(group);
            });
        }
    } catch (error) {
        console.error('Error loading properties:', error);
        showNotification('error', 'Error loading properties');
    }
}

// Функция для создания транзакции
async function createTransaction(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = {
        property_id: formData.get('propertyId'),
        new_owner_id: parseInt(formData.get('newOwnerId')),
        total_amount: parseFloat(formData.get('totalAmount')),
        payment_schedule: []
    };

    console.log('Creating transaction:', {
        url: `${API_BASE_URL}/v1/admin/transactions`,
        data
    });

    try {
        const response = await fetch(`${API_BASE_URL}/v1/admin/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response data:', result);

        if (!response.ok) {
            throw new Error(result.message || 'Error creating transaction');
        }

        showNotification('success', 'Transaction created successfully');
        closeModal('createTransactionModal');
        loadTransactions();
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Error creating transaction');
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    const buttonOpen = document.getElementById('create')
    buttonOpen.addEventListener('click', (event) => openCreateTransactionModal())
})
// Добавляем вызов загрузки свойств при открытии модального окна создания транзакции
function openCreateTransactionModal() {
    loadProperties();
    openModal('createTransactionModal');
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

// Добавляем валидацию CNIC
function validateCNIC(input) {
    if (input && input.length == 0) {
        console.log(input)
        input.setCustomValidity('Please enter CNIC');
    }
}

// Добавляем валидацию телефона
function validatePhone(input) {
    if (input && input.length == 0) {
        console.log(input)
        input.setCustomValidity('Please enter phone');
    }
}

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

// Функция для привязки обработчиков событий
function attachActionHandlers1() {
    document.getElementById('transferRequestsTableBody').addEventListener('click', function (e) {
        const button = e.target.closest('.action-btn');
        if (!button) return;

        const action = button.classList.contains('btn-approve') ? 'approved' :
            button.classList.contains('btn-reject') ? 'rejected' :
                button.classList.contains('btn-view') ? 'view' : null;

        const requestId = button.getAttribute('data-id');

        if (action === 'approved' || action === 'rejected') {
            handleTransferRequestAction(requestId, action);
        } else if (action === 'view') {
            showTransferRequestDetails(requestId);
        }
    });
}
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

// Функция для привязки обработчиков событий
function attachActionHandlers() {
    const tableBody = document.getElementById('transferRequestsTableBody');

    if (!tableBody) return;

    tableBody.addEventListener('click', function (e) {
        const button = e.target.closest('.action-btn');
        if (!button) return;

        const action = button.classList.contains('btn-approve') ? 'approved' :
            button.classList.contains('btn-reject') ? 'rejected' : null;

        const requestId = button.getAttribute('data-id');

        if (!action || !requestId) return;

        handleTransferRequestAction(requestId, action);
    });
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

function updateTransactionAmount() {
    const newAmount = document.getElementById('newTotalAmount').value;
    // Здесь реализуйте логику отправки новых данных на сервер
    console.log('Updating transaction amount to:', newAmount);
}

function cancelAmountEdit() {
    const editSection = document.getElementById('amountEditSection');
    editSection.style.display = 'none';
}

async function updateTransactionAmount() {
    try {
        const transactionId = document.getElementById('currentTransactionId').value;
        const newAmount = document.getElementById('newTotalAmount').value;

        if (!newAmount || isNaN(newAmount) || newAmount < 0) {
            showNotification('error', 'Please enter a valid amount');
            return;
        }

        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/update-amount`, {
            method: 'PUT',
            body: JSON.stringify({
                total_amount: parseFloat(newAmount)
            })
        });

        if (response.success) {
            document.getElementById('totalAmount').textContent = formatCurrency(newAmount);
            document.getElementById('amountEditSection').style.display = 'none';
            showNotification('success', 'Amount updated successfully');

            // Обновляем оставшуюся сумму
            const paidAmount = parseFloat(document.getElementById('paidAmount').textContent.replace(/[^0-9]/g, '')) || 0;
            document.getElementById('remainingAmount').textContent = formatCurrency(newAmount - paidAmount);
        } else {
            showNotification('error', response.message || 'Failed to update amount');
        }
    } catch (error) {
        console.error('Error updating transaction amount:', error);
        showNotification('error', 'Failed to update amount');
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'PKR'
    }).format(amount);
}

async function loadWitnesses(transactionId) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/witnesses`);

        if (response.success && response.witnesses) {
            const { witness1, witness2 } = response.witnesses;

            if (witness1) {
                document.getElementById('witness1Name').value = witness1.name || '';
                document.getElementById('witness1CNIC').value = witness1.cnic || '';
                document.getElementById('witness1Phone').value = witness1.phone || '';
            }

            if (witness2) {
                document.getElementById('witness2Name').value = witness2.name || '';
                document.getElementById('witness2CNIC').value = witness2.cnic || '';
                document.getElementById('witness2Phone').value = witness2.phone || '';
            }
        }
    } catch (error) {
        console.error('Error loading witnesses:', error);
        showNotification('error', 'Failed to load witnesses information');
    }
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


// Форматирование суммы в долларах
function formatUSD(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

function parseNumber(value) {
    const cleanValue = value.replace(/[^\d.]/g, '');
    const [integer, ...decimals] = cleanValue.split('.');
    const decimalPart = decimals.join('');

    return parseFloat(`${integer}.${decimalPart}`) || 0;
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


// Глобальная переменная для хранения текущего ID транзакции
let currentTransactionId = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут
let exchangeRateCache = null;
let lastFetchTime = 0;
let conversionDebounce = null;

// Функция для отображения уведомлений
function showNotification(type, message, duration = 3000) {
    // Создаем контейнер для уведомлений, если его еще нет
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }

    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Добавляем уведомление в контейнер
    container.appendChild(notification);

    // Показываем уведомление с анимацией
    setTimeout(() => {
        notification.classList.add('show');
    }, 10); // Небольшая задержка для корректного запуска анимации

    // Автоматически скрываем и удаляем уведомление через указанное время
    setTimeout(() => {
        notification.classList.remove('show'); // Запускаем анимацию исчезновения
        setTimeout(() => {
            notification.remove(); // Удаляем элемент из DOM
        }, 300); // Ждем завершения анимации исчезновения
    }, duration);
}

// Функция для пагинации
function createPagination(totalItems, currentPage, itemsPerPage) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.createElement('div');
    pagination.className = 'pagination';

    // Кнопка "Предыдущая"
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            loadTransactions(currentPage - 1);
        }
    });
    pagination.appendChild(prevButton);

    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = i === currentPage ? 'active' : '';
        pageButton.addEventListener('click', () => {
            loadTransactions(i);
        });
        pagination.appendChild(pageButton);
    }

    // Кнопка "Следующая"
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadTransactions(currentPage + 1);
        }
    });
    pagination.appendChild(nextButton);

    return pagination;
}

// Форматирование суммы в долларах
function formatUSD(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

// Форматирование денег с разделителями тысяч
function formatPKR(amount) {
    try {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch (e) {
        // Fallback для старых браузеров
        return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}

function parseNumber(value) {
    const cleanValue = value.replace(/[^\d.]/g, '');
    const [integer, ...decimals] = cleanValue.split('.');
    const decimalPart = decimals.join('');

    return parseFloat(`${integer}.${decimalPart}`) || 0;
}

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

// Общая функция для открытия модальных окон
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        // Добавляем класс для анимации
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    } else {
        console.error(`Modal with id "${modalId}" not found`);
    }
}

// Общая функция для закрытия модальных окон
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
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

// Функция для открытия модального окна множественной загрузки файлов
function openMultipleUploadModal() {
    // Получаем ID текущей транзакции
    const transactionIdElement = document.getElementById('currentTransactionId');
    if (!transactionIdElement || !transactionIdElement.value) {
        showNotification('error', 'Transaction ID not found');
        return;
    }

    currentTransactionId = transactionIdElement.value;

    // Устанавливаем значение в скрытое поле формы
    const multiUploadTransactionId = document.getElementById('multiUploadTransactionId');
    if (multiUploadTransactionId) {
        multiUploadTransactionId.value = currentTransactionId;
    }

    // Сбрасываем форму
    const filesInput = document.getElementById('files');
    if (filesInput) {
        filesInput.value = '';
    }

    // Открываем модальное окно
    openModal('multipleUploadModal');
}

// Функция для открытия модального окна добавления платежа
function openAddPaymentModal() {
    // Получаем ID текущей транзакции
    const transactionIdElement = document.getElementById('currentTransactionId');
    if (!transactionIdElement || !transactionIdElement.value) {
        showNotification('error', 'Transaction ID not found');
        return;
    }

    const transactionId = transactionIdElement.value;

    // Устанавливаем значения в форму
    const paymentTransactionId = document.getElementById('paymentTransactionId');
    if (paymentTransactionId) paymentTransactionId.value = transactionId;

    const paymentAmount = document.getElementById('paymentAmount');
    if (paymentAmount) paymentAmount.value = '';

    const paymentMethod = document.getElementById('paymentMethod');
    if (paymentMethod) paymentMethod.value = 'cash';

    // Сбрасываем предпросмотр квитанции
    const receiptFile = document.getElementById('receiptFile');
    const receiptPreview = document.getElementById('receiptPreview');

    if (receiptFile) receiptFile.value = '';
    if (receiptPreview) receiptPreview.innerHTML = '';

    // Открываем модальное окно
    openModal('addPaymentModal');
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

// Функция для отображения файлов в интерфейсе
function displayFiles(files, containerId, fileCategory) {
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
    
    // Создаем действия с файлом
    const actions = document.createElement('div');
    actions.className = 'file-actions';
    
    // Кнопка просмотра
    const viewBtn = document.createElement('button');
    viewBtn.innerHTML = '<i class="fas fa-eye"></i> View';
    
    // Формируем правильный URL
    const fileUrl = file.file_path 
      ? `${API_BASE_URL}/uploads/${encodeURIComponent(file.file_path)}`
      : `${API_BASE_URL}/uploads/${encodeURIComponent(file.file_name)}`;
      
    viewBtn.onclick = () => window.open(fileUrl, '_blank');
    actions.appendChild(viewBtn);
    
    // Кнопка скачивания
    const downloadBtn = document.createElement('button');
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = `${fileUrl}?download=true`;
      a.download = file.original_name || file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    actions.appendChild(downloadBtn);
    
    // Определяем тип файла для отображения иконки
    let fileIcon = 'fa-file';
    if (file.file_name.toLowerCase().endsWith('.pdf')) {
      fileIcon = 'fa-file-pdf';
    } else if (file.file_name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
      fileIcon = 'fa-file-image';
    } else if (file.file_name.toLowerCase().match(/\.(mp4|mov|avi)$/)) {
      fileIcon = 'fa-file-video';
    }
    
    // Формируем отображение файла
    fileElement.innerHTML = `<i class="fas ${fileIcon}"></i>
      <span class="file-name">${file.original_name || file.file_name}</span>
      <span class="file-date">${new Date(file.created_at).toLocaleDateString()}</span>`;
      
    fileElement.appendChild(actions);
    container.appendChild(fileElement);
  });
}

// Функция для загрузки файлов транзакции
async function loadTransactionFiles(transactionId) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/documents`, {
            method: 'GET'
        });

        if (response.success && response.documents) {
            // Распределяем файлы по категориям
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
}// Функция для форматирования метода оплаты
function formatPaymentMethod(method) {
    const methods = {
        'cash': 'Cash',
        'bank_transfer': 'Bank Transfer',
        'credit_card': 'Credit Card',
        'other': 'Other'
    };
    return methods[method] || method.charAt(0).toUpperCase() + method.slice(1);
}

// Функция для форматирования статуса платежа
function formatStatus(status) {
    const statuses = {
        'pending': 'Pending',
        'paid': 'Paid',
        'cancelled': 'Cancelled'
    };
    return statuses[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

// Функция для получения CSS класса статуса
function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'paid': 'status-paid',
        'cancelled': 'status-cancelled'
    };
    return classes[status] || '';
}
// Функция для подтверждения платежа
async function confirmPayment(paymentId, transactionId) {
    if (!confirm('Are you sure you want to confirm this payment?')) {
        return;
    }

    try {
        const response = await apiRequest(
            `/v1/admin/transactions/${transactionId}/payments/${paymentId}`,
            {
                method: 'PUT',
                body: JSON.stringify({
                    status: 'paid',
                    notes: 'Payment confirmed by admin'
                })
            }
        );

        if (response.success) {
            showNotification('success', 'Payment confirmed successfully');
            await loadTransactionPayments(transactionId);
            await loadTransactionSummary(transactionId);
        } else {
            throw new Error(response.message || 'Failed to confirm payment');
        }
    } catch (error) {
        console.error('Error confirming payment:', error);
        showNotification('error', error.message || 'Error confirming payment');
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

// Функция для редактирования платежа
async function editPayment(paymentId, transactionId) {
    try {
        // Получаем данные платежа
        const response = await apiRequest(
            `/v1/admin/transactions/${transactionId}/payments/${paymentId}`
        );

        if (!response.payment) {
            throw new Error('Payment not found');
        }

        const payment = response.payment;

        // Заполняем форму редактирования
        document.getElementById('paymentTransactionId').value = transactionId;
        document.getElementById('paymentId').value = payment.id;
        document.getElementById('paymentAmount').value = parseFloat(payment.amount).toFixed(2);
        document.getElementById('paymentMethod').value = payment.payment_method;
        document.getElementById('paymentStatus').value = payment.status;
        document.getElementById('paymentNotes').value = payment.notes || '';

        // Показываем форму
        openModal('editPaymentModal');
    } catch (error) {
        console.error('Error loading payment:', error);
        showNotification('error', error.message || 'Error loading payment details');
    }
}
// Функция для отображения свидетелей в модальном окне
function displayWitnesses(transaction) {
    try {
        // Проверяем, есть ли данные свидетелей
        if (transaction.witnesses && transaction.witnesses.witness1) {
            document.getElementById('witness1Name').value = transaction.witnesses.witness1.name || '';
            document.getElementById('witness1CNIC').value = transaction.witnesses.witness1.cnic || '';
            document.getElementById('witness1Phone').value = transaction.witnesses.witness1.phone || '';
        }

        if (transaction.witnesses && transaction.witnesses.witness2) {
            document.getElementById('witness2Name').value = transaction.witnesses.witness2.name || '';
            document.getElementById('witness2CNIC').value = transaction.witnesses.witness2.cnic || '';
            document.getElementById('witness2Phone').value = transaction.witnesses.witness2.phone || '';
        }

        // Добавляем обработчик для сохранения свидетелей
        document.querySelector('.update-witnesses-btn')?.addEventListener('click', async () => {
            await saveWitnesses(transaction.id);
        });

        console.log('Witnesses displayed successfully');
    } catch (error) {
        console.error('Error displaying witnesses:', error);
        showNotification('error', 'Error displaying witness information');
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
// Функция для открытия полноразмерного изображения
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
    document.body.appendChild(modal);

    modal.addEventListener('click', function () {
        document.body.removeChild(modal);
    });
}
// Функция для загрузки платежей
async function loadTransactionPayments(transactionId) {
  try {
    const response = await apiRequest(`/v1/admin/transactions/${transactionId}`);
    
    if (response && response.transaction) {
      const transaction = response.transaction;
      const payments = transaction.payments || [];
      
      const tbody = document.getElementById('paymentsTableBody');
      tbody.innerHTML = '';
      
      if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No payments found</td></tr>';
        return;
      }
      
      payments.forEach(payment => {
        const row = document.createElement('tr');
        
        // Создаем ячейку для превью чека
        let receiptPreview = '';
        
        // ИСПРАВЛЕНО: используем receipt_file_id из платежа
        // В данных платежа может быть receipt_file_id или полный объект receipt
        let receiptFileId = null;
        let receiptPath = null;
        let receiptName = null;
        let receiptType = null;
        
        // Проверяем наличие receipt_file_id
        if (payment.receipt_file_id) {
          receiptFileId = payment.receipt_file_id;
        } 
        // Если нет receipt_file_id, проверяем структуру с вложенным receipt
        else if (payment.receipt && payment.receipt.path) {
          // В этом случае нам нужно найти ID файла по пути
          const files = transaction.files?.receipt || [];
          const matchingFile = files.find(f => f.path === payment.receipt.path);
          if (matchingFile) {
            receiptFileId = matchingFile.id;
          }
          receiptPath = payment.receipt.path;
          receiptName = payment.receipt.name;
          receiptType = payment.receipt.type;
        }
        // Если есть file_path в самом платеже (как в ответе /payments)
        else if (payment.file_path) {
          // Ищем ID файла в списке файлов транзакции
          const files = transaction.files?.receipt || [];
          const matchingFile = files.find(f => f.path === payment.file_path);
          if (matchingFile) {
            receiptFileId = matchingFile.id;
          }
          receiptPath = payment.file_path;
          receiptName = payment.original_name;
          receiptType = payment.file_type;
        }
        
        // Формируем правильный URL для получения файла через API
        if (receiptFileId) {
          const fileUrl = `${API_BASE_URL}/v1/admin/transactions/files/${receiptFileId}`;
          
          // Определяем тип файла для правильного превью
          if (receiptType && receiptType.includes('pdf')) {
            receiptPreview = `
              <div class="receipt-preview">
                <i class="fas fa-file-pdf receipt-icon" style="font-size: 24px; color: #dc3545;"></i>
                <div class="receipt-actions">
                  <a href="${fileUrl}" target="_blank" class="view-receipt">View</a>
                  <a href="${fileUrl}?download=true" class="download-receipt">Download</a>
                </div>
              </div>
            `;
          } else if (receiptType && receiptType.includes('image')) {
            receiptPreview = `
              <div class="receipt-preview">
                <img src="${fileUrl}" alt="${receiptName || 'Receipt'}" class="receipt-thumbnail" 
                     onclick="openImagePreview('${fileUrl}')">
                <div class="receipt-actions">
                  <a href="${fileUrl}" target="_blank" class="view-receipt">View</a>
                  <a href="${fileUrl}?download=true" class="download-receipt">Download</a>
                </div>
              </div>
            `;
          } else {
            receiptPreview = `
              <div class="receipt-preview">
                <i class="fas fa-file-alt receipt-icon"></i>
                <div class="receipt-actions">
                  <a href="${fileUrl}" target="_blank" class="view-receipt">View</a>
                  <a href="${fileUrl}?download=true" class="download-receipt">Download</a>
                </div>
              </div>
            `;
          }
        } else {
          receiptPreview = '<span class="no-receipt">No receipt</span>';
        }
        
        // Форматируем дату платежа
        let paymentDate = 'Invalid date';
        try {
          const date = new Date(payment.payment_date);
          if (!isNaN(date)) {
            paymentDate = date.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          }
        } catch (e) {
          console.error('Error parsing date:', e);
        }
        
        // Форматируем сумму
        const amount = parseFloat(payment.amount) || 0;
        
        // Добавляем кнопки действий для платежей в статусе pending
        let actionButtons = '';
        if (payment.status === 'pending') {
          actionButtons = `
            <div class="payment-actions">
              <button class="action-btn btn-approve confirm-payment-btn" 
                      data-payment-id="${payment.id}">
                <i class="fas fa-check"></i> Confirm
              </button>
              <button class="action-btn btn-reject cancel-payment-btn" 
                      data-payment-id="${payment.id}">
                <i class="fas fa-times"></i> Cancel
              </button>
            </div>
          `;
        } else {
          actionButtons = `
            <div class="payment-status">
              <span class="status-badge ${getStatusClass(payment.status)}">
                ${formatStatus(payment.status)}
              </span>
            </div>
          `;
        }
        
        row.innerHTML = `
          <td>${payment.id}</td>
          <td>${paymentDate}</td>
          <td>PKR ${amount.toFixed(2)}</td>
          <td>${formatPaymentMethod(payment.payment_method)}</td>
          <td>${actionButtons}</td>
          <td class="receipt-cell">${receiptPreview}</td>
        `;
        
        tbody.appendChild(row);
      });
      
      // Добавляем обработчики событий для кнопок
      document.querySelectorAll('.confirm-payment-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          const paymentId = e.target.closest('.confirm-payment-btn').dataset.paymentId;
          confirmPayment(paymentId, transactionId);
        });
      });
      
      document.querySelectorAll('.cancel-payment-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          const paymentId = e.target.closest('.cancel-payment-btn').dataset.paymentId;
          cancelPayment(paymentId, transactionId);
        });
      });
      
      document.querySelectorAll('.edit-payment-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          const paymentId = e.target.closest('.edit-payment-btn').dataset.paymentId;
          editPayment(paymentId, transactionId);
        });
      });
    } else {
      document.getElementById('paymentsTableBody').innerHTML = 
        '<tr><td colspan="7" class="text-center">No payments found or error loading data</td></tr>';
    }
  } catch (error) {
    console.error('Error loading payments:', error);
    document.getElementById('paymentsTableBody').innerHTML = 
      '<tr><td colspan="7" class="text-center">Error loading payments</td></tr>';
  }
}

// Функция для подтверждения платежа
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
            await loadTransactionSummary(transactionId);
        } else {
            throw new Error(response.message || 'Failed to confirm payment');
        }
    } catch (error) {
        console.error('Error confirming payment:', error);
        showNotification('error', error.message || 'Error confirming payment');
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

// Функция для редактирования платежа
async function editPayment(paymentId, transactionId) {
    try {
        // Получаем данные платежа
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`);

        if (!response.payment) {
            throw new Error('Payment not found');
        }

        const payment = response.payment;

        // Заполняем форму редактирования
        document.getElementById('paymentTransactionId').value = transactionId;
        document.getElementById('paymentId').value = payment.id;
        document.getElementById('paymentAmount').value = parseFloat(payment.amount).toFixed(2);
        document.getElementById('paymentMethod').value = payment.payment_method;

        // Показываем форму
        openModal('editPaymentModal');
    } catch (error) {
        console.error('Error loading payment:', error);
        showNotification('error', error.message || 'Error loading payment details');
    }
}

// Вспомогательные функции для форматирования
function formatPaymentMethod(method) {
    const methods = {
        'cash': 'Cash',
        'bank_transfer': 'Bank Transfer',
        'credit_card': 'Credit Card',
        'other': 'Other'
    };
    return methods[method] || method.charAt(0).toUpperCase() + method.slice(1);
}

function formatStatus(status) {
    const statuses = {
        'pending': 'Pending',
        'paid': 'Paid',
        'cancelled': 'Cancelled'
    };
    return statuses[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'paid': 'status-paid',
        'cancelled': 'status-cancelled'
    };
    return classes[status] || '';
}

// Функция для открытия полноразмерного предпросмотра изображения
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
    document.body.appendChild(modal);

    modal.addEventListener('click', function () {
        document.body.removeChild(modal);
    });
}

// Функция для настройки обработчиков действий с платежами
function setupPaymentActionHandlers(transactionId) {
    // Удаляем существующие обработчики, чтобы избежать дублирования
    document.querySelectorAll('.btn-view, .btn-edit, .btn-delete').forEach(btn => {
        const clonedBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(clonedBtn, btn);
    });

    // Добавляем новые обработчики
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const paymentId = e.target.closest('button').dataset.id;
            viewPaymentDetails(paymentId, transactionId);
        });
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const paymentId = e.target.closest('button').dataset.id;
            openEditPaymentModal(paymentId, transactionId);
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const paymentId = e.target.closest('button').dataset.id;
            confirmDeletePayment(paymentId, transactionId);
        });
    });
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

function openEditPaymentModal(paymentId, transactionId) {
    // Реализация открытия модального окна для редактирования платежа
    console.log(`Editing payment ${paymentId} for transaction ${transactionId}`);

    // Загрузка данных платежа
    apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`)
        .then(response => response.json())
        .then(data => {
            if (data.payment) {
                // Заполнение формы редактирования
                document.getElementById('editPaymentId').value = data.payment.id;
                document.getElementById('editPaymentAmount').value = data.payment.amount;
                document.getElementById('editPaymentMethod').value = data.payment.payment_method;
                document.getElementById('editPaymentNotes').value = data.payment.notes || '';
                document.getElementById('editPaymentStatus').value = data.payment.status;

                // Открытие модального окна
                openModal('editPaymentModal');
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

// Функция для загрузки деталей транзакции
async function loadTransactionDetails(transactionId) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}`);

        if (response.success && response.transaction) {
            const transaction = response.transaction;

            // Форматируем суммы
            const formatAmount = (amount) => new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);

            // Обновляем суммы
            const totalAmountView = document.getElementById('totalAmountView');
            const paidAmount = document.getElementById('paidAmount');

            if (totalAmountView) totalAmountView.textContent = formatAmount(transaction.total_amount);
            if (paidAmount) paidAmount.textContent = formatAmount(transaction.paid_amount);

            // Обновляем оставшуюся сумму
            const remaining = transaction.total_amount - transaction.paid_amount;
            const remainingAmount = document.getElementById('remainingAmount');
            if (remainingAmount) {
                remainingAmount.textContent = formatAmount(remaining);
            }

            // Обновляем дату создания
            const createdAt = document.getElementById('createdAt');
            if (createdAt) {
                createdAt.textContent = new Date(transaction.created_at).toLocaleDateString();
            }
        }
    } catch (error) {
        console.error('Error loading transaction details:', error);
    }
}
// Функция для отображения свидетелей в модальном окне
function displayWitnesses(transaction) {
    try {
        // Проверяем, есть ли данные свидетелей в формате, который мы ожидаем
        if (transaction.witnesses && transaction.witnesses.witness1) {
            document.getElementById('witness1Name').value = transaction.witnesses.witness1.name || '';
            document.getElementById('witness1CNIC').value = transaction.witnesses.witness1.cnic || '';
            document.getElementById('witness1Phone').value = transaction.witnesses.witness1.phone || '';
        }

        if (transaction.witnesses && transaction.witnesses.witness2) {
            document.getElementById('witness2Name').value = transaction.witnesses.witness2.name || '';
            document.getElementById('witness2CNIC').value = transaction.witnesses.witness2.cnic || '';
            document.getElementById('witness2Phone').value = transaction.witnesses.witness2.phone || '';
        }

        console.log('Witnesses displayed successfully');
    } catch (error) {
        console.error('Error displaying witnesses:', error);
        showNotification('error', 'Error displaying witness information');
    }
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
async function loadTransactions() {
    try {
        const response = await apiRequest('/v1/admin/transactions');

        if (response.success && response.transactions) {
            const tbody = document.getElementById('transactionsTableBody');
            tbody.innerHTML = '';

            if (response.transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No transactions found</td></tr>';
                return;
            }

            response.transactions.forEach(transaction => {
                const row = document.createElement('tr');

                // КНОПКИ ДЛЯ ТРАНЗАКЦИЙ (Edit/Delete)
                const actionsHTML = `
    <div class="actions-column">
        <button class="action-btn btn-view view-transaction-btn" data-transaction-id="${transaction.id}">
            <i class="fas fa-eye"></i> View
        </button>
        ${transaction.status === 'pending'
                        ? `
        <button class="action-btn btn-edit" data-id="${transaction.id}" data-action="approve">
            <i class="fas fa-check"></i> Approve
        </button>
        <button class="action-btn btn-delete" data-id="${transaction.id}" data-action="reject">
            <i class="fas fa-times"></i> Reject
        </button>`
                        : ''}
    </div>
`;

                row.innerHTML = `
                    <td>${transaction.id}</td>
                    <td>${transaction.property_id}</td>
                    <td>${transaction.previous_owner}</td>
                    <td>${transaction.new_owner}</td>
                    <td>${new Date(transaction.date).toLocaleDateString()}</td>
                    <td><span class="status-badge ${transaction.status}">${transaction.status}</span></td>
                    <td class="actions-cell">${actionsHTML}</td>
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
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactionsTableBody').innerHTML =
            '<tr><td colspan="7" class="text-center">Error loading transactions</td></tr>';
    }
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
                        <button class="action-btn btn-view view-user-btn" data-user-id="${user.id}">
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

// Функция для открытия модального окна создания транзакции
function openCreateTransactionModal() {
    loadProperties();
    loadUsersForSelect();
    openModal('createTransactionModal');
}

// Функция для открытия модального окна просмотра пользователя
async function openViewUserModal(userId) {
    try {
        const response = await apiRequest(`/v1/admin/users/${userId}`);

        if (response.success && response.user) {
            const user = response.user;
            const modalBody = document.getElementById('userModalBody');

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
                    <button class="action-btn btn-approve activate-user-btn" data-user-id="${user.id}">
                        <i class="fas fa-check"></i> Activate
                    </button>
                    <button class="action-btn btn-reject block-user-btn" data-user-id="${user.id}">
                        <i class="fas fa-ban"></i> Block
                    </button>
                </div>
            `;

            openModal('userModal');

            // Добавляем обработчики для кнопок действий
            document.querySelector('.activate-user-btn')?.addEventListener('click', function () {
                const userId = this.getAttribute('data-user-id');
                updateUserStatus(userId, 'active');
            });

            document.querySelector('.block-user-btn')?.addEventListener('click', function () {
                const userId = this.getAttribute('data-user-id');
                updateUserStatus(userId, 'blocked');
            });
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

// Функция для обновления свидетелей
async function updateWitnesses() {
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

    // Валидация CNIC
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(witness1.cnic)) {
        showNotification('error', 'Witness 1 CNIC must be in XXXXX-XXXXXXX-X format');
        return;
    }

    if (!cnicRegex.test(witness2.cnic)) {
        showNotification('error', 'Witness 2 CNIC must be in XXXXX-XXXXXXX-X format');
        return;
    }

    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/witnesses`, {
            method: 'PUT',
            body: JSON.stringify({
                witness1,
                witness2
            })
        });

        if (response.success) {
            showNotification('success', 'Witnesses updated successfully');
        } else {
            throw new Error(response.message || 'Failed to update witnesses');
        }
    } catch (error) {
        showNotification('error', 'Error updating witnesses: ' + error.message);
    }
}

// Функция для обработки навигации между секциями
function navigateToSection(sectionId) {
    // Скрываем все секции
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Убираем активный класс со всех ссылок
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Показываем выбранную секцию
    document.getElementById(sectionId).classList.add('active');

    // Добавляем активный класс к выбранной ссылке
    document.querySelector(`.nav-link[data-section="${sectionId}"]`).classList.add('active');

    // Загружаем данные для секции
    if (sectionId === 'transactions') {
        loadTransactions();
    } else if (sectionId === 'users') {
        loadUsers();
    } else if (sectionId === 'users-archive') {
        loadArchivedUsers();
    }
}

// Функция для инициализации конвертера валют
function attachCurrencyConverter() {
    const totalAmountInput = document.getElementById('totalAmount');
    const usdOutput = document.getElementById('toUSD');

    if (!totalAmountInput || !usdOutput) {
        console.error('Элементы #totalAmount или #toUSD не найдены!');
        return;
    }

    let rawValue = 0;
    let lastInputValue = '';

    // Сохраняем "сырое" значение во время ввода
    totalAmountInput.addEventListener('input', function (e) {
        // Сохраняем текущее значение для корректной обработки
        lastInputValue = this.value;

        // Чистим ввод, сохраняя цифры и разделители
        let cleanValue = this.value
            .replace(/[^0-9.,]/g, '')
            .replace(/(,)/g, '.') // Заменяем запятые на точки
            .replace(/(\..*)\./g, '$1'); // Удаляем лишние точки

        // Парсим значение
        const newRawValue = parseNumber(cleanValue);

        // Сохраняем сырое значение ТОЛЬКО если оно изменилось
        if (newRawValue !== rawValue) {
            rawValue = newRawValue;
            // Обновляем конвертацию в USD во время ввода (без форматирования)
            updateUSD(rawValue);
        }
    });

    // Форматируем ТОЛЬКО при потере фокуса
    totalAmountInput.addEventListener('blur', function () {
        // Сохраняем позицию курсора (для корректного восстановления при focus)
        const cursorPosition = this.selectionStart;

        if (!this.value || parseFloat(this.value) === 0) {
            this.value = '0.00';
            rawValue = 0;
        } else {
            // Форматируем значение при потере фокуса
            rawValue = parseNumber(this.value);
            this.value = formatPKR(rawValue);
        }

        // Восстанавливаем позицию курсора (если нужно)
        if (cursorPosition > 0 && cursorPosition <= this.value.length) {
            this.setSelectionRange(cursorPosition, cursorPosition);
        }

        updateUSD(rawValue);
    });

    // При фокусе показываем "сырое" значение для редактирования
    totalAmountInput.addEventListener('focus', function () {
        if (this.value === '0.00' || this.value === '') {
            this.value = '';
            rawValue = 0;
        } else {
            // Сохраняем текущее значение как "сырое" для редактирования
            this.value = rawValue.toString();
        }

        // Восстанавливаем последнее введенное значение (если было)
        if (lastInputValue && lastInputValue !== '0.00') {
            this.value = lastInputValue;
        }

        // Устанавливаем курсор в конец поля
        setTimeout(() => {
            this.setSelectionRange(this.value.length, this.value.length);
        }, 0);
    });

    // Обновление USD
    async function updateUSD(pkrAmount) {
        if (pkrAmount <= 0) {
            usdOutput.textContent = '';
            return;
        }
        try {
            const exchangeRate = await getCachedExchangeRate();
            const usdAmount = pkrAmount * exchangeRate;
            usdOutput.innerHTML = `≈ ${formatUSD(usdAmount)} USD
                <span style="font-size: 0.8em; display: block; opacity: 0.7; margin-top: 3px">
                    (1 PKR = ${exchangeRate.toFixed(6)} USD)
                </span>`;
        } catch (error) {
            console.log(error)
            usdOutput.innerHTML = `
                <span style="color: #dc3545">Conversion error</span>
                <span style="font-size: 0.8em; display: block; opacity: 0.7; margin-top: 3px">
                    Check your internet connection
                </span>`;
        }
    }

    // Инициализация
    if (totalAmountInput.value) {
        rawValue = parseNumber(totalAmountInput.value);
        totalAmountInput.value = formatPKR(rawValue);
    } else {
        totalAmountInput.value = '0.00';
        rawValue = 0;
    }
    updateUSD(rawValue);
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
                openMultipleUploadModal();
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
            const transactionId = viewTransactionBtn.getAttribute('data-transaction-id');
            openViewTransactionModal(transactionId);
        }

        const viewUserBtn = e.target.closest('.view-user-btn');
        if (viewUserBtn) {
            const userId = viewUserBtn.getAttribute('data-user-id');
            openViewUserModal(userId);
        }
    });

    // Инициализация конвертера валют
    attachCurrencyConverter();
}

// Функция для инициализации приложения
function initApp() {
    // Проверяем, что все необходимые элементы существуют
    if (document.querySelector('.admin-container')) {
        // Инициализируем обработчики событий
        initEventHandlers();

        // Загружаем начальные данные
        loadTransactions();

        // Навигация по умолчанию
        navigateToSection('transactions');
    }
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
