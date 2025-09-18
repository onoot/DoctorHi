// init.js
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация всех компонентов
    initModalHandlers();
    initNavigation();
    initTransactionHandlers();
    
    // Загрузка начальных данных
    navigateToSection('transactions');

    loadUsers();
    initCurrencyConverter();
});
