// user-modal.js
// Функции для работы с модальными окнами пользователей

// Универсальная функция для открытия модальных окон
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hide');
        modal.classList.add('show');
        void modal.offsetWidth;
        return true;
    } else {
        console.error(`[ERROR] Modal with ID "${modalId}" not found`);
        return false;
    }
}

async function viewUser(userId) {
    console.log(`[USER MODAL] Attempting to view user with ID: ${userId}`);
    
    try {
        const response = await apiRequest(`/v1/admin/users/${userId}`);
        
        if (response && response.id) {
            const user = response || response?.user;
            
            const modalBody = document.getElementById('userModalBody');
            
            if (modalBody) {
                const createdAt = user.created_at ? 
                    new Date(user.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric'
                    }) : 'N/A';
                
                modalBody.innerHTML = `
                    <div class="user-details">
                        <p><strong>ID:</strong> ${user.id}</p>
                        <p><strong>Name:</strong> ${user.name || 'N/A'}</p>
                        <p><strong>CNIC:</strong> ${user.cnic || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
                        <p><strong>Address:</strong> ${user.address || 'N/A'}</p>
                        <p><strong>Login:</strong> ${user.email || 'N/A'}</p>
                        <p><strong>Status:</strong> 
                            <span class="status-badge ${user.status ? 'active' : 'blocked'}">
                                ${user.status ? 'Active' : 'Blocked'}
                            </span>
                        </p>
                        <p><strong>Properties:</strong> ${user.properties ? user.properties.length : 0}</p>
                        <p><strong>Created:</strong> ${createdAt}</p>
                    </div>
                    
                    <div class="change-password-section" style="margin-top: 20px; padding: 15px 0 15px 0; border-top: 1px solid #eee;">
                        <h4>Change Password</h4>
                        <div class="form-group">
                            <label>New Password</label>
                            <input type="password" id="userModal_newPassword" class="form-control" placeholder="Enter new password" required>
                            <small style="color: #666; display: block; margin-top: 5px;">To change the password, enter it.</small>
                        </div>
                        <div class="password-actions" style="margin-top: 10px; display: flex; gap: 10px;">
                            <button type="button" class="action-btn btn-edit change-password-btn btn-primary save-password-btn">Save New Password</button>
                        </div>
                    </div>
                `;
            } else {
                console.error('[USER MODAL] User modal body not found');
                showNotification('error', 'Error displaying user details');
            }
        } else {
            console.error('[USER MODAL] Invalid user data format:', response);
            showNotification('error', 'Failed to load user data');
        }
    } catch (error) {
        console.error('[USER MODAL] Error loading user details:', error);
        showNotification('error', 'Error loading user details');
    }

    // ✅ Устанавливаем data-user-id на модальное окно
    const userModal = document.getElementById('userModal');
    if (userModal) {
        userModal.setAttribute('data-user-id', userId);
    }

    openModal('userModal');
}

function openAddUserModal() {
    console.log('[USER MODAL] Opening add user modal');
    generateLoginCredentials();
    openModal('addUserModal');
}

function regenerateLogin() {
    console.log('[USER MODAL] Regenerating login');
    const nameInput = document.getElementById('addUserModal_userName');
    const fullName = nameInput ? nameInput.value.trim() : '';
    let login = '';
    
    if (fullName) {
        const nameParts = fullName.toLowerCase().split(' ').filter(part => part.length > 0);
        if (nameParts.length > 0) {
            if (nameParts.length === 1) {
                login = nameParts[0];
            } else {
                login = nameParts[0] + '.' + nameParts[nameParts.length - 1];
            }
            login += Math.floor(100 + Math.random() * 900);
        }
    }
    
    const loginInput = document.getElementById('addUserModal_userLogin');
    if (loginInput) {
        loginInput.value = login;
    }
}

function regeneratePassword() {
    console.log('[USER MODAL] Regenerating password');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const passwordInput = document.getElementById('addUserModal_userPassword');
    if (passwordInput) {
        passwordInput.value = password;
    }
}

function generateLoginCredentials() {
    console.log('[USER MODAL] Generating login credentials');
    regenerateLogin();
    regeneratePassword();
}

// 👇 ЕДИНСТВЕННЫЙ обработчик для сохранения пароля
async function handleSavePassword(e) {
    const saveBtn = e.target.closest('.save-password-btn');
    if (!saveBtn) return;
    
    e.preventDefault();
    
    const newPassword = document.getElementById('userModal_newPassword')?.value?.trim();
    const modal = document.getElementById('userModal');
    const userId = modal?.getAttribute('data-user-id');

    if (!newPassword) {
        showNotification('error', 'Please enter a new password');
        return;
    }

    if (!userId) {
        showNotification('error', 'User ID not found. Please reload the page.');
        return;
    }

    await changeUserPassword(userId, newPassword);
}

// 👇 ЕДИНСТВЕННАЯ функция для смены пароля
async function changeUserPassword(userId, newPassword) {
    if (!userId || !newPassword) {
        showNotification('error', 'User ID or password missing');
        return;
    }

    try {
        const response = await apiRequest(`/v1/admin/users/${userId}/password`, {
            method: 'PUT',
            body: JSON.stringify({ newPassword })
        });

        if (response.success) {
            showNotification('success', 'Password changed successfully');
            const newPasswordInput = document.getElementById('userModal_newPassword');
            if (newPasswordInput) newPasswordInput.value = '';
        } else {
            throw new Error(response.message || 'Failed to change password');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('error', 'Error changing password: ' + error.message);
    }
}

// Инициализация обработчиков для модальных окон пользователей
function initUserModalHandlers() {
    console.log('[USER MODAL] Initializing user modal handlers');
    
    // Кнопка добавления пользователя
    const addUserBtn = document.getElementById('openAddUserModal');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('[USER MODAL] Add user button clicked');
            openAddUserModal();
        });
    }
    
    // Обработчик кнопок просмотра пользователей
    document.addEventListener('click', function(e) {
        const viewUserBtn = e.target.closest('.view-user-btn');
        if (viewUserBtn) {
            e.preventDefault();
            const userId = viewUserBtn.getAttribute('data-id');
            console.log(`[USER MODAL] View user button clicked for user ID: ${userId}`);
            if (userId) {
                viewUser(userId);
            }
        }
    });
    
    // Обработчики генерации логина и пароля
    document.addEventListener('click', function(e) {
        if (e.target.closest('.regenerate-login-btn')) {
            regenerateLogin();
        }
        if (e.target.closest('.regenerate-password-btn')) {
            regeneratePassword();
        }
    });

    // 👇 ЕДИНСТВЕННЫЙ обработчик для сохранения пароля
    document.addEventListener('click', handleSavePassword);
}

// Прикрепляем функции к глобальному объекту window
window.openModal = openModal;
window.openAddUserModal = openAddUserModal;
window.regenerateLogin = regenerateLogin;
window.regeneratePassword = regeneratePassword;
window.generateLoginCredentials = generateLoginCredentials;
window.initUserModalHandlers = initUserModalHandlers;