# UI Component Library

A modular, accessible component library built with React and Tailwind CSS.

## Structure

The component library follows the Atomic Design methodology:

```
ui/
├── atoms/         # Basic building blocks (Button, Input, Textarea, etc.)
├── molecules/     # Combinations of atoms (Card, Table, Modal, etc.)
├── organisms/     # Complex UI components (StepNavigation, Forms, etc.)
├── templates/     # Page layouts and templates
├── utils/         # Utility components and functions (ThemeProvider, ErrorBoundary, etc.)
├── index.js       # Main export file
└── README.md      # Documentation (this file)
```

## Usage

Import components directly from the UI library:

```jsx
import { Button, Input, Card } from '../components/ui';

const MyComponent = () => (
  <Card>
    <h2>Form Example</h2>
    <Input label="Username" required />
    <Button variant="primary">Submit</Button>
  </Card>
);
```

## Component Types

### Atoms

Basic building blocks of the interface - cannot be broken down further.

- **Button**: Action triggers with various styles and states
- **Input**: Text fields for user input
- **Textarea**: Multi-line text input
- **Skeleton**: Loading placeholders

### Molecules

Combinations of atoms forming more complex components.

- **Card**: Content containers with consistent styling
- **Table**: Data tables for structured information
- **ConfirmationModal**: Dialog boxes for user confirmation

### Organisms

Complex, complete features composed of molecules and atoms.

- **StepNavigation**: Multi-step form navigation

### Utils

Non-visual utilities and providers.

- **ThemeProvider**: Manages light/dark mode
- **ErrorBoundary**: Catches and handles JavaScript errors
- **Constants**: Shared values for consistent design

## Accessibility

All components are built with accessibility in mind:

- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Color contrast compliance

## Theming

Components support light and dark mode through the ThemeProvider.

## Best Practices

- Use the appropriate component for each use case
- Maintain consistent prop naming across components
- Follow the component documentation for proper usage
- Extend existing components rather than creating new ones
- Use the built-in variants before adding custom styles