// action-handlers.js
// Обработчики действий пользователя

/**
 * Привязка обработчиков действий
 */
function attachActionHandlers() {
    document.body.addEventListener('click', function(e) {
        const button = e.target.closest('.action-btn');
        if (!button) return;

        const action = button.getAttribute('data-action');
        const id = button.closest('[data-id]')?.dataset.id;

        if (!id || !action) return;

        switch (action) {
            case 'view':
                viewTransaction(id);
                break;
            case 'view_user':
                viewUser(id);
                break;
            case 'approve':
                updateTransactionStatus(id, 'approved');
                break;
            case 'reject':
                updateTransactionStatus(id, 'rejected');
                break;
            case 'block':
                toggleUserStatus(id, 'blocked');
                break;
            case 'unblock':
                toggleUserStatus(id, 'active');
                break;
            case 'archive':
                archiveUser(id);
                break;
            case 'restore':
                restoreUser(id);
                break;
            case 'toggle-status':
                toggleUserStatus(id);
                break;
            case 'upload-modal':
                const category = button.getAttribute('data-category');
                openUploadFileModal(id, category);
                break;
            case 'upload-multiple':
                openMultipleUploadModal(id);
                break;
            case 'add-payment':
                openAddPaymentModal(id);
                break;
            case 'edit-amount':
                toggleAmountEdit();
                break;
            default:
                console.error(`Unknown action: ${action}`);
        }
    });
}

/**
 * Инициализация обработчиков действий
 */
function initActionHandlers() {
    attachActionHandlers();
    
    // Дополнительные обработчики действий
    document.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const action = this.getAttribute('data-action');
            const id = this.getAttribute('data-id');
            
            if (action === 'approve') {
                updateTransactionStatus(id, 'approved');
            } else if (action === 'reject') {
                updateTransactionStatus(id, 'rejected');
            }
        });
    });
}

// Экспортируем функции
export { attachActionHandlers, initActionHandlers };