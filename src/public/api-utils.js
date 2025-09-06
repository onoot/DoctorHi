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

// Функция показа уведомлений
function showNotification(type, message) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Здесь может быть реализация UI уведомлений
    alert(`${type.toUpperCase()}: ${message}`);
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

// Прикрепляем функции к глобальному объекту
window.API_BASE_URL = API_BASE_URL;
window.currentPage = currentPage;
window.itemsPerPage = itemsPerPage;
window.apiRequest = apiRequest;
window.showNotification = showNotification;
window.formatPKR = formatPKR;
window.parseNumber = parseNumber;
window.updateRemainingAmount = updateRemainingAmount;

console.log('[API UTILS] Initialized successfully');