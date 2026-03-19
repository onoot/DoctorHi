// src/utils/useUSDConverter.js
import { useState, useEffect } from 'react';
import { http } from '../api/http'; // Используем ваш http.js

// Кэширование курса обмена
let exchangeRateCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут
let isFetchingRate = false; // Флаг для предотвращения дублирующих запросов

/**
 * Хук для конвертации PKR в USD
 * @param {number} pkrAmount - Сумма в PKR
 * @returns {{ usdValue: string, exchangeRate: number }} - Отформатированное значение USD и курс
 */
export const useUSDConverter = (pkrAmount) => {
  const [usdValue, setUsdValue] = useState('');
  const [exchangeRate, setExchangeRate] = useState(0.0036);

  useEffect(() => {
    if (typeof pkrAmount !== 'number' || isNaN(pkrAmount) || pkrAmount <= 0) {
      setUsdValue('');
      return;
    }

    const convert = async () => {
      // Если уже идет запрос, ждем его завершения
      if (isFetchingRate) {
        const checkRate = setInterval(() => {
          if (!isFetchingRate && exchangeRateCache) {
            clearInterval(checkRate);
            const rate = exchangeRateCache;
            const usd = pkrAmount * rate;
            setExchangeRate(rate);
            setUsdValue(formatUSD(usd));
          }
        }, 100);
        return;
      }

      // Проверяем кэш
      const now = Date.now();
      if (exchangeRateCache && (now - lastFetchTime) < CACHE_DURATION) {
        console.log('[CURRENCY] Using cached exchange rate:', exchangeRateCache);
        const rate = exchangeRateCache;
        const usd = pkrAmount * rate;
        setExchangeRate(rate);
        setUsdValue(formatUSD(usd));
        return;
      }

      // Устанавливаем флаг, что идет запрос
      isFetchingRate = true;
      console.log('[CURRENCY] Fetching new exchange rate...');

      try {
        const rate = await getExchangeRatePKRtoUSD();
        const usd = pkrAmount * rate;
        setExchangeRate(rate);
        setUsdValue(formatUSD(usd));
      } catch (error) {
        console.error('Ошибка получения курса:', error);
        // Используем fallback курс
        const fallbackRate = 0.0036;
        const usd = pkrAmount * fallbackRate;
        setExchangeRate(fallbackRate);
        setUsdValue(formatUSD(usd));
      } finally {
        // Сбрасываем флаг после завершения запроса
        isFetchingRate = false;
      }
    };

    convert();
  }, [pkrAmount]);

  return { usdValue, exchangeRate };
};

/**
 * Функция для получения курса обмена PKR к USD
 * @returns {Promise<number>} - Курс обмена
 */
async function getExchangeRatePKRtoUSD() {
  // Если уже идет запрос, ждем его завершения
  if (isFetchingRate) {
    return new Promise((resolve) => {
      const checkRate = setInterval(() => {
        if (!isFetchingRate && exchangeRateCache) {
          clearInterval(checkRate);
          resolve(exchangeRateCache);
        }
      }, 100);
    });
  }

  // Проверяем кэш
  const now = Date.now();
  if (exchangeRateCache && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('[CURRENCY] Using cached exchange rate:', exchangeRateCache);
    return exchangeRateCache;
  }

  // Устанавливаем флаг, что идет запрос
  isFetchingRate = true;
  console.log('[CURRENCY] Fetching new exchange rate...');

  try {
    // Используем правильный URL с учетом структуры API
    const response = await http.get('/v1/admin/latest/PKR');

    // Проверяем структуру ответа
    if (response.success && typeof response.USD === 'number' && response.USD > 0) {
      console.log('[CURRENCY] Exchange rate received:', response.USD);
      exchangeRateCache = response.USD;
      lastFetchTime = now;
      return response.USD;
    }

    throw new Error('Invalid API response structure');
  } catch (error) {
    console.error('Ошибка получения курса:', error);

    // Возвращаем fallback курс
    exchangeRateCache = 0.0036;
    lastFetchTime = now;
    return 0.0036;
  } finally {
    // Сбрасываем флаг после завершения запроса
    isFetchingRate = false;
  }
}

/**
 * Форматирование USD с отображением валюты
 * @param {number} amount - Сумма в USD
 * @returns {string} - Отформатированная строка
 */
function formatUSD(amount) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (e) {
    console.error('Error formatting USD:', e);
    return `$${amount.toFixed(2)}`;
  }
}