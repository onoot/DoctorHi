// api-utils.js
// Этот файл ДОЛЖЕН быть загружен ПЕРВЫМ!

// Глобальные конфигурационные переменные
const API_BASE_URL = `https://${window?.location?.host}/api`;
let currentPage = 1;
let itemsPerPage = 10;

// Функция универсального API запроса
async function apiRequest(url, options = {}) {
    console.log(`[API] Making request to: ${API_BASE_URL}${url}`);
    
    const requestOptions = {
        method: options.method || 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        credentials: 'include',
        ...options
    };
    
    try {
        const response = await fetch(API_BASE_URL + url, requestOptions);
        console.log(`[API] Response status: ${response.status}`);
        
        let data = null;
        
        // Проверяем, содержит ли ответ данные
        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');
        
        if (response.status !== 204 && contentLength !== '0' && 
            (contentType?.includes('application/json') || contentType?.includes('text'))) {
            try {
                // Клонируем ответ для возможности многократного чтения
                const responseClone = response.clone();
                data = await response.json();
            } catch (jsonError) {
                try {
                    // Используем клонированный ответ для чтения текста
                    const responseClone = response.clone();
                    const text = await responseClone.text();
                    console.log('[API] Response text:', text);
                    
                    // Пытаемся распарсить как JSON, если это возможно
                    try {
                        data = JSON.parse(text);
                    } catch {
                        data = { message: text || 'Unknown error' };
                    }
                } catch (textError) {
                    console.error('[API] Failed to read response text:', textError);
                    data = { message: 'Unknown error' };
                }
            }
        } else {
            // Для ответов без тела
            data = { success: response.ok };
        }
        
        console.log('[API] Response data:', data);
        
        if (!response.ok) {
            console.log('[API] Request failed:', data);
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('[API] Request failed:', error);
        throw error;
    }
}

/**
 * Функция для отображения уведомлений
 * @param {string} type - Тип уведомления (error, warning, info, success)
 * @param {string} message - Текст уведомления
 * @param {number} [duration=5000] - Время отображения в миллисекундах
 */
function showNotification(type, message, duration = 5000) {
    // Проверяем, существует ли контейнер для уведомлений
    let notificationContainer = document.getElementById('notification-container');
    
    // Если контейнер не существует, создаем его
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        notificationContainer.style.display = 'flex';
        notificationContainer.style.flexDirection = 'column';
        notificationContainer.style.gap = '10px';
        notificationContainer.style.maxWidth = '400px';
        document.body.appendChild(notificationContainer);
    }
    
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Стили по умолчанию
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = 'var(--rounded-lg)';
    notification.style.boxShadow = 'var(--shadow-md)';
    notification.style.color = 'white';
    notification.style.fontFamily = 'var(--font-sans)';
    notification.style.fontSize = 'var(--font-size-sm)';
    notification.style.lineHeight = '1.5';
    notification.style.cursor = 'pointer';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    notification.style.transition = 'all 0.3s ease';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '10px';
    
    // Добавляем иконку в зависимости от типа
    let icon = '';
    switch (type) {
        case 'error':
            icon = '<i class="fas fa-exclamation-circle" style="font-size: 1.2em;"></i>';
            notification.style.background = 'var(--danger)';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle" style="font-size: 1.2em;"></i>';
            notification.style.background = 'var(--warning)';
            break;
        case 'info':
            icon = '<i class="fas fa-info-circle" style="font-size: 1.2em;"></i>';
            notification.style.background = 'var(--info)';
            break;
        case 'success':
            icon = '<i class="fas fa-check-circle" style="font-size: 1.2em;"></i>';
            notification.style.background = 'var(--success)';
            break;
        default:
            icon = '<i class="fas fa-bell" style="font-size: 1.2em;"></i>';
            notification.style.background = 'var(--primary)';
    }
    
    // Добавляем содержимое уведомления
    notification.innerHTML = `
        ${icon}
        <span>${message}</span>
        <button class="notification-close" style="margin-left: auto; background: none; border: none; color: white; font-size: 1.2em; cursor: pointer; opacity: 0.7; transition: opacity 0.2s;">
            &times;
        </button>
    `;
    
    // Добавляем уведомление в контейнер
    notificationContainer.appendChild(notification);
    
    // Принудительная перерисовка для анимации
    void notification.offsetWidth;
    
    // Анимация появления
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
    
    // Функция закрытия уведомления
    const closeNotification = () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            notificationContainer.removeChild(notification);
            if (notificationContainer.children.length === 0) {
                document.body.removeChild(notificationContainer);
            }
        }, 300);
    };
    
    // Обработчик закрытия по клику на крестик
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeNotification();
        });
    }
    
    // Обработчик закрытия по клику на уведомление
    notification.addEventListener('click', () => {
        closeNotification();
    });
    
    // Автоматическое закрытие через указанное время
    setTimeout(() => {
        closeNotification();
    }, duration);
}

// Функция для форматирования PKR
function formatPKR(amount) {
    try {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch (e) {
        console.error('Error formatting PKR:', e);
        return amount.toFixed(2);
    }
}

// Функция парсинга числа
function parseNumber(value) {
    if (!value) return 0;
    
    // Удаляем все символы, кроме цифр и десятичного разделителя
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Парсим как число
    return parseFloat(cleanValue) || 0;
}

// Функция для обновления оставшейся суммы
function updateRemainingAmount() {
    const totalAmountText = document.getElementById('totalAmountView')?.textContent?.replace(/,/g, '') || '0';
    const paidAmountText = document.getElementById('paidAmount')?.textContent?.replace(/,/g, '') || '0';
    
    const totalAmount = parseFloat(totalAmountText) || 0;
    const paidAmount = parseFloat(paidAmountText) || 0;
    const remainingAmount = totalAmount - paidAmount;
    
    // Форматируем оставшуюся сумму с разделителями тысяч
    const formattedRemaining = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(remainingAmount);
    
    const remainingAmountEl = document.getElementById('remainingAmount');
    if (remainingAmountEl) {
        remainingAmountEl.textContent = formattedRemaining;
    }
}

// Автоматическая инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('[NOTIFICATIONS] Notification system initialized');
    
    showNotification('info', 'Notification system is ready', 3000);
});

// Прикрепляем функции к глобальному объекту
window.API_BASE_URL = API_BASE_URL;
window.currentPage = currentPage;
window.itemsPerPage = itemsPerPage;
window.apiRequest = apiRequest;
window.showNotification = showNotification;
window.formatPKR = formatPKR;
window.parseNumber = parseNumber;
window.updateRemainingAmount = updateRemainingAmount;
window.showNotification = showNotification;

console.log('[API UTILS] Initialized successfully');