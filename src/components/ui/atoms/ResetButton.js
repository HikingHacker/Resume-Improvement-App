import React from 'react';
import PropTypes from 'prop-types';
import { RotateCcw } from 'lucide-react';
import Button from './Button';
import { useResumeContext } from '../../../contexts/ResumeContext';

/**
 * Reset button component with confirmation dialog
 * When clicked, asks for confirmation before resetting all resume data
 * 
 * @returns {JSX.Element} ResetButton component
 */
const ResetButton = ({ className = '' }) => {
  const { clearStorageAndResetState } = useResumeContext();
  
  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all resume data? This cannot be undone.")) {
      clearStorageAndResetState();
    }
  };

  return (
    <Button 
      onClick={handleReset}
      variant="danger"
      className={className}
    >
      <RotateCcw className="w-4 h-4 mr-2" />
      Reset
    </Button>
  );
};

ResetButton.propTypes = {
  className: PropTypes.string
};

export default ResetButton;