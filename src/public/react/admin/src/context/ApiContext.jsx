// src/context/ApiContext.jsx
import React, { createContext, useContext } from 'react';
import { http } from '../api/http';

const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
  return <ApiContext.Provider value={{ http }}>{children}</ApiContext.Provider>;
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
};