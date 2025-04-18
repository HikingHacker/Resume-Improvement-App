import React from 'react';
import { RotateCcw } from 'lucide-react';
import Button from './Button';
import { useResumeContext } from '../../../contexts/ResumeContext';

/**
 * Fixed Reset button component that appears at the bottom of the page
 * When clicked, asks for confirmation before resetting all resume data
 * 
 * @returns {JSX.Element} FixedResetButton component
 */
const FixedResetButton = () => {
  const { clearStorageAndResetState } = useResumeContext();
  
  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all resume data? This cannot be undone.")) {
      clearStorageAndResetState();
    }
  };

  return (
    <div className="w-full bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3">
      <div className="flex justify-center">
        <Button 
          onClick={handleReset}
          variant="danger"
          className="shadow-md hover:shadow-lg mx-auto"
          size="sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset All Data
        </Button>
      </div>
    </div>
  );
};

export default FixedResetButton;