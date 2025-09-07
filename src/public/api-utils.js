// api-utils.js
// Этот файл ДОЛЖЕН быть загружен ПЕРВЫМ!

// Глобальные конфигурационные переменные
const API_BASE_URL = `https://${window?.location?.host}/api`;
let currentPage = 1;
let itemsPerPage = 10;


if (typeof API_BASE_URL === 'undefined') {
    const protocol = window.location.protocol;
    const host = window.location.host;
    window.API_BASE_URL = `${protocol}//${host}/api`;
}

if (typeof currentPage === 'undefined') {
    currentPage = 1;
}

if (typeof itemsPerPage === 'undefined') {
    itemsPerPage = 10;
}

// Флаг для предотвращения множественных перенаправлений
let isRedirecting = false;

// Проверяем, не находимся ли мы уже на странице входа
const isLoginPage = window.location.pathname.endsWith('/login.html') || 
                   window.location.pathname.endsWith('/login') ||
                   window.location.pathname.includes('login');

// Функция универсального API запроса
async function apiRequest(url, options = {}) {
    // Проверяем, не находимся ли мы на странице входа
    if (isLoginPage) {
        console.log('[API] Skipping API request on login page');
        return;
    }
    
    console.log(`[API] Making request to: ${window.API_BASE_URL}${url}`);
    
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
        const response = await fetch(window.API_BASE_URL + url, requestOptions);
        console.log(`[API] Response status: ${response.status}`);
        
        let data = null;
        
        // Проверяем, содержит ли ответ данные
        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');
        
        // Обработка ошибки 401 Unauthorized
        if (response.status === 401) {
            console.log('[API] Unauthorized access - 401 status received');
            
            // Предотвращаем множественные перенаправления
            if (!isRedirecting) {
                isRedirecting = true;
                
                // Удаляем токены доступа
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                
                // Удаляем куки
                document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                document.cookie = "_csrf=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                
                // Показываем уведомление
                if (typeof window.showNotification === 'function') {
                    window.showNotification('error', 'Your session has expired. Please log in again.');
                }
                
                // Перенаправляем на страницу входа
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
                
                // Прерываем дальнейшую обработку
                throw new Error('Session expired. Redirecting to login page...');
            }
        }
        
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
            
            // Обработка других ошибок
            throw new Error(data.message || `API request failed with status ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('[API] Request failed:', error);
        
        // Проверяем, не была ли уже выполнена перенаправление из-за 401
        if (error.message !== 'Session expired. Redirecting to login page...') {
            // Проверяем, не является ли ошибка сетевой проблемой
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                if (typeof window.showNotification === 'function') {
                    window.showNotification('error', 'Network error. Please check your connection.', 5000);
                }
            } else {
                if (typeof window.showNotification === 'function') {
                    window.showNotification('error', error.message || 'An unexpected error occurred', 5000);
                }
            }
        }
        
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

// Функция проверки аутентификации
function checkAuth() {
    // Проверяем, не находимся ли мы уже на странице входа
    if (isLoginPage) {
        return;
    }
    
    // Проверяем наличие токена в куках
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
    
    const authToken = getCookie('auth_token');
    const csrfToken = getCookie('_csrf');
    
    // Если токенов нет и мы не на странице входа, перенаправляем
    if (!authToken || !csrfToken) {
        console.log('[AUTH] No authentication tokens found, redirecting to login');
        if (!isRedirecting) {
            isRedirecting = true;
            window.location.href = '/login.html';
        }
    }
}

// Проверка аутентификации при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('[NOTIFICATIONS] Notification system initialized');
    
    // Проверяем аутентификацию
    checkAuth();
    
    // Добавляем обработчик для проверки сессии при переходе между страницами
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && link.href !== window.location.href) {
            checkAuth();
        }
    });
    
    // Проверяем, не нужно ли перенаправить на страницу входа
    if (typeof window.showNotification === 'function' && window.location.pathname !== '/login.html') {
        const authToken = document.cookie.includes('auth_token');
        const csrfToken = document.cookie.includes('_csrf');
        
        if (!authToken || !csrfToken) {
            console.log('[AUTH] Tokens missing, redirecting to login');
            if (!isRedirecting) {
                isRedirecting = true;
                window.location.href = '/login.html';
            }
        }
    }
});

console.log('[API UTILS] Initialized successfully');

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

// Прикрепляем функции к глобальному объекту
window.API_BASE_URL = API_BASE_URL;
window.currentPage = currentPage;
window.itemsPerPage = itemsPerPage;
window.apiRequest = apiRequest;
window.showNotification = showNotification;
window.updateRemainingAmount = updateRemainingAmount;
window.showNotification = showNotification;