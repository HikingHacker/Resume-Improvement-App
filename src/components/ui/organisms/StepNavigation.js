import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle } from 'lucide-react';
import { cn } from '../utils/utils';

/**
 * Step navigation component for multi-step processes
 *
 * @param {Object} props - Component props
 * @param {string|number} props.currentStep - Current step value
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
    <div className={cn("w-full flex justify-center overflow-x-auto px-1", className)}>
      <div className="flex items-start max-w-5xl w-full md:px-0">
        {steps.map((step, index) => {
          const isActive = currentStep === step.value;
          const isDisabled = disabled.includes(step.value);
          const isCompleted = isStepCompleted(step.value);
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={index}>
              {/* Step item */}
              <div className="flex flex-col items-center justify-start relative z-10 flex-shrink-0 mx-0">
                {/* Step circle */}
                <button
                  onClick={() => !isDisabled && onStepClick(step.value)}
                  disabled={isDisabled}
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 relative",
                    isActive
                      ? "bg-primary-600 text-white shadow-md"
                      : isCompleted
                        ? "bg-primary-100 text-primary-700 border-2 border-primary-600"
                        : "bg-white text-gray-500 border-2 border-gray-300",
                    isDisabled ? "cursor-not-allowed opacity-60" : "hover:shadow-lg"
                  )}
                  aria-current={isActive ? 'step' : undefined}
                  aria-disabled={isDisabled}
                  tabIndex={isDisabled ? "-1" : "0"}
                  title={isDisabled ? "This step is not available yet" : step.label}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" aria-hidden="true" />
                  ) : (
                    <span className="text-xs sm:text-sm font-semibold">{step.icon || index + 1}</span>
                  )}
                </button>

                {/* Step label */}
                <span className={cn(
                  "mt-1 sm:mt-2 text-xs font-medium text-center px-1 transition-colors duration-200 leading-tight w-20 sm:w-24",
                  isActive
                    ? "text-primary-700"
                    : isCompleted
                      ? "text-primary-600"
                      : "text-gray-600"
                )}>
                  {step.label}
                </span>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 -mx-2 min-w-[2rem] self-start mt-4 sm:mt-5", // Extends lines with negative margin
                    isCompleted && isStepCompleted(steps[index + 1].value)
                      ? "bg-primary-600"
                      : "bg-gray-300"
                  )}
                  style={{ marginLeft: "-4px", marginRight: "-4px" }} // Fine-tune the exact positioning
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
  currentStep: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
    })
  ).isRequired,
  onStepClick: PropTypes.func.isRequired,
  disabled: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])),
  isStepCompleted: PropTypes.func,
  className: PropTypes.string,
};

export default StepNavigation;