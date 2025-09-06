// currency-converter.js
// Функции для конвертации валют

/**
 * Функция для инициализации конвертера валют
 */
function attachCurrencyConverter() {
    const totalAmountInput = document.getElementById('totalAmount');
    const usdOutput = document.getElementById('toUSD');
    
    if (!totalAmountInput || !usdOutput) {
        console.error('Элементы #totalAmount или #toUSD не найдены!');
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
            
            // Форматируем отображаемое значение
            this.value = formatPKR(rawValue);
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
}

/**
 * Инициализация конвертера валют
 */
function initCurrencyConverter() {
    // Инициализируем конвертер для поля ввода суммы транзакции
    attachCurrencyConverter();
    
    // Инициализируем конвертер для поля ввода суммы платежа
    initPaymentAmountConverter();
}

/**
 * Инициализация конвертера для поля ввода суммы платежа
 */
function initPaymentAmountConverter() {
    const paymentAmount = document.getElementById('paymentAmount');
    const rawPaymentAmount = document.getElementById('rawPaymentAmount');
    
    if (!paymentAmount || !rawPaymentAmount) {
        console.error('Элементы #paymentAmount или #rawPaymentAmount не найдены!');
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
}