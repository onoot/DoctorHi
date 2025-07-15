export const API_BASE_URL = 'http://127.0.0.1:3003/api';

document.addEventListener('DOMContentLoaded', function() {
    if (!document.cookie.includes('client_token=')) {
        showLoginForm();
    } else {
        validateAuth();
    }
});

export function showLoginForm() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('transferSection').style.display = 'none';
}

export function showOwnershipDetails() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('transferSection').style.display = 'block';
    loadOwnershipDetails();
}

export async function validateAuth() {
    try {
        const propertyId = getPropertyIdFromUrl();
        const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            showOwnershipDetails();
        } else {
            showLoginForm();
        }
    } catch (error) {
        showLoginForm();
    }
}

// ... остальные функции ... 