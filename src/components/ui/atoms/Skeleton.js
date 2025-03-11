import React from 'react';
import PropTypes from 'prop-types';

/**
 * Skeleton component for representing loading state
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Shape variant
 * @param {string|number} props.width - Element width
 * @param {string|number} props.height - Element height
 * @returns {JSX.Element} Skeleton component
 */
const Skeleton = ({ 
  className = '',
  variant = 'rectangle',
  width,
  height,
  ...props 
}) => {
  const variants = {
    rectangle: 'rounded',
    circle: 'rounded-full',
    text: 'rounded h-4',
    avatar: 'rounded-full h-12 w-12',
    button: 'rounded h-10',
    card: 'rounded-lg h-40',
  };

  return (
    <div
      className={`
        animate-pulse bg-gray-200 dark:bg-gray-700
        ${variants[variant]}
        ${width ? `w-${width}` : 'w-full'}
        ${height ? `h-${height}` : ''}
        ${className}
      `}
      aria-hidden="true"
      {...props}
    />
  );
};

/**
 * SkeletonText component for loading text content
 * 
 * @param {Object} props - Component props
 * @param {number} props.lines - Number of text lines to show
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} SkeletonText component
 */
const SkeletonText = ({ 
  lines = 3,
  className = '',
  ...props 
}) => {
  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i}
          variant="text" 
          className={i === lines - 1 ? 'w-4/5' : 'w-full'} 
        />
      ))}
    </div>
  );
};

/**
 * SkeletonAvatar component for loading avatar images
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Avatar size
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} SkeletonAvatar component
 */
const SkeletonAvatar = ({ 
  size = 'md',
  className = '',
  ...props 
}) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };
  
  return (
    <Skeleton 
      variant="circle" 
      className={`${sizes[size]} ${className}`} 
      {...props} 
    />
  );
};

/**
 * SkeletonButton component for loading buttons
 * 
 * @param {Object} props - Component props
 * @param {string|number} props.width - Button width
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} SkeletonButton component
 */
const SkeletonButton = ({ 
  width = 'full',
  className = '',
  ...props 
}) => {
  return (
    <Skeleton 
      variant="button" 
      className={`w-${width} ${className}`} 
      {...props} 
    />
  );
};

// PropTypes
Skeleton.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['rectangle', 'circle', 'text', 'avatar', 'button', 'card']),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

SkeletonText.propTypes = {
  lines: PropTypes.number,
  className: PropTypes.string
};

SkeletonAvatar.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string
};

SkeletonButton.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string
};

// Export all components
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton
};

export default Skeleton;