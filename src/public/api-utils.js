// api-utils.js
// Этот файл ДОЛЖЕН быть загружен ПЕРВЫМ!

// Глобальные конфигурационные переменные
const API_BASE_URL = `https://${window?.location?.host}/api`;
let currentPage = 1;
let itemsPerPage = 10;

// Проверка и установка глобальных переменных
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
            } else {
                if (typeof window.showNotification === 'function') {
                    window.showNotification('error', error.message || 'An unexpected error occurred', 5000);
                }
            }
        }
        
        throw error;
    }
}

// ЕДИНСТВЕННАЯ РЕАЛИЗАЦИЯ updateUSD
function updateUSD(amount) {
    // Ваш код конвертации
    const usdConversionElement = document.getElementById('usdConversion') || 
                                document.getElementById('toUSD') ||
                                document.getElementById('addPaymentModal_usdConversion') ||
                                document.getElementById('createTransactionModal_toUSD');
    
    if (!usdConversionElement) return;
    
    // Пример конвертации (замените на ваш API)
    const exchangeRate = 0.0036; // 1 PKR = 0.0036 USD
    const usdAmount = (amount * exchangeRate).toFixed(2);
    
    usdConversionElement.innerHTML = `<strong>USD:</strong> $${usdAmount}`;
}

// Проверка авторизации
async function checkAuth() {
    try {
        const response = await apiRequest('/v1/admin/validate', {
            method: 'GET',
            noAuth: true
        });
        
        if (!response.success) {
            // Только если ошибка связана с авторизацией, перенаправляем на логин
            if (response.message && (response.message.includes('Unauthorized') || 
                response.message.includes('token') || 
                response.message.includes('auth'))) {
                window.location.href = '/login.html';
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        // Проверяем, является ли ошибка сетевой проблемой
        if (error.message && !error.message.includes('Failed to fetch')) {
            window.location.href = '/login.html';
        }
        return false;
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Проверяем авторизацию только один раз
        const isAuthenticated = await checkAuth();
        
        if (isAuthenticated) {
            // Инициализируем приложение только если авторизация успешна
            initApp();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        // Не перенаправляем на логин при сетевых ошибках
        if (!error.message.includes('Failed to fetch')) {
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
    
    if (typeof initTransactionHandlers === 'function') {
        initTransactionHandlers();
    }
    
    if (typeof initUserHandlers === 'function') {
        initUserHandlers();
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
window.API_BASE_URL = API_BASE_URL;
window.currentPage = currentPage;
window.itemsPerPage = itemsPerPage;
window.apiRequest = apiRequest;
window.showNotification = showNotification;
window.updateRemainingAmount = updateRemainingAmount;
window.updateUSD = updateUSD; // ЕДИНСТВЕННАЯ ССЫЛКА НА ФУНКЦИЮ

console.log('[API UTILS] Initialized successfully');