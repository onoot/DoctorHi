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

/**
 * Обработчик формы добавления платежа
 */
document.getElementById('addPaymentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const transactionId = document.getElementById('paymentTransactionId').value;
    const amount = parseNumber(document.getElementById('paymentAmount').value);
    const method = document.getElementById('paymentMethod').value;
    const status = document.getElementById('paymentStatus').value;
    const notes = document.getElementById('paymentNotes').value;
    const receiptFile = document.getElementById('receiptFile').files[0];
    
    if (amount <= 0) {
        showNotification('error', 'Amount must be greater than 0');
        return;
    }
    
    try {
        // Создаем объект платежа
        const paymentData = {
            amount,
            method,
            status,
            notes
        };
        
        // Сначала создаем платеж
        const paymentResponse = await apiRequest(`/v1/admin/transactions/${transactionId}/payments`, {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
        
        if (paymentResponse.success && paymentResponse.payment) {
            // Если есть файл чека, загружаем его
            if (receiptFile) {
                const formData = new FormData();
                formData.append('file', receiptFile);
                formData.append('category', 'receipt');
                
                // Загружаем чек как документ транзакции
                await fetch(`${API_BASE_URL}/v1/admin/transactions/${transactionId}/documents`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });
            }
            
            showNotification('success', 'Payment added successfully');
            closeModal('addPaymentModal');
            await loadTransactionPayments(transactionId);
        }
    } catch (error) {
        console.error('Error adding payment:', error);
        showNotification('error', error.message || 'Error adding payment');
    }
});