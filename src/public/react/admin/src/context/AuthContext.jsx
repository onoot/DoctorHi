// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { http } from '../api/http';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const isInitialCheck = useRef(true);

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    const checkAuthOnMount = async () => {
      try {
        const res = await http.get('/auth/admin/validate');
        
        if (res?.valid === true) {
          setIsAuthenticated(true);
          setUser(res.user || null);
          
          // Если на странице логина и уже авторизован - редирект на админку
          if (window.location.pathname === '/login') {
            navigate('/admin', { replace: true });
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        console.error('Auth validation error:', err);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
        isInitialCheck.current = false;
      }
    };
    
    checkAuthOnMount();
  }, [navigate]);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const res = await http.get('/auth/admin/validate');
      
      if (res?.valid === true) {
        setIsAuthenticated(true);
        setUser(res.user || null);
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (err) {
      console.error('Auth validation error:', err);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      
      // Используем fetch напрямую для избежания рекурсии
      const response = await fetch('http://localhost:3001/api/auth/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // После успешного логина проверяем авторизацию
      await checkAuth();
      
      // Перенаправляем на предыдущую страницу или на /admin
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      navigate('/login', { replace: true });
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};