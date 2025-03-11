// This file contains examples of using the UI components
// It's not meant to be imported directly, but rather to serve as a reference

import React, { useState } from 'react';
import {
  // Atoms
  Button,
  Input,
  Textarea,
  Skeleton,
  SkeletonText,
  Badge,
  Tooltip,
  
  // Molecules
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ConfirmationModal,
  
  // Organisms
  StepNavigation,
  
  // Templates
  Layout,
  
  // Utils
  ThemeProvider,
  ThemeToggle,
  ErrorBoundary,
  
  // Utility functions
  cn,
  generateId,
  
  // Constants
  VARIANTS
} from './index';

// Example of a basic button
export const ButtonExample = () => (
  <div className="space-x-2">
    <Button>Default Button</Button>
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="danger">Danger</Button>
    <Button disabled>Disabled</Button>
    <Button loading>Loading</Button>
  </div>
);

// Example of a form with inputs
export const FormExample = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Contact Form</CardTitle>
        <CardDescription>Fill out this form to contact us</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          
          <Textarea
            label="Message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={5}
            required
          />
        </form>
      </CardContent>
      
      <CardFooter>
        <Button variant="ghost">Cancel</Button>
        <Button type="submit">Submit</Button>
      </CardFooter>
    </Card>
  );
};

// Example of a table
export const TableExample = () => {
  const data = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Pending' },
  ];
  
  return (
    <Table variant="striped">
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(row => (
          <TableRow key={row.id}>
            <TableCell>{row.id}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.email}</TableCell>
            <TableCell>
              <Badge 
                variant={
                  row.status === 'Active' ? 'success' : 
                  row.status === 'Inactive' ? 'danger' : 'warning'
                }
              >
                {row.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Example of step navigation
export const StepNavigationExample = () => {
  const [currentStep, setCurrentStep] = useState(1);
  
  const steps = [
    { value: 1, label: 'Upload' },
    { value: 2, label: 'Analyze' },
    { value: 3, label: 'Improve' },
    { value: 4, label: 'Review' },
  ];
  
  const isStepCompleted = (step) => {
    return step < currentStep;
  };
  
  return (
    <StepNavigation
      currentStep={currentStep}
      steps={steps}
      onStepClick={setCurrentStep}
      disabled={[3, 4]}
      isStepCompleted={isStepCompleted}
    />
  );
};

// Example of a tooltip
export const TooltipExample = () => (
  <div className="flex justify-center p-8">
    <Tooltip content="This is a helpful tooltip">
      <Button>Hover me</Button>
    </Tooltip>
  </div>
);

// Example of a confirmation modal
export const ConfirmationModalExample = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete Item
      </Button>
      
      <ConfirmationModal
        isOpen={isOpen}
        title="Confirm Deletion"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          console.log('Item deleted');
          setIsOpen(false);
        }}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
};

// Complete application example with layout
export const ApplicationExample = () => (
  <ThemeProvider>
    <ErrorBoundary>
      <Layout>
        <div className="space-y-8">
          <h1 className="text-2xl font-bold">UI Components</h1>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">Buttons</h2>
            <ButtonExample />
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">Form</h2>
            <FormExample />
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">Table</h2>
            <TableExample />
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">Step Navigation</h2>
            <StepNavigationExample />
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">Modal</h2>
            <ConfirmationModalExample />
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">Tooltip</h2>
            <TooltipExample />
          </section>
        </div>
      </Layout>
    </ErrorBoundary>
  </ThemeProvider>
);