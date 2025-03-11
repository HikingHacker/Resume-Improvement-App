import React from 'react';
import ResumeImprovement from './components/ResumeImprovement';
import { ThemeProvider, ThemeToggle } from './components/ui';

function App() {
  
  return (
    <ThemeProvider>
      <div className="App min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <header className="w-full p-4 flex justify-end items-center">
          <div className="relative">
            <ThemeToggle className="bg-white dark:bg-gray-800 shadow-md text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700" />
          </div>
        </header>
        <main>
          <ResumeImprovement />
        </main>
        <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Resume Improvement Tool © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </ThemeProvider>
  );
}

export default App;