// search-handlers.js
// Обработчики для поиска

/**
 * Инициализация обработчиков поиска
 */
function initSearchHandlers() {
    // Обработчик для поиска пользователей
    document.querySelector('#users .search-input')?.addEventListener('input', debounce(function() {
        currentPage = 1;
        const activeSection = document.querySelector('.section.active')?.id;
        if (activeSection === 'users') {
            loadUsers('active');
        } else if (activeSection === 'users-archive') {
            loadUsers('archived');
        }
    }, 300));
    
    // Обработчик для поиска транзакций
    document.querySelector('#transactions .search-input')?.addEventListener('input', debounce(function() {
        currentPage = 1;
        if (document.querySelector('.section.active')?.id === 'transactions') {
            loadTransactions();
        }
    }, 300));
}

/**
 * Настройка поиска по различным разделам
 */
function setupSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce(function() {
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

/**
 * Инициализация обработчиков поиска
 */
function initSearchHandlers() {
    setupSearch();
    
    // Дополнительные обработчики поиска
    document.querySelector('#users .search-input')?.addEventListener('input', debounce(function() {
        currentPage = 1;
        const activeSection = document.querySelector('.section.active')?.id;
        if (activeSection === 'users') {
            loadUsers('active');
        } else if (activeSection === 'users-archive') {
            loadUsers('archived');
        }
    }, 300));
    
    // Обработчик для поиска транзакций
    document.querySelector('#transactions .search-input')?.addEventListener('input', debounce(function() {
        currentPage = 1;
        if (document.querySelector('.section.active')?.id === 'transactions') {
            loadTransactions();
        }
    }, 300));
}