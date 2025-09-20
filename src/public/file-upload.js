// Для receiptFileNameDisplay (например, в форме создания платежа)
document.addEventListener('DOMContentLoaded', function() {
    const receiptFileInput = document.querySelector('input[type="file"][name="receipt"]');
    const receiptFileNameDisplay = document.getElementById('receiptFileNameDisplay');
    if (receiptFileInput && receiptFileNameDisplay) {
        receiptFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            receiptFileNameDisplay.textContent = file ? file.name : 'No file chosen';
        });
    }
});
// Обновление имени файла для singleFileUploadForm
document.addEventListener('DOMContentLoaded', function() {
    // Для receipt в addPaymentModal (уже реализовано выше)
    const receiptInput = document.getElementById('addPaymentModal_receiptFile');
    const receiptNameDisplay = document.getElementById('addPaymentModal_receiptFileNameDisplay');
    if (receiptInput && receiptNameDisplay) {
        receiptInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            receiptNameDisplay.textContent = file ? file.name : 'No file chosen';
        });
    }

    // Для single file upload modal
    const fileInput = document.getElementById('file');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    if (fileInput && fileNameDisplay) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            fileNameDisplay.textContent = file ? file.name : 'No file chosen';
        });
    }

    // Для multiple file upload modal
    const filesInput = document.getElementById('files');
    const multipleFileNameDisplay = document.getElementById('multipleFileNameDisplay');
    if (filesInput && multipleFileNameDisplay) {
        filesInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            if (files.length === 0) {
                multipleFileNameDisplay.textContent = 'No files chosen';
            } else if (files.length === 1) {
                multipleFileNameDisplay.textContent = files[0].name;
            } else {
                multipleFileNameDisplay.textContent = files.map(f => f.name).join(', ');
            }
        });
    }
});
// Обновление имени файла для receipt в addPaymentModal
document.addEventListener('DOMContentLoaded', function() {
    const receiptInput = document.getElementById('addPaymentModal_receiptFile');
    const receiptNameDisplay = document.getElementById('addPaymentModal_receiptFileNameDisplay');
    if (receiptInput && receiptNameDisplay) {
        receiptInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            receiptNameDisplay.textContent = file ? file.name : 'No file chosen';
        });
    }
});
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

