import React from 'react';
import { Upload, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '../ui';

/**
 * Resume upload component
 * Allows users to upload their resume for processing
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onFileUpload - Function to handle file upload
 * @param {boolean} props.loading - Whether upload is in progress
 * @param {string} props.error - Error message if upload failed
 */
const ResumeUpload = ({ onFileUpload, loading, error, onBack, onNext }) => {
  return (
    <Card className="w-full shadow-md dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-2xl text-center mb-2">Resume DJ</CardTitle>
      </CardHeader>
      
      <CardContent>
      
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-primary-800 dark:text-primary-200 mb-2">How It Works:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm transition-colors duration-200">
            <div className="flex items-center mb-2">
              <div className="bg-primary-100 dark:bg-primary-800 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                <span className="text-primary-600 dark:text-primary-300 font-medium">1</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Upload</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Upload your resume in PDF or text format</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm transition-colors duration-200">
            <div className="flex items-center mb-2">
              <div className="bg-primary-100 dark:bg-primary-800 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                <span className="text-primary-600 dark:text-primary-300 font-medium">2</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Analyze</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Receive a comprehensive analysis with strengths and improvement areas</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm transition-colors duration-200">
            <div className="flex items-center mb-2">
              <div className="bg-primary-100 dark:bg-primary-800 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                <span className="text-primary-600 dark:text-primary-300 font-medium">3</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Improve</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Get AI-generated improvements for each bullet point</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Key Features:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary-500 dark:text-secondary-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700 dark:text-gray-300">Comprehensive resume analysis</span>
          </div>
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary-500 dark:text-secondary-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700 dark:text-gray-300">AI-powered bullet point improvements</span>
          </div>
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary-500 dark:text-secondary-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700 dark:text-gray-300">Identification of missing skills</span>
          </div>
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary-500 dark:text-secondary-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700 dark:text-gray-300">Suggested job roles matching your experience</span>
          </div>
        </div>
      </div>
      
      <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Upload Your Resume:</h3>
      <div className="flex flex-col items-center space-y-4">
        <label className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 w-full transition-colors">
          <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-full mb-3">
            <Upload className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <span className="font-medium mb-1 text-gray-900 dark:text-white">Choose a file</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">PDF, DOC, DOCX or TXT files supported</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">Max file size: 5MB</span>
          <input 
            type="file" 
            className="hidden" 
            onChange={onFileUpload} 
            accept=".pdf,.txt,.doc,.docx" 
            aria-label="Upload resume file" 
          />
        </label>
        
        {error && (
          <div className="text-red-500 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800 w-full">
            {error}
          </div>
        )}
        
        {loading && (
          <div className="text-primary-600 dark:text-primary-400 text-sm p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg border border-primary-200 dark:border-primary-800 w-full flex items-center">
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing your file... This may take a moment
          </div>
        )}
      </div>
      
      <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>Your privacy is important to us. Files are processed securely and not stored permanently.</p>
      </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <Button 
          onClick={onBack}
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Features
        </Button>
        
        <div className="invisible">
          {/* This empty div helps with spacing */}
          <Button variant="outline">Placeholder</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ResumeUpload;