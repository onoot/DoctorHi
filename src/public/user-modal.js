// user-modal.js
// Функции для работы с модальными окнами пользователей

// Универсальная функция для открытия модальных окон
function openModal(modalId) {
    console.log(`[DEBUG] Attempting to open modal with ID: ${modalId}`);
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hide');
        modal.classList.add('show');
        modal.style.display = 'flex';
        void modal.offsetWidth; // Принудительная перерисовка
        console.log(`[SUCCESS] Modal ${modalId} opened successfully`);
        return true;
    } else {
        console.error(`[ERROR] Modal with ID "${modalId}" not found`);
        return false;
    }
}

// Универсальная функция для закрытия модальных окон
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hide');
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.classList.contains('hide')) {
                modal.style.display = 'none';
            }
        }, 300);
    }
}

// Функция для просмотра пользователя
async function viewUser(userId) {
    console.log(`[USER MODAL] Attempting to view user with ID: ${userId}`);
    
    try {
        const response = await apiRequest(`/v1/admin/users/${userId}`);
        if (response.success && response.user) {
            const user = response.user;
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
                        <p><strong>Login:</strong> ${user.login || 'N/A'}</p>
                        <p><strong>Status:</strong> 
                            <span class="status-badge ${user.is_active ? 'active' : 'blocked'}">
                                ${user.is_active ? 'Active' : 'Blocked'}
                            </span>
                        </p>
                        <p><strong>Properties:</strong> ${user.properties ? user.properties.length : 0}</p>
                        <p><strong>Created:</strong> ${createdAt}</p>
                    </div>
                `;
                
                openModal('userModal');
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
}

// Функция для открытия модального окна добавления пользователя
function openAddUserModal() {
    console.log('[USER MODAL] Opening add user modal');
    generateLoginCredentials();
    openModal('addUserModal');
}

// Функция для генерации логина на основе имени
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
            login += Math.floor(100 + Math.random() * 900); // Добавляем 3 случайных цифры
        }
    }
    
    const loginInput = document.getElementById('addUserModal_userLogin');
    if (loginInput) {
        loginInput.value = login;
    }
}

// Функция для генерации пароля
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

// Функция для генерации учетных данных (логин + пароль)
function generateLoginCredentials() {
    console.log('[USER MODAL] Generating login credentials');
    regenerateLogin();
    regeneratePassword();
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
    const regenerateLoginBtn = document.querySelector('.regenerate-login-btn');
    if (regenerateLoginBtn) {
        regenerateLoginBtn.addEventListener('click', regenerateLogin);
    }
    
    const regeneratePasswordBtn = document.querySelector('.regenerate-password-btn');
    if (regeneratePasswordBtn) {
        regeneratePasswordBtn.addEventListener('click', regeneratePassword);
    }
    
    // Обработчики закрытия модальных окон
    document.querySelectorAll('.modal-close, .close').forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            console.log(`[DEBUG] Closing modal via close button: ${modalId}`);
            closeModal(modalId);
        });
    });
    
    // Закрытие по клику на overlay
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            const modalId = event.target.id;
            console.log(`[DEBUG] Closing modal via background click: ${modalId}`);
            closeModal(modalId);
        }
    });
    
    // Закрытие по клавише Esc
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(modal => {
                const modalId = modal.id;
                console.log(`[DEBUG] Closing modal via Escape key: ${modalId}`);
                closeModal(modalId);
            });
        }
    });
}

// Прикрепляем функции к глобальному объекту window
window.openModal = openModal;
window.closeModal = closeModal;
window.viewUser = viewUser;
window.openAddUserModal = openAddUserModal;
window.regenerateLogin = regenerateLogin;
window.regeneratePassword = regeneratePassword;
window.generateLoginCredentials = generateLoginCredentials;
window.initUserModalHandlers = initUserModalHandlers;

// Автоматическая инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('userModal') || document.getElementById('addUserModal')) {
        initUserModalHandlers();
    }
});