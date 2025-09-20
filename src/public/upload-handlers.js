// upload-handlers.js
// Обработчики для загрузки файлов

/**
 * Функция для открытия модального окна загрузки одного файла
 * @param {string} transactionId - ID транзакции
 * @param {string} category - Категория файла
 */
function openUploadFileModal(transactionId, category) {
    console.log(`[FILE UPLOAD] Opening upload modal for transaction ${transactionId}, category: ${category}`);
    
    // Устанавливаем ID транзакции и категорию
    const transactionIdInput = document.getElementById('uploadTransactionId');
    const categoryInput = document.getElementById('uploadCategory');
    
    if (!transactionIdInput || !categoryInput) {
        console.error('[FILE UPLOAD] Upload form inputs not found');
        showNotification('error', 'Upload form not initialized correctly');
        return;
    }
    
    transactionIdInput.value = transactionId;
    categoryInput.value = category;
    
    // Обновляем заголовок модального окна
    const modalTitle = document.querySelector('#uploadFileModal .modal-title');
    if (modalTitle) {
        if (category === 'agreement') {
            modalTitle.textContent = 'Upload Agreement';
        } else if (category === 'video') {
            modalTitle.textContent = 'Upload Video';
        } else if (category === 'proof_documents') {
            modalTitle.textContent = 'Upload Proof Documents';
        }
    }
    
    // Сбрасываем форму
    const form = document.getElementById('singleFileUploadForm');
    if (form) {
        form.reset();
    }
    
    // Обновляем отображение имени файла
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const previewImage = document.getElementById('previewImage');
    
    if (fileNameDisplay) {
        fileNameDisplay.textContent = 'No file chosen';
    }
    
    if (previewImage) {
        previewImage.style.display = 'none';
        previewImage.src = '';
    }
    
    // Открываем модальное окно
    openModal('uploadFileModal');
}

/**
 * Функция для открытия модального окна множественной загрузки
 * @param {string} transactionId - ID транзакции
 * @param {string} category - Категория файла (по умолчанию 'proof_documents')
 */
function openMultipleUploadModal(transactionId, category = 'proof_documents') {
    // Устанавливаем ID транзакции
    const multiUploadTransactionId = document.getElementById('multiUploadTransactionId');
    if (!multiUploadTransactionId) {
        console.error('Multi upload transaction ID input not found');
        showNotification('error', 'Upload form not initialized correctly');
        return;
    }
    
    multiUploadTransactionId.value = transactionId;
    
    // Сбрасываем форму
    const form = document.getElementById('multipleFileUploadForm');
    if (form) {
        form.reset();
    }
    
    // Обновляем отображение имен файлов
    const multipleFileNameDisplay = document.getElementById('multipleFileNameDisplay');
    if (multipleFileNameDisplay) {
        multipleFileNameDisplay.textContent = 'No files chosen';
    }
    
    // Открываем модальное окно
    openModal('multipleUploadModal');
}

/**
 * Инициализация обработчиков для загрузки файлов
 */
