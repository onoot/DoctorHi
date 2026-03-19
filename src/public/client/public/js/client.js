// client.js
const baseURL = `http://${window?.location?.host}`;

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
            window.location.href = `transfer-ownership.html`;
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

        // ИСПРАВЛЕНО: Заполняем поле object_sell данными из API
        const objectSell = document.getElementById('object_sell');
        if (objectSell && data.transaction) {
            // Формируем строку с информацией о объекте
            const propertyInfo = `${data.transaction.property_name || ''} (${data.transaction.property_id || ''}) - ${data.transaction.property_type || ''}, Area: ${data.transaction.area || 'N/A'} sqft`;
            objectSell.value = propertyInfo;
        }

        updateDocumentsTable(data.transaction.files || []);
        updateWitnessesTable(data.transaction.witnesses || {});
        console.log("SDF", data)
        updatePaymentsTable(data.transaction.payments || [], data.transaction.total_amount);

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
    }
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

    // Добавь это в начало файла, после определения baseURL
let isLoading = false;

// Функция для показа/скрытия прелоадера
function showLoader(show) {
    isLoading = show;
    const loader = document.getElementById('globalLoader');
    if (!loader && show) {
        // Создаем прелоадер, если его нет
        const loaderHTML = `
            <div id="globalLoader" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.8);
                z-index: 9999;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid #F8DC78;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                <p style="margin-top: 20px; color: #333; font-weight: 500;">Loading transaction details...</p>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', loaderHTML);
    } else if (loader && !show) {
        loader.remove();
    }
}

// Обновленная функция getObject с прелоадером
async function getObject() {
    try {
        showLoader(true); // Показываем прелоадер
        
        const token = localStorage.getItem('client_token');
        if (!token) {
            showNotification('error', 'Authentication required. Please log in.');
            showLoader(false);
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
            window.location.href = `transfer-ownership.html`;
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

        // Заполняем поле object_sell данными из API
        const objectSell = document.getElementById('object_sell');
        if (objectSell && data.transaction) {
            const propertyInfo = `${data.transaction.property_name || ''} (${data.transaction.property_id || ''}) - ${data.transaction.property_type || ''}, Area: ${data.transaction.area || 'N/A'} sqft`;
            objectSell.value = propertyInfo;
        }

        updateDocumentsTable(data.transaction.files || []);
        updateWitnessesTable(data.transaction.witnesses || {});
        updatePaymentsTable(data.transaction.payments || [], data.transaction.total_amount);

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

        showLoader(false); // Скрываем прелоадер

    } catch (error) {
        console.error('Error fetching object data:', error);
        showNotification('error', error.message || 'Failed to load transaction details');
        showLoader(false); // Скрываем прелоадер в случае ошибки
    }
}

// Обновленная функция updateDocumentsTable с выровненными кнопками
function updateDocumentsTable(files) {
    const agreementRow = document.getElementById('agreementRow');
    const proofRow = document.getElementById('proofRow');
    const meetingVideoRow = document.getElementById('meetingVideoRow');

    const resetRow = (row) => {
        if (!row) return;
        const statusCell = row.querySelector('.status-cell');
        const dateCell = row.querySelector('.date-cell');
        const filenameCell = row.querySelector('.filename-cell');

        if (statusCell) statusCell.innerHTML = 'Not uploaded';
        if (dateCell) dateCell.textContent = '-';
        if (filenameCell) {
            filenameCell.innerHTML = '-';
        }
    };

    resetRow(agreementRow);
    resetRow(proofRow);
    resetRow(meetingVideoRow);

    if (!files || files.length === 0) {
        return;
    }

    files.forEach(file => {
        let targetRow = null;

        if (file.category === 'agreement') {
            targetRow = agreementRow;
        } else if (file.category === 'proof_documents') {
            targetRow = proofRow;
        } else if (file.category === 'video') {
            targetRow = meetingVideoRow;
        }

        if (targetRow) {
            const statusCell = targetRow.querySelector('.status-cell');
            const dateCell = targetRow.querySelector('.date-cell');
            const filenameCell = targetRow.querySelector('.filename-cell');

            if (statusCell) {
                statusCell.innerHTML = '<i class="fas fa-check-circle" style="color: green;"></i> Uploaded';
            }
            if (dateCell) {
                dateCell.textContent = formatDate(file.created_at);
            }

            if (filenameCell) {
                filenameCell.innerHTML = '';
                
                // Создаем контейнер для выравнивания
                const contentWrapper = document.createElement('div');
                contentWrapper.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    gap: 10px;
                `;
                
                // Название файла с ограничением длины
                const fileNameSpan = document.createElement('span');
                let fileName = file.original_name || file.file_name;
                if (fileName.length > 30) {
                    fileName = fileName.substring(0, 27) + '...';
                }
                fileNameSpan.textContent = fileName;
                fileNameSpan.style.cssText = `
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    flex: 1;
                `;
                
                // Кнопка скачивания фиксированного размера
                const downloadBtn = document.createElement('button');
                downloadBtn.type = 'button';
                downloadBtn.className = 'download-btn';
                downloadBtn.style.cssText = `
                    margin-left: 10px;
                    padding: 6px 12px;
                    font-size: 12px;
                    border: none;
                    border-radius: 4px;
                    background-color: #007bff;
                    color: white;
                    cursor: pointer;
                    min-width: 70px;
                    height: 30px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    flex-shrink: 0;
                `;
                downloadBtn.textContent = 'Download';
                
                downloadBtn.addEventListener('mouseenter', function() {
                    this.style.backgroundColor = '#0056b3';
                });
                
                downloadBtn.addEventListener('mouseleave', function() {
                    this.style.backgroundColor = '#007bff';
                });

                downloadBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    // Показываем загрузку на кнопке
                    const originalText = this.textContent;
                    this.textContent = '...';
                    this.disabled = true;
                    
                    downloadFileById(file.id).finally(() => {
                        this.textContent = originalText;
                        this.disabled = false;
                    });
                });

                contentWrapper.appendChild(fileNameSpan);
                contentWrapper.appendChild(downloadBtn);
                filenameCell.appendChild(contentWrapper);
            }
        }
    });
}

