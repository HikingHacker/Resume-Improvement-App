import React from 'react';
import PropTypes from 'prop-types';

/**
 * Card component for containing content in a styled container
 */
const Card = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: 'bg-white',
    bordered: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg',
    flat: 'bg-gray-50',
    interactive: 'bg-white hover:shadow-md transition-shadow cursor-pointer',
  };

  return (
    <div
      className={`rounded-lg shadow-md transition-all ${variants[variant]} ${className}`}
      tabIndex={props.onClick ? 0 : undefined}
      role={props.onClick ? 'button' : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card header component
 */
const CardHeader = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`p-6 pb-3 border-b border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card title component
 */
const CardTitle = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h3
      className={`text-xl font-bold text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

/**
 * Card description component
 */
const CardDescription = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p
      className={`text-sm text-gray-500 mt-1 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

/**
 * Card content component
 */
const CardContent = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`p-6 pt-3 animate-fade-in ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card footer component
 */
const CardFooter = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`p-6 pt-0 flex justify-end items-center gap-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// PropTypes
Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'bordered', 'elevated', 'flat', 'interactive']),
  onClick: PropTypes.func
};

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

CardTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

CardDescription.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

CardFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

// Export all components
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
};

// Default export for the main Card component
export default Card;