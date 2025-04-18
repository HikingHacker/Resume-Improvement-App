import React from 'react';
import ResumeImprovement from './components/ResumeImprovement';
import { ThemeProvider, ThemeToggle, FixedResetButton } from './components/ui';
import { ResumeProvider } from './contexts/ResumeContext';

function App() {
  
  return (
    <ThemeProvider>
      <ResumeProvider>
        <div className="App min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col">
          <header className="w-full p-4 flex justify-end items-center">
            <div className="relative">
              <ThemeToggle className="bg-white dark:bg-gray-800 shadow-md text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700" />
            </div>
          </header>
          <main className="flex-grow mb-auto">
            <ResumeImprovement />
          </main>
          <div className="mt-auto">
            <FixedResetButton />
            <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Resume Improvement Tool © {new Date().getFullYear()}</p>
            </footer>
          </div>
        </div>
      </ResumeProvider>
    </ThemeProvider>
  );
}

export default App;