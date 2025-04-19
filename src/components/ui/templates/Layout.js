import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../utils/utils';
import { ThemeToggle } from '../utils/ThemeProvider';

/**
 * Layout component for consistent page structure
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Main content
 * @param {React.ReactNode} props.header - Header content
 * @param {React.ReactNode} props.footer - Footer content
 * @param {React.ReactNode} props.sidebar - Sidebar content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.fluid - Whether to use a fluid container
 * @returns {JSX.Element} Layout component
 */
const Layout = ({
  children,
  header,
  footer,
  sidebar,
  className = '',
  fluid = false,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      {header ? (
        header
      ) : (
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className={fluid ? 'container-fluid px-4' : 'container mx-auto px-4'}>
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img 
                  src="/resume_dj_logo.png" 
                  alt="Resume DJ Logo" 
                  className="h-8 w-auto mr-2" 
                />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Resume DJ
                </h1>
              </div>
              <div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="flex-grow flex">
        {/* Sidebar (if provided) */}
        {sidebar && (
          <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm hidden md:block">
            {sidebar}
          </aside>
        )}

        {/* Content */}
        <div className={cn("flex-grow py-6", className)}>
          <div className={fluid ? 'px-4' : 'container mx-auto px-4'}>
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      {footer ? (
        footer
      ) : (
        <footer className="bg-white dark:bg-gray-800 shadow-sm">
          <div className={fluid ? 'container-fluid px-4' : 'container mx-auto px-4'}>
            <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Resume DJ
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  header: PropTypes.node,
  footer: PropTypes.node,
  sidebar: PropTypes.node,
  className: PropTypes.string,
  fluid: PropTypes.bool,
};

export default Layout;