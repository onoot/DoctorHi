const baseURL = `https://${window?.location?.host}`;
document.addEventListener('DOMContentLoaded', function () {

    const reloadBTN = document.getElementById('reload')
    reloadBTN.addEventListener('click', () => getObject())
    const token = localStorage.getItem('client_token');

    if (token) {
        verifyToken();
    }
    const transferForm = document.getElementById('transferForm');
    const documentsContainer = document.getElementById('documentsContainer');
    const ownershipHistoryTable = document.getElementById('ownershipHistoryTable');

    const authSection = document.getElementById('authSection');
    const transferSection = document.getElementById('transferSection');

    const name = document.getElementById('name');
    const cnic = document.getElementById('cnic');
    const objectSell = document.getElementById('object_sell');

    async function verifyToken() {
        const token = localStorage.getItem('client_token');
        const verifyResponse = await fetch(baseURL + '/api/auth/check-auth', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const verifyResponseData = await verifyResponse.json();
        localStorage.setItem('users', JSON.stringify(verifyResponseData.user));
    }

    async function getUsers() {
        const user = JSON.parse(localStorage.getItem('users'));
        if (name) name.value = user?.name;
        if (cnic) cnic.value = user?.cnic;

        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        const type = urlParams.get('type');

        if (objectSell) objectSell.value = `${id} ${type}`;

        console.log("user", user?.name);
    }
    getUsers();

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

            // Получаем тип контента и имя файла из заголовков
            const contentType = response.headers.get('content-type');
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

            // Читаем как Blob
            const blob = await response.blob();

            // Создаём ссылку и эмулируем клик для скачивания
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();

            // Очищаем URL объекта
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
                return;
            }

            // Получаем список транзакций пользователя
            const transactionsResponse = await fetch(`${baseURL}/api/v1/client/transactions/my`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!transactionsResponse.ok) {
                throw new Error('Failed to fetch transactions');
            }

            const responseData = await transactionsResponse.json();

            // Проверяем, что данные содержат массив транзакций
            if (!responseData.success || !Array.isArray(responseData.transactions)) {
                throw new Error('Invalid response format for transactions');
            }

            const transactions = responseData.transactions;

            // Фильтруем только активные транзакции (approved или pending)
            const activeTransactions = transactions.filter(transaction =>
                transaction.status === 'approved' || transaction.status === 'pending'
            );

            if (activeTransactions.length === 0) {
                console.log("No active transactions found");
                window.location.href = `transfer-ownership.html}`;
                return;
            }

            // Берем первую активную транзакцию
            const transaction = activeTransactions[0];

            // Получаем детальную информацию о транзакции
            const response = await fetch(`${baseURL}/api/v1/client/transactions/${transaction.id}/details`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.log("Failed to fetch transaction details");
                throw new Error('Failed to fetch object data');
            }

            const data = await response.json();

            // Проверяем успешный ответ
            if (!data.success) {
                throw new Error(data.message || 'Failed to get transaction details');
            }

            console.log("Transaction details:", data);

            // Обновляем таблицу документов
            updateDocumentsTable(data.transaction.files || []);

            // Обновляем таблицу свидетелей
            updateWitnessesTable(data.transaction.witnesses || {});

            // Обновляем таблицу платежей с общей суммой сделки
            updatePaymentsTable(
                data.transaction.payments || [],
                data.transaction.total_amount
            );

            // Обновляем историю владения
            updateOwnershipHistory(data.ownership_history || []);

            // Проверяем статус сделки и управляем формой
            const hasActiveTransaction = data.transaction &&
                (data.transaction.status === 'approved' || data.transaction.status === 'pending');
            const transferForm = document.getElementById('transferForm');

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
        }
    }

    /**
 * Обновление таблицы документов — использует фиксированные строки и скачивает файл по ID
 * @param {Array} files - Массив файлов
 */
    function updateDocumentsTable(files) {
        const agreementRow = document.getElementById('agreementRow');
        const receiptRow = document.getElementById('receiptRow');
        const meetingVideoRow = document.getElementById('meetingVideoRow');

        const resetRow = (row) => {
            if (!row) return;
            row.querySelector('.status-cell').textContent = 'Not uploaded';
            row.querySelector('.date-cell').textContent = '-';
            const filenameCell = row.querySelector('.filename-cell');
            filenameCell.textContent = '-';
            // Удаляем старую кнопку, если есть
            const oldButton = filenameCell.querySelector('.download-btn');
            if (oldButton) oldButton.remove();
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
                targetRow.querySelector('.status-cell').innerHTML = `
                <i class="fas fa-check-circle" style="color: green;">
                    </i> 
                    Uploaded
                `;
                targetRow.querySelector('.date-cell').textContent = formatDate(file.created_at);

                const filenameCell = targetRow.querySelector('.filename-cell');
                filenameCell.textContent = ''; 

                // Добавляем имя файла
                const fileNameSpan = document.createElement('span');
                fileNameSpan.textContent = file.original_name || file.file_name;
                filenameCell.appendChild(fileNameSpan);

                // Создаём кнопку скачивания
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
        });
    }

    /**
 * Обновление таблицы свидетелей — использует фиксированные строки
 * @param {Object} witnesses - Объект со свидетелями
 */
    function updateWitnessesTable(witnesses) {
        const witness1Row = document.getElementById('witness1Row');
        const witness2Row = document.getElementById('witness2Row');

        const resetWitnessRow = (row) => {
            if (!row) return;
            row.querySelector('.name-cell').textContent = 'N/A';
            row.querySelector('.cnic-cell').textContent = 'N/A';
            row.querySelector('.phone-cell').textContent = 'N/A';
        };

        resetWitnessRow(witness1Row);
        resetWitnessRow(witness2Row);

        if (!witnesses) return;

        if (witnesses.witness1 && witness1Row) {
            witness1Row.querySelector('.name-cell').textContent = witnesses.witness1.name || 'N/A';
            witness1Row.querySelector('.cnic-cell').textContent = witnesses.witness1.cnic || 'N/A';
            witness1Row.querySelector('.phone-cell').textContent = witnesses.witness1.phone || 'N/A';
        }

        if (witnesses.witness2 && witness2Row) {
            witness2Row.querySelector('.name-cell').textContent = witnesses.witness2.name || 'N/A';
            witness2Row.querySelector('.cnic-cell').textContent = witnesses.witness2.cnic || 'N/A';
            witness2Row.querySelector('.phone-cell').textContent = witnesses.witness2.phone || 'N/A';
        }
    }

    /**
     * Обновление таблицы платежей
     * @param {Array} payments - Массив платежей
     * @param {number} totalAmount - Общая сумма сделки
     */
    function updatePaymentsTable(payments, totalAmount) {
        const paymentsTableBody = document.querySelector('#paymentsTable tbody');
        if (!paymentsTableBody) return;

        paymentsTableBody.innerHTML = '';

        if (!payments || payments.length === 0) {
            paymentsTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 15px;">
                    No payments recorded
                </td>
            </tr>
        `;
            return;
        }

        let paidAmount = 0;

        payments.forEach(payment => {
            paidAmount += parseFloat(payment.amount);

            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${payment.id}</td>
            <td>${formatDate(payment.payment_date)}</td>
            <td>${formatPKR(payment.amount)}</td>
            <td>${formatPaymentMethod(payment.payment_method)}</td>
            <td>${payment.notes || '-'}</td>
            <td>
                ${payment.file_path ? `<a href='${payment.file_path.replace(/^\.\.\//, baseURL + '/')}' target='_blank'>${payment.original_name || 'Receipt'}</a>` : '-'}
            </td>
            <td>
                <span class="status-badge ${getStatusClass(payment.status)}">
                    ${formatStatus(payment.status)}
                </span>
            </td>
        `;
            paymentsTableBody.appendChild(row);
        });

        // Обновляем информацию о сумме
        const totalAmountEl = document.getElementById('totalAmount');
        const paidAmountEl = document.getElementById('paidAmount');
        const remainingAmountEl = document.getElementById('remainingAmount');

        if (totalAmountEl) totalAmountEl.textContent = formatPKR(totalAmount);
        if (paidAmountEl) paidAmountEl.textContent = formatPKR(paidAmount);
        if (remainingAmountEl) {
            const remaining = totalAmount - paidAmount;
            remainingAmountEl.textContent = formatPKR(remaining);
        }
    }

    /**
     * Обновление истории владения
     * @param {Array} history - Массив истории владения
     */
    function updateOwnershipHistory(history) {
        const historyTableBody = document.querySelector('#ownershipHistoryTable tbody');
        if (!historyTableBody) return;

        historyTableBody.innerHTML = '';

        if (!history || history.length === 0) {
            historyTableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 15px;">
                    No ownership history
                </td>
            </tr>
        `;
            return;
        }

        history.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${record.owner_name || 'Unknown'}</td>
            <td>${record.owner_cnic || 'N/A'}</td>
            <td>${formatDate(record.from_date)}</td>
            <td>${record.to_date ? formatDate(record.to_date) : 'Present'}</td>
        `;
            historyTableBody.appendChild(row);
        });
    }

    /**
     * Получение иконки файла по MIME-типу
     * @param {string} fileType - MIME-тип файла
     * @returns {string} - Класс иконки
     */
    function getFileIcon(fileType) {
        if (!fileType) return 'fa-file';

        if (fileType.startsWith('image/')) return 'fa-file-image';
        if (fileType === 'application/pdf') return 'fa-file-pdf';
        if (fileType.startsWith('video/')) return 'fa-file-video';
        if (fileType.startsWith('audio/')) return 'fa-file-audio';

        return 'fa-file';
    }

    /**
     * Форматирование даты
     * @param {string} dateStr - Строка даты
     * @returns {string} - Отформатированная дата
     */
    function formatDate(dateStr) {
        if (!dateStr) return '';

        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Форматирование суммы в PKR
     * @param {number|string} amount - Сумма
     * @returns {string} - Отформатированная сумма
     */
    function formatPKR(amount) {
        if (amount === null || amount === undefined) return 'N/A';

        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR'
        }).format(num);
    }

    /**
     * Форматирование метода оплаты
     * @param {string} method - Метод оплаты
     * @returns {string} - Отформатированный метод
     */
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

    /**
     * Форматирование статуса
     * @param {string} status - Статус
     * @returns {string} - Отформатированный статус
     */
    function formatStatus(status) {
        if (!status) return 'N/A';

        const statuses = {
            'pending': 'Pending',
            'paid': 'Paid',
            'cancelled': 'Cancelled'
        };

        return statuses[status] || status.charAt(0).toUpperCase() + status.slice(1);
    }

    /**
     * Получение CSS класса для статуса
     * @param {string} status - Статус
     * @returns {string} - CSS класс
     */
    function getStatusClass(status) {
        const classes = {
            'pending': 'status-pending',
            'paid': 'status-paid',
            'cancelled': 'status-cancelled'
        };

        return classes[status] || '';
    }
    // Вызываем функцию при загрузке страницы
    getObject();
});