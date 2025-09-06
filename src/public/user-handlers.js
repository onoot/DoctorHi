// user-handlers.js
// Дополнительные обработчики для пользователей

/**
 * Архивация пользователя
 * @param {string} userId - ID пользователя
 */
async function archiveUser(userId) {
    if (!confirm('Are you sure you want to archive this user?')) {
        return;
    }
    
    try {
        const response = await apiRequest(`/v1/admin/users/${userId}/archive`, {method: 'POST'});
        if (response.success) {
            showNotification('success', 'User archived successfully');
            // Перезагружаем список пользователей
            const activeSection = document.querySelector('.section.active').id;
            if (activeSection === 'users') {
                loadUsers('active');
            } else if (activeSection === 'users-archive') {
                loadUsers('archived');
            }
        } else {
            showNotification('error', 'Failed to archive user: ' + (response.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Archive error:', error);
        showNotification('error', 'Error archiving user');
    }
}

/**
 * Восстановление пользователя из архива
 * @param {string} userId - ID пользователя
 */
async function restoreUser(userId) {
    if (!confirm('Are you sure you want to restore this user from archive?')) {
        return;
    }
    
    try {
        const response = await apiRequest(`/v1/admin/users/${userId}/unarchive`, {method: 'POST'});
        if (response.success) {
            showNotification('success', 'User restored successfully');
            // Перезагружаем список пользователей
            const activeSection = document.querySelector('.section.active').id;
            if (activeSection === 'users') {
                loadUsers('active');
            } else if (activeSection === 'users-archive') {
                loadUsers('archived');
            }
        } else {
            showNotification('error', 'Failed to restore user: ' + (response.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Restore error:', error);
        showNotification('error', 'Error restoring user');
    }
}

// Экспортируем функции
export { archiveUser, restoreUser };