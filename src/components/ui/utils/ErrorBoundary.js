import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle } from 'lucide-react';

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child component tree
 * and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You could also log the error to a reporting service here
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    const { children, fallback } = this.props;
    
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback(this.state.error, this.state.errorInfo, this.resetError)
          : fallback;
      }
      
      // Default fallback UI
      return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <div className="bg-red-100 dark:bg-red-900 p-2 rounded-full mr-3">
              <AlertTriangle className="text-red-500 dark:text-red-400 w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Something went wrong
            </h2>
          </div>
          
          <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-md overflow-auto">
            <p className="text-red-600 dark:text-red-400 mb-2">
              {this.state.error && this.state.error.toString()}
            </p>
            {this.state.errorInfo && (
              <details className="text-gray-700 dark:text-gray-300 text-sm">
                <summary className="cursor-pointer mb-2">Error Details</summary>
                <pre className="whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={this.resetError}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-primary-600 text-primary-600 rounded hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    // If there's no error, render children normally
    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func
  ]),
  onError: PropTypes.func
};

export default ErrorBoundary;