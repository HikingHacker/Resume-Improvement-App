import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Input component for collecting user data
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.error - Error message
 * @param {string} props.label - Input label
 * @param {string} props.helperText - Helper text displayed below input
 * @param {string} props.id - Input ID
 * @param {boolean} props.fullWidth - Whether input should take full width
 * @param {React.ReactNode} props.startIcon - Icon displayed at start of input
 * @param {React.ReactNode} props.endIcon - Icon displayed at end of input
 * @param {boolean} props.required - Whether input is required
 * @returns {JSX.Element} Input component
 */
const Input = forwardRef(({ 
  className = '', 
  error, 
  label, 
  helperText, 
  id, 
  fullWidth = true, 
  startIcon,
  endIcon,
  required = false,
  ...props 
}, ref) => {
  // Generate a unique ID if one is not provided
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {startIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded transition-colors duration-200
            border ${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} 
            text-gray-900 dark:text-white
            bg-white dark:bg-gray-800
            focus:ring-2 ${error ? 'focus:ring-red-500 dark:focus:ring-red-400' : 'focus:ring-primary-500 dark:focus:ring-primary-400'} 
            focus:border-transparent focus:outline-none
            disabled:bg-gray-100 disabled:dark:bg-gray-700 disabled:cursor-not-allowed
            ${startIcon ? 'pl-10' : 'pl-3'} 
            ${endIcon ? 'pr-10' : 'pr-3'} 
            py-2
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={helperText || error ? `${inputId}-helper-text` : undefined}
          required={required}
          {...props}
        />
        
        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {endIcon}
          </div>
        )}
      </div>
      
      {(helperText || error) && (
        <p 
          id={`${inputId}-helper-text`}
          className={`mt-1 text-sm ${error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.propTypes = {
  className: PropTypes.string,
  error: PropTypes.string,
  label: PropTypes.string,
  helperText: PropTypes.string,
  id: PropTypes.string,
  fullWidth: PropTypes.bool,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  required: PropTypes.bool,
  onChange: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  placeholder: PropTypes.string,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  name: PropTypes.string
};

Input.displayName = 'Input';

export default Input;