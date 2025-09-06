// Инициализация мобильного меню
document.addEventListener('DOMContentLoaded', function() {
    // Используем let вместо const, чтобы можно было переназначить переменную
    let sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggleBtn = document.querySelector('.sidebar-toggle-btn');
    
    // Проверка, существует ли элемент sidebarToggle
    if (!sidebarToggle) {
        // Создаем скрытый чекбокс для переключения меню
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.id = 'sidebar-toggle';
        toggle.className = 'sidebar-toggle';
        toggle.hidden = true;
        document.body.insertBefore(toggle, document.body.firstChild);
        
        // КРИТИЧЕСКИ ВАЖНО: обновляем переменную sidebarToggle
        sidebarToggle = document.getElementById('sidebar-toggle');
    }
    
    // Функция для проверки мобильного устройства
    function isMobile() {
        return window.innerWidth <= 992;
    }
    
    // Обработчик клика по бургер-меню
    if (sidebarToggleBtn && sidebarToggle) {
        sidebarToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (isMobile()) {
                // Переключаем состояние чекбокса
                sidebarToggle.checked = !sidebarToggle.checked;
                
                // Добавляем/удаляем класс для body, чтобы предотвратить прокрутку
                if (sidebarToggle.checked) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            }
        });
    }
    
    // Закрываем меню при клике вне его области на мобильных
    document.addEventListener('click', function(e) {
        if (isMobile() && sidebarToggle && sidebarToggle.checked && 
            sidebar && !sidebar.contains(e.target) && 
            !e.target.closest('.sidebar-toggle-btn') &&
            !e.target.closest('.sidebar')) {
            
            sidebarToggle.checked = false;
            document.body.style.overflow = '';
        }
    });
    
    // Обновляем при изменении размера окна
    window.addEventListener('resize', function() {
        if (!isMobile() && sidebarToggle && sidebarToggle.checked) {
            sidebarToggle.checked = false;
            document.body.style.overflow = '';
        }
    });
    
    // Инициализация навигации
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // На мобильных устройствах закрываем меню после выбора раздела
            if (isMobile() && sidebarToggle) {
                sidebarToggle.checked = false;
                document.body.style.overflow = '';
            }
            
            const sectionId = this.getAttribute('data-section') || this.getAttribute('href').substring(1);
            navigateToSection(sectionId);
        });
    });
    
    // Добавляем обработчик для закрытия модальных окон при клике на overlay
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
                this.classList.add('hide');
                
                // Удаляем класс hide после завершения анимации
                setTimeout(() => {
                    this.classList.remove('hide');
                }, 300);
            }
        });
    });
});