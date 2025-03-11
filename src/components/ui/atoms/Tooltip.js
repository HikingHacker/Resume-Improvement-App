import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../utils/utils';
import { Z_INDEX } from '../utils/constants';

/**
 * Tooltip component for displaying additional information on hover
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Element that triggers the tooltip
 * @param {React.ReactNode} props.content - Tooltip content
 * @param {string} props.className - Additional CSS classes for the tooltip
 * @param {string} props.position - Tooltip position relative to the trigger
 * @param {string} props.delay - Delay before showing the tooltip in ms
 * @param {boolean} props.arrow - Whether to show an arrow pointing to the trigger
 * @returns {JSX.Element} Tooltip component
 */
const Tooltip = ({
  children,
  content,
  className = '',
  position = 'top',
  delay = 300,
  arrow = true,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTimeout, setShowTimeout] = useState(null);

  // Position styles
  const positionStyles = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  // Arrow styles
  const arrowStyles = {
    top: 'bottom-[-5px] left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'top-[-5px] left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'right-[-5px] top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right: 'left-[-5px] top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent',
  };

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setShowTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (showTimeout) {
      clearTimeout(showTimeout);
      setShowTimeout(null);
    }
    setIsVisible(false);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-[1070] max-w-xs px-2 py-1 text-sm text-white bg-gray-900 dark:bg-gray-800 rounded shadow-sm',
            'animate-fade-in',
            positionStyles[position],
            className
          )}
          style={{ zIndex: Z_INDEX.tooltip }}
          {...props}
        >
          {content}
          
          {arrow && (
            <span 
              className={cn(
                'absolute border-solid border-4 border-gray-900 dark:border-gray-800',
                arrowStyles[position]
              )}
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </div>
  );
};

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  content: PropTypes.node.isRequired,
  className: PropTypes.string,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  delay: PropTypes.number,
  arrow: PropTypes.bool,
};

export default Tooltip;