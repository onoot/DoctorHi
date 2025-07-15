const API_BASE_URL = 'http://127.0.0.1:3003/api';

// Функции для работы с токеном
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

function setAuthToken(token) {
    localStorage.setItem('auth_token', token);
}

function clearAuth() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
}

// Функции для управления UI
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

function showLoginForm() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('transferSection').style.display = 'none';
}

function showMainContent() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('transferSection').style.display = 'block';
    loadUploadedFiles();
}

// Функция для выполнения защищенных запросов
async function fetchWithAuth(url, options = {}) {
    const token = getAuthToken();
    if (!token) {
        showLoginForm();
        throw new Error('Authentication required');
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (response.status === 401) {
        clearAuth();
        showLoginForm();
        throw new Error('Authentication expired');
    }

    return response;
}

// Функция обновления таблицы документов
function updateDocumentsTable(documents) {
    const statusCells = document.querySelectorAll('.status-cell');
    const dateCells = document.querySelectorAll('.date-cell');
    const filenameCells = document.querySelectorAll('.filename-cell');

    // Очистка всех ячеек
    statusCells.forEach(cell => cell.textContent = 'Not uploaded');
    dateCells.forEach(cell => cell.textContent = '-');
    filenameCells.forEach(cell => cell.textContent = '-');

    // Обновление данных
    documents.forEach(doc => {
        const row = document.getElementById(`${doc.type}Row`);
        if (row) {
            row.querySelector('.status-cell').textContent = doc.status;
            row.querySelector('.date-cell').textContent = new Date(doc.uploadDate).toLocaleDateString();
            row.querySelector('.filename-cell').textContent = doc.filename;
        }
    });
}

// Функция обновления истории владения
function updateOwnershipHistory(history) {
    const tbody = document.getElementById('ownershipHistoryBody');
    if (!tbody) return;

    if (!history || history.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="no-data">No ownership history available</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = history.map(record => `
        <tr>
            <td>${record.name}</td>
            <td>${record.cnic}</td>
            <td>${new Date(record.transfer_date).toLocaleDateString()}</td>
            <td>
                <span class="status-badge ${record.status === 'Current Owner' ? 'status-current' : 'status-previous'}">
                    ${record.status}
                </span>
            </td>
        </tr>
    `).join('');
}

// Обработчик формы входа
async function handleLogin(event) {
    event.preventDefault();
    hideError();

    const login = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ login, password })
        });

        const data = await response.json();

        if (response.ok) {
            setAuthToken(data.token);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            showMainContent();
        } else {
            showError(data.message || 'Login failed');
        }
    } catch (error) {
        showError('Network error occurred');
        console.error('Login error:', error);
    }
}

// Обработчик формы передачи прав
async function handleTransferSubmit(event) {
    event.preventDefault();
    hideError();

    const formData = new FormData(event.target);
    const data = {
        newOwnerName: formData.get('name'),
        newOwnerCNIC: formData.get('cnic'),
        objectToSell: formData.get('object_sell')
    };

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/transfer/request`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        const responseData = await response.json();

        if (response.ok) {
            alert('Transfer request submitted successfully!');
            event.target.reset();
            loadUploadedFiles(); // Обновляем данные
        } else {
            showError(responseData.message || 'Failed to submit transfer request');
        }
    } catch (error) {
        showError('Network error occurred');
        console.error('Transfer request error:', error);
    }
}

// Обработчик выхода
function handleLogout() {
    clearAuth();
    showLoginForm();
}

// Загрузка данных после авторизации
async function loadUploadedFiles() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/documents/list`);
        const data = await response.json();
        
        // Обновление таблицы документов
        updateDocumentsTable(data.documents);
        
        // Загрузка истории владения
        const historyResponse = await fetchWithAuth(`${API_BASE_URL}/ownership/history`);
        const historyData = await historyResponse.json();
        updateOwnershipHistory(historyData.history);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Обработчик формы входа
    const loginForm = document.getElementById('userLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Обработчик формы передачи прав
    const transferForm = document.getElementById('transferForm');
    if (transferForm) {
        transferForm.addEventListener('submit', handleTransferSubmit);
    }

    // Обработчик кнопки отмены
    const cancelBtn = document.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to cancel the transfer request?')) {
                document.getElementById('transferForm').reset();
            }
        });
    }

    // Добавляем обработчик для кнопки выхода, если она есть
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Проверка авторизации при загрузке
    const token = getAuthToken();
    if (token) {
        showMainContent();
    } else {
        showLoginForm();
    }

    // Добавляем валидацию CNIC
    const cnicInput = document.getElementById('cnic');
    if (cnicInput) {
        cnicInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 13);
        });
    }
}); 