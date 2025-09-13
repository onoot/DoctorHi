// currency-converter.js
// Функции для конвертации валют

// Кэширование курса обмена
let exchangeRateCache = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут
let lastFetchTime = 0;
let isFetchingRate = false; // Флаг для предотвращения дублирующих запросов

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
    // Если уже идет запрос, ждем его завершения
    if (isFetchingRate) {
        return new Promise((resolve) => {
            const checkRate = setInterval(() => {
                if (!isFetchingRate && exchangeRateCache) {
                    clearInterval(checkRate);
                    resolve(exchangeRateCache);
                }
            }, 100);
        });
    }

    // Проверяем кэш
    const now = Date.now();
    if (exchangeRateCache && (now - lastFetchTime) < CACHE_DURATION) {
        console.log('[CURRENCY] Using cached exchange rate:', exchangeRateCache);
        return exchangeRateCache;
    }

    // Устанавливаем флаг, что идет запрос
    isFetchingRate = true;
    console.log('[CURRENCY] Fetching new exchange rate...');

    try {
        // Используем правильный URL с учетом структуры API
        const url = `${window.API_BASE_URL}/v1/admin/latest/PKR`;
        console.log('[CURRENCY] Fetching exchange rate from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            timeout: 5000 // Таймаут 5 секунд
        });
        
        console.log(`[CURRENCY] Exchange rate response status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch exchange rate, status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Проверяем структуру ответа
        if (data.success && typeof data.USD === 'number' && data.USD > 0) {
            console.log('[CURRENCY] Exchange rate received:', data.USD);
            exchangeRateCache = data.USD;
            lastFetchTime = now;
            return data.USD;
        }
        
        throw new Error('Invalid API response structure');
    } catch (error) {
        console.error('Ошибка получения курса:', error);
        
        // Показываем уведомление только если функция доступна
        if (typeof window.showNotification === 'function') {
            window.showNotification('warning', 'Failed to retrieve the exchange rate. Using fallback rate.');
        }
        
        // Возвращаем fallback курс
        exchangeRateCache = 0.0036;
        lastFetchTime = now;
        return 0.0036;
    } finally {
        // Сбрасываем флаг после завершения запроса
        isFetchingRate = false;
    }
}

/**
 * Получает кэшированный курс обмена или запрашивает новый
 * @returns {Promise<number>} - Курс обмена
 */
async function getCachedExchangeRate() {
    return await getExchangeRatePKRtoUSD();
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
        
        // Получаем курс обмена (с кэшированием и задержкой)
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
            }).format(usdAmount)}<span style="font-size: 0.8em; display: block; opacity: 0.7; margin-top: 3px">
                (1 PKR = ${exchangeRate.toFixed(6)} USD)
            </span>`;
        });
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        
        // Используем fallback курс
        const exchangeRate = 0.0036;
        const usdAmount = amountInPKR * exchangeRate;
        
        // Обновляем все возможные элементы с сообщением об ошибке
        [
            document.getElementById('usdConversion'),
            document.getElementById('toUSD'),
            document.getElementById('editPaymentModal_usdConversion'),
            document.getElementById('createTransactionModal_toUSD'),
            document.getElementById('addPaymentModal_usdConversion')
        ].filter(el => el !== null).forEach(usdConversion => {
            usdConversion.innerHTML = `<span style="color: #dc3545">Loading...</span>
                <span style="font-size: 0.8em; display: block; opacity: 0.7; margin-top: 3px">
                    (1 PKR = ${exchangeRate.toFixed(6)} USD)
                </span>`;
        });
    }
}

/**
 * Заполняет выпадающие списки в модальном окне создания транзакции
 */
