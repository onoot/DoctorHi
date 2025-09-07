// search-handlers.js
// Обработчики для поиска

// Проверяем наличие функции debounce в глобальном объекте
if (typeof debounce !== 'function') {
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
    
    // Прикрепляем к глобальному объекту
    window.debounce = debounce;
}

/**
 * Инициализация обработчиков поиска
 */
function initSearchHandlers() {
    console.log('[SEARCH] Initializing search handlers');
    
    // Проверяем, существует ли функция loadUsers
    const usersLoaded = typeof loadUsers === 'function';
    const transactionsLoaded = typeof loadTransactions === 'function';
    
    if (!usersLoaded && !transactionsLoaded) {
        console.warn('[SEARCH] No data loading functions available for search');
        return;
    }
    
    // Обработчик для поиска пользователей
    const usersSearch = document.querySelector('#users .search-input');
    if (usersSearch && usersLoaded) {
        usersSearch.addEventListener('input', debounce(function() {
            // Используем глобальную переменную, если доступна
            if (typeof window.currentPage !== 'undefined') {
                window.currentPage = 1;
            }
            
            const activeSection = document.querySelector('.section.active')?.id;
            if (activeSection === 'users') {
                loadUsers('active');
            } else if (activeSection === 'users-archive') {
                loadUsers('archived');
            }
        }, 300));
        
        console.log('[SEARCH] User search handler initialized');
    }
    
    // Обработчик для поиска транзакций
    const transactionsSearch = document.querySelector('#transactions .search-input');
    if (transactionsSearch && transactionsLoaded) {
        transactionsSearch.addEventListener('input', debounce(function() {
            // Используем глобальную переменную, если доступна
            if (typeof window.currentPage !== 'undefined') {
                window.currentPage = 1;
            }
            
            if (document.querySelector('.section.active')?.id === 'transactions') {
                loadTransactions();
            }
        }, 300));
        
        console.log('[SEARCH] Transactions search handler initialized');
    }
    
    // Обработчик для общих полей поиска
    document.querySelectorAll('.search-input').forEach(input => {
        if ((input === usersSearch || input === transactionsSearch) && (usersLoaded || transactionsLoaded)) {
            return; // Уже обработано выше
        }
        
        input.addEventListener('input', debounce(function() {
            // Используем глобальную переменную, если доступна
            if (typeof window.currentPage !== 'undefined') {
                window.currentPage = 1;
            }
            
            const section = this.closest('.section')?.id;
            if (section && usersLoaded && (section === 'users' || section === 'users-archive')) {
                loadUsers(section === 'users' ? 'active' : 'archived');
            } else if (section && transactionsLoaded && section === 'transactions') {
                loadTransactions();
            }
        }, 300));
        
        console.log(`[SEARCH] General search handler initialized for ${input.closest('.section')?.id || 'unknown section'}`);
    });
    
    // Обработчик для кнопки сброса поиска
    document.querySelectorAll('.search-clear').forEach(button => {
        button.addEventListener('click', function() {
            const searchInput = this.previousElementSibling;
            if (searchInput && searchInput.classList.contains('search-input')) {
                searchInput.value = '';
                const event = new Event('input', { bubbles: true });
                searchInput.dispatchEvent(event);
            }
        });
    });
    
    // Добавляем иконку сброса к полям поиска
    document.querySelectorAll('.search-input').forEach(input => {
        if (!input.nextElementSibling || !input.nextElementSibling.classList.contains('search-clear')) {
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'search-clear action-btn';
            clearBtn.innerHTML = '<i class="fas fa-times"></i>';
            clearBtn.title = 'Clear search';
            input.parentNode.insertBefore(clearBtn, input.nextSibling);
        }
    });
    
    console.log('[SEARCH] Search handlers initialized successfully');
}

/**
 * Настройка поиска по различным разделам
 */
