// Инициализация мобильного меню
document.addEventListener('DOMContentLoaded', function() {
    // Используем let вместо const, чтобы можно было переназначить переменную
    let sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggleBtn = document.querySelector('.sidebar-toggle-btn');
    const mainContent = document.querySelector('.main-content');
    
    // Проверка, существует ли элемент sidebarToggle
    if (!sidebarToggle) {
        // Создаем скрытый чекбокс для переключения меню
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.id = 'sidebar-toggle';
        toggle.className = 'sidebar-toggle';
        toggle.hidden = true;
        toggle.setAttribute('aria-label', 'Toggle sidebar');
        document.body.insertBefore(toggle, document.body.firstChild);
        
        // КРИТИЧЕСКИ ВАЖНО: обновляем переменную sidebarToggle
        sidebarToggle = document.getElementById('sidebar-toggle');
    }
    
    // Функция для проверки мобильного устройства
    function isMobile() {
        return window.innerWidth <= 992;
    }
    
    // Функция для обновления ARIA атрибутов
    function updateAriaAttributes(isOpen) {
        if (sidebarToggleBtn) {
            sidebarToggleBtn.setAttribute('aria-expanded', isOpen);
            sidebarToggleBtn.setAttribute('aria-label', isOpen ? 'Close sidebar' : 'Open sidebar');
        }
        
        if (sidebar) {
            sidebar.setAttribute('aria-hidden', !isOpen);
        }
    }
    
    // Функция для открытия меню
    function openSidebar() {
        if (sidebarToggle && !sidebarToggle.checked) {
            sidebarToggle.checked = true;
            document.body.style.overflow = 'hidden';
            updateAriaAttributes(true);
            
            // Добавляем класс для анимации
            if (sidebar) {
                sidebar.classList.add('sidebar-open');
            }
            
            // Добавляем класс для затемнения контента
            if (mainContent) {
                mainContent.classList.add('content-blurred');
            }
        }
    }
    
    // Функция для закрытия меню
    function closeSidebar() {
        if (sidebarToggle && sidebarToggle.checked) {
            sidebarToggle.checked = false;
            document.body.style.overflow = '';
            updateAriaAttributes(false);
            
            // Удаляем классы для анимации
            if (sidebar) {
                sidebar.classList.remove('sidebar-open');
            }
            
            if (mainContent) {
                mainContent.classList.remove('content-blurred');
            }
        }
    }
    
    // Обработчик клика по бургер-меню
    if (sidebarToggleBtn && sidebarToggle) {
        // Устанавливаем начальное состояние ARIA
        updateAriaAttributes(false);
        
        sidebarToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Предотвращаем множественные клики во время анимации
            if (this.dataset.clicking === 'true') return;
            
            this.dataset.clicking = 'true';
            
            if (isMobile()) {
                // Переключаем состояние меню
                if (sidebarToggle.checked) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
                
                // Блокируем клики на короткое время для завершения анимации
                setTimeout(() => {
                    this.dataset.clicking = 'false';
                }, 300);
            }
        });
    }
    
    // Закрываем меню при клике вне его области на мобильных
    document.addEventListener('click', function(e) {
        if (isMobile() && sidebarToggle && sidebarToggle.checked && 
            sidebar && !sidebar.contains(e.target) && 
            !e.target.closest('.sidebar-toggle-btn') &&
            !e.target.closest('.sidebar')) {
            
            closeSidebar();
        }
    });
    
    // Обработчик касаний для лучшего UX на мобильных
    if (sidebarToggle && sidebar) {
        let touchStartX = 0;
        
        sidebar.addEventListener('touchstart', function(e) {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });
        
        sidebar.addEventListener('touchmove', function(e) {
            const touchDeltaX = e.touches[0].clientX - touchStartX;
            
            // Если свайп вправо на мобильном устройстве и меню закрыто, открываем
            if (touchDeltaX > 50 && !sidebarToggle.checked && isMobile()) {
                e.preventDefault();
                openSidebar();
            }
            
            // Если свайп влево на мобильном устройстве и меню открыто, закрываем
            if (touchDeltaX < -50 && sidebarToggle.checked && isMobile()) {
                e.preventDefault();
                closeSidebar();
            }
        }, { passive: false });
    }
    
    // Обновляем при изменении размера окна с использованием debounce
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // Если перешли с мобильного на десктопный режим, сбрасываем состояние
            if (!isMobile() && sidebarToggle && sidebarToggle.checked) {
                closeSidebar();
            }
            
            // Обновляем отображение бургер-кнопки
            if (sidebarToggleBtn) {
                sidebarToggleBtn.style.display = isMobile() ? 'flex' : 'none';
            }
        }, 250);
    });
    
    // Инициализация отображения бургер-кнопки
    if (sidebarToggleBtn) {
        sidebarToggleBtn.style.display = isMobile() ? 'flex' : 'none';
    }
    
    // Инициализация навигации
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // На мобильных устройствах закрываем меню после выбора раздела
            if (isMobile() && sidebarToggle && sidebarToggle.checked) {
                closeSidebar();
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
    
    // Закрытие модальных окон по кнопке "×"
document.querySelectorAll('.modal-close, .close').forEach(button => {
    button.addEventListener('click', function(e) {
        e.stopPropagation(); // ← ОБЯЗАТЕЛЬНО!
        e.preventDefault();  // ← НА ВСЯКИЙ СЛУЧАЙ
        const modalId = this.closest('.modal')?.id || this.getAttribute('data-modal');
        if (modalId) {
            closeModal(modalId);
        }
    });
});
    // Добавляем обработчик для нажатия клавиши Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebarToggle && sidebarToggle.checked) {
            closeSidebar();
        }
    });
    
    // Инициализация после полной загрузки
    console.log('[MOBILE MENU] Mobile menu initialized successfully');
});