function populateCreateTransactionModal() {
    // Получаем элементы выпадающих списков
    const propertySelect = document.getElementById('createTransactionModal_propertyId');
    const ownerSelect = document.getElementById('createTransactionModal_newOwnerId');
    
    if (!propertySelect && !ownerSelect) return;
    
    // === ЗАПОЛНЕНИЕ СПИСКА СВОЙСТВ ===
    if (propertySelect) {
        propertySelect.innerHTML = '<option value="">Select Property</option>';
        
        const propertiesData = localStorage.getItem('transactionProperties');
        if (propertiesData) {
            try {
                const properties = JSON.parse(propertiesData);
                
                // Проверяем, что это объект с категориями
                if (typeof properties === 'object' && properties !== null) {
                    Object.keys(properties).forEach(category => {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = category;
                        
                        // Убедимся, что массив свойств существует и не пустой
                        if (Array.isArray(properties[category])) {
                            properties[category].forEach(property => {
                                const option = document.createElement('option');
                                option.value = property.id;
                                option.textContent = `${property.name} (${property.id})`;
                                optgroup.appendChild(option);
                            });
                        }
                        
                        propertySelect.appendChild(optgroup);
                    });
                }
            } catch (e) {
                console.error('Error parsing properties from localStorage:', e);
                propertySelect.innerHTML = '<option value="">Error loading properties</option>';
            }
        } else {
            propertySelect.innerHTML = '<option value="">No properties available</option>';
        }
    }
    
    // === ЗАПОЛНЕНИЕ СПИСКА ПОЛЬЗОВАТЕЛЕЙ ===
    if (ownerSelect) {
        ownerSelect.innerHTML = '<option value="">Select New Owner</option>';
        
        const usersData = localStorage.getItem('users');
        if (usersData) {
            try {
                const users = JSON.parse(usersData);
                
                // Проверяем, что это массив
                if (Array.isArray(users)) {
                    // Фильтруем только активных пользователей с ролью "user"
                    const activeUsers = users.filter(user => 
                        user.role === 'user' && user.status === 'active'
                    );
                    
                    if (activeUsers.length === 0) {
                        ownerSelect.innerHTML = '<option value="">No active users available</option>';
                    } else {
                        activeUsers.forEach(user => {
                            const option = document.createElement('option');
                            option.value = user.id;
                            option.textContent = `${user.name} (${user.cnic})`;
                            ownerSelect.appendChild(option);
                        });
                    }
                } else {
                    ownerSelect.innerHTML = '<option value="">Invalid user data format</option>';
                }
            } catch (e) {
                console.error('Error parsing users from localStorage:', e);
                ownerSelect.innerHTML = '<option value="">Error loading users</option>';
            }
        } else {
            ownerSelect.innerHTML = '<option value="">No users available</option>';
        }
    }
}

/**
 * Функция для инициализации конвертера валют
 */
function attachCurrencyConverter() {
    // Проверяем, существуют ли элементы на текущей странице
    const totalAmountInputs = [
        document.getElementById('totalAmount'),
        document.getElementById('createTransactionModal_totalAmount')
    ].filter(el => el !== null);
    
    if (totalAmountInputs.length === 0) {
        console.log('[CURRENCY] Total amount input not found on current page');
        return;
    }
    
    // Добавляем обработчики ко всем полям ввода
    totalAmountInputs.forEach(totalAmountInput => {
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
    });
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
    const paymentAmountInputs = [
        document.getElementById('paymentAmount'),
        document.getElementById('editPaymentModal_paymentAmount'),
        document.getElementById('addPaymentModal_paymentAmount')
    ].filter(el => el !== null);
    
    const rawPaymentAmountInputs = [
        document.getElementById('rawPaymentAmount'),
        document.getElementById('editPaymentModal_rawPaymentAmount'),
        document.getElementById('addPaymentModal_rawPaymentAmount')
    ].filter(el => el !== null);
    
    if (paymentAmountInputs.length === 0 || rawPaymentAmountInputs.length === 0) {
        console.log('[CURRENCY] Payment amount elements not found on current page');
        return;
    }
    
    // Для каждого поля ввода суммы создаем отдельный обработчик
    paymentAmountInputs.forEach((paymentAmount, index) => {
        const rawPaymentAmount = rawPaymentAmountInputs[index];
        if (!rawPaymentAmount) return;
        
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
    });
}

// Прикрепляем функции к глобальному объекту
window.updateUSD = updateUSD;
window.attachCurrencyConverter = attachCurrencyConverter;
window.initCurrencyConverter = initCurrencyConverter;
window.initPaymentAmountConverter = initPaymentAmountConverter;

console.log('[CURRENCY CONVERTER] Initialized successfully');