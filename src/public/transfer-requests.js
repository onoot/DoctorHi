// transfer-requests.js
// Функции для работы с запросами передачи

/**
 * Загрузка запросов передачи для администратора
 */
async function loadTransferRequestsAdmin() {
    try {
        const status = document.getElementById('transferRequestStatus')?.value || 'pending';
        const response = await apiRequest(`/v1/admin/transfer-requests?status=${status}`);
        
        if (response.success && response.requests) {
            const tbody = document.getElementById('transferRequestsTableBody');
            if (tbody) {
                tbody.innerHTML = '';
                
                response.requests.forEach(request => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${request.id}</td>
                        <td>${request.property_id}</td>
                        <td>${request.current_owner_name || 'N/A'}</td>
                        <td>${request.new_owner_name || 'N/A'}</td>
                        <td>${new Date(request.created_at).toLocaleDateString('en-GB')}</td>
                        <td>
                            <span class="status-badge ${request.status}">${request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                            ${request.admin_notes ? `<i class="fas fa-info-circle" title="${request.admin_notes}"></i>` : ''}
                        </td>
                        <td>
                            ${request.status === 'pending' ? `
                                <button class="action-btn btn-approve approve-transfer" data-id="${request.id}">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                                <button class="action-btn btn-delete reject-transfer" data-id="${request.id}">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            ` : `
                                <span class="action-text">${request.status === 'approved' ? 'Approved' : 'Rejected'}</span>
                                ${request.admin_notes ? `<i class="fas fa-info-circle" title="${request.admin_notes}"></i>` : ''}
                            `}
                        </td>
                    `;
                    tbody.appendChild(row);
                });
                
                attachTransferRequestActionHandlers();
            }
        }
    } catch (error) {
        console.error('Error loading transfer requests:', error);
        showNotification('error', 'Failed to load requests');
    }
}

/**
 * Привязка обработчиков событий для запросов передачи
 */
function attachTransferRequestActionHandlers() {
    const tableBody = document.getElementById('transferRequestsTableBody');
    if (!tableBody) return;
    
    tableBody.addEventListener('click', function(e) {
        const button = e.target.closest('.action-btn');
        if (!button) return;
        
        const requestId = button.closest('tr')?.querySelector('[data-id]')?.dataset.id;
        if (!requestId) return;
        
        if (button.classList.contains('approve-transfer')) {
            handleTransferRequest(requestId, 'approved');
        } else if (button.classList.contains('reject-transfer')) {
            handleTransferRequest(requestId, 'rejected');
        }
    });
}

/**
 * Обработка запроса передачи
 * @param {string} requestId - ID запроса
 * @param {string} action - Действие (approved/rejected)
 */
async function handleTransferRequest(requestId, action) {
    const notes = prompt(`Please enter ${action === 'approved' ? 'approval' : 'rejection'} notes:`);
    if (!notes) {
        showNotification('info', 'Action cancelled');
        return;
    }
    
    try {
        const response = await apiRequest(`/v1/admin/transfer-requests/${requestId}/${action}`, {
            method: 'POST',
            body: JSON.stringify({ admin_notes: notes })
        });
        
        if (response.success) {
            showNotification('success', `Request ${action} successfully`);
            loadTransferRequestsAdmin();
        } else {
            throw new Error(response.message || `Failed to ${action} request`);
        }
    } catch (error) {
        console.error(`Error ${action} transfer request:`, error);
        showNotification('error', `Error ${action} request: ${error.message}`);
    }
}

/**
 * Показ деталей запроса передачи
 * @param {string} requestId - ID запроса
 */
function showTransferRequestDetails(requestId) {
    // Здесь можно добавить модальное окно с подробной информацией
    // о запросе, включая историю изменений и комментарии
    console.log(`Showing details for transfer request: ${requestId}`);
}

/**
 * Инициализация обработчиков для запросов передачи
 */
function initTransferRequestHandlers() {
    // Обработчик для изменения статуса запросов
    document.getElementById('transferRequestStatus')?.addEventListener('change', loadTransferRequestsAdmin);
    
    // Загружаем запросы при инициализации админ-панели
    if (document.getElementById('transferRequestsSection')) {
        loadTransferRequestsAdmin();
    }
}

// Экспортируем функции
export { 
    loadTransferRequestsAdmin, 
    attachTransferRequestActionHandlers, 
    handleTransferRequest,
    showTransferRequestDetails,
    initTransferRequestHandlers 
};