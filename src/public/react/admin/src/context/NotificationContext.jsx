// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState } from 'react';
import './not.css'

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (type, message, duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = { id, type, message };
    setNotifications((prev) => [...prev, notification]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, duration);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div id="notification-container" className="notification-container">
        {notifications.map((n) => (
          <div key={n.id} className={`notification notification-${n.type} show`}>
            <i className={`fas ${getIcon(n.type)}`}></i>
            <span>{n.message}</span>
            <button
              className="notification-close"
              onClick={() => setNotifications((prev) => prev.filter((item) => item.id !== n.id))}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

const getIcon = (type) => {
  switch (type) {
    case 'error': return 'fa-exclamation-circle';
    case 'warning': return 'fa-exclamation-triangle';
    case 'info': return 'fa-info-circle';
    case 'success': return 'fa-check-circle';
    default: return 'fa-bell';
  }
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};