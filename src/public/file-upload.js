// file-upload.js
// Функции для загрузки файлов

/**
 * Функция для открытия модального окна добавления платежа
 * @param {string} transactionId - ID транзакции
 */
function openAddPaymentModal(transactionId) {
    console.log(`[PAYMENT] Opening add payment modal for transaction ${transactionId}`);
    
    // Устанавливаем ID транзакции
    document.getElementById('paymentTransactionId').value = transactionId;
    
    // Сбрасываем форму
    const form = document.getElementById('addPaymentForm');
    if (form) {
        form.reset();
    }
    
    // Обновляем отображение
    document.getElementById('receiptFileNameDisplay').textContent = 'No file chosen';
    document.getElementById('receiptPreview').innerHTML = '';
    
    // Открываем модальное окно
    openModal('addPaymentModal');
}

/**
 * Функция для открытия модального окна редактирования платежа
 * @param {string} transactionId - ID транзакции
 * @param {string} paymentId - ID платежа
 */
async function openEditPaymentModal(transactionId, paymentId) {
    console.log(`[PAYMENT] Opening edit payment modal for transaction ${transactionId}, payment ${paymentId}`);
    
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`);
        if (response.success && response.payment) {
            const payment = response.payment;
            
            // Заполняем форму
            document.getElementById('paymentTransactionId').value = transactionId;
            document.getElementById('paymentId').value = payment.id;
            document.getElementById('paymentAmount').value = formatPKR(payment.amount);
            document.getElementById('rawPaymentAmount').value = payment.amount;
            document.getElementById('paymentMethod').value = payment.method;
            document.getElementById('paymentStatus').value = payment.status;
            document.getElementById('paymentNotes').value = payment.notes || '';
            
            // Обновляем конвертацию в USD
            await updateUSD(payment.amount);
            
            // Открываем модальное окно
            openModal('editPaymentModal');
        }
    } catch (error) {
        console.error('[PAYMENT] Error loading payment details:', error);
        showNotification('error', 'Error loading payment details');
    }
}

// Функция для скачивания файла
async function downloadFile(file) {
    if (!file || !file.file_name) {
        showNotification('error', 'File not fount');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/uploads/${encodeURIComponent(file.file_name)}?download=true`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Download failed');

        // Создаем ссылку для скачивания
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.original_name || file.file_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showNotification('success', 'Success');
    } catch (error) {
        console.error('Download error:', error);
        showNotification('error', 'Error load');
    }
}

async function uploadMultipleFiles(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const transactionId = document.getElementById('multiUploadTransactionId').value;

    try {
        const response = await fetch(`${API_BASE_URL}/v1/admin/transactions/${transactionId}/documents`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error uploading files');
        }

        const result = await response.json();
        showNotification('success', 'Files uploaded successfully');
        closeModal('multipleUploadModal');
        await loadTransactionFiles(transactionId);
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', error.message || 'Error uploading files');
    }
}

/**
 * Отображение файлов в соответствующих контейнерах
 * @param {Array} files - Массив файлов
 * @param {string} containerId - ID контейнера
 * @param {string} category - Категория файлов
 */
function displayFiles(files, containerId, category) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!files || files.length === 0) {
        container.innerHTML = '<p>No files uploaded yet</p>';
        return;
    }
    
    files.forEach(file => {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.dataset.fileId = file.id;
        
        // Создаем действия с файлом
        const actions = document.createElement('div');
        actions.className = 'file-actions';
        
        // Кнопка просмотра
        const viewBtn = document.createElement('button');
        viewBtn.innerHTML = '<i class="fas fa-eye"></i> View';
        viewBtn.addEventListener('click', () => {
            const fileUrl = `${API_BASE_URL}/v1/admin/files/${file.id}`;
            window.open(fileUrl, '_blank');
        });
        actions.appendChild(viewBtn);

        // Кнопка удаления
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn btn-delete'; 
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteFile(file.id, document.getElementById('currentTransactionId').value, category);
        });
        actions.appendChild(deleteBtn);

        // Создаем превью файла
        let filePreview = '';
        if (file.file_type && file.file_type.startsWith('image/')) {
            filePreview = `<div class="file-preview"><img src="${API_BASE_URL}/v1/admin/files/${file.id}" alt="${file.original_name}"></div>`;
        } else if (file.file_type && file.file_type.includes('pdf')) {
            filePreview = '<i class="fas fa-file-pdf file-icon"></i>';
        } else if (file.file_type && (file.file_type.includes('video') || file.file_type.includes('mp4'))) {
            filePreview = '<i class="fas fa-file-video file-icon"></i>';
        } else {
            filePreview = '<i class="fas fa-file file-icon"></i>';
        }
        
        // Формируем отображение файла
        fileElement.innerHTML = `
            ${filePreview}
            <div class="file-info">
                <span class="file-name">${file.original_name || file.file_name}</span>
                <span class="file-date">${new Date(file.created_at).toLocaleDateString()}</span>
            </div>
        `;
        
        fileElement.appendChild(actions);
        container.appendChild(fileElement);
    });
}

