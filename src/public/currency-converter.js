// currency-converter.js
// Функции для конвертации валют

// Кэширование курса обмена
let exchangeRateCache = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут
let lastFetchTime = 0;

/**
 * Форматирование денег с разделителями тысяч
 * @param {number} amount - Сумма
 * @returns {string} - Отформатированная строка
 */
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

/**
 * Парсинг числа с учетом разделителей
 * @param {string} value - Строка с числом
 * @returns {number} - Парсированное число
 */
function parseNumber(value) {
    if (!value) return 0;
    
    // Удаляем все символы, кроме цифр и десятичного разделителя
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Парсим как число
    return parseFloat(cleanValue) || 0;
}

/**
 * Функция для получения курса обмена PKR к USD
 * @returns {Promise<number>} - Курс обмена
 */
async function getExchangeRatePKRtoUSD() {
    try {
        // Используем правильный URL с API_BASE_URL
        const response = await fetch(`${window.API_BASE_URL}/v1/admin/latest/PKR`);
        const data = await response.json();
        
        // Проверяем структуру ответа
        if (data.success && typeof data.USD === 'number') {
            return data.USD;
        }
        throw new Error('Invalid API response structure');
    } catch (error) {
        console.error('Ошибка получения курса:', error);
        
        // Показываем уведомление только если функция доступна
        if (typeof window.showNotification === 'function') {
            window.showNotification('error', 'Failed to retrieve the course. An approximate value is used.');
        }
        
        return 0.0036; // Fallback курс
    }
}

/**
 * Получает кэшированный курс обмена или запрашивает новый
 * @returns {Promise<number>} - Курс обмена
 */
async function getCachedExchangeRate() {
    const now = Date.now();
    if (exchangeRateCache && (now - lastFetchTime) < CACHE_DURATION) {
        return exchangeRateCache;
    }
    try {
        exchangeRateCache = await getExchangeRatePKRtoUSD();
        lastFetchTime = now;
        return exchangeRateCache;
    } catch (error) {
        // Если не удалось получить курс, возвращаем fallback
        console.error('Error getting exchange rate:', error);
        return 0.0036;
    }
}

/**
 * Функция обновления конвертации в USD
 * @param {number} amountInPKR - Сумма в PKR
 */
async function updateUSD(amountInPKR) {
    try {
        // Проверяем, что сумма корректна
        if (isNaN(amountInPKR) || amountInPKR <= 0) {
            // Ищем все возможные элементы для отображения конвертации
            const usdElements = [
                document.getElementById('usdConversion'),
                document.getElementById('toUSD'),
                document.getElementById('editPaymentModal_usdConversion'),
                document.getElementById('createTransactionModal_toUSD'),
                document.getElementById('addPaymentModal_usdConversion')
            ].filter(el => el !== null);
            
            // Очищаем все найденные элементы
            usdElements.forEach(usdConversion => {
                usdConversion.innerHTML = '';
            });
            return;
        }
        
        const exchangeRate = await getCachedExchangeRate();
        const usdAmount = amountInPKR * exchangeRate;
        
        // Ищем все возможные элементы для отображения конвертации
        const usdElements = [
            document.getElementById('usdConversion'),
            document.getElementById('toUSD'),
            document.getElementById('editPaymentModal_usdConversion'),
            document.getElementById('createTransactionModal_toUSD'),
            document.getElementById('addPaymentModal_usdConversion')
        ].filter(el => el !== null);
        
        // Обновляем все найденные элементы
        usdElements.forEach(usdConversion => {
            usdConversion.innerHTML = `≈ ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(usdAmount)}`;
        });
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        
        // Обновляем все возможные элементы с сообщением об ошибке
        [
            document.getElementById('usdConversion'),
            document.getElementById('toUSD'),
            document.getElementById('editPaymentModal_usdConversion'),
            document.getElementById('createTransactionModal_toUSD'),
            document.getElementById('addPaymentModal_usdConversion')
        ].filter(el => el !== null).forEach(usdConversion => {
            usdConversion.innerHTML = `<span style="color: #dc3545">Conversion error</span>
                <span style="font-size: 0.8em; display: block; opacity: 0.7; margin-top: 3px">
                    Check your internet connection
                </span>`;
        });
    }
}

/**
 * Функция для инициализации конвертера валют
 */
