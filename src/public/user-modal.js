// user-modal.js
// Функции для работы с модальными окнами пользователей

// Универсальная функция для открытия модальных окон
function openModal(modalId) {
    console.log(`[DEBUG] Attempting to open modal with ID: ${modalId}`);
    
    const modal = document.getElementById(modalId);
    if (modal) {
        // Удаляем класс hide, если он есть
        modal.classList.remove('hide');
        
        // Добавляем класс show для отображения
        modal.classList.add('show');
        
        console.log(`[SUCCESS] Modal ${modalId} opened successfully`);
        
        // Дополнительная проверка для отладки
        if (!modal.classList.contains('show')) {
            console.error(`[ERROR] Failed to add 'show' class to modal ${modalId}`);
            return false;
        }
        
        // Устанавливаем display: flex только если класс show добавлен
        modal.style.display = 'flex';
        
        // Принудительная перерисовка для анимации
        void modal.offsetWidth;
        
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
        
        // Устанавливаем таймер для полного скрытия после анимации
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
                // Форматируем дату создания
                const createdAt = user.created_at ? 
                    new Date(user.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric'
                    }) : 'N/A';
                
                // Заполняем содержимое модального окна
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
                
                // Открываем модальное окно
                console.log('[USER MODAL] Calling openModal with ID: userModal');
                const modalOpened = openModal('userModal');
                if (!modalOpened) {
                    console.error('[USER MODAL] Failed to open user modal after loading data');
                    showNotification('error', 'Error opening user details');
                } else {
                    console.log('[USER MODAL] User modal opened successfully');
                }
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

// Функция для генерации логина
function regenerateLogin() {
    console.log('[USER MODAL] Regenerating login');
    const nameInput = document.getElementById('userName');
    const fullName = nameInput ? nameInput.value || '' : '';
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
    document.getElementById('userLogin').value = login;
}

// Функция для генерации пароля
function regeneratePassword() {
    console.log('[USER MODAL] Regenerating password');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('userPassword').value = password;
}

// Функция для генерации учетных данных
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
    
    // Обработчик для кнопок просмотра пользователей
    document.addEventListener('click', function(e) {
        const viewUserBtn = e.target.closest('.view-user-btn');
        if (viewUserBtn) {
            e.preventDefault();
            const userId = viewUserBtn.getAttribute('data-id');
            console.log(`[USER MODAL] View user button clicked for user ID: ${userId}`);
            if (userId) {
                viewUser(userId);
            }
            return;
        }
    });
    
    // Обработчики для генерации логина и пароля
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
    
    // Закрытие модального окна при клике вне его содержимого
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            const modalId = event.target.id;
            console.log(`[DEBUG] Closing modal via background click: ${modalId}`);
            closeModal(modalId);
        }
    });
    
    // Закрытие модальных окон по клавише Esc
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
// Это позволяет другим скриптам обращаться к этим функциям
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
    // Проверяем существование необходимых элементов
    if (document.getElementById('userModal') || document.getElementById('addUserModal')) {
        initUserModalHandlers();
    }
});