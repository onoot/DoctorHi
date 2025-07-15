import { API_BASE_URL, showOwnershipDetails } from './ownership-details.js';

export async function handleLogin(event) {
    event.preventDefault();
    
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ login, password })
        });

        const data = await response.json();

        if (response.ok) {
            showOwnershipDetails();
            errorMessage.style.display = 'none';
        } else {
            errorMessage.textContent = data.message || 'Invalid credentials';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'Login failed. Please try again.';
        errorMessage.style.display = 'block';
    }
}

// ... остальные функции для работы с формами ... 