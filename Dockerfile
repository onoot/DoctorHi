# Используем официальный образ Node.js
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем дополнительные зависимости
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Создаем директорию для загрузок и устанавливаем права
RUN mkdir -p /app/uploads/transactions/agreements \
    /app/uploads/transactions/receipts \
    /app/uploads/transactions/documents \
    && chown -R node:node /app/uploads

# Переключаемся на непривилегированного пользователя
USER node

# Определяем переменные среды по умолчанию
ENV NODE_ENV=production \
    PORT=3000

# Проверка работоспособности
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget -q --spider http://localhost:$PORT/health || exit 1

# Запускаем приложение
CMD ["npm", "start"] 