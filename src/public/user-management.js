// user-management.js
// Функции для управления пользователями

/**
 * Загрузка списка пользователей
 * @param {string} status - Статус пользователей ('active' или 'archived')
 */
async function loadUsers(status = 'active') {
    console.log(`[USER MANAGEMENT] Loading ${status} users`);

    try {
        const searchInput = document.querySelector(`#${status === 'active' ? 'users' : 'users-archive'} .search-input`);
        const searchTerm = searchInput ? searchInput.value.trim() : '';

        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);

        const response = await apiRequest(`/v1/admin/users?status=${status}${params.toString() ? `&${params.toString()}` : ''}`);
        if (response.success && Array.isArray(response.users)) {
            
            // Сохраняем ВСЕХ пользователей (все статусы), а не только активных
            localStorage.setItem('users', JSON.stringify(response.users));
            console.log('[USERS] Saved all users to localStorage:', response.users.length);
            
            const users = response.users;
            const tableBody = status === 'active' ?
                document.getElementById('usersTableBody') :
                document.getElementById('archivedUsersTableBody');

            if (tableBody) {
                renderUsersTable(users, tableBody); 
            }
        } else {
            console.error('[USER MANAGEMENT] Invalid users data format:', response);
            const tableBody = status === 'active' ?
                document.getElementById('usersTableBody') :
                document.getElementById('archivedUsersTableBody');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading users</td></tr>';
            }
        }
    } catch (error) {
        console.error('[USER MANAGEMENT] Error loading users:', error);
        const tableBody = status === 'active' ?
            document.getElementById('usersTableBody') :
            document.getElementById('archivedUsersTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading users</td></tr>';
        }
    }
}

/**
 * Архивация пользователя
 * @param {string} userId - ID пользователя
 */
