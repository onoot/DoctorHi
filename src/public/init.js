// init.js
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация всех компонентов
    initModalHandlers();
    initUserModalHandlers();
    initNavigation();
    initTransactionHandlers();
    
    // Загрузка начальных данных
    navigateToSection('transactions');
});