function attachCurrencyConverter() {
    // Проверяем, существуют ли элементы на текущей странице
    const totalAmountInput = document.getElementById('totalAmount') || 
                            document.getElementById('createTransactionModal_totalAmount');
    
    if (!totalAmountInput) {
        console.log('[CURRENCY] Total amount input not found on current page');
        return;
    }
    
    let rawValue = 0;
    let lastInputValue = '';
    
    // Сохраняем "сырое" значение во время ввода
    totalAmountInput.addEventListener('input', function(e) {
        // Сохраняем текущее значение для корректной обработки
        lastInputValue = this.value;
        
        // Чистим ввод, сохраняя цифры и разделители
        let cleanValue = this.value
            .replace(/[^0-9.,]/g, '')
            .replace(/(,)/g, '.') // Заменяем запятые на точки
            .replace(/(\..*)\./g, '$1'); // Удаляем лишние точки
        
        // Парсим значение
        const newRawValue = parseNumber(cleanValue);
        
        // Сохраняем сырое значение ТОЛЬКО если оно изменилось
        if (newRawValue !== rawValue) {
            rawValue = newRawValue;
            
            // Обновляем конвертацию в USD
            updateUSD(rawValue);
        }
    });
    
    // Восстанавливаем значение при фокусе
    totalAmountInput.addEventListener('focus', function() {
        this.value = rawValue.toString();
    });
    
    // Форматируем значение при потере фокуса
    totalAmountInput.addEventListener('blur', function() {
        if (lastInputValue === '') {
            this.value = '';
            rawValue = 0;
            updateUSD(0);
            return;
        }
        
        // Форматируем с разделителями тысяч
        this.value = formatPKR(rawValue);
    });
    
    // Инициализируем с текущим значением
    if (totalAmountInput.value) {
        rawValue = parseNumber(totalAmountInput.value);
        totalAmountInput.value = formatPKR(rawValue);
    } else {
        totalAmountInput.value = '0.00';
        rawValue = 0;
    }
    
    // Обновляем конвертацию
    updateUSD(rawValue);
}

/**
 * Инициализация конвертера валют
 */
function initCurrencyConverter() {
    // Инициализируем конвертер только если мы на странице транзакций
    if (document.querySelector('#transactions.active')) {
        attachCurrencyConverter();
        initPaymentAmountConverter();
    }
}

/**
 * Инициализация конвертера для поля ввода суммы платежа
 */
function initPaymentAmountConverter() {
    // Проверяем, существуют ли элементы на текущей странице
    const paymentAmount = document.getElementById('paymentAmount') || 
                         document.getElementById('editPaymentModal_paymentAmount') ||
                         document.getElementById('addPaymentModal_paymentAmount');
    
    const rawPaymentAmount = document.getElementById('rawPaymentAmount') || 
                            document.getElementById('editPaymentModal_rawPaymentAmount') ||
                            document.getElementById('addPaymentModal_rawPaymentAmount');
    
    if (!paymentAmount || !rawPaymentAmount) {
        console.log('[CURRENCY] Payment amount elements not found on current page');
        return;
    }
    
    let rawValue = 0;
    
    // Удаляем существующие обработчики, чтобы избежать дублирования
    const newPaymentAmount = paymentAmount.cloneNode(true);
    paymentAmount.parentNode.replaceChild(newPaymentAmount, paymentAmount);
    
    // Обработчик ввода
    newPaymentAmount.addEventListener('input', function(e) {
        // Сохраняем позицию курсора
        const cursorStart = this.selectionStart;
        const cursorEnd = this.selectionEnd;
        const oldValue = this.value;
        
        // Чистим ввод, сохраняя цифры и точку
        let cleanValue = this.value.replace(/[^0-9.]/g, '');
        
        // Проверяем, что не введено больше одной точки
        const dotCount = (cleanValue.match(/\./g) || []).length;
        if (dotCount > 1) {
            cleanValue = cleanValue.replace(/\.+$/, ''); // Удаляем лишние точки в конце
        }
        
        // Сохраняем текущее значение для отслеживания изменений
        this.value = cleanValue;
        
        // Парсим значение
        const newRawValue = parseNumber(cleanValue);
        
        // Сохраняем сырое значение ТОЛЬКО если оно изменилось
        if (newRawValue !== rawValue) {
            rawValue = newRawValue;
            
            // Обновляем конвертацию в USD
            updateUSD(rawValue);
            
            // Обновляем скрытое поле
            rawPaymentAmount.value = rawValue;
        }
        
        // Корректируем позицию курсора
        const diff = this.value.length - oldValue.length;
        this.setSelectionRange(Math.max(0, cursorStart + diff), 
                              Math.max(0, cursorEnd + diff));
    });
    
    // Форматируем значение при потере фокуса
    newPaymentAmount.addEventListener('blur', function() {
        this.value = formatPKR(rawValue);
    });
    
    // Восстанавливаем значение при фокусе
    newPaymentAmount.addEventListener('focus', function() {
        this.value = rawValue.toString();
    });
    
    // Инициализируем с текущим значением
    if (newPaymentAmount.value) {
        rawValue = parseNumber(newPaymentAmount.value);
        newPaymentAmount.value = formatPKR(rawValue);
        rawPaymentAmount.value = rawValue;
    } else {
        newPaymentAmount.value = '0.00';
        rawValue = 0;
        rawPaymentAmount.value = '0';
    }
    
    // Обновляем конвертацию
    updateUSD(rawValue);
}

// Прикрепляем функции к глобальному объекту
window.updateUSD = updateUSD;
window.attachCurrencyConverter = attachCurrencyConverter;
window.initCurrencyConverter = initCurrencyConverter;
window.initPaymentAmountConverter = initPaymentAmountConverter;

console.log('[CURRENCY CONVERTER] Initialized successfully');