// src/context/UserModalContext.jsx
import React, { createContext, useState, useContext } from 'react';

const UserModalContext = createContext();

export const useUserModal = () => {
  const context = useContext(UserModalContext);
  if (!context) {
    throw new Error('useUserModal must be used within UserModalProvider');
  }
  return context;
};

export const UserModalProvider = ({ children }) => {
  const [viewUserModal, setViewUserModal] = useState({
    isOpen: false,
    userId: null,
  });

  const openViewUserModal = (userId) => {
    setViewUserModal({ isOpen: true, userId });
  };

  const closeViewUserModal = () => {
    setViewUserModal({ isOpen: false, userId: null });
  };

  return (
    <UserModalContext.Provider
      value={{
        viewUserModal,
        openViewUserModal,
        closeViewUserModal,
      }}
    >
      {children}
    </UserModalContext.Provider>
  );
};