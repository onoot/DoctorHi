// src/components/common/ActionButton.jsx
import React from 'react';

const ActionButton = ({ children, variant = 'edit', onClick, type = 'button', ...props }) => {
  const baseClass = 'action-btn';
  const variantClass = variant ? `btn-${variant}` : '';
  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default ActionButton;