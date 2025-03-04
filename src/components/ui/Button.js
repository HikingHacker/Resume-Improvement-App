import React from 'react';

const Button = ({ children, onClick, className, disabled, ...props }) => {
  return (
    <button
      className={`px-4 py-2 rounded flex items-center justify-center ${
        disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-500 text-white hover:bg-blue-600'
      } ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;