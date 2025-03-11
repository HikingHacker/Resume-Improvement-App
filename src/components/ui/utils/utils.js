import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine multiple class names with tailwind-merge to handle conflicting classes
 * 
 * @param {...string} inputs - Class strings to merge
 * @returns {string} - Combined class string 
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date object or string into a human-readable string
 * 
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', mergedOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Generate a unique ID with optional prefix
 * 
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} - Unique ID
 */
export function generateId(prefix = 'id') {
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${randomPart}`;
}

/**
 * Deep merge objects recursively
 * 
 * @param {Object} target - Target object to merge into
 * @param {Object} source - Source object to merge from
 * @returns {Object} - Merged object
 */
export function deepMerge(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
}

/**
 * Check if a value is an object
 * 
 * @param {*} item - Value to check
 * @returns {boolean} - True if item is an object
 */
function isObject(item) {
  return (
    item && 
    typeof item === 'object' && 
    !Array.isArray(item) &&
    !(item instanceof Date)
  );
}