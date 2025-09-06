// main.js
// Основной файл инициализации приложения

// Импортируем конфигурацию
import { API_BASE_URL, currentPage, itemsPerPage } from './config.js';
// Импортируем утилиты
import { formatPKR, parseNumber, updateUSD, updateRemainingAmount, formatUSD } from './utils.js';
// Импортируем функции управления транзакциями
import { initAmountInputHandlers, updateTransactionAmount, openImagePreview } from './transaction-management.js';

/**
 * Универсальная функция для API запросов
 * @param {string} url - URL запроса
 * @param {Object} options - Опции запроса
 * @returns {Promise} - Результат запроса
 */
async function apiRequest(url, options = {}) {
    const requestOptions = {
        method: options.method || 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers
        },
        credentials: 'include',
        ...options
    };
    
    try {
        const response = await fetch(API_BASE_URL + url, requestOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
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
            loadTransactions();
            break;
        case 'users':
            loadUsers('active');
            break;
        case 'users-archive':
            loadUsers('archived');
            break;
    }
}

/**
 * Инициализация всего приложения
 */
function initApp() {
    console.log('[APP] Initializing application...');
    
    // Инициализация базовых функций
    initModalCloseHandlers();
    
    // Инициализация навигации
    initNavigation();
    
    // Инициализация модальных окон пользователей
    initUserModalHandlers();
    
    // Инициализация управления пользователями
    initUserManagementHandlers();
    
    // Инициализация управления транзакциями
    initTransactionHandlers();
    
    // Инициализация загрузки файлов
    initFileUploadHandlers();
    
    // Инициализация обработчиков поиска
    initSearchHandlers();
    
    // Инициализация обработчиков аутентификации
    initAuthHandlers();
    
    // Инициализация конвертера валют
    attachCurrencyConverter();
    
    // Инициализация обработчиков ввода сумм
    initAmountInputHandlers();
    
    console.log('[APP] Application initialized successfully');
}

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
 * Инициализация обработчиков аутентификации
 */
function initAuthHandlers() {
    // Обработчик кнопки выхода
    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
}

// Запуск приложения после полной загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('[APP] DOM content loaded, initializing app');
    initApp();
    
    // Закрытие модального окна при клике вне его содержимого
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
});