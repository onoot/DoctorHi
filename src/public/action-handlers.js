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