function initUploadHandlers() {
    console.log('[FILE UPLOAD] Initializing upload handlers');
    
    // Проверяем, доступны ли необходимые функции
    const loadFilesAvailable = typeof loadTransactionFiles === 'function';
    const displayFilesAvailable = typeof displayFiles === 'function';
    
    if (!loadFilesAvailable && !displayFilesAvailable) {
        console.warn('[FILE UPLOAD] No file loading/display functions available');
    }
    
    // Обработчик кнопок загрузки файлов
    document.querySelectorAll('[data-action="upload-modal"]').forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = document.getElementById('currentTransactionId')?.value;
            const category = this.getAttribute('data-category');
            
            if (!transactionId) {
                showNotification('error', 'Transaction ID not found');
                return;
            }
            
            openUploadFileModal(transactionId, category);
        });
    });
    
    document.querySelectorAll('[data-action="upload-multiple"]').forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = document.getElementById('currentTransactionId')?.value;
            const category = this.getAttribute('data-category') || 'proof_documents';
            
            if (transactionId) {
                openMultipleUploadModal(transactionId, category);
            } else {
                showNotification('error', 'Transaction ID not found');
            }
        });
    });
    
    // Обработчик выбора файла для одиночной загрузки
    const fileInput = document.getElementById('file');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const fileNameDisplay = document.getElementById('fileNameDisplay');
            const previewImage = document.getElementById('previewImage');
            
            if (fileNameDisplay && file) {
                fileNameDisplay.textContent = file.name;
            }
            
            if (previewImage && file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    previewImage.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else if (previewImage) {
                previewImage.style.display = 'none';
                previewImage.src = '';
            }
        });
    }
    
    // Обработчик выбора файлов для множественной загрузки
    const multipleFileInput = document.getElementById('files');
    if (multipleFileInput) {
        multipleFileInput.addEventListener('change', function(e) {
            const files = e.target.files;
            const multipleFileNameDisplay = document.getElementById('multipleFileNameDisplay');
            
            if (multipleFileNameDisplay) {
                if (files.length === 0) {
                    multipleFileNameDisplay.textContent = 'No files chosen';
                } else if (files.length === 1) {
                    multipleFileNameDisplay.textContent = files[0].name;
                } else {
                    multipleFileNameDisplay.textContent = `${files.length} files selected`;
                }
            }
        });
    }
    
    // Обработчик формы загрузки одного файла
    const singleFileUploadForm = document.getElementById('singleFileUploadForm');
    if (singleFileUploadForm) {
        singleFileUploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const transactionId = document.getElementById('uploadTransactionId')?.value;
            const category = document.getElementById('uploadCategory')?.value;
            const file = document.getElementById('file')?.files[0];
            
            if (!transactionId) {
                showNotification('error', 'Transaction ID not found');
                return;
            }
            
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
                    
                    // ✅ Обновляем список файлов — это и есть ПЕРЕРЕНДЕР
                    if (loadFilesAvailable) {
                        await loadTransactionFiles(transactionId);
                    }
                    
                    // ✅ Сбрасываем форму
                    const form = document.getElementById('singleFileUploadForm');
                    if (form) form.reset();
                    
                    // ✅ Очищаем превью
                    const previewImage = document.getElementById('previewImage');
                    if (previewImage) {
                        previewImage.style.display = 'none';
                        previewImage.src = '';
                    }
                    
                    const fileNameDisplay = document.getElementById('fileNameDisplay');
                    if (fileNameDisplay) {
                        fileNameDisplay.textContent = 'No file chosen';
                    }
                } else {
                    throw new Error(result.message || 'Upload failed');
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                showNotification('error', error.message || 'Error uploading file');
            }
        });
    }
    
    // Обработчик формы множественной загрузки
    const multipleFileUploadForm = document.getElementById('multipleFileUploadForm');
    if (multipleFileUploadForm) {
        multipleFileUploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const transactionId = document.getElementById('multiUploadTransactionId')?.value;
            const filesInput = document.getElementById('files');
            const category = document.getElementById('uploadCategory')?.value || 'proof_documents';
            
            if (!transactionId) {
                showNotification('error', 'Transaction ID not found');
                return;
            }
            
            if (!filesInput?.files.length) {
                showNotification('error', 'Please select files');
                return;
            }
            
            const formData = new FormData();
            for (let i = 0; i < filesInput.files.length; i++) {
                formData.append('files', filesInput.files[i]);
            }
            formData.append('category', category);
            
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
                    
                    // ✅ Обновляем документы — это и есть ПЕРЕРЕНДЕР
                    if (loadFilesAvailable) {
                        await loadTransactionFiles(transactionId);
                    }
                    
                    // ✅ Сбрасываем форму
                    const form = document.getElementById('multipleFileUploadForm');
                    if (form) form.reset();
                    
                    const multipleFileNameDisplay = document.getElementById('multipleFileNameDisplay');
                    if (multipleFileNameDisplay) {
                        multipleFileNameDisplay.textContent = 'No files chosen';
                    }
                } else {
                    throw new Error(result.message || 'Failed to upload files');
                }
            } catch (error) {
                console.error('Error uploading files:', error);
                showNotification('error', 'Error uploading files: ' + error.message);
            }
        });
    }
    
    console.log('[FILE UPLOAD] Upload handlers initialized successfully');
}

/**
 * Функция для отображения файлов в соответствующих контейнерах
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
        viewBtn.className = 'action-btn btn-view';
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
            deleteFile(file.id, document.getElementById('currentTransactionId')?.value, category);
        });
        actions.appendChild(deleteBtn);
        
        // Создаем превью файла
        let filePreview = '';
        if (file.file_type && file.file_type.startsWith('image/')) {
            filePreview = `<div class="file-preview"><img src="${API_BASE_URL}/v1/admin/files/${file.id}" alt="${file.original_name || 'Image'}"></div>`;
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
                <span class="file-name">${file.original_name || file.name || file.file_name || file.fileName || 'Unknown file'}</span>
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
            
            // ✅ Удаляем элемент из DOM
            const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
            if (fileElement && fileElement.parentNode) {
                fileElement.parentNode.removeChild(fileElement);
            }

            // ✅ Обновляем список файлов — это и есть ПЕРЕРЕНДЕР
            if (category === 'agreement' || category === 'video' || category === 'proof_documents') {
                await loadTransactionFiles(transactionId);
            } else if (category === 'receipt') {
                await loadTransactionPayments(transactionId);
            } else {
                console.warn(`[DELETE] Unknown category: ${category}. No UI update triggered.`);
            }
        } else {
            throw new Error(response.message || 'Failed to delete file');
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        showNotification('error', 'Error deleting file: ' + error.message);
    }
}

// Прикрепляем функции к глобальному объекту
window.openUploadFileModal = openUploadFileModal;
window.openMultipleUploadModal = openMultipleUploadModal;
window.initUploadHandlers = initUploadHandlers;
window.displayFiles = displayFiles;
window.deleteFile = deleteFile;

// Автоматическая инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем наличие элементов для загрузки файлов
    const hasUploadElements = 
        document.getElementById('singleFileUploadForm') || 
        document.getElementById('multipleFileUploadForm') ||
        document.querySelectorAll('[data-action="upload-modal"]').length > 0;
    
    if (hasUploadElements) {
        initUploadHandlers();
        console.log('[FILE UPLOAD] DOM loaded, upload handlers ready');
    } else {
        console.log('[FILE UPLOAD] No upload elements found, skipping initialization');
    }
});