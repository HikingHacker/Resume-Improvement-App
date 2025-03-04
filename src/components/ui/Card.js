// components/ui/card.js
import React from 'react';

export const Card = ({ children, className, ...props }) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-md ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }) => {
  return (
    <div 
      className={`p-6 pb-3 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className, ...props }) => {
  return (
    <h3 
      className={`text-xl font-bold ${className}`} 
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardContent = ({ children, className, ...props }) => {
  return (
    <div 
      className={`p-6 pt-3 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};