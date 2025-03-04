// components/ui/input.js
import React from 'react';

const Input = ({ className, ...props }) => {
  return (
    <input
      className={`w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none ${className}`}
      {...props}
    />
  );
};

export default Input;