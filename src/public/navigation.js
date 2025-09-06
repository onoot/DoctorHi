// navigation.js
// Функции для навигации между секциями

/**
 * Переключение на указанную секцию
 * @param {string} sectionId - ID секции для отображения
 */
function navigateToSection(sectionId) {
    console.log(`[NAVIGATION] Navigating to section: ${sectionId}`);
    
    // Сначала скрываем все секции
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Показываем выбранную секцию
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        console.error(`[NAVIGATION] Section with id "${sectionId}" not found`);
        return;
    }
    
    // Обновляем активную ссылку в меню
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Загружаем данные для секции
    if (sectionId === 'users') {
        console.log('[NAVIGATION] Loading users for active users section');
        loadUsers('active');
    } else if (sectionId === 'users-archive') {
        console.log('[NAVIGATION] Loading archived users');
        loadUsers('archived');
    } else if (sectionId === 'transactions') {
        console.log('[NAVIGATION] Loading transactions for transactions section');
        loadTransactions();
    }
}

/**
 * Инициализация навигации
 */
function initNavigation() {
    console.log('[NAVIGATION] Initializing navigation');
    
    // Навигация между секциями
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            console.log(`[NAVIGATION] Navigation link clicked for section: ${sectionId}`);
            navigateToSection(sectionId);
        });
    });
    
    // Инициализация начальной секции
    const initialSection = 'transactions';
    console.log(`[NAVIGATION] Setting initial section: ${initialSection}`);
    navigateToSection(initialSection);
}
// выаы
// navigation.js
// Функции для навигации между секциями

/**
 * Переключение категорий объектов
 * @param {HTMLElement} header - Элемент заголовка категории
 */
function toggleCategory(header) {
    const category = header.parentElement;
    category.classList.toggle('active');
}

/**
 * Инициализация обработчиков для категорий
 */
function initCategoryHandlers() {
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', function() {
            toggleCategory(this);
        });
    });
}

/**
 * Инициализация навигации
 */
function initNavigation() {
    console.log('[NAVIGATION] Initializing navigation');
    
    // Навигация между секциями
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            console.log(`[NAVIGATION] Navigation link clicked for section: ${sectionId}`);
            navigateToSection(sectionId);
        });
    });
    
    // Инициализация категорий
    initCategoryHandlers();
    
    // Инициализация начальной секции
    const initialSection = 'transactions';
    console.log(`[NAVIGATION] Setting initial section: ${initialSection}`);
    navigateToSection(initialSection);
}