async function archiveUser(userId) {
    console.log(`[USER MANAGEMENT] Attempting to archive user with ID: ${userId}`);

    if (!confirm('Are you sure you want to archive this user?')) {
        console.log('[USER MANAGEMENT] Archive action cancelled by user');
        return;
    }

    try {
        const response = await apiRequest(`/v1/admin/users/${userId}/archive`, { method: 'POST' });
        if (response.success) {
            console.log('[USER MANAGEMENT] User archived successfully');
            showNotification('success', 'User archived successfully');
            // Перезагружаем список пользователей
            const activeSection = document.querySelector('.section.active').id;
            if (activeSection === 'users') {
                loadUsers('active');
            } else if (activeSection === 'users-archive') {
                loadUsers('archived');
            }
        } else {
            console.error('[USER MANAGEMENT] Failed to archive user:', response.message);
            showNotification('error', 'Failed to archive user: ' + (response.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('[USER MANAGEMENT] Archive error:', error);
        showNotification('error', 'Error archiving user');
    }
}


/**
 * Восстановление пользователя из архива
 * @param {string} userId - ID пользователя
 */
async function restoreUser(userId) {
    console.log(`[USER MANAGEMENT] Attempting to restore user with ID: ${userId}`);

    if (!confirm('Are you sure you want to restore this user from archive?')) {
        console.log('[USER MANAGEMENT] Restore action cancelled by user');
        return;
    }

    try {
        const response = await apiRequest(`/v1/admin/users/${userId}/unarchive`, { method: 'POST' });
        if (response.success) {
            console.log('[USER MANAGEMENT] User restored successfully');
            showNotification('success', 'User restored successfully');
            // Перезагружаем список пользователей
            const activeSection = document.querySelector('.section.active').id;
            if (activeSection === 'users') {
                loadUsers('active');
            } else if (activeSection === 'users-archive') {
                loadUsers('archived');
            }
        } else {
            console.error('[USER MANAGEMENT] Failed to restore user:', response.message);
            showNotification('error', 'Failed to restore user: ' + (response.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('[USER MANAGEMENT] Restore error:', error);
        showNotification('error', 'Error restoring user');
    }
}

/**
 * Создание нового пользователя
 */
async function createUser() {
    const name = document.getElementById('addUserModal_userName')?.value?.trim();
    const cnic = document.getElementById('addUserModal_userCnic')?.value?.trim();
    const phone = document.getElementById('addUserModal_userPhone')?.value?.trim();
    const address = document.getElementById('addUserModal_userAddress')?.value?.trim();
    const login = document.getElementById('addUserModal_userLogin')?.value?.trim();
    const password = document.getElementById('addUserModal_userPassword')?.value?.trim();

    // ПРОВЕРКА ТОЛЬКО НА ПУСТОТУ ПОСЛЕ TRIM — БЕЗ РЕГУЛЯРОК И ПРОЧЕГО
    if (!name || !cnic || !phone || !address || !login || !password) {
        showNotification('error', 'All fields are required');
        return;
    }

    try {
        const response = await apiRequest('/v1/admin/users', {
            method: 'POST',
            body: JSON.stringify({
                name,
                cnic,
                phone,
                address,
                login,
                password
            })
        });

        if (response.success) {
            showNotification('success', 'User created successfully');
            closeModal('addUserModal');
            loadUsers('active');
        } else {
            throw new Error(response.message || 'Failed to create user');
        }
    } catch (error) {
        console.error('[USER MANAGEMENT] Error creating user:', error);
        showNotification('error', 'Error creating user: ' + error.message);
    }
}

/**
 * Инициализация обработчиков управления пользователями
 */
function initUserManagementHandlers() {
    const createBtn = document.querySelector('.create-user-btn');
    if (createBtn) {
        createBtn.addEventListener('click', function () {
            createUser();
        });
    }

    // Обработчик кнопки отмены
    document.querySelector('.cancel-user-btn')?.addEventListener('click', function () {
        closeModal('addUserModal');
    });

    // Обработчики генерации логина/пароля
    document.querySelector('.regenerate-login-btn')?.addEventListener('click', regenerateLogin);
    document.querySelector('.regenerate-password-btn')?.addEventListener('click', regeneratePassword);
}

/**
 * Функция для отрисовки таблицы пользователей
 * @param {Array} users - Массив пользователей
 * @param {HTMLElement} tbody - Тело таблицы для отображения
 */
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
            <td>${user.email}</td>
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
                    <button class="action-btn btn-edit" data-id="${user.id}" data-action="restore">
                        <i class="fas fa-undo"></i> Restore
                    </button>
                </div>`;
        } else {
            actionsHTML = `
                <div class="actions-column">
                    <button class="action-btn btn-view" data-id="${user.id}"><i class="fas fa-eye"></i> View</button>
                    <button class="action-btn btn-delete archive-user-btn" data-id="${user.id}">
    <i class="fas fa-archive"></i> Archive
</button>
                </div>`;
        }

        actionsCell.innerHTML = actionsHTML;
        tbody.appendChild(row);
    });

    document.querySelectorAll('#usersTableBody .btn-view').forEach(button => {
        button.addEventListener('click', async (e) => {
            const userId = e.target.closest('[data-id]').dataset.id;
            await viewUser(userId);
            openModal('userModal');
        });
    });

    document.querySelectorAll('.btn-edit[data-action="toggle-status"]').forEach(button => {
        button.addEventListener('click', (e) => toggleUserStatus(e.target.closest('[data-id]').dataset.id));
    });

    document.querySelectorAll('.archive-user-btn').forEach(button => {
        button.addEventListener('click', (e) => archiveUser(e.target.closest('[data-id]').dataset.id));
    });

    document.querySelectorAll('.restore-user-btn').forEach(button => {
        button.addEventListener('click', (e) => restoreUser(e.target.closest('[data-id]').dataset.id));
    });
}

/**
 * Обновление статуса пользователя
 * @param {string} userId - ID пользователя
 */
async function toggleUserStatus(userId) {
    try {
        // Определяем текущий статус пользователя
        const userElement = document.querySelector(`[data-id="${userId}"]`);
        if (!userElement) {
            showNotification('error', 'User element not found');
            return;
        }

        // Определяем текущий статус
        let newStatus;
        if (userElement.closest('.status-badge')?.classList.contains('active')) {
            newStatus = 'blocked';
        } else {
            newStatus = 'active';
        }

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

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('users') || document.getElementById('addUserModal')) {
        initUserManagementHandlers();
    }
});