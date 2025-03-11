import React, { useState } from 'react';
import { Sun, Moon, Mail, Lock, Eye, EyeOff, Check, X, AlertTriangle, Info } from 'lucide-react';

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
  cn,
  
  // Constants
  VARIANTS
} from './ui';

/**
 * UI Component Showcase
 * This component demonstrates how to use our UI component library
 */
const UIShowcase = () => {
  // States for interactive examples
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState('buttons');
  
  // Steps for StepNavigation example
  const steps = [
    { value: 1, label: 'Account' },
    { value: 2, label: 'Personal' },
    { value: 3, label: 'Review' },
    { value: 4, label: 'Complete' }
  ];
  
  // Sample table data
  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Pending' }
  ];
  
  // Helper function for step navigation
  const isStepCompleted = (step) => step < currentStep;
  
  return (
    <Layout>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>UI Component Library Showcase</CardTitle>
          <CardDescription>
            A demonstration of our modular UI components built with React and Tailwind CSS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              {['buttons', 'inputs', 'cards', 'tables', 'navigation', 'feedback'].map((tab) => (
                <button
                  key={tab}
                  className={cn(
                    'px-4 py-2 capitalize border-b-2 font-medium transition-colors whitespace-nowrap',
                    activeTab === tab
                      ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  )}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          {activeTab === 'buttons' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Button Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
              </section>
              
              <section>
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Button Sizes</h3>
                <div className="flex items-center flex-wrap gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </section>
              
              <section>
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Button States</h3>
                <div className="flex flex-wrap gap-3">
                  <Button>Normal</Button>
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                  <Button variant="primary" className="gap-2">
                    <Check className="w-4 h-4" />
                    With Icon
                  </Button>
                </div>
              </section>
            </div>
          )}
          
          {activeTab === 'inputs' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Text Inputs</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Name" placeholder="Enter your name" />
                  <Input 
                    label="Email" 
                    type="email" 
                    placeholder="example@email.com" 
                    startIcon={<Mail className="w-4 h-4 text-gray-500" />} 
                  />
                  <Input 
                    label="Password" 
                    type={passwordVisible ? "text" : "password"} 
                    placeholder="Enter your password" 
                    startIcon={<Lock className="w-4 h-4 text-gray-500" />}
                    endIcon={
                      <button 
                        type="button" 
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        {passwordVisible ? 
                          <EyeOff className="w-4 h-4" /> : 
                          <Eye className="w-4 h-4" />
                        }
                      </button>
                    }
                  />
                  <Input 
                    label="Error Example" 
                    error="This field is required" 
                    placeholder="Input with error" 
                  />
                </div>
              </section>
              
              <section>
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Textarea</h3>
                <Textarea 
                  label="Message" 
                  placeholder="Enter your message here..." 
                  rows={4} 
                  helperText="Max 500 characters" 
                />
              </section>
            </div>
          )}
          
          {activeTab === 'cards' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Card Variants</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Default Card</CardTitle>
                      <CardDescription>This is a basic card component</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300">Cards are used to group related content and actions.</p>
                    </CardContent>
                    <CardFooter>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost">Cancel</Button>
                        <Button>Save</Button>
                      </div>
                    </CardFooter>
                  </Card>
                  
                  <Card variant="bordered">
                    <CardHeader>
                      <CardTitle>Bordered Card</CardTitle>
                      <CardDescription>This card has a border</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300">Different card variants can be used for different contexts.</p>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </div>
          )}
          
          {activeTab === 'tables' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Data Table</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row) => (
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
              </section>
            </div>
          )}
          
          {activeTab === 'navigation' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Step Navigation</h3>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <StepNavigation
                    currentStep={currentStep}
                    steps={steps}
                    onStepClick={setCurrentStep}
                    disabled={[4]}
                    isStepCompleted={isStepCompleted}
                  />
                  
                  <div className="flex justify-center mt-8 gap-3">
                    <Button 
                      onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                      disabled={currentStep === 1}
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                      disabled={currentStep === 4}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          )}
          
          {activeTab === 'feedback' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Badges</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="primary" outline>Outline</Badge>
                </div>
              </section>
              
              <section>
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Tooltips</h3>
                <div className="flex gap-4 justify-center py-4">
                  <Tooltip content="Top tooltip" position="top">
                    <Button variant="outline" size="sm">Hover me (Top)</Button>
                  </Tooltip>
                  
                  <Tooltip content="Bottom tooltip position" position="bottom">
                    <Button variant="outline" size="sm">Hover me (Bottom)</Button>
                  </Tooltip>
                </div>
              </section>
              
              <section>
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Loading States</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-12 w-12" variant="avatar" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  
                  <SkeletonText lines={3} />
                </div>
              </section>
              
              <section>
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Modal</h3>
                <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
                
                <ConfirmationModal
                  isOpen={modalOpen}
                  title="Confirm Action"
                  message="Are you sure you want to perform this action? This cannot be undone."
                  confirmText="Confirm"
                  cancelText="Cancel"
                  onConfirm={() => {
                    alert('Action confirmed!');
                    setModalOpen(false);
                  }}
                  onCancel={() => setModalOpen(false)}
                />
              </section>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default UIShowcase;