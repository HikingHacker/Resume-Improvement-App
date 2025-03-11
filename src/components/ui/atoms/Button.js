import React from 'react';
import PropTypes from 'prop-types';

/**
 * Button component for user interactions
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onClick - Click handler function
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'} props.variant - Button style variant
 * @param {'sm'|'md'|'lg'} props.size - Button size
 * @param {boolean} props.loading - Whether to show loading spinner
 * @returns {JSX.Element} Button component
 */
const Button = ({ 
  children, 
  onClick, 
  className = '', 
  disabled = false, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  type = 'button',
  ...props 
}) => {
  // Variant styles
  const variants = {
    primary: `bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-800`,
    secondary: `bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500 dark:bg-secondary-700 dark:hover:bg-secondary-800`,
    outline: `border border-primary-600 text-primary-600 bg-transparent hover:bg-primary-50 focus:ring-primary-500 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-gray-800`,
    ghost: `bg-transparent text-primary-600 hover:bg-gray-100 focus:ring-primary-500 dark:text-primary-400 dark:hover:bg-gray-800`,
    danger: `bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800`,
  };

  // Size styles
  const sizes = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={`rounded flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed ${
        isDisabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
          : variants[variant]
      } ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      type={type}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  loading: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default Button;