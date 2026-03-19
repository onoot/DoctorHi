// src/api/http.js
export const API_BASE_URL = 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Получаем CSRF токен
  function getCsrfToken() {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? match[1] : '';
  }

  const config = {
    headers: {
      'Accept': 'application/json',
      'X-XSRF-TOKEN': getCsrfToken(),
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    // Проверяем если это проверка авторизации - не делаем редирект
    if (response.status === 401 && !endpoint.includes('/auth/admin/validate')) {
      // Только для не-auth запросов делаем редирект
      localStorage.clear();
      window.location.href = '/login';
      return null;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      return data;
    } else {
      // Если ответ не JSON
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return await response.text();
    }
  } catch (error) {
    console.error(`API ${url} failed:`, error);
    throw error;
  }
}

export const http = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    });
  },
  put: (endpoint, body) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  // alias for delete to match older code using http.del
  del: (endpoint) => request(endpoint, { method: 'DELETE' }),
};