// utils.js
// Вспомогательные функции и утилиты

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
            .replace(',', '.');
        
        // Проверяем, является ли значение валидным числом
        if (cleanValue === '' || cleanValue === '.') {
            rawValue = 0;
            return;
        }
        
        // Пытаемся преобразовать в число
        const numberValue = parseFloat(cleanValue);
        if (!isNaN(numberValue)) {
            rawValue = numberValue;
            updateUSD(rawValue);
        }
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
    
    // Восстанавливаем значение при фокусе
    totalAmountInput.addEventListener('focus', function() {
        this.value = rawValue.toString();
    });
}

/**
 * Функция обновления конвертации в USD
 * @param {number} amountInPKR - Сумма в PKR
 */
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
        const usdConversion = document.getElementById('toUSD');
        
        if (usdConversion) {
            usdConversion.innerHTML = `≈ ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(usdAmount)}`;
        }
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        const usdConversion = document.getElementById('toUSD');
        if (usdConversion) {
            usdConversion.innerHTML = 'Error fetching exchange rate';
        }
    }
}

/**
 * Форматирование суммы в долларах
 * @param {number} amount - Сумма в долларах
 * @returns {string} - Отформатированная строка
 */
function formatUSD(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

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
 * Обновление оставшейся суммы
 */
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
    
    document.getElementById('remainingAmount').textContent = formattedRemaining;
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
 * Форматирование числа для отображения
 * @param {number} value - Число для форматирования
 * @returns {string} - Отформатированная строка
 */
function formatNumberInput(value) {
    if (value === null || value === undefined || value === '') return '';
    
    // Преобразуем в строку и разделяем на целую и дробную части
    const parts = value.toString().split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? 
        parts.slice(1).join('') : '00';
    
    // Ограничиваем до 2 знаков после запятой
    let formattedDecimalPart = decimalPart.slice(0, 2);
    
    // Если дробная часть короче 2 знаков, дополняем нулями
    if (formattedDecimalPart.length === 1) formattedDecimalPart += '0';
    if (formattedDecimalPart.length === 0) formattedDecimalPart = '00';
    
    return parseFloat(`${integerPart}.${formattedDecimalPart}`) || 0;
}

/**
 * Валидация CNIC
 * @param {HTMLInputElement} input - Поле ввода CNIC
 */
function validateCNIC(input) {
    if (input && input.value.length === 0) {
        input.setCustomValidity('Please enter CNIC');
    } else {
        input.setCustomValidity('');
    }
}

/**
 * Валидация телефона
 * @param {HTMLInputElement} input - Поле ввода телефона
 */
function validatePhone(input) {
    if (input && input.value.length === 0) {
        input.setCustomValidity('Please enter phone');
    } else {
        input.setCustomValidity('');
    }
}

/**
 * Дебаунс функции
 * @param {Function} func - Функция для дебаунса
 * @param {number} wait - Время ожидания в миллисекундах
 * @returns {Function} - Дебаунснутая функция
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


/**
 * Helper function to determine appropriate file icon based on MIME type
 * @param {string} fileType - MIME type of the file
 * @returns {string} - Font Awesome icon class
 */
function getFileIcon(fileType) {
    if (!fileType) return 'fa-file';
    fileType = fileType.toLowerCase();
    
    if (fileType.includes('pdf')) return 'fa-file-pdf';
    if (fileType.includes('image')) return 'fa-file-image';
    if (fileType.includes('video') || fileType.includes('mp4') || 
        fileType.includes('mov') || fileType.includes('avi')) {
        return 'fa-file-video';
    }
    
    return 'fa-file';
}


// Экспортируем утилиты
export { formatNumberInput, getFileIcon, attachCurrencyConverter, debounce, validatePhone, validateCNIC, formatPKR, parseNumber, updateUSD, updateRemainingAmount, formatUSD };