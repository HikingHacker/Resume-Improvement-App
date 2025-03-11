import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Textarea component for multi-line user input
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.error - Error message
 * @param {string} props.label - Textarea label
 * @param {string} props.helperText - Helper text displayed below textarea
 * @param {string} props.id - Textarea ID
 * @param {boolean} props.fullWidth - Whether textarea should take full width
 * @param {boolean} props.required - Whether textarea is required
 * @param {number} props.rows - Number of visible text lines
 * @returns {JSX.Element} Textarea component
 */
const Textarea = forwardRef(({ 
  className = '', 
  error, 
  label, 
  helperText, 
  id, 
  fullWidth = true, 
  required = false,
  rows = 4,
  ...props 
}, ref) => {
  // Generate a unique ID if one is not provided
  const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`
          w-full rounded transition-colors duration-200
          border ${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} 
          text-gray-900 dark:text-white
          bg-white dark:bg-gray-800
          focus:ring-2 ${error ? 'focus:ring-red-500 dark:focus:ring-red-400' : 'focus:ring-primary-500 dark:focus:ring-primary-400'} 
          focus:border-transparent focus:outline-none
          disabled:bg-gray-100 disabled:dark:bg-gray-700 disabled:cursor-not-allowed
          px-3 py-2 resize-y
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={helperText || error ? `${textareaId}-helper-text` : undefined}
        required={required}
        {...props}
      />
      
      {(helperText || error) && (
        <p 
          id={`${textareaId}-helper-text`}
          className={`mt-1 text-sm ${error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Textarea.propTypes = {
  className: PropTypes.string,
  error: PropTypes.string,
  label: PropTypes.string,
  helperText: PropTypes.string,
  id: PropTypes.string,
  fullWidth: PropTypes.bool,
  required: PropTypes.bool,
  rows: PropTypes.number,
  onChange: PropTypes.func,
  value: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  name: PropTypes.string
};

Textarea.displayName = 'Textarea';

export default Textarea;