// api-utils.js
// Этот файл должен быть загружен первым!

// Глобальные конфигурационные переменные
const API_BASE_URL = `https://${window?.location?.host}/api`;
let currentPage = 1;
let itemsPerPage = 10;

// Функция универсального API запроса
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

// Функция обновления конвертации в USD
async function updateUSD(amountInPKR) {
    try {
        const response = await fetch('api/v1/admin/latest/PKR');
        const data = await response.json();
        let exchangeRate;
        
        if (data.success && data.USD) {
            exchangeRate = data.USD;
        } else {
            // Fallback-курс, если API не отвечает
            exchangeRate = 0.0036;
        }
        
        const usdAmount = amountInPKR * exchangeRate;
        const usdConversion = document.getElementById('usdConversion') || 
                              document.getElementById('toUSD');
        
        if (usdConversion) {
            usdConversion.innerHTML = `≈ ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(usdAmount)}<span style="font-size: 0.8em; display: block; opacity: 0.7; margin-top: 3px">(1 PKR = ${exchangeRate.toFixed(6)} USD)</span>`;
        }
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        const exchangeRate = 0.0036;
        const usdAmount = amountInPKR * exchangeRate;
        const usdConversion = document.getElementById('usdConversion') || 
                              document.getElementById('toUSD');
        
        if (usdConversion) {
            usdConversion.innerHTML = `Error fetching exchange rate. Using fallback rate: 1 PKR = ${exchangeRate.toFixed(6)} USD`;
        }
    }
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
    
    document.getElementById('remainingAmount')?.textContent = formattedRemaining;
}

// Прикрепляем функции к глобальному объекту
window.API_BASE_URL = API_BASE_URL;
window.currentPage = currentPage;
window.itemsPerPage = itemsPerPage;
window.apiRequest = apiRequest;
window.showNotification = showNotification;
window.formatPKR = formatPKR;
window.parseNumber = parseNumber;
window.updateUSD = updateUSD;
window.updateRemainingAmount = updateRemainingAmount;

console.log('[API UTILS] Initialized successfully');