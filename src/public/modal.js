// modal.js
// Базовые функции для работы с модальными окнами

// Глобальные переменные для отслеживания состояния модальных окон
let previousFocusedElement = null;
const openModalsStack = [];

/**
 * Универсальная функция для открытия модальных окон
 * @param {string} modalId - ID модального окна
 * @param {boolean} [isNested=false] - Является ли модальное окно вложенным
 * @returns {boolean} - Успешно ли открылось модальное окно
 */
function openModal(modalId, isNested = false) {
    console.log(`[MODALS] Attempting to open modal with ID: ${modalId}`);

    const modal = document.getElementById(modalId);
    if (modal) {
        // Проверяем, не открыто ли уже это модальное окно
        if (modal.classList.contains('show')) {
            console.warn(`[MODALS] Modal ${modalId} is already open`);
            return true;
        }

        // Сохраняем предыдущий активный элемент для возврата фокуса
        if (!isNested && !previousFocusedElement) {
            previousFocusedElement = document.activeElement;
        }

        // Удаляем класс hide, если он есть
        modal.classList.remove('hide');

        // Добавляем класс show для отображения
        // modal.classList.add('show');

        // Принудительная перерисовка для анимации
        void modal.offsetWidth;

        // Добавляем в стек открытых модальных окон
        openModalsStack.push(modalId);

        // Устанавливаем фокус на первый фокусируемый элемент внутри модального окна
        setTimeout(() => {
            trapFocus(modal);
        }, 100);

        // Устанавливаем ARIA атрибуты для доступности
        modal.setAttribute('aria-hidden', 'false');
        modal.setAttribute('aria-modal', 'true');

        console.log(`[MODALS] Modal ${modalId} opened successfully`);
        return true;
    } else {
        console.error(`[MODALS] Modal with ID "${modalId}" not found`);
        return false;
    }
}

/**
 * Универсальная функция для закрытия модальных окон
 * @param {string} modalId - ID модального окна
 * @param {boolean} [isNested=false] - Является ли модальное окно вложенным
 */
function closeModal(modalId, isNested = false) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Remove show, add hide
    modal.classList.remove('show');
    modal.classList.add('hide');

    // Set ARIA attributes for accessibility
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');

    // Принудительная перерисовка для анимации
    void modal.offsetWidth;

    // Удаляем из стека открытых модальных окон
    const modalIndex = openModalsStack.indexOf(modalId);
    if (modalIndex !== -1) {
        openModalsStack.splice(modalIndex, 1);
    }
}

/**
 * Получает продолжительность анимации модального окна из CSS
 * @param {HTMLElement} modal - Элемент модального окна
 * @returns {number} - Продолжительность анимации в миллисекундах
 */
function getModalAnimationDuration(modal) {
    const style = window.getComputedStyle(modal);
    const transitionDuration = style.transitionDuration || '0.3s';

    // Парсим значение анимации (может быть в секундах или миллисекундах)
    if (transitionDuration.includes('ms')) {
        return parseFloat(transitionDuration);
    } else {
        return parseFloat(transitionDuration) * 1000;
    }
}

/**
 * Устанавливает ловушку фокуса внутри модального окна
 * @param {HTMLElement} modal - Элемент модального окна
 */
function trapFocus(modal) {
    if (!modal) return;

    const focusableElements = getFocusableElements(modal);

    if (focusableElements.length > 0) {
        // Устанавливаем фокус на первый фокусируемый элемент
        focusableElements[0].focus();

        // Добавляем обработчик для ловушки фокуса
        modal.addEventListener('keydown', function focusTrapHandler(e) {
            if (e.key === 'Tab') {
                // Если нажали Shift+Tab и фокус на первом элементе
                if (e.shiftKey && document.activeElement === focusableElements[0]) {
                    e.preventDefault();
                    focusableElements[focusableElements.length - 1].focus();
                }
                // Если нажали Tab и фокус на последнем элементе
                else if (!e.shiftKey && document.activeElement === focusableElements[focusableElements.length - 1]) {
                    e.preventDefault();
                    focusableElements[0].focus();
                }
            }
        });
    }
}

/**
 * Получает все фокусируемые элементы внутри контейнера
 * @param {HTMLElement} container - Контейнер для поиска
 * @returns {Array} - Массив фокусируемых элементов
 */
function getFocusableElements(container) {
    return Array.from(
        container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
    ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
}

/**
 * Инициализация обработчиков закрытия модальных окон
 */
function initModalCloseHandlers() {


    // Закрытие модального окна при клике вне его содержимого
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('modal')) {
            const modalId = event.target.id;
            if (modalId) {
                closeModal(modalId);
            }
        }
    });

    // Закрытие модальных окон по клавише Esc
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && openModalsStack.length > 0) {
            const topModalId = openModalsStack[openModalsStack.length - 1];
            closeModal(topModalId);
            event.stopPropagation();
        }
    });

    console.log('[MODALS] Modal close handlers initialized');
}

/**
 * Инициализация модальных окон
 */
function initModals() {
    // Инициализация обработчиков закрытия
    initModalCloseHandlers();

    // Добавляем обработчик для вложенных модальных окон
    document.addEventListener('click', function (event) {
        const nestedModalTrigger = event.target.closest('[data-nested-modal]');
        if (nestedModalTrigger) {
            const modalId = nestedModalTrigger.getAttribute('data-nested-modal');
            openModal(modalId, true);
            event.stopPropagation();
        }
    });

    console.log('[MODALS] Modals initialized successfully');
}

// Прикрепляем функции к глобальному объекту
window.openModal = openModal;
window.closeModal = closeModal;
window.initModals = initModals;

// Автоматическая инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function () {
    initModals();

    // Добавляем обработчик для кнопок открытия модальных окон
    document.querySelectorAll('[data-modal]').forEach(button => {
        button.addEventListener('click', function () {
            const modalId = this.getAttribute('data-modal');
            if (modalId) {
                openModal(modalId);
            }
        });
    });

    console.log('[MODALS] DOM loaded, modals ready');
});