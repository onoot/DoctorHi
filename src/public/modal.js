// modal.js
// Базовые функции для работы с модальными окнами

/**
 * Универсальная функция для открытия модальных окон
 * @param {string} modalId - ID модального окна
 * @returns {boolean} - Успешно ли открылось модальное окно
 */
function openModal(modalId) {
    console.log(`[DEBUG] Attempting to open modal with ID: ${modalId}`);
    
    const modal = document.getElementById(modalId);
    if (modal) {
        // Удаляем класс hide, если он есть
        modal.classList.remove('hide');
        
        // Добавляем класс show для отображения
        modal.classList.add('show');
        
        console.log(`[SUCCESS] Modal ${modalId} opened successfully`);
        
        // Дополнительная проверка для отладки
        if (!modal.classList.contains('show')) {
            console.error(`[ERROR] Failed to add 'show' class to modal ${modalId}`);
            return false;
        }
        
        // Устанавливаем display: flex только если класс show добавлен
        modal.style.display = 'flex';
        
        // Принудительная перерисовка для анимации
        void modal.offsetWidth;
        
        return true;
    } else {
        console.error(`[ERROR] Modal with ID "${modalId}" not found`);
        return false;
    }
}

/**
 * Универсальная функция для закрытия модальных окон
 * @param {string} modalId - ID модального окна
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hide');
        modal.classList.remove('show');
        
        // Устанавливаем таймер для полного скрытия после анимации
        setTimeout(() => {
            if (modal.classList.contains('hide')) {
                modal.style.display = 'none';
            }
        }, 300);
    }
}

/**
 * Инициализация обработчиков закрытия модальных окон
 */
function initModalCloseHandlers() {
    // Закрытие модальных окон по кнопке "×"
    document.querySelectorAll('.modal-close, .close').forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            console.log(`[DEBUG] Closing modal via close button: ${modalId}`);
            closeModal(modalId);
        });
    });
    
    // Закрытие модального окна при клике вне его содержимого
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            const modalId = event.target.id;
            console.log(`[DEBUG] Closing modal via background click: ${modalId}`);
            closeModal(modalId);
        }
    });
    
    // Закрытие модальных окон по клавише Esc
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(modal => {
                const modalId = modal.id;
                console.log(`[DEBUG] Closing modal via Escape key: ${modalId}`);
                closeModal(modalId);
            });
        }
    });
}