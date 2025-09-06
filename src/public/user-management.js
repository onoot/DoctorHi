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
            const users = response.users;
            const tableBody = status === 'active' ? 
                document.getElementById('usersTableBody') : 
                document.getElementById('archivedUsersTableBody');
            
            if (tableBody) {
                if (users.length === 0) {
                    tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No ${status} users found</td></tr>`;
                    return;
                }
                
                let html = '';
                users.forEach(user => {
                    const createdAt = user.created_at ? 
                        new Date(user.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric'
                        }) : 'N/A';
                    
                    const statusBadge = user.is_active ? 
                        '<span class="status-badge active">Active</span>' : 
                        '<span class="status-badge blocked">Blocked</span>';
                    
                    html += `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.name || 'N/A'}</td>
                            <td>${user.cnic || 'N/A'}</td>
                            <td>${user.login || 'N/A'}</td>
                            <td>${user.properties ? user.properties.length : 0}</td>
                            <td>${statusBadge}</td>
                            <td>
                                <button class="action-btn btn-view view-user-btn" data-id="${user.id}">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                ${status === 'active' ? `
                                <button class="action-btn btn-delete archive-user-btn" data-id="${user.id}">
                                    <i class="fas fa-archive"></i> Archive
                                </button>` : `
                                <button class="action-btn btn-approve restore-user-btn" data-id="${user.id}">
                                    <i class="fas fa-undo"></i> Restore
                                </button>`}
                            </td>
                        </tr>
                    `;
                });
                
                tableBody.innerHTML = html;
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
        const response = await apiRequest(`/v1/admin/users/${userId}/archive`, {method: 'POST'});
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
        const response = await apiRequest(`/v1/admin/users/${userId}/unarchive`, {method: 'POST'});
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
    const name = document.getElementById('userName').value;
    const cnic = document.getElementById('userCnic').value;
    const phone = document.getElementById('userPhone').value;
    const address = document.getElementById('userAddress').value;
    const login = document.getElementById('userLogin').value;
    const password = document.getElementById('userPassword').value;
    
    // Валидация
    if (!name || !cnic || !phone || !address) {
        showNotification('error', 'Please fill all required fields');
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
    // Обработчик формы добавления пользователя
    document.getElementById('addUserForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        createUser();
    });
    
    // Обработчик кнопки отмены добавления пользователя
    document.querySelector('.cancel-user-btn')?.addEventListener('click', function() {
        closeModal('addUserModal');
    });
    
    // Обработчик кнопки отмены в модальном окне транзакции
    document.querySelector('.cancel-transaction-btn')?.addEventListener('click', function() {
        closeModal('createTransactionModal');
    });
    
    // Обработчик кнопки отмены в модальном окне загрузки файла
    document.querySelector('.cancel-upload-btn')?.addEventListener('click', function() {
        closeModal('uploadFileModal');
    });
    
    // Обработчик кнопки отмены в модальном окне множественной загрузки
    document.querySelector('.cancel-multi-upload-btn')?.addEventListener('click', function() {
        closeModal('multipleUploadModal');
    });
    
    // Обработчик кнопки отмены в модальном окне добавления платежа
    document.querySelector('.cancel-payment-btn')?.addEventListener('click', function() {
        closeModal('addPaymentModal');
    });
    
    // Обработчик кнопки отмены в модальном окне редактирования платежа
    document.querySelectorAll('.cancel-payment-btn').forEach(button => {
        button.addEventListener('click', function() {
            closeModal('editPaymentModal');
        });
    });
}