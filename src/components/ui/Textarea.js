// components/ui/textarea.js
import React from 'react';

const Textarea = ({ className, ...props }) => {
  return (
    <textarea
      className={`w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none ${className}`}
      {...props}
    />
  );
};

export default Textarea;