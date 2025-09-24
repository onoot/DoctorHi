// client.js
const baseURL = `https://${window?.location?.host}`;

document.addEventListener('DOMContentLoaded', function () {

    const reloadBTN = document.getElementById('reload');
    if (reloadBTN) {
        reloadBTN.addEventListener('click', () => getObject());
    }

    const token = localStorage.getItem('client_token');
    if (token) {
        verifyToken();
    }

    const transferForm = document.getElementById('transferForm');
    const documentsContainer = document.getElementById('documentsContainer');
    const authSection = document.getElementById('authSection');
    const transferSection = document.getElementById('transferSection');
    const name = document.getElementById('name');
    const cnic = document.getElementById('cnic');
    const objectSell = document.getElementById('object_sell');

    // --- Добавление обработчика для кнопки выхода ---
    const logoutBtn = document.getElementById('logoutBtn'); // Предполагается, что ID кнопки такой
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    // --- Конец добавления ---

    async function verifyToken() {
        const token = localStorage.getItem('client_token');
        if (!token) return; // Если токена нет, ничего не делаем

        try {
            const verifyResponse = await fetch(baseURL + '/api/auth/check-auth', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!verifyResponse.ok) {
                 // Если токен недействителен, выходим
                 console.warn('Token invalid, logging out.');
                 logout();
                 return;
            }

            const verifyResponseData = await verifyResponse.json();
            if(verifyResponseData.user) {
                 localStorage.setItem('users', JSON.stringify(verifyResponseData.user));
                 getUsers(); // Обновляем UI после верификации
            }
        } catch (error) {
             console.error('Error verifying token:', error);
             // В случае ошибки сети, можно решить, выходить ли автоматически
             // logout();
        }
    }

    async function getUsers() {
        const user = JSON.parse(localStorage.getItem('users'));
        if (name) name.value = user?.name || '';
        if (cnic) cnic.value = user?.cnic || '';

        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        const type = urlParams.get('type');

        if (objectSell) objectSell.value = `${id || ''} ${type || ''}`.trim();

        console.log("User loaded:", user?.name);
    }
    getUsers();

    /**
     * Функция выхода из аккаунта
     */
    function logout() {
        localStorage.removeItem('client_token');
        localStorage.removeItem('users');
        // Перенаправляем на страницу входа или главную
        window.location.href = '/login.html'; // Или другой URL вашей страницы входа
    }

    /**
     * Скачивает файл по ID как бинарный поток и запускает сохранение
     * @param {number} fileId - ID файла в таблице transaction_files
     */
    async function downloadFileById(fileId) {
        if (!fileId) {
            showNotification('error', 'File ID is required');
            return;
        }

        const token = localStorage.getItem('client_token');
        if (!token) {
            showNotification('error', 'Authentication required');
            // window.location.href = '/login.html'; // Опционально: перенаправить на логин
            return;
        }

        try {
            const response = await fetch(`${baseURL}/api/v1/client/files/${fileId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to download file: ${response.status}`);
            }

            const contentDisposition = response.headers.get('content-disposition');
            let fileName = `file_${fileId}`;

            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i);
                if (fileNameMatch && fileNameMatch[1]) {
                    try {
                        fileName = decodeURIComponent(fileNameMatch[1]);
                    } catch (e) {
                        fileName = fileNameMatch[1];
                    }
                }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

            showNotification('success', 'File downloaded successfully');

        } catch (error) {
            console.error('Error downloading file:', error);
            showNotification('error', error.message || 'Failed to download file');
        }
    }

    async function getObject() {
        try {
            const token = localStorage.getItem('client_token');
            if (!token) {
                showNotification('error', 'Authentication required. Please log in.');
                // window.location.href = '/login.html'; // Опционально
                return;
            }

            const transactionsResponse = await fetch(`${baseURL}/api/v1/client/transactions/my`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!transactionsResponse.ok) {
                if (transactionsResponse.status === 401 || transactionsResponse.status === 403) {
                     showNotification('error', 'Session expired. Please log in again.');
                     logout();
                     return;
                }
                throw new Error(`Failed to fetch transactions (${transactionsResponse.status})`);
            }

            const responseData = await transactionsResponse.json();

            if (!responseData.success || !Array.isArray(responseData.transactions)) {
                throw new Error('Invalid response format for transactions');
            }

            const transactions = responseData.transactions;
            const activeTransactions = transactions.filter(transaction =>
                transaction.status === 'approved' || transaction.status === 'pending'
            );

            if (activeTransactions.length === 0) {
                console.log("No active transactions found");
                // Исправлена ошибка в URL
                window.location.href = `transfer-ownership.html`; // Или другая подходящая страница
                return;
            }

            const transaction = activeTransactions[0];

            const response = await fetch(`${baseURL}/api/v1/client/transactions/${transaction.id}/details`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                 if (response.status === 401 || response.status === 403) {
                     showNotification('error', 'Session expired. Please log in again.');
                     logout();
                     return;
                 }
                console.log("Failed to fetch transaction details");
                throw new Error(`Failed to fetch object data (${response.status})`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to get transaction details');
            }

            console.log("Transaction details:", data);

            updateDocumentsTable(data.transaction.files || []);
            updateWitnessesTable(data.transaction.witnesses || {});

            // === ОБНОВЛЕНИЕ: Передаем ПОЛНЫЙ график платежей ===
            // Предполагается, что data.payments - это массив с полным графиком
            // включая совершенные ({status: 'paid', payment_date: ...}) и
            // предстоящие ({status: 'pending', due_date: ...})
            updatePaymentsTable(
                data.payments || [], // Передаем полный график
                data.transaction.total_amount
            );
            // === КОНЕЦ ОБНОВЛЕНИЯ ===

            // updateOwnershipHistory(data.ownership_history || []); // Закомментировано, как в исходном коде

            const hasActiveTransaction = data.transaction &&
                (data.transaction.status === 'approved' || data.transaction.status === 'pending');

            if (transferForm) {
                const nameInput = document.getElementById('name');
                const cnicInput = document.getElementById('cnic');
                const submitBtn = transferForm.querySelector('.submit-btn');

                if (hasActiveTransaction) {
                    if (nameInput) nameInput.disabled = true;
                    if (cnicInput) cnicInput.disabled = true;
                    if (submitBtn) submitBtn.style.display = 'none';
                } else {
                    if (nameInput) nameInput.disabled = false;
                    if (cnicInput) cnicInput.disabled = false;
                    if (submitBtn) submitBtn.style.display = 'block';
                }
            }

        } catch (error) {
            console.error('Error fetching object data:', error);
            showNotification('error', error.message || 'Failed to load transaction details');
            // В случае критической ошибки можно рассмотреть logout()
            // logout();
        }
    }

    function updateDocumentsTable(files) {
        const agreementRow = document.getElementById('agreementRow');
        const receiptRow = document.getElementById('receiptRow');
        const meetingVideoRow = document.getElementById('meetingVideoRow');

        const resetRow = (row) => {
            if (!row) return;
            const statusCell = row.querySelector('.status-cell');
            const dateCell = row.querySelector('.date-cell');
            const filenameCell = row.querySelector('.filename-cell');

            if (statusCell) statusCell.textContent = 'Not uploaded';
            if (dateCell) dateCell.textContent = '-';
            if (filenameCell) {
                filenameCell.textContent = '-';
                const oldButton = filenameCell.querySelector('.download-btn');
                if (oldButton) oldButton.remove();
            }
        };

        resetRow(agreementRow);
        resetRow(receiptRow);
        resetRow(meetingVideoRow);

        if (!files || files.length === 0) {
            return;
        }

        files.forEach(file => {
            let targetRow = null;

            if (file.category === 'agreement') {
                targetRow = agreementRow;
            } else if (file.category === 'receipt') {
                targetRow = receiptRow;
            } else if (file.category === 'video') {
                targetRow = meetingVideoRow;
            }

            if (targetRow) {
                const statusCell = targetRow.querySelector('.status-cell');
                const dateCell = targetRow.querySelector('.date-cell');
                const filenameCell = targetRow.querySelector('.filename-cell');

                if (statusCell) {
                    statusCell.innerHTML = `<i class="fas fa-check-circle" style="color: green;"></i> Uploaded`;
                }
                if (dateCell) {
                    dateCell.textContent = formatDate(file.created_at);
                }

                if (filenameCell) {
                    filenameCell.textContent = '';
                    const fileNameSpan = document.createElement('span');
                    fileNameSpan.textContent = file.original_name || file.file_name;
                    filenameCell.appendChild(fileNameSpan);

                    const downloadBtn = document.createElement('button');
                    downloadBtn.type = 'button';
                    downloadBtn.className = 'download-btn';
                    downloadBtn.style.marginLeft = '10px';
                    downloadBtn.style.padding = '4px 8px';
                    downloadBtn.style.fontSize = '12px';
                    downloadBtn.style.border = 'none';
                    downloadBtn.style.borderRadius = '4px';
                    downloadBtn.style.backgroundColor = '#007bff';
                    downloadBtn.style.color = 'white';
                    downloadBtn.style.cursor = 'pointer';
                    downloadBtn.textContent = 'Download';

                    downloadBtn.addEventListener('click', function () {
                        downloadFileById(file.id);
                    });

                    filenameCell.appendChild(downloadBtn);
                }
            }
        });
    }

    function updateWitnessesTable(witnesses) {
        const witness1Row = document.getElementById('witness1Row');
        const witness2Row = document.getElementById('witness2Row');

        const resetWitnessRow = (row) => {
            if (!row) return;
            const nameCell = row.querySelector('.name-cell');
            const cnicCell = row.querySelector('.cnic-cell');
            const phoneCell = row.querySelector('.phone-cell');

            if (nameCell) nameCell.textContent = 'N/A';
            if (cnicCell) cnicCell.textContent = 'N/A';
            if (phoneCell) phoneCell.textContent = 'N/A';
        };

        resetWitnessRow(witness1Row);
        resetWitnessRow(witness2Row);

        if (!witnesses) return;

        if (witnesses.witness1 && witness1Row) {
            const nameCell = witness1Row.querySelector('.name-cell');
            const cnicCell = witness1Row.querySelector('.cnic-cell');
            const phoneCell = witness1Row.querySelector('.phone-cell');

            if (nameCell) nameCell.textContent = witnesses.witness1.name || 'N/A';
            if (cnicCell) cnicCell.textContent = witnesses.witness1.cnic || 'N/A';
            if (phoneCell) phoneCell.textContent = witnesses.witness1.phone || 'N/A';
        }

        if (witnesses.witness2 && witness2Row) {
            const nameCell = witness2Row.querySelector('.name-cell');
            const cnicCell = witness2Row.querySelector('.cnic-cell');
            const phoneCell = witness2Row.querySelector('.phone-cell');

            if (nameCell) nameCell.textContent = witnesses.witness2.name || 'N/A';
            if (cnicCell) cnicCell.textContent = witnesses.witness2.cnic || 'N/A';
            if (phoneCell) phoneCell.textContent = witnesses.witness2.phone || 'N/A';
        }
    }

    /**
     * Обновление таблицы платежей с графиком
     * @param {Array} fullPaymentSchedule - Полный график платежей (включая совершенные и предстоящие)
     * @param {number} totalAmount - Общая сумма сделки
     */
    function updatePaymentsTable(fullPaymentSchedule, totalAmount) {
        const paymentsTableBody = document.querySelector('#paymentsTable tbody');
        if (!paymentsTableBody) {
            console.error('Payments table body (#paymentsTable tbody) not found in DOM');
            return;
        }

        // Очищаем таблицу
        paymentsTableBody.innerHTML = '';

        // Проверка наличия данных графика
        if (!fullPaymentSchedule || fullPaymentSchedule.length === 0) {
            paymentsTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 15px;">
                    No payment schedule available
                </td>
            </tr>
            `;
            updateAmountSummary(totalAmount, 0); // Обновляем суммы: всего 0 оплачено
            return;
        }

        let paidAmount = 0;
        let sortedSchedule = [];

        try {
            // Сортируем график по дате (плана или оплаты)
            sortedSchedule = [...fullPaymentSchedule].sort((a, b) => {
                // Используем payment_date если есть, иначе due_date
                const dateA_str = a.payment_date || a.due_date;
                const dateB_str = b.payment_date || b.due_date;
                if (!dateA_str && !dateB_str) return 0;
                if (!dateA_str) return 1; // Элементы без даты в конец
                if (!dateB_str) return -1;
                return new Date(dateA_str) - new Date(dateB_str);
            });
        } catch (sortError) {
            console.error('Error sorting payment schedule:', sortError);
            sortedSchedule = fullPaymentSchedule; // Используем без сортировки
        }

        // Перебираем отсортированный график
        sortedSchedule.forEach((item, index) => {
            // Номер в таблице (может отличаться от installment)
            const displayInstallment = index + 1;

            const row = document.createElement('tr');

            // Сумма платежа
            const amount = parseFloat(item.amount) || 0;
            // Считаем оплаченную сумму
            if (item.status === 'paid' || item.status === 'confirmed') {
                paidAmount += amount;
            }

            // Дата: фактическая или плановая
            const displayDate = item.payment_date ? formatDate(item.payment_date) : (item.due_date ? formatDate(item.due_date) : 'N/A');

            // Статус и класс для бейджа
            const statusClass = getStatusClass(item.status);
            const statusText = formatStatus(item.status);

            // Метод оплаты (только для совершенных)
            const paymentMethod = (item.payment_date || item.status === 'paid' || item.status === 'confirmed') ?
                formatPaymentMethod(item.payment_method) : '-';

            // Примечания/ноты (если есть)
            const notes = item.notes || '-';

            // Чек/квитанция (если есть)
            let receiptCellContent = '-';
            if (item.receipt_file_id) {
                // Создаем кнопку скачивания, если есть ID файла чека
                const downloadBtn = document.createElement('button');
                downloadBtn.type = 'button';
                downloadBtn.className = 'download-btn';
                downloadBtn.style.padding = '4px 8px';
                downloadBtn.style.fontSize = '12px';
                downloadBtn.style.border = 'none';
                downloadBtn.style.borderRadius = '4px';
                downloadBtn.style.backgroundColor = '#28a745';
                downloadBtn.style.color = 'white';
                downloadBtn.style.cursor = 'pointer';
                downloadBtn.textContent = 'Download Receipt';
                downloadBtn.setAttribute('data-file-id', item.receipt_file_id);
                downloadBtn.addEventListener('click', function () {
                    const id = this.getAttribute('data-file-id');
                    if (id) downloadFileById(id);
                });
                receiptCellContent = downloadBtn.outerHTML; // Преобразуем кнопку в HTML строку
            } else if (item.file_path && !item.receipt_file_id) {
                 // Старый способ, если file_path передается напрямую (менее предпочтителен)
                 receiptCellContent = `<a href='${item.file_path.replace(/^\.\.\//, baseURL + '/')}' target='_blank'>${item.original_name || 'Receipt'}</a>`;
            }


            row.innerHTML = `
                <td>${displayInstallment}</td>
                <td>${displayDate}</td>
                <td>${formatPKR(amount)}</td>
                <td>${paymentMethod}</td>
                <td>${notes}</td>
                <td>${receiptCellContent}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </td>
            `;
            paymentsTableBody.appendChild(row);
        });

        // Обновляем сводку по суммам
        updateAmountSummary(totalAmount, paidAmount);
    }

    /**
     * Обновление сводной информации по суммам
     * @param {number} totalAmount - Общая сумма сделки
     * @param {number} paidAmount - Оплаченная сумма
     */
    function updateAmountSummary(totalAmount, paidAmount) {
        const totalAmountEl = document.getElementById('totalAmount');
        const paidAmountEl = document.getElementById('paidAmount');
        const remainingAmountEl = document.getElementById('remainingAmount');

        const total = parseFloat(totalAmount) || 0;
        const paid = parseFloat(paidAmount) || 0;
        const remaining = total - paid;

        if (totalAmountEl) totalAmountEl.textContent = formatPKR(total);
        if (paidAmountEl) paidAmountEl.textContent = formatPKR(paid);
        if (remainingAmountEl) remainingAmountEl.textContent = formatPKR(remaining);
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        // Проверка на валидность даты
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function formatPKR(amount) {
        if (amount === null || amount === undefined) return 'N/A';
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(num)) return 'N/A';
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR'
        }).format(num);
    }

    function formatPaymentMethod(method) {
        if (!method) return 'N/A';
        const methods = {
            'cash': 'Cash',
            'bank_transfer': 'Bank Transfer',
            'credit_card': 'Credit Card',
            'other': 'Other'
        };
        return methods[method] || method.charAt(0).toUpperCase() + method.slice(1);
    }

    function formatStatus(status) {
        if (!status) return 'N/A';
        const statuses = {
            'pending': 'Pending',
            'paid': 'Paid',
            'confirmed': 'Confirmed', // Добавлен статус confirmed
            'cancelled': 'Cancelled',
            'overdue': 'Overdue' // Добавлен статус overdue
        };
        return statuses[status] || status.charAt(0).toUpperCase() + status.slice(1);
    }

    function getStatusClass(status) {
        // Добавлены классы для новых статусов
        const classes = {
            'pending': 'status-pending',
            'paid': 'status-paid',
            'confirmed': 'status-paid', // confirmed тоже зеленый
            'cancelled': 'status-cancelled',
            'overdue': 'status-overdue' // overdue красный
        };
        return classes[status] || '';
    }
    // --- Конец функций форматирования ---

    // Вызываем функцию при загрузке страницы
    getObject();
});