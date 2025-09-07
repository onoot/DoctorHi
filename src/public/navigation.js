// navigation.js

// Глобальные переменные для управления навигацией
let currentSection = null;
let isMobileMenuOpen = false;

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
 * Проверка, является ли устройство мобильным
 * @returns {boolean} - true, если устройство мобильное
 */
function isMobileDevice() {
    return window.innerWidth <= 992;
}

/**
 * Закрытие мобильного меню
 */
function closeMobileMenu() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle && sidebarToggle.checked) {
        sidebarToggle.checked = false;
        document.body.style.overflow = '';
    }
}

/**
 * Показ указанного раздела и скрытие остальных
 * @param {string} sectionId - ID раздела для отображения
 * @param {boolean} [updateHistory=true] - Нужно ли обновлять историю браузера
 */
function navigateToSection(sectionId, updateHistory = true) {
    console.log(`[NAVIGATION] Navigating to section: ${sectionId}`);
    
    // Проверяем, не пытаемся ли перейти к уже активному разделу
    if (currentSection === sectionId) {
        console.log(`[NAVIGATION] Section ${sectionId} is already active`);
        return;
    }
    
    // Скрыть все разделы
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Обновляем активную ссылку в меню
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkSection = link.getAttribute('data-section') || link.getAttribute('href')?.replace('#', '');
        if (linkSection === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Показываем выбранный раздел
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) {
        console.error(`[NAVIGATION] Section with id "${sectionId}" not found in DOM`);
        
        // Если раздел не найден, переключаемся на раздел транзакций
        const transactionsSection = document.getElementById('transactions');
        if (transactionsSection) {
            navigateToSection('transactions', updateHistory);
        } else {
            console.error('[NAVIGATION] Transactions section not found either');
        }
        return;
    }
    
    // Показываем раздел
    targetSection.style.display = 'block';
    targetSection.classList.add('active');
    currentSection = sectionId;
    
    // Закрываем мобильное меню после выбора раздела
    if (isMobileDevice()) {
        closeMobileMenu();
    }
    
    // Обновляем историю браузера
    if (updateHistory) {
        const url = new URL(window.location.href);
        url.searchParams.set('section', sectionId);
        window.history.pushState({ section: sectionId }, '', url);
    }
    
    // Загружаем данные для раздела
    loadSectionData(sectionId);
}

/**
 * Загрузка данных для активного раздела
 * @param {string} sectionId - ID раздела
 */
function loadSectionData(sectionId) {
    console.log(`[NAVIGATION] Loading data for section: ${sectionId}`);
    
    switch (sectionId) {
        case 'users':
            console.log('[NAVIGATION] Loading active users');
            loadUsers('active');
            break;
        case 'users-archive':
            console.log('[NAVIGATION] Loading archived users');
            loadUsers('archived');
            break;
        case 'transactions':
            console.log('[NAVIGATION] Loading transactions');
            loadTransactions();
            break;
        default:
            console.log(`[NAVIGATION] No data loader for section: ${sectionId}`);
    }
}

/**
 * Обработка события popstate (назад/вперед в браузере)
 */
function handlePopState() {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section') || 'transactions';
    navigateToSection(section, false);
}

/**
 * Инициализация навигации
 */
function initNavigation() {
    console.log('[NAVIGATION] Initializing navigation');
    
    // Инициализация обработчиков для категорий
    initCategoryHandlers();
    
    // Навигация между секциями
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section') || this.getAttribute('href')?.replace('#', '');
            if (sectionId) {
                navigateToSection(sectionId);
            }
        });
    });
    
    // Обработка переходов по истории браузера
    window.addEventListener('popstate', handlePopState);
    
    // Определение начальной секции
    const urlParams = new URLSearchParams(window.location.search);
    const sectionFromUrl = urlParams.get('section');
    const initialSection = sectionFromUrl && document.getElementById(sectionFromUrl) ? 
                          sectionFromUrl : 'transactions';
    
    // Проверяем, есть ли активная секция
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
        currentSection = activeSection.id;
    }
    
    // Инициализация начальной секции
    navigateToSection(initialSection, false);
    
    console.log(`[NAVIGATION] Initial section set to: ${initialSection}`);
}

/**
 * Инициализация обработчиков для мобильной навигации
 */
function initMobileNavigation() {
    // Обработчик для закрытия мобильного меню при выборе раздела
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.addEventListener('click', function() {
            if (isMobileDevice()) {
                closeMobileMenu();
            }
        });
    });
    
    // Обработчик для изменения размера окна
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // При переходе с мобильного на десктопный режим, убедимся, что меню открыто
            if (!isMobileDevice()) {
                const sidebarToggle = document.getElementById('sidebar-toggle');
                if (sidebarToggle) {
                    sidebarToggle.checked = false;
                    document.body.style.overflow = '';
                }
            }
        }, 250);
    });
}

/**
 * Инициализация всех обработчиков навигации
 */
function initAllNavigationHandlers() {
    initNavigation();
    initMobileNavigation();
    
    // Добавляем обработчик для кнопки "Home" или логотипа
    const logoLink = document.querySelector('.logo a');
    if (logoLink) {
        logoLink.addEventListener('click', function(e) {
            e.preventDefault();
            navigateToSection('transactions');
        });
    }
    
    console.log('[NAVIGATION] All navigation handlers initialized');
}

// Прикрепляем функции к глобальному объекту
window.navigateToSection = navigateToSection;
window.initNavigation = initNavigation;
window.initAllNavigationHandlers = initAllNavigationHandlers;

// Автоматическая инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли элементы навигации
    if (document.querySelector('.nav-link') || document.querySelector('.sidebar')) {
        initAllNavigationHandlers();
    }
    
    // Добавляем обработчик для кнопки "New Transaction"
    const createTransactionBtn = document.getElementById('create');
    if (createTransactionBtn && typeof openCreateTransactionModal === 'function') {
        createTransactionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openCreateTransactionModal();
        });
    }
});