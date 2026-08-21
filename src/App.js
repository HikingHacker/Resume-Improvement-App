import React from 'react';
import ResumeImprovement from './components/ResumeImprovement';
import { ResumeProvider } from './contexts/ResumeContext';
import AppHeader from './components/AppHeader';

function App() {
  return (
    <ResumeProvider>
      <div className="App min-h-screen bg-gray-50 flex flex-col">
        <AppHeader />
        <main className="flex-grow">
          <ResumeImprovement />
        </main>
        <footer className="py-4 text-center text-sm text-gray-500">
          <p>Resume DJ © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </ResumeProvider>
  );
}

export default App;
