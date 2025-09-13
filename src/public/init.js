// init.js
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация всех компонентов
    initModalHandlers();
    initNavigation();
    initTransactionHandlers();
    
    // Загрузка начальных данных
    navigateToSection('transactions');

    loadTransactions(1, 1);
    loadUsers();
    initCurrencyConverter();
});
