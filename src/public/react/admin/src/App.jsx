// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AdminLayout from './components/layout/AdminLayout';
import Login from './components/Login';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';              
import { ApiProvider } from './context/ApiContext';
import theme from './theme';
import './App.css';

// Компонент ProtectedRoute
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{
            width: 50,
            height: 50,
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Компонент PublicRoute для логина
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{
            width: 50,
            height: 50,
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
};

const AppContent = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app">
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/admin" replace />} />
          
          <Route path="*" element={
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              textAlign: 'center',
              background: '#f8f9fa',
            }}>
              <h1 style={{ fontSize: '120px', color: '#667eea', margin: 0 }}>404</h1>
              <p style={{ fontSize: '24px', color: '#666', marginTop: '20px' }}>Page not found</p>
            </div>
          } />
        </Routes>
      </div>
    </ThemeProvider>
  );
};

const App = () => {
  return (
    <Router>
      <ApiProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </ApiProvider>
    </Router>
  );
};

export default App;