/**
 * Удаление файла
 * @param {string} fileId - ID файла
 * @param {string} transactionId - ID транзакции
 * @param {string} category - Категория файла
 */
async function deleteFile(fileId, transactionId, category) {
    if (!confirm(`Вы уверены, что хотите удалить файл?`)) {
        return;
    }
    
    try {
        const response = await apiRequest(`/v1/admin/files/${fileId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showNotification('success', 'File deleted successfully');
            
            // Обновляем отображение файлов
            if (category === 'agreement' || category === 'video' || category === 'proof') {
                await loadTransactionFiles(transactionId);
            } else if (category === 'receipt') {
                await loadTransactionPayments(transactionId);
            }
        } else {
            throw new Error(response.message || 'Failed to delete file');
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        showNotification('error', 'Error deleting file: ' + error.message);
    }
}
/**
 * Отображение платежей в таблице
 * @param {Array} payments - Массив платежей
 */
function displayPayments(payments) {
    const paymentsTableBody = document.querySelector('#paymentsTable tbody');
    if (!paymentsTableBody) return;
    
    paymentsTableBody.innerHTML = '';
    
    if (!payments || payments.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 20px;">
                No payments found
            </td>
        `;
        paymentsTableBody.appendChild(row);
        return;
    }
    
    payments.forEach(payment => {
        const row = document.createElement('tr');
        
        // ID платежа
        const idCell = document.createElement('td');
        idCell.textContent = payment.id;
        row.appendChild(idCell);
        
        // Сумма
        const amountCell = document.createElement('td');
        amountCell.textContent = formatPKR(payment.amount);
        row.appendChild(amountCell);
        
        // Метод
        const methodCell = document.createElement('td');
        methodCell.textContent = payment.method;
        row.appendChild(methodCell);
        
        // Статус
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge status-${payment.status.toLowerCase()}`;
        statusBadge.textContent = payment.status;
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);
        
        // Дата
        const dateCell = document.createElement('td');
        dateCell.textContent = new Date(payment.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        row.appendChild(dateCell);
        
        // Чек
        const receiptCell = document.createElement('td');
        receiptCell.className = 'receipt-cell';
        
        // Проверяем, есть ли связанный чек (предполагаем, что чеки хранятся в payment.receipt)
        if (payment.receipt || (payment.files && payment.files.some(f => f.category === 'receipt'))) {
            const receipt = payment.receipt || payment.files.find(f => f.category === 'receipt');
            
            receiptCell.innerHTML = `
                <div class="receipt-preview">
                    <img src="${API_BASE_URL}/v1/admin/files/${receipt.id}" 
                         alt="Receipt" class="receipt-thumbnail">
                    <div class="receipt-actions">
                        <a href="${API_BASE_URL}/v1/admin/files/${receipt.id}" target="_blank">
                            <i class="fas fa-eye"></i> View
                        </a>
                        <a href="#" onclick="deleteFile(${receipt.id}, ${payment.transaction_id}, 'receipt'); return false;">
                            <i class="fas fa-trash"></i> Delete
                        </a>
                    </div>
                </div>
            `;
        } else {
            receiptCell.innerHTML = '<span class="no-receipt">No receipt</span>';
        }
        
        row.appendChild(receiptCell);
        
        // Действия
        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions-cell';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn btn-edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        editBtn.addEventListener('click', () => openEditPaymentModal(payment.transaction_id, payment.id));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn btn-delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        deleteBtn.addEventListener('click', () => deletePayment(payment.id, payment.transaction_id));
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
        row.appendChild(actionsCell);
        
        paymentsTableBody.appendChild(row);
    });
}

/**
 * Функция для загрузки документов транзакции
 * @param {string} transactionId - ID транзакции
 */
async function loadTransactionFiles(transactionId) {
    try {
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/documents`, {
            method: 'GET'
        });
        
        if (response.success && response.documents) {
            // Распределяем файлы по категориям
            const agreementFiles = response.documents.filter(file => file.category === 'agreement');
            const videoFiles = response.documents.filter(file => file.category === 'video');
            const proofFiles = response.documents.filter(file => file.category === 'proof');
            
            // Отображаем файлы в соответствующих контейнерах
            displayFiles(agreementFiles, 'agreementFile', 'agreement');
            displayFiles(videoFiles, 'videoFile', 'video');
            displayFiles(proofFiles, 'proofDocuments', 'proof');
        }
    } catch (error) {
        console.error('Error loading transaction files:', error);
        showNotification('error', 'Error loading files');
    }
}

/**
 * Функция для открытия модального окна загрузки одного файла
 * @param {string} transactionId - ID транзакции
 * @param {string} category - Категория файла
 */
function openUploadFileModal(transactionId, category) {
    console.log(`[FILE UPLOAD] Opening upload modal for transaction ${transactionId}, category: ${category}`);
    
    // Устанавливаем ID транзакции и категорию
    document.getElementById('uploadTransactionId').value = transactionId;
    document.getElementById('uploadCategory').value = category;
    
    // Обновляем заголовок модального окна
    const modalTitle = document.querySelector('#uploadFileModal .modal-title');
    if (modalTitle) {
        if (category === 'agreement') {
            modalTitle.textContent = 'Upload Agreement';
        } else if (category === 'video') {
            modalTitle.textContent = 'Upload Video';
        }
    }
    
    // Сбрасываем форму
    const form = document.getElementById('singleFileUploadForm');
    if (form) {
        form.reset();
    }
    
    // Обновляем отображение имени файла
    document.getElementById('fileNameDisplay').textContent = 'No file chosen';
    document.getElementById('previewImage').style.display = 'none';
    document.getElementById('previewImage').src = '';
    
    // Открываем модальное окно
    openModal('uploadFileModal');
}

/**
 * Функция для открытия модального окна множественной загрузки файлов
 */
function openMultipleUploadModal() {
    // Получаем ID текущей транзакции
    const transactionIdElement = document.getElementById('currentTransactionId');
    if (!transactionIdElement || !transactionIdElement.value) {
        console.error('Transaction ID not found');
        showNotification('error', 'Transaction ID not found');
        return;
    }
    
    const transactionId = transactionIdElement.value;
    
    // Устанавливаем ID транзакции
    document.getElementById('multiUploadTransactionId').value = transactionId;
    
    // Сбрасываем форму
    const form = document.getElementById('multipleFileUploadForm');
    if (form) {
        form.reset();
    }
    
    // Обновляем отображение имен файлов
    document.getElementById('multipleFileNameDisplay').textContent = 'No files chosen';
    
    // Открываем модальное окно
    openModal('multipleUploadModal');
}

/**
 * Инициализация обработчиков для загрузки файлов
 */
function initFileUploadHandlers() {
    // Обработчик выбора файла для одиночной загрузки
    const fileInput = document.getElementById('file');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('previewImage');
            if (preview) {
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                } else {
                    preview.style.display = 'none';
                    preview.src = '';
                }
            }
        });
    }
    
    // Для предпросмотра квитанции платежа
    const receiptFileInput = document.getElementById('receiptFile');
    if (receiptFileInput) {
        receiptFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('receiptPreview');
            if (preview) {
                preview.innerHTML = '';
                if (file) {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px;">`;
                        };
                        reader.readAsDataURL(file);
                    } else if (file.type === 'application/pdf') {
                        preview.innerHTML = '<i class="fas fa-file-pdf" style="font-size: 48px; color: #dc3545;"></i>';
                    }
                }
            }
        });
    }
    
    // Обработчик формы одиночной загрузки
    const singleFileUploadForm = document.getElementById('singleFileUploadForm');
    if (singleFileUploadForm) {
        singleFileUploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const transactionId = document.getElementById('uploadTransactionId').value;
            const category = document.getElementById('uploadCategory').value;
            const file = document.getElementById('file').files[0];
            
            if (!file) {
                showNotification('error', 'Please select a file');
                return;
            }
            
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('category', category);
                
                const response = await fetch(API_BASE_URL + `/v1/admin/transactions/${transactionId}/documents`, {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Upload failed');
                }
                
                const result = await response.json();
                if (result.success && result.files && result.files.length > 0) {
                    const filesContainer = document.getElementById('filesContainer');
                    if (!filesContainer) {
                        console.warn('Files container not found. Refreshing file list...');
                        // Попробуем обновить список файлов полностью
                        await loadTransactionFiles(transactionId);
                        showNotification('success', 'File uploaded successfully');
                        closeModal('uploadFileModal');
                        return;
                    }
                    
                    // Ищем или создаем категорию
                    let categoryDiv = filesContainer.querySelector(`[data-category="${category}"]`);
                    if (!categoryDiv) {
                        categoryDiv = createCategoryDiv(category);
                        filesContainer.appendChild(categoryDiv);
                    }
                    
                    const filesList = categoryDiv.querySelector('.files-list') || (function() {
                        const list = document.createElement('div');
                        list.className = 'files-list';
                        categoryDiv.appendChild(list);
                        return list;
                    })();
                    
                    // Добавляем новый файл в список
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    fileItem.dataset.fileId = result.files[0].id;
                    
                    // Добавляем обработчик удаления
                    fileItem.querySelector('.delete-file').addEventListener('click', (e) => {
                        e.stopPropagation();
                        deleteFile(result.files[0].id, transactionId, category);
                    });
                    
                    // Если это чек платежа, обновляем таблицу платежей
                    if (category === 'receipt') {
                        await loadTransactionPayments(transactionId);
                    }
                    
                    showNotification('success', 'File uploaded successfully');
                    closeModal('uploadFileModal');
                } else {
                    throw new Error(result.message || 'Upload failed');
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                showNotification('error', error.message || 'Error uploading file');
            }
        });
    }
}
