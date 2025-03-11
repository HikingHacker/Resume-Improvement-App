// Export all UI components from a single entry point
// This makes importing components cleaner: import { Button, Input } from 'components/ui'

// Atoms - Basic building blocks
export { default as Button } from './atoms/Button';
export { default as Input } from './atoms/Input';
export { default as Textarea } from './atoms/Textarea';
export { default as Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton } from './atoms/Skeleton';
export { default as Badge } from './atoms/Badge';
export { default as Tooltip } from './atoms/Tooltip';

// Molecules - Combinations of atoms
export { default as Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './molecules/Card';
export { default as Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from './molecules/Table';
export { default as ConfirmationModal } from './molecules/ConfirmationModal';

// Organisms - More complex UI components
export { default as StepNavigation } from './organisms/StepNavigation';

// Templates - Page layouts and templates
export { default as Layout } from './templates/Layout';

// Utils - Non-visual utilities
export { default as ThemeProvider, ThemeToggle, useTheme } from './utils/ThemeProvider';
export { default as ErrorBoundary } from './utils/ErrorBoundary';

// Utility functions
export { cn, generateId, formatDate, deepMerge } from './utils/utils';

// Constants
export * from './utils/constants';