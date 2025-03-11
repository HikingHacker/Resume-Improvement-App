# UI Component Standards

This document outlines the standards for creating and maintaining components in our UI library.

## Component Structure

All components should follow this general structure:

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../utils/utils';

/**
 * Component description
 * 
 * @param {Object} props - Component props
 * @param {string} props.propName - Prop description
 * @returns {JSX.Element} Component
 */
const ComponentName = ({ 
  propName, 
  className = '',
  // More props with defaults
  ...restProps 
}) => {
  // Component logic here
  
  return (
    <element
      className={cn('base-styles', className)}
      {...restProps}
    >
      {/* Component content */}
    </element>
  );
};

ComponentName.propTypes = {
  propName: PropTypes.string.isRequired,
  className: PropTypes.string,
  // More prop types
};

export default ComponentName;
```

## Naming Conventions

- **Files**: PascalCase matching the component name (e.g., `Button.js`)
- **Components**: PascalCase (e.g., `Button`, `Card`, `ConfirmationModal`)
- **Props**: camelCase (e.g., `onClick`, `className`, `isDisabled`)
- **CSS Classes**: kebab-case for custom classes (e.g., `primary-button`)

## Prop Standards

- Use destructuring for props
- Provide default values for optional props
- Document all props with JSDoc comments
- Include PropTypes for type validation
- Spread `restProps` to the root element to support HTML attributes

## Styling

- Use Tailwind CSS for styling
- Use the `cn()` utility to merge class names
- Accept a `className` prop to allow custom styling
- Use CSS variables for theming when needed
- Follow responsive design best practices

## Accessibility

- Include proper ARIA attributes
- Ensure keyboard navigation works
- Use semantic HTML elements
- Test with screen readers
- Follow WCAG 2.1 AA standards

## Performance

- Memoize components when appropriate using `React.memo`
- Avoid unnecessary renders
- Split large components into smaller pieces
- Optimize expensive calculations

## Testing

- Write tests for all components
- Test both functionality and accessibility
- Include snapshot tests
- Test different prop combinations

## Documentation

- Include JSDoc comments for all components and props
- Provide usage examples
- Document available variants and options
- Update the README.md with new components