// === Новый код для загрузки файлов без submit ===
document.addEventListener('DOMContentLoaded', function() {
    // Одиночная загрузка
    const uploadBtn = document.getElementById('uploadSingleFileBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', async function() {
            const transactionId = document.getElementById('uploadTransactionId').value;
            const category = document.getElementById('uploadCategory').value;
            const fileInput = document.getElementById('file');
            const file = fileInput.files[0];
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
                    credentials: 'include',
                    body: formData
                });
                if (!response.ok) {
                    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
                    throw new Error(error.message || 'Upload failed');
                }
                const result = await response.json();
                if (result.success) {
                    showNotification('success', 'File uploaded successfully');
                    // Закрываем модальное окно
                    closeModal('uploadFileModal');
                    // Обновляем DOM - загружаем файлы для текущей транзакции
                    if (transactionId) {
                        loadTransactionFiles(transactionId);
                    }
                    // Показываем имя файла и превью
                    document.getElementById('fileNameDisplay').textContent = file.name;
                    const preview = document.getElementById('previewImage');
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            preview.style.display = 'block';
                            preview.innerHTML = `<img src="${e.target.result}" style="max-width:100%;max-height:200px;">`;
                        };
                        reader.readAsDataURL(file);
                    } else if (file.type === 'application/pdf') {
                        preview.style.display = 'block';
                        preview.innerHTML = '<i class="fas fa-file-pdf" style="font-size:48px;color:#dc3545;"></i>';
                    } else if (file.type.startsWith('video/')) {
                        preview.style.display = 'block';
                        preview.innerHTML = '<i class="fas fa-file-video" style="font-size:48px;color:#007bff;"></i>';
                    } else {
                        preview.style.display = 'block';
                        preview.innerHTML = '<i class="fas fa-file" style="font-size:48px;"></i>';
                    }
                } else {
                    throw new Error(result.message || 'Upload failed');
                }
            } catch (error) {
                showNotification('error', error.message || 'Error uploading file');
            }
        });
    }
    // Множественная загрузка
    const uploadMultiBtn = document.getElementById('uploadMultipleFilesBtn');
    if (uploadMultiBtn) {
        uploadMultiBtn.addEventListener('click', async function() {
            const transactionId = document.getElementById('multiUploadTransactionId').value;
            const filesInput = document.getElementById('files');
            if (!filesInput.files.length) {
                showNotification('error', 'Please select files');
                return;
            }
            const formData = new FormData();
            for (let i = 0; i < filesInput.files.length; i++) {
                formData.append('files', filesInput.files[i]);
            }
            formData.append('category', 'proof_documents');
            try {
                const response = await fetch(API_BASE_URL + `/v1/admin/transactions/${transactionId}/documents`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });
                if (!response.ok) {
                    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
                    throw new Error(error.message || 'Upload failed');
                }
                const result = await response.json();
                if (result.success) {
                    showNotification('success', 'Files uploaded successfully');
                    // Закрываем модальное окно
                    closeModal('multipleUploadModal');
                    // Обновляем DOM - загружаем файлы для текущей транзакции
                    if (transactionId) {
                        loadTransactionFiles(transactionId);
                    }
                    // Показываем имена файлов
                    document.getElementById('multipleFileNameDisplay').textContent = Array.from(filesInput.files).map(f=>f.name).join(', ');
                } else {
                    throw new Error(result.message || 'Failed to upload files');
                }
            } catch (error) {
                showNotification('error', error.message || 'Error uploading files');
            }
        });
    }
});

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
            
            // Заполняем форму с правильными ID
            const transactionIdEl = document.getElementById('editPaymentModal_transactionId');
            const paymentIdEl = document.getElementById('editPaymentModal_paymentId');
            const paymentAmountEl = document.getElementById('editPaymentModal_paymentAmount');
            const rawPaymentAmountEl = document.getElementById('editPaymentModal_rawPaymentAmount');
            const paymentMethodEl = document.getElementById('editPaymentModal_paymentMethod');
            const paymentStatusEl = document.getElementById('editPaymentModal_paymentStatus');
            const paymentNotesEl = document.getElementById('editPaymentModal_paymentNotes');
            
            if (transactionIdEl) transactionIdEl.value = transactionId;
            if (paymentIdEl) paymentIdEl.value = payment.id;
            if (paymentAmountEl) paymentAmountEl.value = formatPKR(payment.amount);
            if (rawPaymentAmountEl) rawPaymentAmountEl.value = payment.amount;
            if (paymentMethodEl) paymentMethodEl.value = payment.payment_method;
            if (paymentStatusEl) paymentStatusEl.value = payment.status;
            if (paymentNotesEl) paymentNotesEl.value = payment.notes || '';
            
            // Обновляем конвертацию в USD
            await updateUSD(payment.amount);
            
            // Открываем модальное окно
            openModal('editPaymentModal');
             const saveEditPaymentBtn = document.querySelector('.save-payment-btn');
    if (saveEditPaymentBtn) {
        saveEditPaymentBtn.addEventListener('click', async function () {
            const transactionId = document.getElementById('editPaymentModal_transactionId')?.value;
            const paymentId = document.getElementById('editPaymentModal_paymentId')?.value;
            const amount = parseNumber(document.getElementById('editPaymentModal_paymentAmount')?.value);
            const method = document.getElementById('editPaymentModal_paymentMethod')?.value;
            const status = document.getElementById('editPaymentModal_paymentStatus')?.value;
            const notes = document.getElementById('editPaymentModal_paymentNotes')?.value;

            if (!transactionId || !paymentId) {
                showNotification('error', 'Transaction or Payment ID not found');
                return;
            }

            if (amount <= 0) {
                showNotification('error', 'Amount must be greater than 0');
                return;
            }

            try {
                const paymentData = {
                    amount,
                    payment_method: method,
                    status,
                    notes
                };

                const response = await apiRequest(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`, {
                    method: 'PUT',
                    body: JSON.stringify(paymentData)
                });

                if (response.success) {
                    showNotification('success', 'Payment updated successfully');
                    closeModal('editPaymentModal');
                    await loadTransactionDetails(transactionId); // Обновляем данные
                } else {
                    throw new Error(response.message || 'Failed to update payment');
                }
            } catch (error) {
                console.error('Error updating payment:', error);
                showNotification('error', 'Error updating payment: ' + error.message);
            }
        });
    }
        } else {
            throw new Error(response.message || 'Payment not found');
        }
    } catch (error) {
        console.error('[PAYMENT] Error loading payment details:', error);
        showNotification('error', 'Error loading payment details: ' + error.message);
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
        const response = await apiRequest(`/v1/admin/transactions/${transactionId}/documents/${fileId}`, {
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
