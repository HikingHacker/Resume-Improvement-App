import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Button from './Button';

/**
 * Reusable confirmation modal component with keyboard support
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onConfirm - Function to call when confirmed
 * @param {Function} props.onCancel - Function to call when canceled
 * @param {string} props.title - Modal title
 * @param {string} props.message - Modal message
 * @param {string} props.confirmText - Text for confirm button
 * @param {string} props.cancelText - Text for cancel button
 * @param {string} props.confirmVariant - Button variant for confirm button
 */
const ConfirmationModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel,
  title = "Confirm Action",
  message = "Are you sure you want to continue? This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger"
}) => {
  // Handle keyboard events for accessibility
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    // Lock body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'visible';
    };
  }, [isOpen, onCancel]);
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onCancel} // Allow clicking outside to close
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full animate-slide-in"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full mr-3">
              <AlertTriangle className="text-yellow-500 dark:text-yellow-400 w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white" id="modal-title">
              {title}
            </h3>
          </div>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button 
            onClick={onCancel} 
            variant="ghost"
            aria-label="Cancel and close dialog"
          >
            {cancelText}
          </Button>
          <Button 
            onClick={onConfirm} 
            variant={confirmVariant}
            aria-label="Confirm action"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;