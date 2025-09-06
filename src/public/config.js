// config.js
// Глобальные конфигурационные переменные

// Базовый URL API
const API_BASE_URL = `https://${window?.location?.host}/api`;

// Параметры пагинации
let currentPage = 1;
let itemsPerPage = 10;

// Экспортируем конфигурацию
export { API_BASE_URL, currentPage, itemsPerPage };