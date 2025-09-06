// init-handlers.js
// Инициализация всех обработчиков

import { initModalHandlers } from './modal-handlers.js';
import { initUserModalHandlers } from './user-modal-handlers.js';
import { initUserManagementHandlers } from './user-management-handlers.js';
import { initTransactionHandlers } from './transaction-handlers.js';
import { initFileHandlers } from './file-handlers.js';
import { initPaymentHandlers } from './payment-handlers.js';
import { initUploadHandlers } from './upload-handlers.js';
import { initTransferRequestHandlers } from './transfer-requests.js';
import { initSearchHandlers } from './search-handlers.js';
import { initAuthHandlers } from './auth-handlers.js';
import { initCurrencyConverter } from './currency-converter.js';
import { initPaymentScheduleHandlers } from './payment-schedule.js';
import { initActionHandlers } from './action-handlers.js';

/**
 * Инициализация всех обработчиков приложения
 */
function initAllHandlers() {
    // Инициализация базовых функций
    initModalHandlers();
    
    // Инициализация модальных окон пользователей
    initUserModalHandlers();
    
    // Инициализация управления пользователями
    initUserManagementHandlers();
    
    // Инициализация управления транзакциями
    initTransactionHandlers();
    
    // Инициализация обработчиков файлов
    initFileHandlers();
    
    // Инициализация обработчиков платежей
    initPaymentHandlers();
    
    // Инициализация загрузки файлов
    initUploadHandlers();
    
    // Инициализация запросов передачи
    initTransferRequestHandlers();
    
    // Инициализация обработчиков поиска
    initSearchHandlers();
    
    // Инициализация обработчиков аутентификации
    initAuthHandlers();
    
    // Инициализация конвертера валют
    initCurrencyConverter();
    
    // Инициализация графика платежей
    initPaymentScheduleHandlers();
    
    // Инициализация обработчиков действий
    initActionHandlers();
    
    console.log('[HANDLERS] All handlers initialized successfully');
}

/**
 * Инициализация приложения после полной загрузки DOM
 */
function initApp() {
    console.log('[APP] Initializing application...');
    
    // Инициализация навигации
    initNavigation();
    
    // Инициализация всех обработчиков
    initAllHandlers();
    
    // Инициализация начальной секции
    const initialSection = 'transactions';
    console.log(`[NAVIGATION] Setting initial section: ${initialSection}`);
    navigateToSection(initialSection);
    
    console.log('[APP] Application initialized successfully');
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

// Экспортируем функции
export { initAllHandlers, initApp };