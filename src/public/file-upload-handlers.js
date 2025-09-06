// file-upload-handlers.js
// Функции для загрузки файлов

/**
 * Функция для открытия модального окна загрузки одного файла
 * @param {string} category - Категория файла
 */
function openUploadModal(category) {
    // Получаем ID текущей транзакции из скрытого поля в модальном окне
    const transactionIdElement = document.getElementById('currentTransactionId');
    if (!transactionIdElement || !transactionIdElement.value) {
        showNotification('error', 'Transaction ID not found');
        return;
    }
    
    const transactionId = transactionIdElement.value;
    
    // Устанавливаем значения в скрытые поля формы
    const uploadTransactionId = document.getElementById('uploadTransactionId');
    const uploadCategory = document.getElementById('uploadCategory');
    
    if (uploadTransactionId && uploadCategory) {
        uploadTransactionId.value = transactionId;
        uploadCategory.value = category;
        
        // Обновляем заголовок модального окна
        const modalTitle = document.querySelector('#uploadFileModal .modal-title');
        if (modalTitle) {
            if (category === 'agreement') {
                modalTitle.textContent = 'Upload Agreement';
            } else if (category === 'video') {
                modalTitle.textContent = 'Upload Video';
            }
        }
        
        // Открываем модальное окно
        openModal('uploadFileModal');
    }
}

/**
 * Функция для открытия модального окна множественной загрузки
 */
function openMultiplUploadModal() {
    // Получаем ID текущей транзакции
    const transactionIdElement = document.getElementById('currentTransactionId');
    if (!transactionIdElement || !transactionIdElement.value) {
        showNotification('error', 'Transaction ID not found');
        return;
    }
    
    const transactionId = transactionIdElement.value;
    
    // Устанавливаем ID транзакции
    document.getElementById('multiUploadTransactionId').value = transactionId;
    
    // Открываем модальное окно
    openModal('multipleUploadModal');
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
 * Функция для отображения файлов
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
        deleteBtn.className = 'btn-delete';
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
 * Функция для удаления файла
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
 * Инициализация обработчиков загрузки файлов
 */
function initFileUploadHandlers() {
    // Обработчик для кнопок действий с транзакцией
    document.addEventListener('click', function (e) {
        const button = e.target.closest('[data-action]');
        if (!button) return;
        e.preventDefault(); // Предотвращаем всплытие события
        
        const action = button.getAttribute('data-action');
        const category = button.getAttribute('data-category');
        
        switch (action) {
            case 'upload-modal':
                openUploadModal(category);
                break;
            case 'upload-multiple':
                openMultiplUploadModal();
                break;
            case 'add-payment':
                openAddPaymentModal();
                break;
            case 'edit-amount':
                const amountEditSection = document.getElementById('amountEditSection');
                
                // Если секция уже открыта, закрываем её
                if (amountEditSection.style.display === 'block') {
                    amountEditSection.style.display = 'none';
                } else {
                    // Открываем форму редактирования суммы
                    amountEditSection.style.display = 'block';
                    // Устанавливаем фокус на поле ввода
                    document.getElementById('newTotalAmount').focus();
                }
                break;
            case 'save-amount':
                const newAmount = parseFloat(document.getElementById('newTotalAmount').value);
                if (!isNaN(newAmount) && newAmount > 0) {
                    // Здесь будет вызов API для обновления суммы
                    updateTransactionAmount(newAmount);
                    document.getElementById('amountEditSection').style.display = 'none';
                } else {
                    alert('Please enter a valid amount');
                }
                break;
            case 'cancel-amount':
                document.getElementById('amountEditSection').style.display = 'none';
                break;
        }
    });
}
