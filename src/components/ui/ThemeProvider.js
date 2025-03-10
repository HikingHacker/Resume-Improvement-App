// components/ui/ThemeProvider.js
import React, { createContext, useContext, useEffect, useState } from 'react';

// Create theme context
const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

// Hook to use theme
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Check local storage or system preference for initial theme
  const [theme, setTheme] = useState('light'); // Start with a default to avoid hydration mismatch

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }, []);

  // Update HTML class and local storage when theme changes
  useEffect(() => {
    try {
      const root = window.document.documentElement;
      
      // First, remove both classes to ensure clean state
      root.classList.remove('light', 'dark');
      
      // Then add the current theme class
      root.classList.add(theme);
      
      // Save to local storage
      localStorage.setItem('theme', theme);
      
      // Also set a data attribute for additional CSS targeting if needed
      root.setAttribute('data-theme', theme);
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e) => {
        // Only update if the user hasn't manually set a preference
        if (!localStorage.getItem('theme')) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      };
      
      // Set up event listener with safer cross-browser approach
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else if (typeof mediaQuery.addListener === 'function') {
        // For older browsers
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    } catch (error) {
      console.error('Error setting up media query listener:', error);
    }
    
    return () => {}; // Fallback empty cleanup function
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    try {
      setTheme(prevTheme => {
        const newTheme = prevTheme === 'light' ? 'dark' : 'light';
        console.log('Toggling theme from', prevTheme, 'to', newTheme);
        return newTheme;
      });
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  // Log current theme for debugging
  useEffect(() => {
    console.log('Current theme:', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme toggle button component
export const ThemeToggle = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  
  // Use useEffect to log when the component renders with what theme
  useEffect(() => {
    console.log('ThemeToggle rendered with theme:', theme);
  }, [theme]);
  
  return (
    <button
      type="button"
      onClick={() => {
        console.log('Toggle button clicked, current theme:', theme);
        toggleTheme();
      }}
      className={`p-2 rounded-full transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-400 ${className}`}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        // Moon icon for light mode (clicking will switch to dark)
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        // Sun icon for dark mode (clicking will switch to light)
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
};