# Doctor Heights API

API для управления недвижимостью и пользователями в системе Doctor Heights.

## Требования

- Node.js 14+
- MySQL 5.7+

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/your-username/doctor-heights-api.git
cd doctor-heights-api
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл .env на основе .env.example и настройте переменные окружения:
```bash
cp .env.example .env
```

4. Создайте базу данных MySQL:
```sql
CREATE DATABASE doctor_heights;
```

5. Импортируйте структуру базы данных:
```bash
mysql -u your_username -p doctor_heights < src/config/init.sql
```

## Запуск

Для разработки:
```bash
npm run dev
```

Для продакшена:
```bash
npm start
```

## API Endpoints

### Клиентские маршруты

#### Аутентификация
- POST /api/v1/client/auth/login - Вход в систему
- POST /api/v1/client/auth/register - Регистрация нового пользователя

#### Недвижимость
- GET /api/v1/client/properties/:propertyId - Получить информацию об объекте
- GET /api/v1/client/properties/:propertyId/ownership-history - Получить историю владения
- GET /api/v1/client/properties/:propertyId/active-transaction - Получить активную сделку

#### Сделки
- POST /api/v1/client/transactions/request - Запросить сделку
- GET /api/v1/client/transactions - Получить список сделок пользователя

### Административные маршруты

#### Пользователи
- GET /api/v1/admin/users - Получить список пользователей
- PUT /api/v1/admin/users/:userId - Обновить статус пользователя

#### Сделки
- GET /api/v1/admin/transactions - Получить список всех сделок
- PUT /api/v1/admin/transactions/:transactionId - Обновить статус сделки
- POST /api/v1/admin/transactions/history/clear - Очистить историю сделок

```

## Безопасность

- Все маршруты (кроме аутентификации) требуют JWT токен
- Административные маршруты доступны только пользователям с ролью admin
- Пароли хешируются с использованием bcrypt
- Используется helmet для защиты от известных веб-уязвимостей
- Загрузка файлов ограничена по размеру и типу

## Разработка

1. Создайте новую ветку для своих изменений:
```bash
git checkout -b feature/your-feature-name
```

2. Внесите изменения и создайте коммит:
```bash
git add .
git commit -m "Описание изменений"
```

3. Отправьте изменения в репозиторий:
```bash
git push origin feature/your-feature-name
```

## Лицензия

MIT 
