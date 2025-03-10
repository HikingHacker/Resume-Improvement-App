// components/ui/Skeleton.js
import React from 'react';

export const Skeleton = ({ className, variant = 'rectangle', width, height, ...props }) => {
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

export const SkeletonText = ({ lines = 3, className, ...props }) => {
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

export const SkeletonAvatar = ({ size = 'md', className, ...props }) => {
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

export const SkeletonButton = ({ width = 'full', className, ...props }) => {
  return (
    <Skeleton 
      variant="button" 
      className={`w-${width} ${className}`} 
      {...props} 
    />
  );
};

export default Skeleton;