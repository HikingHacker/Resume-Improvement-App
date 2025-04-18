import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle } from 'lucide-react';
import { cn } from '../utils/utils';

/**
 * Step navigation component for multi-step processes
 * 
 * @param {Object} props - Component props
 * @param {number} props.currentStep - Current step value
 * @param {Array} props.steps - Array of step objects with value, label, and optional icon
 * @param {Function} props.onStepClick - Function to call when a step is clicked
 * @param {Array} props.disabled - Array of step values that should be disabled
 * @param {Function} props.isStepCompleted - Function to determine if a step is completed
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} StepNavigation component
 */
const StepNavigation = ({ 
  currentStep, 
  steps, 
  onStepClick, 
  disabled = [], 
  isStepCompleted = () => false,
  className = '',
}) => {
  return (
    <div className={cn("w-full mb-8 flex justify-center", className)}>
      <div className="flex items-center max-w-4xl w-full">
        {steps.map((step, index) => {
          const isActive = currentStep === step.value;
          const isDisabled = disabled.includes(step.value);
          const isCompleted = isStepCompleted(step.value);
          const isLast = index === steps.length - 1;
          
          return (
            <React.Fragment key={index}>
              {/* Step item */}
              <div className="flex flex-col items-center justify-center relative z-10">
                {/* Step circle */}
                <button 
                  onClick={() => !isDisabled && onStepClick(step.value)}
                  disabled={isDisabled}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 relative",
                    isActive 
                      ? "bg-primary-600 dark:bg-primary-500 text-white shadow-md" 
                      : isCompleted
                        ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-2 border-primary-600 dark:border-primary-500"
                        : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600",
                    isDisabled ? "cursor-not-allowed opacity-60" : "hover:shadow-lg"
                  )}
                  aria-current={isActive ? 'step' : undefined}
                  aria-disabled={isDisabled}
                  tabIndex={isDisabled ? "-1" : "0"}
                  title={isDisabled ? "This step is not available yet" : step.label}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  ) : (
                    <span className="text-sm font-semibold">{step.icon || index + 1}</span>
                  )}
                </button>
                
                {/* Step label */}
                <span className={cn(
                  "mt-2 text-xs font-medium text-center w-20 transition-colors duration-200",
                  isActive 
                    ? "text-primary-700 dark:text-primary-300" 
                    : isCompleted
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-gray-600 dark:text-gray-400"
                )}>
                  {step.label}
                </span>
              </div>
              
              {/* Connecting line */}
              {!isLast && (
                <div 
                  className={cn(
                    "flex-1 h-0.5 mx-1",
                    isCompleted && isStepCompleted(steps[index + 1].value) 
                      ? "bg-primary-600 dark:bg-primary-500" 
                      : "bg-gray-300 dark:bg-gray-600"
                  )}
                  aria-hidden="true"
                ></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

StepNavigation.propTypes = {
  currentStep: PropTypes.number.isRequired,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
    })
  ).isRequired,
  onStepClick: PropTypes.func.isRequired,
  disabled: PropTypes.arrayOf(PropTypes.number),
  isStepCompleted: PropTypes.func,
  className: PropTypes.string,
};

export default StepNavigation;