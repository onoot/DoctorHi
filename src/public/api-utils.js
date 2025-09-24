// api-utils.js
// Этот файл ДОЛЖЕН быть загружен ПЕРВЫМ!

// Глобальные конфигурационные переменные
if (typeof window.API_BASE_URL === 'undefined') {
    const protocol = window.location.protocol;
    const host = window.location.host;
    window.API_BASE_URL = `${protocol}//${host}/api`;
}

// Инициализируем переменные только если они еще не определены
if (typeof window.currentPage === 'undefined') {
    window.currentPage = 1;
}

if (typeof window.itemsPerPage === 'undefined') {
    window.itemsPerPage = 10;
}

// Флаг для предотвращения множественных перенаправлений
let isRedirecting = false;

// Проверяем, не находимся ли мы уже на странице входа
const isLoginPage = window.location.pathname.endsWith('/login.html') || 
                   window.location.pathname.endsWith('/login') ||
                   window.location.pathname.includes('login');

/**
 * Получает CSRF-токен из куки XSRF-TOKEN
 * @returns {string|null} - CSRF-токен или null
 */
function getCsrfToken() {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('XSRF-TOKEN=')) {
            return cookie.substring('XSRF-TOKEN='.length);
        }
    }
    return null;
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
    
    // 👇 КРИТИЧЕСКИЙ ШАГ: ДОБАВЛЯЕМ CSRF-ТОКЕН В ЗАГОЛОВКИ
    const csrfToken = getCsrfToken();
    if (csrfToken) {
        requestOptions.headers['X-XSRF-TOKEN'] = csrfToken;
        requestOptions.headers['X-CSRF-Token'] = csrfToken; // Для совместимости с разными фреймворками
    } else {
        console.warn('[API] CSRF token not found in cookies. Request may fail.');
    }
    
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
        
        // Читаем тело ответа только один раз
        if (response.status !== 204 && contentLength !== '0' && 
            (contentType?.includes('application/json') || contentType?.includes('text'))) {
            try {
                // Пытаемся прочитать как JSON
                data = await response.json();
            } catch (jsonError) {
                // Если JSON не удался, возвращаем ошибку без попытки чтения текста
                console.error('[API] Failed to parse response as JSON:', jsonError);
                data = { message: 'Failed to parse response', error: jsonError.message };
            }
        } else {
            // Для ответов без тела или с нулевой длиной
            data = { success: response.ok };
        }
        
        console.log('[API] Response ', data);
        
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
                // Не перенаправляем на логин при сетевых ошибках
                return { success: false, message: 'Network error' };
            } else {
                if (typeof window.showNotification === 'function') {
                    window.showNotification('error', error.message || 'An unexpected error occurred', 5000);
                }
            }
        }
        
        throw error;
    }
}

// Проверка авторизации
async function checkAuth() {
    try {
        // Используем правильный URL для проверки авторизации
        const authUrl = '/auth/admin/validate';
        const response = await fetch(`${window.API_BASE_URL}${authUrl}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('[AUTH] Auth check response status:', response.status);
        
        // Если статус 401, перенаправляем на логин
        if (response.status === 401) {
            console.log('[AUTH] Unauthorized access - redirecting to login');
            window.location.href = '/login.html';
            return false;
        }
        
        // Пытаемся прочитать ответ как JSON
        let data;
        try {
            data = await response.json();
        } catch (e) {
            // Если не удалось распарсить JSON, проверяем статус
            if (response.ok) {
                return true;
            } else {
                throw new Error('Failed to parse auth response');
            }
        }
        
        // Если ответ успешный и содержит valid: true
        if (data && data.valid === true) {
            return true;
        } else {
            // Если ответ не содержит valid: true, перенаправляем на логин
            console.log('[AUTH] Invalid auth response - redirecting to login');
            window.location.href = '/login.html';
            return false;
        }
    } catch (error) {
        console.error('[AUTH] Auth check error:', error);
        
        // При сетевых ошибках не перенаправляем на логин
        if (error.message && error.message.includes('Failed to fetch')) {
            console.log('[AUTH] Network error - not redirecting to login');
            return true; // Предполагаем, что пользователь авторизован, если это сетевая ошибка
        }
        
        // При других ошибках перенаправляем на логин
        console.log('[AUTH] Other error - redirecting to login');
        window.location.href = '/login.html';
        return false;
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Проверяем, не находимся ли мы на странице входа
        if (isLoginPage) {
            console.log('[APP] On login page, skipping initialization');
            return;
        }
        
        // Проверяем авторизацию
        const isAuthenticated = await checkAuth();
        
        if (isAuthenticated) {
            // Инициализируем приложение только если авторизация успешна
            initApp();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        // Не перенаправляем на логин при сетевых ошибках
        if (!error.message || !error.message.includes('Failed to fetch')) {
            window.location.href = '/login.html';
        }
    }
});

function initApp() {
    // Инициализация всех компонентов приложения
    if (typeof initModalHandlers === 'function') {
        initModalHandlers();
    }
    
    if (typeof initNavigation === 'function') {
        initNavigation();
    }
    
    if (typeof initSearchHandlers === 'function') {
        initSearchHandlers();
    }
    
    // Загрузка данных только после полной инициализации
    setTimeout(() => {
        const activeSection = document.querySelector('.section.active')?.id;
        if (activeSection === 'transactions') {
            if (typeof loadTransactions === 'function') {
                loadTransactions();
            }
        } else if (activeSection === 'users') {
            if (typeof loadUsers === 'function') {
                loadUsers('active');
            }
        } else if (activeSection === 'users-archive') {
            if (typeof loadUsers === 'function') {
                loadUsers('archived');
            }
        }
    }, 100);
    
    console.log('[APP] Application initialized successfully');
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
window.showNotification = showNotification;
window.apiRequest = apiRequest;
window.updateRemainingAmount = updateRemainingAmount;
window.checkAuth = checkAuth;
window.initApp = initApp;

console.log('[API UTILS] Initialized successfully');