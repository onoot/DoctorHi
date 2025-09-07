// main.js
// Основной файл инициализации приложения

/**
 * Функция для задержки выполнения (debounce)
 * @param {Function} func - Функция для выполнения
 * @param {number} delay - Задержка в миллисекундах
 * @returns {Function} - Дебаунс-функция
 */
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * Функция выхода
 */
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

/**
 * Функция загрузки текущего раздела
 */
function loadCurrentSection() {
    const activeSection = document.querySelector('.section.active');
    if (!activeSection) return;
    
    switch (activeSection.id) {
        case 'transactions':
            if (typeof loadTransactions === 'function') {
                loadTransactions();
            }
            break;
        case 'users':
            if (typeof loadUsers === 'function') {
                loadUsers('active');
            }
            break;
        case 'users-archive':
            if (typeof loadUsers === 'function') {
                loadUsers('archived');
            }
            break;
    }
}

/**
 * Инициализация всего приложения
 */
function initApp() {
    console.log('[APP] Initializing application...');
    
    // Инициализация базовых функций
    if (typeof initModalCloseHandlers === 'function') {
        initModalCloseHandlers();
    }
    
    // Инициализация навигации
    if (typeof initNavigation === 'function') {
        initNavigation();
    }
    
    // Инициализация модальных окон пользователей
    if (typeof initUserModalHandlers === 'function') {
        initUserModalHandlers();
    }
    
    // Инициализация управления пользователями
    if (typeof initUserManagementHandlers === 'function') {
        initUserManagementHandlers();
    }
    
    // Инициализация управления транзакциями
    if (typeof initTransactionHandlers === 'function') {
        initTransactionHandlers();
    }
    
    // Инициализация загрузки файлов
    if (typeof initFileUploadHandlers === 'function') {
        initFileUploadHandlers();
    }
    
    // Инициализация обработчиков поиска
    initSearchHandlers();
    
    // Инициализация обработчиков аутентификации
    initAuthHandlers();
    
    // Инициализация конвертера валют
    if (typeof attachCurrencyConverter === 'function') {
        attachCurrencyConverter();
    }
    
    // Инициализация обработчиков ввода сумм
    if (typeof initAmountInputHandlers === 'function') {
        initAmountInputHandlers();
    }
    
    // Инициализация обработчиков модальных окон
    if (typeof initModalHandlers === 'function') {
        initModalHandlers();
    }
    
    console.log('[APP] Application initialized successfully');
}

/**
 * Инициализация обработчиков поиска
 */
function initSearchHandlers() {
    // Обработчик для поиска пользователей
    const usersSearch = document.querySelector('#users .search-input');
    if (usersSearch) {
        usersSearch.addEventListener('input', debounce(function() {
            window.currentPage = 1;
            const activeSection = document.querySelector('.section.active')?.id;
            if (activeSection === 'users' && typeof loadUsers === 'function') {
                loadUsers('active');
            } else if (activeSection === 'users-archive' && typeof loadUsers === 'function') {
                loadUsers('archived');
            }
        }, 300));
    }
    
    // Обработчик для поиска транзакций
    const transactionsSearch = document.querySelector('#transactions .search-input');
    if (transactionsSearch) {
        transactionsSearch.addEventListener('input', debounce(function() {
            window.currentPage = 1;
            if (document.querySelector('.section.active')?.id === 'transactions' && 
                typeof loadTransactions === 'function') {
                loadTransactions();
            }
        }, 300));
    }
}

/**
 * Инициализация обработчиков аутентификации
 */
function initAuthHandlers() {
    // Обработчик кнопки выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Запуск приложения после полной загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('[APP] DOM content loaded, initializing app');
    initApp();
    
    // Закрытие модального окна при клике вне его содержимого
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            const modalId = event.target.id;
            if (modalId && typeof closeModal === 'function') {
                closeModal(modalId);
            }
        }
    });
    
    // Инициализация кнопки создания транзакции (если она существует)
    const createTransactionBtn = document.getElementById('create');
    if (createTransactionBtn && typeof openCreateTransactionModal === 'function') {
        createTransactionBtn.addEventListener('click', openCreateTransactionModal);
        console.log('[APP] Create transaction button handler attached');
    }
    
    // Проверка наличия функции открытия просмотра транзакции
    if (typeof openViewTransactionModal === 'function') {
        window.openViewTransactionModal = openViewTransactionModal;
    }
    
    // Проверка наличия функции открытия редактирования платежа
    if (typeof openEditPaymentModal === 'function') {
        window.openEditPaymentModal = openEditPaymentModal;
    }
    
    // Проверка наличия функции открытия добавления платежа
    if (typeof openAddPaymentModal === 'function') {
        window.openAddPaymentModal = openAddPaymentModal;
    }
});

// Прикрепляем необходимые функции к глобальному объекту
window.debounce = debounce;
window.logout = logout;
window.loadCurrentSection = loadCurrentSection;
window.initApp = initApp;
window.initSearchHandlers = initSearchHandlers;
window.initAuthHandlers = initAuthHandlers;