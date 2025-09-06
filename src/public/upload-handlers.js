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
 * Функция для открытия модального окна множественной загрузки
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
function initUploadHandlers() {
    // Обработчик кнопок загрузки файлов
    document.querySelectorAll('[data-action="upload-modal"]').forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = document.getElementById('currentTransactionId').value;
            const category = this.getAttribute('data-category');
            openUploadFileModal(transactionId, category);
        });
    });
    
    document.querySelectorAll('[data-action="upload-multiple"]').forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = document.getElementById('currentTransactionId').value;
            openMultipleUploadModal(transactionId);
        });
    });
    
    // Обработчик формы загрузки одного файла
    document.getElementById('singleFileUploadForm')?.addEventListener('submit', async function(e) {
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
                // Обновляем список файлов
                await loadTransactionFiles(transactionId);
                
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
    
    // Обработчик формы множественной загрузки
    document.getElementById('multipleFileUploadForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
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
        formData.append('category', 'proof');
        
        try {
            const response = await fetch(API_BASE_URL + `/v1/admin/transactions/${transactionId}/documents/multiple`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('success', 'Files uploaded successfully');
                closeModal('multipleUploadModal');
                
                // Обновляем документы транзакции
                await loadTransactionFiles(transactionId);
            } else {
                throw new Error(result.message || 'Failed to upload files');
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            showNotification('error', 'Error uploading files: ' + error.message);
        }
    });
}

// Экспортируем функции
export { 
    openUploadFileModal, 
    openMultipleUploadModal, 
    initUploadHandlers 
};