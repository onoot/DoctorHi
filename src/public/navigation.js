// navigation.js

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
 * Показ указанного раздела и скрытие остальных
 * @param {string} sectionId - ID раздела для отображения
 */
function showSection(sectionId) {
    // Скрыть все разделы
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });

    // Скрыть все ссылки навигации
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Показать выбранный раздел
    const sectionElement = document.getElementById(sectionId);
    if (!sectionElement) {
        console.error(`Section with id "${sectionId}" not found in DOM`);

        // Если раздел не найден, переключаемся на раздел транзакций
        const transactionsSection = document.getElementById('transactions');
        if (transactionsSection) {
            transactionsSection.style.display = 'block';
            transactionsSection.classList.add('active');

            // Активируем соответствующую ссылку навигации
            const navLink = document.querySelector('[href="#transactions"]');
            if (navLink) {
                navLink.classList.add('active');
            }

            // Загружаем данные для раздела транзакций
            loadTransactions();

            return;
        } else {
            console.error('Transactions section not found either');
            return;
        }
    }

    // Элемент найден, показываем его
    sectionElement.style.display = 'block';
    sectionElement.classList.add('active');

    // Активируем соответствующую ссылку навигации
    const navLink = document.querySelector(`[href="#${sectionId}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }

    // Загрузить данные для активного раздела
    if (sectionId === 'users') {
        console.log('Loading users for active users section');
        loadUsers('active');
    } else if (sectionId === 'users-archive') {
        console.log('Loading archived users');
        loadUsers('archived');
    } else if (sectionId === 'transactions') {
        console.log('Loading transactions for transactions section');
        loadTransactions();
    }
}

/**
 * Переключение на указанную секцию
 * @param {string} sectionId - ID секции для отображения
 */
function navigateToSection(sectionId) {
    console.log(`[NAVIGATION] Navigating to section: ${sectionId}`);
    
    // Сначала скрываем все секции
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Показываем выбранную секцию
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
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

// Прикрепляем функции к глобальному объекту
window.navigateToSection = navigateToSection;
window.initNavigation = initNavigation;

// Автоматическая инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.nav-link')) {
        initNavigation();
    }
});