import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../utils/utils';
import { VARIANTS } from '../utils/constants';

/**
 * Badge component for status indicators and labels
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Badge style variant
 * @param {string} props.size - Badge size
 * @param {boolean} props.outline - Whether to use outline style
 * @returns {JSX.Element} Badge component
 */
const Badge = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  size = 'md',
  outline = false,
  ...props 
}) => {
  // Variant styles
  const variantStyles = {
    primary: outline 
      ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 bg-transparent' 
      : 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
    
    secondary: outline 
      ? 'border-secondary-600 text-secondary-600 dark:border-secondary-400 dark:text-secondary-400 bg-transparent' 
      : 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300',
    
    success: outline 
      ? 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400 bg-transparent' 
      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    
    danger: outline 
      ? 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400 bg-transparent' 
      : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    
    warning: outline 
      ? 'border-yellow-600 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400 bg-transparent' 
      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    
    info: outline 
      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-transparent' 
      : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    
    light: outline 
      ? 'border-gray-300 text-gray-700 dark:border-gray-500 dark:text-gray-300 bg-transparent' 
      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    
    dark: outline 
      ? 'border-gray-800 text-gray-800 dark:border-gray-200 dark:text-gray-200 bg-transparent' 
      : 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800',
  };

  // Size styles
  const sizeStyles = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-full',
        outline ? 'border' : '',
        variantStyles[variant] || variantStyles.primary,
        sizeStyles[size] || sizeStyles.md,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(Object.keys(VARIANTS)),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  outline: PropTypes.bool,
};

export default Badge;