// Обновленная функция updatePaymentsTable с выровненными кнопками
function updatePaymentsTable(fullPaymentSchedule, totalAmount) {
    const paymentsTableBody = document.querySelector('#paymentsTable tbody');
    if (!paymentsTableBody) {
        console.error('Payments table body (#paymentsTable tbody) not found in DOM');
        return;
    }

    paymentsTableBody.innerHTML = '';

    if (!fullPaymentSchedule || fullPaymentSchedule.length === 0) {
        paymentsTableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 15px;">
                No payment schedule available
            </td>
        </tr>
        `;
        updateAmountSummary(totalAmount, 0);
        return;
    }

    let paidAmount = 0;
    let sortedSchedule = [];

    try {
        sortedSchedule = [...fullPaymentSchedule].sort((a, b) => {
            const dateA_str = a.payment_date || a.due_date;
            const dateB_str = b.payment_date || b.due_date;
            if (!dateA_str && !dateB_str) return 0;
            if (!dateA_str) return 1;
            if (!dateB_str) return -1;
            return new Date(dateA_str) - new Date(dateB_str);
        });
    } catch (sortError) {
        console.error('Error sorting payment schedule:', sortError);
        sortedSchedule = fullPaymentSchedule;
    }

    sortedSchedule.forEach((item, index) => {
        const displayInstallment = index + 1;
        const row = document.createElement('tr');
        const amount = parseFloat(item.amount) || 0;

        if (item.status === 'paid' || item.status === 'confirmed') {
            paidAmount += amount;
        }

        const displayDate = item.payment_date ? formatDate(item.payment_date) : 
                          (item.due_date ? formatDate(item.due_date) : 'N/A');

        const statusClass = getStatusClass(item.status);
        const statusText = formatStatus(item.status);
        const paymentMethod = formatPaymentMethod(item.payment_method);
        const notes = item.notes || '-';

        // Создаем ячейку для квитанции с выровненной кнопкой
        let receiptCell = '-';
        if (item.receipt_file_id) {
            receiptCell = `<button type="button" class="download-btn receipt-download-btn" data-file-id="${item.receipt_file_id}" style="padding: 6px 12px; font-size: 12px; border: none; border-radius: 4px; background-color: #28a745; color: white; cursor: pointer; min-width: 120px; height: 30px; display: inline-flex; align-items: center; justify-content: center;">Download Receipt</button>`;
        } else if (item.file_path) {
            receiptCell = '<span style="color: #28a745;">✓ Uploaded</span>';
        }

        row.innerHTML = `
            <td style="text-align: center;">${displayInstallment}</td>
            <td>${displayDate}</td>
            <td style="text-align: right;">${formatPKR(amount)}</td>
            <td>${paymentMethod}</td>
            <td>${notes}</td>
            <td style="text-align: center;">${receiptCell}</td>
            <td style="text-align: center;">
                <span class="status-badge ${statusClass}" style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${statusText}
                </span>
            </td>
        `;
        paymentsTableBody.appendChild(row);
    });

    // Добавляем обработчики для кнопок скачивания с состоянием загрузки
    paymentsTableBody.querySelectorAll('.receipt-download-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const fileId = this.getAttribute('data-file-id');
            if (fileId) {
                const originalText = this.textContent;
                this.textContent = 'Downloading...';
                this.disabled = true;
                
                downloadFileById(fileId).finally(() => {
                    this.textContent = originalText;
                    this.disabled = false;
                });
            }
        });
    });

    updateAmountSummary(totalAmount, paidAmount);
}

// Добавляем стили для кнопок в CSS (можно добавить в существующий CSS)
const buttonStyles = `
    <style>
        .download-btn {
            transition: all 0.3s ease;
            font-weight: 500;
        }
        
        .download-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .download-btn:active {
            transform: translateY(0);
        }
        
        .download-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .filename-cell {
            vertical-align: middle;
        }
        
        #paymentsTable td {
            vertical-align: middle;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .status-paid {
            background-color: #d4edda;
            color: #155724;
        }
        
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }
        
        .status-cancelled {
            background-color: #f8d7da;
            color: #721c24;
        }
        
        .status-overdue {
            background-color: #f8d7da;
            color: #721c24;
        }
    </style>
`;

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