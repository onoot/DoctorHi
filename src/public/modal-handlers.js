// modal-handlers.js
// ТОЛЬКО открытие/закрытие модалок + заполнение выпадающих списков перед открытием

/**
 * Функция для открытия модального окна добавления платежа
 * @param {string} transactionId - ID транзакции
 */
function openAddPaymentModal(transactionId) {
    console.log(`[PAYMENT] Opening add payment modal for transaction ${transactionId}`);

    const paymentTransactionId = document.getElementById('paymentTransactionId');
    if (paymentTransactionId) paymentTransactionId.value = transactionId;

    const form = document.getElementById('addPaymentForm');
    if (form) form.reset();

    const receiptFileNameDisplay = document.getElementById('receiptFileNameDisplay');
    if (receiptFileNameDisplay) receiptFileNameDisplay.textContent = 'No file chosen';

    const receiptPreview = document.getElementById('receiptPreview');
    if (receiptPreview) receiptPreview.innerHTML = '';

    if (typeof openModal === 'function') openModal('addPaymentModal');
}

/**
 * Заполняет выпадающие списки в модальном окне создания транзакции
 */
function populateCreateTransactionModal() {
    const propertySelect = document.getElementById('createTransactionModal_propertyId');
    const ownerSelect = document.getElementById('createTransactionModal_newOwnerId');

    if (!propertySelect && !ownerSelect) return;

    // === СВОЙСТВА ===
    if (propertySelect) {
        propertySelect.innerHTML = '<option value="">Select Property</option>';

        const propertiesData = localStorage.getItem('transactionProperties');
        if (propertiesData) {
            try {
                const properties = JSON.parse(propertiesData);
                if (typeof properties === 'object' && properties !== null) {
                    Object.keys(properties).forEach(category => {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = category;
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

    // === ПОЛЬЗОВАТЕЛИ ===
    if (ownerSelect) {
        ownerSelect.innerHTML = '<option value="">Select New Owner</option>';

        const usersData = localStorage.getItem('users');
        if (usersData) {
            try {
                const users = JSON.parse(usersData);
                if (Array.isArray(users)) {
                    const activeUsers = users.filter(user => user.role === 'user' && user.status === 'active');
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
 * Открывает модальное окно создания транзакции
 */
function openCreateTransactionModal() {
    console.log('[TRANSACTION] Opening create transaction modal');

    const modal = document.getElementById('createTransactionModal');
    if (!modal) {
        console.error('[TRANSACTION] Create transaction modal not found in DOM');
        if (typeof showNotification === 'function') showNotification('error', 'Transaction modal not found');
        return;
    }

    const form = document.getElementById('createTransactionForm');
    if (form) form.reset(); // ✅ Очищаем поля

    document.querySelectorAll('.error-message').forEach(el => el.textContent = ''); // ✅ Очищаем ошибки

    // Заполняем выпадающие списки свойств и пользователей
    populateCreateTransactionModal();

    // === НОВАЯ/ОБНОВЛЕННАЯ ЛОГИКА: Инициализация полей типа оплаты ===
    const paymentTypeSelect = document.getElementById('createTransactionModal_paymentType');
    const fullPaymentFields = document.getElementById('fullPaymentFields');
    const schedulePaymentFields = document.getElementById('schedulePaymentFields');
    const scheduleTypeSelect = document.getElementById('createTransactionModal_scheduleType');
    const decreaseRateField = document.getElementById('decreaseRateField');
    const interestRateField = document.getElementById('interestRateField');
    const totalAmountInput = document.getElementById('createTransactionModal_totalAmount');
    const initialPaymentInput = document.getElementById('createTransactionModal_initialPayment');

    // Функция переключения видимости полей в зависимости от типа оплаты (полная/расписание)
    // Делаем её доступной глобально, чтобы обработчик события change мог её найти
    window.togglePaymentFields = function () {
        const selectedType = paymentTypeSelect.value;
        if (selectedType === 'full') {
            fullPaymentFields.style.display = 'block';
            schedulePaymentFields.style.display = 'none';
            const previewContainer = document.getElementById('schedulePreviewContainer');
            if (previewContainer) previewContainer.style.display = 'none';
        } else if (selectedType === 'schedule') {
            fullPaymentFields.style.display = 'none';
            schedulePaymentFields.style.display = 'block';
            const previewContainer = document.getElementById('schedulePreviewContainer');
            if (previewContainer) previewContainer.style.display = 'none';
            toggleScheduleTypeFields(); // Инициализируем поля для расписания
        }
    };
        // Обработчики для нового поля Minimum Payment (только для decreasing_fixed)
    const minPaymentInput = document.getElementById('createTransactionModal_minPayment');
    if (minPaymentInput) {
        let usdDiv = document.getElementById('createTransactionModal_minPayment_toUSD');
        if (!usdDiv) {
            usdDiv = document.createElement('div');
            usdDiv.id = 'createTransactionModal_minPayment_toUSD';
            usdDiv.style = 'color: #0066cc; font-size: 0.95em; margin-top: 5px;';
            minPaymentInput.parentNode.insertBefore(usdDiv, minPaymentInput.nextSibling);
        }

        const formatAndCalculateMin = function() {
            formatAndUpdateMinPaymentUSD(this.value);
            calculateAndPreviewSchedule(); // Пересчитываем график при изменении мин. платежа
        };
        minPaymentInput.addEventListener('input', formatAndCalculateMin);
        minPaymentInput.addEventListener('blur', function() {
            this.value = window.formatPKR ? window.formatPKR(window.parseNumber ? window.parseNumber(this.value) : this.value) : this.value;
            formatAndUpdateMinPaymentUSD(this.value);
            calculateAndPreviewSchedule();
        });
        formatAndUpdateMinPaymentUSD(minPaymentInput.value);
    }

    // Вспомогательная функция для форматирования и обновления USD для минимального платежа
    async function formatAndUpdateMinPaymentUSD(amountValue) {
        let amount = window.parseNumber ? window.parseNumber(amountValue) : parseFloat(amountValue);
        if (isNaN(amount) || amount < 0) amount = 0;

        let usdDiv = document.getElementById('createTransactionModal_minPayment_toUSD');
        if (!usdDiv) return;

        if (window.getExchangeRatePKRtoUSD) {
            try {
                const rate = await window.getExchangeRatePKRtoUSD();
                usdDiv.innerHTML = `≈ $${(amount * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` +
                    `<span style="font-size: 0.8em; display: block; opacity: 0.7; margin-top: 3px">(1 PKR = ${rate.toFixed(6)} USD)</span>`;
            } catch {
                usdDiv.textContent = `≈ $${(amount * 0.0036).toFixed(2)}`;
            }
        } else {
            usdDiv.textContent = `≈ $${(amount * 0.0036).toFixed(2)}`;
        }
    }

        // Функция переключения видимости полей в зависимости от типа графика (дифф. / уменьш.)
    window.toggleScheduleTypeFields = function () {
        const selectedScheduleType = scheduleTypeSelect.value;
        const minPaymentField = document.getElementById('minPaymentField'); // Новое поле
        if (selectedScheduleType === 'decreasing_fixed') {
            decreaseRateField.style.display = 'block';
            interestRateField.style.display = 'none';
            if (minPaymentField) minPaymentField.style.display = 'block'; // Показываем новое поле
            // Обновляем подсказку
            const hint = decreaseRateField.querySelector('.form-text');
            if (hint) {
                hint.textContent = 'Enter the fixed percentage by which each payment decreases from the previous one (e.g., 10 for 10% decrease).';
                hint.classList.add('fade-in');
                setTimeout(() => hint.classList.remove('fade-in'), 300);
            }
        } else if (selectedScheduleType === 'differentiated_with_interest') {
            decreaseRateField.style.display = 'none';
            interestRateField.style.display = 'block';
            if (minPaymentField) minPaymentField.style.display = 'none'; // Скрываем новое поле
            // Обновляем подсказку
            const hint = interestRateField.querySelector('.form-text');
            if (hint) {
                hint.textContent = 'Enter the annual interest rate applied to the remaining balance (e.g., 12.5 for 12.5% per year).';
                hint.classList.add('fade-in');
                setTimeout(() => hint.classList.remove('fade-in'), 300);
            }
        }
        // Пересчитываем расписание при смене типа графика
        calculateAndPreviewSchedule();
    };

    // Инициализация обработчиков и начального состояния полей оплаты
    if (paymentTypeSelect && fullPaymentFields && schedulePaymentFields) {
        // Удаляем старые обработчики, если есть, чтобы избежать дублирования
        paymentTypeSelect.removeEventListener('change', window.togglePaymentFields);
        paymentTypeSelect.addEventListener('change', window.togglePaymentFields);

        // Устанавливаем минимальную дату для full payment deadline на завтра
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const deadlineInput = document.getElementById('createTransactionModal_fullPaymentDeadline');
        if (deadlineInput) {
            deadlineInput.min = tomorrow.toISOString().split('T')[0];
            // Устанавливаем значение по умолчанию на +30 дней
            const defaultDeadline = new Date(tomorrow);
            defaultDeadline.setDate(defaultDeadline.getDate() + 30);
            deadlineInput.value = defaultDeadline.toISOString().split('T')[0];
        }

        // Инициализируем видимость полей в зависимости от выбранного типа оплаты
        window.togglePaymentFields();
    }

    // Инициализация обработчиков для типа графика
    if (scheduleTypeSelect) {
        scheduleTypeSelect.removeEventListener('change', window.toggleScheduleTypeFields);
        scheduleTypeSelect.addEventListener('change', window.toggleScheduleTypeFields);
        // Вызываем при инициализации, чтобы установить начальное состояние
        window.toggleScheduleTypeFields();
    }

    // === НОВАЯ/ОБНОВЛЕННАЯ ЛОГИКА: Обработчики для форматирования USD и расчета расписания ===

    // Обработчики для поля Initial Payment
    if (initialPaymentInput) {
        let usdDiv = document.getElementById('createTransactionModal_initialPayment_toUSD');
        if (!usdDiv) {
            usdDiv = document.createElement('div');
            usdDiv.id = 'createTransactionModal_initialPayment_toUSD';
            usdDiv.style = 'color: #0066cc; font-size: 0.95em; margin-top: 5px;';
            // Вставляем после поля ввода
            initialPaymentInput.parentNode.insertBefore(usdDiv, initialPaymentInput.nextSibling);
        }

        const formatAndCalculate = function () {
            formatAndUpdateInitialPaymentUSD(this.value);
            calculateAndPreviewSchedule();
        };
        initialPaymentInput.addEventListener('input', formatAndCalculate);
        initialPaymentInput.addEventListener('blur', function () {
            this.value = window.formatPKR ? window.formatPKR(window.parseNumber ? window.parseNumber(this.value) : this.value) : this.value;
            formatAndUpdateInitialPaymentUSD(this.value);
            calculateAndPreviewSchedule();
        });
        formatAndUpdateInitialPaymentUSD(initialPaymentInput.value);
    }

    // Обработчики для полей процентных ставок/уменьшения
    const decreaseRateInput = document.getElementById('createTransactionModal_decreaseRate');
    const interestRateInput = document.getElementById('createTransactionModal_interestRate');
    const scheduleDaySelect = document.getElementById('createTransactionModal_schedulePaymentDay');

    if (decreaseRateInput) {
        decreaseRateInput.addEventListener('input', calculateAndPreviewSchedule);
        decreaseRateInput.addEventListener('blur', calculateAndPreviewSchedule);
    }
    if (interestRateInput) {
        interestRateInput.addEventListener('input', calculateAndPreviewSchedule);
        interestRateInput.addEventListener('blur', calculateAndPreviewSchedule);
    }
    if (scheduleDaySelect) {
        scheduleDaySelect.addEventListener('change', calculateAndPreviewSchedule);
    }

    // Обработчики для поля Total Amount
    if (totalAmountInput) {
        // Добавим контейнер для USD, если его нет
        let usdDiv = document.getElementById('createTransactionModal_toUSD');
        if (!usdDiv) {
            usdDiv = document.createElement('div');
            usdDiv.id = 'createTransactionModal_toUSD';
            usdDiv.style = 'color: #0066cc; font-size: 0.95em; margin-top: 5px;';
            totalAmountInput.parentNode.insertBefore(usdDiv, totalAmountInput.nextSibling);
        }

        const formatAndCalculateTotal = function () {
            formatAndUpdateTotalAmountUSD(this.value);
            calculateAndPreviewSchedule();
        };
        totalAmountInput.addEventListener('input', formatAndCalculateTotal);
        totalAmountInput.addEventListener('blur', function () {
            this.value = window.formatPKR ? window.formatPKR(window.parseNumber ? window.parseNumber(this.value) : this.value) : this.value;
            formatAndUpdateTotalAmountUSD(this.value);
            calculateAndPreviewSchedule();
        });
        formatAndUpdateTotalAmountUSD(totalAmountInput.value);
    }
    // === КОНЕЦ НОВОЙ/ОБНОВЛЕННОЙ ЛОГИКИ ===

    // Открываем модальное окно
    openModal('createTransactionModal');
}

/**
 * Создаёт новую транзакцию через API
 */
async function createTransaction() {
    // --- НАСТРОЙКИ ЛИМИТОВ ---
    const MAX_INITIAL_PAYMENT_PERCENT = 50; // Максимум 50% от общей суммы для первого платежа
    const MIN_MONTHLY_PAYMENT_PERCENT = 2;   // Минимум 2% от общей суммы для ежемесячного платежа
    // --------------------------

    // Сбор данных из формы
    const propertyId = document.getElementById('createTransactionModal_propertyId')?.value;
    const newOwnerId = document.getElementById('createTransactionModal_newOwnerId')?.value;
    const totalAmountInput = document.getElementById('createTransactionModal_totalAmount');
    const adminNotesInput = document.getElementById('createTransactionModal_adminNotes');

    // === НОВАЯ/ОБНОВЛЕННАЯ ЛОГИКА: Получение данных о типе оплаты ===
    const paymentTypeSelect = document.getElementById('createTransactionModal_paymentType');
    const fullPaymentDeadlineInput = document.getElementById('createTransactionModal_fullPaymentDeadline');

    const scheduleTypeSelect = document.getElementById('createTransactionModal_scheduleType');
    const schedulePaymentDaySelect = document.getElementById('createTransactionModal_schedulePaymentDay');
    const decreaseRateInput = document.getElementById('createTransactionModal_decreaseRate');
    const interestRateInput = document.getElementById('createTransactionModal_interestRate');
    const initialPaymentInput = document.getElementById('createTransactionModal_initialPayment');
    // === КОНЕЦ НОВОЙ/ОБНОВЛЕННОЙ ЛОГИКИ ===

    // Данные свидетелей
    const witness1Name = document.getElementById('createTransactionModal_witness1Name')?.value.trim();
    const witness1CNIC = document.getElementById('createTransactionModal_witness1CNIC')?.value.trim();
    const witness1Phone = document.getElementById('createTransactionModal_witness1Phone')?.value.trim();
    const witness2Name = document.getElementById('createTransactionModal_witness2Name')?.value.trim();
    const witness2CNIC = document.getElementById('createTransactionModal_witness2CNIC')?.value.trim();
    const witness2Phone = document.getElementById('createTransactionModal_witness2Phone')?.value.trim();

    // Парсинг числовых значений
    const totalAmount = parseNumber(totalAmountInput?.value || '0');
    const adminNotes = adminNotesInput?.value.trim() || null;

    // === НОВАЯ/ОБНОВЛЕННАЯ ЛОГИКА: Валидация данных типа оплаты ===
    const paymentType = paymentTypeSelect?.value;
    let fullPaymentDeadline = null;
    let schedulePaymentDay = null;
    let scheduleType = null;
    let decreaseRate = null;
    let interestRate = null;
    let initialPayment = null; 
    let minPayment = null;

    if (!paymentType) {
        showNotification('error', 'Please select a payment type');
        return;
    }

    if (paymentType === 'full') {
        fullPaymentDeadline = fullPaymentDeadlineInput?.value;
        if (!fullPaymentDeadline) {
            showNotification('error', 'Full payment deadline is required');
            return;
        }
        // Проверка, что дата не в прошлом
        const deadlineDate = new Date(fullPaymentDeadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Сбрасываем время для сравнения дат
        if (deadlineDate < today) {
            showNotification('error', 'Full payment deadline cannot be in the past');
            return;
        }
    } else if (paymentType === 'schedule') {
        schedulePaymentDay = parseInt(schedulePaymentDaySelect?.value);
        scheduleType = scheduleTypeSelect?.value;
        // initialPayment теперь не обязателен
        const initialPaymentValue = initialPaymentInput?.value.trim() || '';
        initialPayment = initialPaymentValue ? parseNumber(initialPaymentValue) : null;

        if (isNaN(schedulePaymentDay) || schedulePaymentDay < 1 || schedulePaymentDay > 31) {
            showNotification('error', 'Please select a valid schedule payment day (1-31)');
            return;
        }
        if (!scheduleType) {
            showNotification('error', 'Please select a schedule calculation type');
            return;
        }

        // --- ПРОВЕРКА ВЕРХНЕГО ЛИМИТА ДЛЯ ПЕРВОГО ПЛАТЕЖА ---
        if (initialPayment !== null) {
            if (isNaN(initialPayment) || initialPayment <= 0) {
                showNotification('error', 'Initial payment amount must be a valid number greater than 0, or left blank.');
                return;
            }
            if (initialPayment > totalAmount) {
                showNotification('error', 'Initial payment amount cannot be greater than total amount');
                return;
            }
            const maxInitialPayment = totalAmount * (MAX_INITIAL_PAYMENT_PERCENT / 100);
            if (initialPayment > maxInitialPayment) {
                showNotification('error', `Initial payment amount is too high. It must be no more than ${formatPKR(maxInitialPayment)} (${MAX_INITIAL_PAYMENT_PERCENT}% of total).`);
                return; // Прерываем создание транзакции
            }
        }
        // --- КОНЕЦ ПРОВЕРКИ ВЕРХНЕГО ЛИМИТА ---

        if (scheduleType === 'decreasing_fixed') {
            decreaseRate = parseFloat(decreaseRateInput?.value);
            if (isNaN(decreaseRate) || decreaseRate <= 0 || decreaseRate > 100) {
                showNotification('error', 'Please enter a valid payment decrease rate (0.01 - 100%)');
                return;
            }
            const minPaymentInputValue = document.getElementById('createTransactionModal_minPayment')?.value.trim() || '';
            if (minPaymentInputValue !== '') {
                minPayment = parseNumber(minPaymentInputValue);
                if (isNaN(minPayment) || minPayment <= 0) {
                    showNotification('error', 'Minimum payment amount must be a valid number greater than 0.');
                    return;
                }
                if (minPayment > totalAmount) {
                    showNotification('error', 'Minimum payment amount cannot be greater than total amount.');
                    return;
                }
                // Проверка против initialPayment?
                if (initialPayment !== null && minPayment > initialPayment) {
                    showNotification('error', 'Minimum payment cannot be greater than initial payment.');
                    return;
                }
            }
        } else if (scheduleType === 'differentiated_with_interest') {
            interestRate = parseFloat(interestRateInput?.value);
            if (isNaN(interestRate) || interestRate < 0 || interestRate > 100) {
                showNotification('error', 'Please enter a valid annual interest rate (0 - 100%)');
                return;
            }
        }

        // --- ФИНАЛЬНАЯ ПРОВЕРКА НИЖНЕГО ЛИМИТА ЕЖЕМЕСЯЧНОГО ПЛАТЕЖА ---
        // Перед отправкой, еще раз рассчитаем график и проверим минимальный платеж
        if (scheduleType && !isNaN(schedulePaymentDay) && schedulePaymentDay >= 1 && schedulePaymentDay <= 31) {
             let rateForCalculation = null;
             if (scheduleType === 'decreasing_fixed') {
                 rateForCalculation = decreaseRate;
             } else if (scheduleType === 'differentiated_with_interest') {
                 rateForCalculation = interestRate;
             }

             if (rateForCalculation !== null) {
                 const testSchedule = calculateScheduleLocally(totalAmount, initialPayment, schedulePaymentDay, scheduleType, rateForCalculation, MIN_MONTHLY_PAYMENT_PERCENT); // Передаем лимит
                 // calculateScheduleLocally теперь возвращает { schedule: ..., minPayment: ... , isValid: ... }
                 if (!testSchedule.isValid) {
                      // Сообщение об ошибке уже сформировано внутри calculateScheduleLocally
                      showNotification('error', testSchedule.errorMessage || 'Payment schedule violates minimum monthly payment rules.');
                      return; // Прерываем создание транзакции
                 }
                 // Если isValid === true, график корректен
             }
        }
        // --- КОНЕЦ ФИНАЛЬНОЙ ПРОВЕРКИ ---
    }
    // === КОНЕЦ НОВОЙ/ОБНОВЛЕННОЙ ЛОГИКИ ===

    // Базовая валидация обязательных полей
    if (!propertyId || !newOwnerId || isNaN(totalAmount) || totalAmount <= 0 ||
        !witness1Name || !witness1CNIC || !witness2Name || !witness2CNIC) {
        showNotification('error', 'All required fields must be filled');
        console.trace('createTransaction called from:');
        return;
    }

    try {
        // Формирование тела запроса
        const requestBody = {
            property_id: propertyId,
            new_owner_id: newOwnerId,
            total_amount: totalAmount,
            // === НОВАЯ/ОБНОВЛЕННАЯ ЛОГИКА: Добавление данных типа оплаты в тело запроса ===
            payment_type: paymentType,
            ...(paymentType === 'full' && { full_payment_deadline: fullPaymentDeadline }),
            ...(paymentType === 'schedule' && {
                schedule_payment_day: schedulePaymentDay,
                schedule_type: scheduleType,
                initial_payment: initialPayment,
                // initial_payment теперь может быть null, отправляем как есть
                initial_payment: initialPayment,
                ...(scheduleType === 'decreasing_fixed' && { decrease_rate: decreaseRate }),
                ...(scheduleType === 'differentiated_with_interest' && { interest_rate: interestRate })
                
            }),
            // === КОНЕЦ НОВОЙ/ОБНОВЛЕННОЙ ЛОГИКИ ===
            witnesses: {
                witness1: {
                    name: witness1Name,
                    cnic: witness1CNIC,
                    phone: witness1Phone || null
                },
                witness2: {
                    name: witness2Name,
                    cnic: witness2CNIC,
                    phone: witness2Phone || null
                }
            }
        };

        // Добавляем admin_notes, если оно есть
        if (adminNotes !== null) {
            requestBody.admin_notes = adminNotes;
        }

        // Отправка запроса на сервер
        const response = await apiRequest('/v1/admin/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (response.success) {
            showNotification('success', 'Transaction created successfully');
            closeModal('createTransactionModal');
            // Очищаем форму после успешного создания
            if (document.getElementById('createTransactionForm')) {
                document.getElementById('createTransactionForm').reset();
            }
            loadTransactions(); // Обновляем список транзакций

            // === НОВАЯ/ОБНОВЛЕННАЯ ЛОГИКА: Сброс превью расписания ===
            const previewContainer = document.getElementById('schedulePreviewContainer');
            if (previewContainer) {
                previewContainer.style.display = 'none';
            }
            // === КОНЕЦ НОВОЙ/ОБНОВЛЕННОЙ ЛОГИКИ ===
        } else {
            throw new Error(response.message || 'Failed to create transaction');
        }
    } catch (error) {
        console.error('[TRANSACTION] Error creating transaction:', error);
        showNotification('error', 'Error creating transaction: ' + error.message);
    }
}


// Вспомогательная функция для форматирования и обновления USD для первого платежа
async function formatAndUpdateInitialPaymentUSD(amountValue) {
    let amount = window.parseNumber ? window.parseNumber(amountValue) : parseFloat(amountValue);
    if (isNaN(amount) || amount < 0) amount = 0;

    let usdDiv = document.getElementById('createTransactionModal_initialPayment_toUSD');
    if (!usdDiv) return;

    if (window.getExchangeRatePKRtoUSD) {
        try {
            const rate = await window.getExchangeRatePKRtoUSD();
            usdDiv.innerHTML = `≈ $${(amount * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` +
                `<span style="font-size: 0.8em; display: block; opacity: 0.7; margin-top: 3px">(1 PKR = ${rate.toFixed(6)} USD)</span>`;
        } catch {
            usdDiv.textContent = `≈ $${(amount * 0.0036).toFixed(2)}`;
        }
    } else {
        usdDiv.textContent = `≈ $${(amount * 0.0036).toFixed(2)}`;
    }
}

// Вспомогательная функция для форматирования и обновления USD для общей суммы
async function formatAndUpdateTotalAmountUSD(amountValue) {
    let amount = window.parseNumber ? window.parseNumber(amountValue) : parseFloat(amountValue);
    if (isNaN(amount) || amount < 0) amount = 0;

    let usdDiv = document.getElementById('createTransactionModal_toUSD');
    if (!usdDiv) return;

    if (window.getExchangeRatePKRtoUSD) {
        try {
            const rate = await window.getExchangeRatePKRtoUSD();
            usdDiv.innerHTML = `≈ $${(amount * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` +
                `<span style="font-size: 0.8em; display: block; opacity: 0.7; margin-top: 3px">(1 PKR = ${rate.toFixed(6)} USD)</span>`;
        } catch {
            usdDiv.textContent = `≈ $${(amount * 0.0036).toFixed(2)}`;
        }
    } else {
        usdDiv.textContent = `≈ $${(amount * 0.0036).toFixed(2)}`;
    }
}

// *** ОБНОВЛЕННАЯ ФУНКЦИЯ РАСЧЕТА ГРАФИКА ***
// Функция для локального расчета расписания (обновленная версия)
// Теперь возвращает объект { schedule: [...], minPayment: number, isValid: boolean, errorMessage: string, adjustmentsMade: boolean, message: string }
// Цель: Автоматически корректировать график, если минимальный платеж слишком мал, вместо простой ошибки.
function calculateScheduleLocally(totalAmount, initialPaymentInput, scheduleDay, scheduleType, rateInput, minMonthlyPercent = 2, minPaymentSpecified = null) {
    const total = parseFloat(totalAmount);
    let initialPayment = initialPaymentInput ? parseFloat(initialPaymentInput) : null;
    let schedule = [];
    let minPaymentInSchedule = total; // Инициализируем максимальным возможным значением
    let adjustmentsMade = false;
    let infoMessage = "";
    let finalNumberOfMonths = null; // Для отслеживания итогового количества месяцев

    if (isNaN(total) || total <= 0) {
        console.warn('Invalid total amount for schedule calculation.');
        return { schedule: [], minPayment: 0, isValid: false, errorMessage: 'Invalid total amount.', adjustmentsMade: false, message: "" };
    }

    const minAllowedMonthlyPayment = total * (minMonthlyPercent / 100);
        // Приоритет у пользовательского минимального платежа
    const effectiveMinPayment = (minPaymentSpecified !== null && !isNaN(minPaymentSpecified) && minPaymentSpecified > 0) 
        ? minPaymentSpecified 
        : minAllowedMonthlyPayment;
    console.log(`[Schedule Calc] Effective minimum payment set to: ${formatPKR(effectiveMinPayment)}`);

    // --- Вспомогательная функция для создания графика ---
    // Возвращает { schedule, minPayment, numberOfMonths }
    function generateSchedule(ip, st, rt, numberOfMonthsOverride = null) {
        let sched = [];
        let minPmt = total;
        let currentDate = new Date();
        let remaining = total;
        let installment = 1;
        let fixedPrincipal = 0;
        let currentPrincipal = total;
        let calculatedNumberOfMonths = null;

        if (st === 'decreasing_fixed') {
            const decreaseRate = parseFloat(rt) / 100;
            if (isNaN(decreaseRate) || decreaseRate <= 0 || decreaseRate >= 1) {
                throw new Error('Invalid decrease rate.');
            }

            let currentPayment = ip;
            if (currentPayment === null) {
                // Если первый платеж не задан, рассчитываем примерный
                const assumedMonths = 12;
                const r = 1 - decreaseRate;
                currentPayment = total * (1 - r) / (1 - Math.pow(r, assumedMonths));
            }

            while (remaining > 0.01) {
                let paymentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), scheduleDay);
                if (paymentDate <= currentDate) {
                    paymentDate.setMonth(paymentDate.getMonth() + 1);
                }

                let amount = currentPayment;
                if (remaining <= currentPayment) {
                    amount = remaining;
                }

                minPmt = Math.min(minPmt, amount);

                sched.push({
                    installment: installment,
                    amount: parseFloat(amount.toFixed(2)),
                    due_date: paymentDate.toISOString().split('T')[0],
                    status: 'pending'
                });

                remaining = parseFloat((remaining - amount).toFixed(2));
                currentDate = new Date(paymentDate);
                currentDate.setDate(currentDate.getDate() + 1);
                installment++;

                currentPayment = currentPayment * (1 - decreaseRate);
                if (currentPayment < 0.01) {
                    if (remaining > 0) {
                        const lastInstallment = sched[sched.length - 1];
                        lastInstallment.amount = parseFloat((lastInstallment.amount + remaining).toFixed(2));
                        minPmt = Math.min(minPmt, lastInstallment.amount);
                    }
                    break;
                }
                if (installment > 1000) break;
            }
            calculatedNumberOfMonths = installment - 1; // Последний installment после цикла

        } else if (st === 'differentiated_with_interest') {
            const annualInterestRate = parseFloat(rt) / 100;
            const monthlyInterestRate = annualInterestRate / 12;
            if (isNaN(annualInterestRate) || annualInterestRate < 0) {
                throw new Error('Invalid interest rate.');
            }

            let numberOfMonths;
            if (numberOfMonthsOverride) {
                numberOfMonths = numberOfMonthsOverride;
            } else {
                if (ip !== null && !isNaN(ip) && ip > 0) {
                    if (ip > total) throw new Error('Initial payment too high.');
                    const estimatedPrincipal = ip - (total * monthlyInterestRate);
                    if (estimatedPrincipal <= 0) {
                        numberOfMonths = 12; // Default fallback
                        console.log(`[Schedule Calc] Initial payment only covers interest or is too small. Assuming 12 months.`);
                    } else {
                        numberOfMonths = Math.max(1, Math.round(total / estimatedPrincipal));
                        console.log(`[Schedule Calc] Estimated months from initial payment: ${numberOfMonths}`);
                    }
                } else {
                    numberOfMonths = 12; // Default fallback
                    console.log(`[Schedule Calc] Initial payment not provided. Assuming 12 months.`);
                }
            }
            calculatedNumberOfMonths = numberOfMonths;

            fixedPrincipal = total / numberOfMonths;
            currentPrincipal = total;
            currentDate = new Date();

            while (remaining > 0.01 && installment <= numberOfMonths) {
                let paymentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), scheduleDay);
                if (paymentDate <= currentDate) {
                    paymentDate.setMonth(paymentDate.getMonth() + 1);
                }

                const interestForPeriod = currentPrincipal * monthlyInterestRate;
                const principalForPeriod = (installment === numberOfMonths) ? currentPrincipal : fixedPrincipal;
                let totalPayment = principalForPeriod + interestForPeriod;

                if (remaining <= totalPayment) {
                    totalPayment = remaining;
                }

                // Для differentiated_with_interest, минимальный платеж - это последний
                if (installment === numberOfMonths) {
                    minPmt = Math.min(minPmt, totalPayment);
                }

                sched.push({
                    installment: installment,
                    amount: parseFloat(totalPayment.toFixed(2)),
                    due_date: paymentDate.toISOString().split('T')[0],
                    status: 'pending'
                });

                remaining = parseFloat((remaining - totalPayment).toFixed(2));
                currentPrincipal = parseFloat((currentPrincipal - principalForPeriod).toFixed(2));
                currentDate = new Date(paymentDate);
                currentDate.setDate(currentDate.getDate() + 1);
                installment++;

                if (installment > 1000) break;
            }
            if (remaining > 0.01) {
                const lastInstallment = sched[sched.length - 1];
                if (lastInstallment) {
                    lastInstallment.amount = parseFloat((lastInstallment.amount + remaining).toFixed(2));
                    minPmt = Math.min(minPmt, lastInstallment.amount);
                }
            }
        }
        return { schedule: sched, minPayment: minPmt, numberOfMonths: calculatedNumberOfMonths };
    }
    // --- Конец вспомогательной функции ---

    try {
        // 1. Попытка рассчитать график с исходными параметрами
        console.log(`[Schedule Calc] Attempting initial schedule calculation...`);
        let result = generateSchedule(initialPayment, scheduleType, rateInput);
        schedule = result.schedule;
        minPaymentInSchedule = result.minPayment;
        finalNumberOfMonths = result.numberOfMonths;

        // 2. Проверка на минимальный платеж
        if (minPaymentInSchedule < effectiveMinPayment - 0.01) {
            console.log(`[Schedule Calc] Min payment ${formatPKR(minPaymentInSchedule)} is below limit ${formatPKR(effectiveMinPayment)}. Attempting adjustments.`);

            // 3. Попытка 1: Увеличить первый платеж, если он был задан пользователем
            let initialPaymentAdjusted = false;
            if (initialPayment !== null) {
                console.log(`[Schedule Calc] Trying to adjust user-provided initial payment (${formatPKR(initialPayment)})...`);
                // Простая эвристика: увеличить первый платеж на 10% и пересчитать
                let newInitialPayment = Math.min(initialPayment * 1.1, total); // Не более общей суммы
                let newResult;
                try {
                     newResult = generateSchedule(newInitialPayment, scheduleType, rateInput);
                } catch (e) {
                    console.log(`[Schedule Calc] Adjusting initial payment failed in attempt 1: ${e.message}`);
                    newResult = { schedule: [], minPayment: 0, numberOfMonths: null };
                }
                
                if (newResult.minPayment >= minAllowedMonthlyPayment - 0.01) {
                    console.log(`[Schedule Calc] Adjustment successful with new initial payment: ${formatPKR(newInitialPayment)}`);
                    schedule = newResult.schedule;
                    minPaymentInSchedule = newResult.minPayment;
                    finalNumberOfMonths = newResult.numberOfMonths;
                    adjustmentsMade = true;
                    initialPaymentAdjusted = true;
                    infoMessage = `The initial payment was automatically increased to ensure all payments meet the minimum of ${formatPKR(effectiveMinPayment)}.`;
                } else {
                    console.log(`[Schedule Calc] Adjustment with initial payment increase was insufficient.`);
                }
            }

            // 4. Попытка 2: Увеличить количество месяцев (универсальный метод)
            // Делаем это, если предыдущая попытка не помогла или первый платеж не был задан
            if (!initialPaymentAdjusted && minPaymentInSchedule < effectiveMinPayment - 0.01) {
                 console.log(`[Schedule Calc] Trying to increase number of months to meet minimum payment...`);
                 // Оценка необходимого количества месяцев, исходя из минимального платежа
                 // total_amount = monthly_payment * number_of_months (грубая оценка без процентов)
                 // number_of_months = total_amount / monthly_payment
                 let estimatedMonths = Math.ceil(total / effectiveMinPayment);
                 // Ограничиваем разумным пределом, например, 360 месяцев (30 лет)
                 estimatedMonths = Math.min(estimatedMonths, 360);
                 
                 // Убедимся, что оценка больше текущего количества месяцев
                 if (finalNumberOfMonths !== null) {
                     estimatedMonths = Math.max(estimatedMonths, finalNumberOfMonths + 6); // Добавим запас
                 }

                 console.log(`[Schedule Calc] Estimating new number of months: ${estimatedMonths}`);
                 
                 let newResult;
                 try {
                     // Для differentiated_with_interest передаем numberOfMonthsOverride
                     if(scheduleType === 'differentiated_with_interest') {
                         newResult = generateSchedule(initialPayment, scheduleType, rateInput, estimatedMonths);
                     } else {
                         // Для decreasing_fixed, если первый платеж не помог, и мы не можем напрямую задать месяцы,
                         // попробуем уменьшить decrease_rate, если он высокий, или просто сообщим.
                         // Пока что просто сообщим, что график может быть длинным.
                         // Более сложная логика может быть добавлена позже.
                         // Попробуем увеличить estimatedMonths сильнее для decreasing_fixed
                         if (scheduleType === 'decreasing_fixed') {
                              estimatedMonths = Math.max(estimatedMonths, 60); // Минимум 5 лет для убывающего
                              console.log(`[Schedule Calc] For decreasing_fixed, increasing estimate to: ${estimatedMonths}`);
                         }
                         // Пересчитываем с новой оценкой
                         result = generateSchedule(initialPayment, scheduleType, rateInput); // Пересчет с оригинальными параметрами, чтобы получить текущий график
                         // Простая эвристика: если убывающий и мин. платеж мал, то график длинный.
                         // Можно сказать, что график будет длинным.
                         newResult = result; // Используем предыдущий результат, но покажем предупреждение
                     }
                 } catch (e) {
                     console.log(`[Schedule Calc] Adjusting number of months failed: ${e.message}`);
                     newResult = { schedule: [], minPayment: 0, numberOfMonths: null };
                 }
                 
                 if (newResult.minPayment >= minAllowedMonthlyPayment - 0.01) {
                    console.log(`[Schedule Calc] Adjustment by increasing months was successful.`);
                    schedule = newResult.schedule;
                    minPaymentInSchedule = newResult.minPayment;
                    finalNumberOfMonths = newResult.numberOfMonths;
                    adjustmentsMade = true;
                    if(scheduleType === 'differentiated_with_interest') {
                         infoMessage = `The payment schedule was automatically extended to ensure all payments meet the minimum of ${formatPKR(effectiveMinPayment)}.`;
                    } else if (scheduleType === 'decreasing_fixed') {
                         infoMessage = `The payment schedule was adjusted (potentially extended) to ensure all payments meet the minimum of ${formatPKR(effectiveMinPayment)}.`;
                    }
                 } else {
                    // Если и это не помогло, или для decreasing_fixed автоматика не сработала
                    console.log(`[Schedule Calc] Could not automatically adjust to strictly meet minimum payment. Showing warning.`);
                    // Не возвращаем ошибку, а показываем предупреждение в превью
                    // isValid останется true, но будет message
                    infoMessage = `Warning: The smallest payment in this schedule is ${formatPKR(minPaymentInSchedule)}, which is below the recommended minimum of ${formatPKR(effectiveMinPayment)}. The schedule will be created as shown.`;
                 }
            }
        }

        // Если после всех попыток минимальный платеж все еще < 0.01, это критично
        if (minPaymentInSchedule < 0.01) {
             const criticalErrorMsg = "The calculated schedule results in an impossibly small payment. Please review your parameters (rate, initial payment).";
             console.error(`[Schedule Calc] ${criticalErrorMsg}`);
             return {
                schedule: [],
                minPayment: minPaymentInSchedule,
                isValid: false,
                errorMessage: criticalErrorMsg,
                adjustmentsMade: adjustmentsMade,
                message: ""
            };
        }


        console.log(`[Schedule Calc] Final schedule has ~${finalNumberOfMonths || schedule.length} payments, min payment: ${formatPKR(minPaymentInSchedule)}`);
        return {
            schedule: schedule,
            minPayment: minPaymentInSchedule,
            isValid: true, // Считаем валидным, даже если были предупреждения
            errorMessage: null,
            adjustmentsMade: adjustmentsMade,
            message: infoMessage
        };

    } catch (error) {
        console.error('[Schedule Calc] Error:', error);
        return {
            schedule: [],
            minPayment: 0,
            isValid: false,
            errorMessage: `Error calculating schedule: ${error.message || error}`,
            adjustmentsMade: false,
            message: ""
        };
    }
}
// *** КОНЕЦ ОБНОВЛЕННОЙ ФУНКЦИИ РАСЧЕТА ***

// *** ОБНОВЛЕННАЯ ФУНКЦИЯ ПРЕДВАРИТЕЛЬНОГО РАСЧЕТА ***
// Функция для расчета и отображения предварительного расписания (обновленная)
async function calculateAndPreviewSchedule() {
    // --- НАСТРОЙКИ ЛИМИТОВ ДЛЯ ПРЕДПРОСМОТРА ---
    const MAX_INITIAL_PAYMENT_PERCENT = 50; // Максимум 50% от общей суммы для первого платежа
    const MIN_MONTHLY_PAYMENT_PERCENT = 2;   // Минимум 2% от общей суммы для ежемесячного платежа
    // --------------------------

    const totalAmountInput = document.getElementById('createTransactionModal_totalAmount');
    const initialPaymentInput = document.getElementById('createTransactionModal_initialPayment');
    const scheduleDaySelect = document.getElementById('createTransactionModal_schedulePaymentDay');
    const scheduleTypeSelect = document.getElementById('createTransactionModal_scheduleType');
    const decreaseRateInput = document.getElementById('createTransactionModal_decreaseRate');
    const interestRateInput = document.getElementById('createTransactionModal_interestRate');
    const previewContainer = document.getElementById('schedulePreviewContainer');
    const previewContent = document.getElementById('schedulePreviewContent');

    if (!totalAmountInput || !scheduleDaySelect || !scheduleTypeSelect || !previewContainer || !previewContent) {
        // console.warn('Schedule preview elements not found.');
        return; // Не все обязательные элементы найдены, выходим тихо
    }

    const totalAmount = window.parseNumber ? window.parseNumber(totalAmountInput.value) : parseFloat(totalAmountInput.value);
    const initialPaymentValue = initialPaymentInput?.value.trim() || '';
    const initialPayment = initialPaymentValue ? (window.parseNumber ? window.parseNumber(initialPaymentValue) : parseFloat(initialPaymentValue)) : null;

    const scheduleDay = parseInt(scheduleDaySelect.value);
    const scheduleType = scheduleTypeSelect.value;
    let rateInput = null;

    if (scheduleType === 'decreasing_fixed') {
        rateInput = parseFloat(decreaseRateInput?.value);
    } else if (scheduleType === 'differentiated_with_interest') {
        rateInput = parseFloat(interestRateInput?.value);
    }

    // Базовая валидация
    if (isNaN(totalAmount) || totalAmount <= 0) {
         previewContainer.style.display = 'none';
         return;
    }
    if (isNaN(scheduleDay) || scheduleDay < 1 || scheduleDay > 31 || !scheduleType) {
        previewContainer.style.display = 'none';
        return;
    }

    // Валидация ставки/уменьшения
    if ((scheduleType === 'decreasing_fixed' && (rateInput === null || isNaN(rateInput) || rateInput <= 0 || rateInput > 100)) ||
        (scheduleType === 'differentiated_with_interest' && (rateInput === null || isNaN(rateInput) || rateInput < 0 || rateInput > 100))) {
        // Не показываем ошибку в превью, если поля пустые, просто скрываем
        if (rateInput === null || rateInput === "" || (isNaN(rateInput) && rateInput !== "")) {
             previewContainer.style.display = 'none';
             return;
        }
        previewContent.innerHTML = '<p style="color: orange;">Please enter a valid rate/decrease percentage (0.01 - 100).</p>';
        previewContainer.style.display = 'block';
        return;
    }

    // --- ПРОВЕРКА ВЕРХНЕГО ЛИМИТА ДЛЯ ПЕРВОГО ПЛАТЕЖА (ПРЕДПРОСМОТР) ---
    let warningMessage = '';
    if (initialPayment !== null) {
        if (isNaN(initialPayment) || initialPayment <= 0) {
            // Не показываем ошибку в превью, если введено некорректно, просто скрываем или показываем общее сообщение
            // previewContent.innerHTML = '<p style="color: orange;">Please enter a valid initial payment amount or leave it blank.</p>';
            // previewContainer.style.display = 'block';
            // return;
            // Лучше скрыть, чтобы не мешать вводу
            previewContainer.style.display = 'none';
            return;
        }
        if (initialPayment > totalAmount) {
            previewContent.innerHTML = '<p style="color: red;">Initial payment cannot be greater than total amount.</p>';
            previewContainer.style.display = 'block';
            return;
        }
        const maxInitialPayment = totalAmount * (MAX_INITIAL_PAYMENT_PERCENT / 100);
        if (initialPayment > maxInitialPayment) {
            warningMessage = `<p style="color: orange; font-weight: bold;">Warning: Initial payment is above the recommended maximum of ${window.formatPKR ? window.formatPKR(maxInitialPayment) : maxInitialPayment.toFixed(2)} PKR (${MAX_INITIAL_PAYMENT_PERCENT}% of total).</p>`;
        }
    }
    // --- КОНЕЦ ПРОВЕРКИ ВЕРХНЕГО ЛИМИТА (ПРЕДПРОСМОТР) ---

    try {

        // Передаем minPaymentForCalculation как дополнительный аргумент
        const scheduleResult = calculateScheduleLocally(totalAmount, initialPayment, scheduleDay, scheduleType, rateInput, MIN_MONTHLY_PAYMENT_PERCENT, minPaymentForCalculation);
        if (scheduleResult.schedule && scheduleResult.schedule.length > 0) {
        // --- ОБНОВЛЕНИЕ: ДОБАВЛЕНИЕ ИНФОРМАЦИИ ОБ АВТОКОРРЕКТИРОВКЕ И ПРЕДУПРЕЖДЕНИЯХ ---
            let fullWarningMessage = warningMessage; // warningMessage от проверки initial_payment

            if (scheduleResult.adjustmentsMade && scheduleResult.message) {
                // Если были автоматические корректировки
                fullWarningMessage += `<p style="color: #0066cc; font-weight: bold;">Info: ${scheduleResult.message}</p>`;
            } else if (scheduleResult.message) {
                // Если есть информационное сообщение (например, предупреждение)
                fullWarningMessage += `<p style="color: orange; font-weight: bold;">${scheduleResult.message}</p>`;
            }
            // Если scheduleResult.isValid === false, основная ошибка будет отображена ниже
            // --- КОНЕЦ ОБНОВЛЕНИЯ ---
            displaySchedulePreview(scheduleResult.schedule, fullWarningMessage);
        } else {
            // Если scheduleResult.schedule пустой или null
            let errorMsg = 'Please provide more details (rate, initial payment) to generate a preview.';
            if (scheduleResult.errorMessage) {
                 errorMsg = scheduleResult.errorMessage; // Приоритет у сообщения об ошибке
            }
            // Для предпросмотра не показываем критические ошибки, если данных недостаточно
            if (errorMsg.includes("Invalid total amount") || errorMsg.includes("Please provide more details")) {
                 previewContainer.style.display = 'none';
                 return;
            }
            previewContent.innerHTML = `<p style="color: orange;">${errorMsg}</p>`;
            previewContainer.style.display = 'block';
        }

    } catch (error) {
        console.error('Error calculating schedule:', error);
        // В превью не показываем внутренние ошибки JS, просто скрываем
        previewContainer.style.display = 'none';
        // previewContent.innerHTML = `<p style="color: red;">Error calculating schedule: ${error.message}</p>`;
        // previewContainer.style.display = 'block';
    }
}

// Функция для отображения предварительного расписания (обновленная)
function displaySchedulePreview(schedule, warningMessage = '') {
    const previewContainer = document.getElementById('schedulePreviewContainer');
    const previewContent = document.getElementById('schedulePreviewContent');

    if (!previewContainer || !previewContent || !schedule || schedule.length === 0) {
        if (previewContainer) previewContainer.style.display = 'none';
        return;
    }

    let tableHTML = warningMessage;
    tableHTML += `
        <div class="schedule-preview-wrapper">
        <table class="schedule-preview-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Due Date</th>
                    <th>Amount (PKR)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    schedule.forEach(payment => {
        tableHTML += `
            <tr>
                <td class="installment-cell">${payment.installment}</td>
                <td class="date-cell">${new Date(payment.due_date).toLocaleDateString('en-GB')}</td>
                <td class="amount-cell">${window.formatPKR ? window.formatPKR(payment.amount) : payment.amount.toFixed(2)}</td>
                <td class="status-cell"><span class="status-badge status-pending">Pending</span></td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
        </div>
        <p style="margin-top: 10px; font-size: 0.9em; color: #555;">
            <strong>Total Payments:</strong> ${schedule.length} | 
            <strong>Total Amount:</strong> ${window.formatPKR ? window.formatPKR(schedule.reduce((sum, p) => sum + p.amount, 0)) : schedule.reduce((sum, p) => sum + p.amount, 0).toFixed(2)} PKR
        </p>
    `;

    previewContent.innerHTML = tableHTML;
    previewContainer.style.display = 'block';
}

/**
 * Функция для открытия модального окна просмотра транзакции
 * @param {string} transactionId - ID транзакции
 */
function openViewTransactionModal(transactionId) {
    if (!transactionId) {
        if (typeof showNotification === 'function') showNotification('error', 'Transaction ID is required');
        return;
    }

    const currentTransactionIdElement = document.getElementById('currentTransactionId');
    if (currentTransactionIdElement) currentTransactionIdElement.value = transactionId;

    if (typeof openModal === 'function') openModal('viewTransactionModal');

    // Загрузка данных — это не задача этого файла!
    // Она делается в transaction.js → loadTransactionDetails()
}


// Прикрепляем к глобальному объекту
window.openAddPaymentModal = openAddPaymentModal;
window.openCreateTransactionModal = openCreateTransactionModal;
window.openViewTransactionModal = openViewTransactionModal;
window.createTransaction = createTransaction;

const modalCreateBtn = document.querySelector('.create-transaction-btn');
if (modalCreateBtn) {
    modalCreateBtn.replaceWith(modalCreateBtn.cloneNode(true));
    const freshBtn = document.querySelector('.create-transaction-btn');
    freshBtn.addEventListener('click', function (e) {
        e.preventDefault();
        createTransaction();
    });
}