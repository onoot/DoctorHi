import React, { createContext, useContext, useState } from 'react';

const UnitContext = createContext(null);

export const UnitProvider = ({ children, value }) => {
  // If value is provided - use it as context (controlled); else fallback to own state
  const [selectedUnit, setSelectedUnit] = useState(value?.selectedUnit ?? null);
  const [mode, setMode] = useState(value?.mode ?? 'add'); // 'add' | 'view' | 'edit'

  const contextValue = value || { selectedUnit, setSelectedUnit, mode, setMode };

  return (
    <UnitContext.Provider value={contextValue}>
      {children}
    </UnitContext.Provider>
  );
};

export const useUnitContext = () => {
  const ctx = useContext(UnitContext);
  if (!ctx) throw new Error('useUnitContext must be used within UnitProvider');
  return ctx;
};

export default UnitContext;