function setupSearch() {
    console.log('[SEARCH] Setting up search functionality');
    
    // Проверяем, загружены ли необходимые функции
    if (typeof loadUsers !== 'function' && typeof loadTransactions !== 'function') {
        console.warn('[SEARCH] No data loading functions available for search');
        return;
    }
    
    // Добавляем обработчики ко всем полям поиска
    document.querySelectorAll('.search-input').forEach(input => {
        input.addEventListener('input', debounce(function() {
            // Используем глобальную переменную, если доступна
            if (typeof window.currentPage !== 'undefined') {
                window.currentPage = 1;
            }
            
            const section = this.closest('.section')?.id;
            if (!section) {
                console.warn('[SEARCH] Could not determine section for search input', this);
                return;
            }
            
            if (typeof loadUsers === 'function' && (section === 'users' || section === 'users-archive')) {
                loadUsers(section === 'users' ? 'active' : 'archived');
            } else if (typeof loadTransactions === 'function' && section === 'transactions') {
                loadTransactions();
            }
        }, 300));
        
        console.log(`[SEARCH] Search handler set up for section: ${input.closest('.section')?.id || 'unknown'}`);
    });
    
    // Инициализируем кнопки сброса
    initSearchClearButtons();
}

/**
 * Инициализация кнопок сброса поиска
 */
function initSearchClearButtons() {
    document.querySelectorAll('.search-input').forEach(input => {
        // Проверяем, есть ли уже кнопка сброса
        if (input.nextElementSibling && input.nextElementSibling.classList.contains('search-clear')) {
            return;
        }
        
        // Создаем кнопку сброса
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'search-clear action-btn';
        clearBtn.innerHTML = '<i class="fas fa-times"></i>';
        clearBtn.title = 'Clear search';
        
        // Добавляем обработчик
        clearBtn.addEventListener('click', function() {
            const searchInput = this.previousElementSibling;
            if (searchInput && searchInput.classList.contains('search-input')) {
                searchInput.value = '';
                const event = new Event('input', { bubbles: true });
                searchInput.dispatchEvent(event);
                searchInput.focus();
            }
        });
        
        // Вставляем кнопку после поля ввода
        input.parentNode.insertBefore(clearBtn, input.nextSibling);
    });
}

/**
 * Инициализация поиска с проверкой контекста
 */
function initContextualSearch() {
    // Проверяем, находимся ли мы на странице с разделами
    const sections = document.querySelectorAll('.section');
    if (sections.length === 0) {
        console.log('[SEARCH] No sections found, skipping search initialization');
        return;
    }
    
    // Проверяем, доступны ли функции загрузки данных
    const hasUserFunctions = typeof loadUsers === 'function';
    const hasTransactionFunctions = typeof loadTransactions === 'function';
    
    if (!hasUserFunctions && !hasTransactionFunctions) {
        console.warn('[SEARCH] No data loading functions available for search');
        return;
    }
    
    // Инициализируем обработчики поиска
    initSearchHandlers();
    
    // Добавляем обработчик для переключения разделов
    document.addEventListener('click', function(e) {
        const navLink = e.target.closest('.nav-link');
        if (navLink) {
            const sectionId = navLink.getAttribute('data-section') || navLink.getAttribute('href')?.replace('#', '');
            if (sectionId) {
                // Очищаем поле поиска при переключении разделов
                const currentSearch = document.querySelector(`#${sectionId} .search-input`);
                if (currentSearch) {
                    currentSearch.value = '';
                }
            }
        }
    });
    
    console.log('[SEARCH] Contextual search initialized');
}

// Прикрепляем функции к глобальному объекту
window.initSearchHandlers = initSearchHandlers;
window.setupSearch = setupSearch;
window.initSearchClearButtons = initSearchClearButtons;
window.initContextualSearch = initContextualSearch;

// Автоматическая инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем наличие полей поиска перед инициализацией
    if (document.querySelectorAll('.search-input').length > 0) {
        initContextualSearch();
        console.log('[SEARCH] DOM loaded, search handlers ready');
    } else {
        console.log('[SEARCH] No search inputs found, skipping initialization');
    }
});