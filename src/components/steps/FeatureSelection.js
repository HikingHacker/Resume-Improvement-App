import React from 'react';
import { FileText, PenTool, Briefcase } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Button
} from '../ui';

/**
 * Feature selection step component
 * Allows users to select which feature of the app they want to use
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSelect - Function called when a feature is selected
 */
const FeatureSelection = ({ onSelect }) => {
  return (
    <Card className="w-full shadow-md dark:bg-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl text-center">Choose a Feature</CardTitle>
        <CardDescription className="text-center">
          Select one of our AI-powered tools to enhance your job search materials
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 p-6">
        {/* Active Feature */}
        <div className="group">
          <Button 
            onClick={() => onSelect(1)} 
            className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white px-6 py-4 rounded-lg flex items-center justify-between hover:from-primary-700 hover:to-primary-600 shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex flex-col items-start">
              <span className="text-lg font-semibold">Resume Improvement Assistant</span>
              <span className="text-sm text-primary-100">Enhance your bullet points with AI suggestions</span>
            </div>
            <div className="bg-primary-400 p-2 rounded-full group-hover:bg-primary-300 transition-colors">
              <FileText className="w-6 h-6" />
            </div>
          </Button>
        </div>
        
        {/* Coming Soon Features */}
        <div>
          <button
            disabled
            className="w-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-4 rounded-lg flex items-center justify-between shadow-sm opacity-80 cursor-not-allowed"
          >
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-semibold">Cover Letter Generator</span>
                <span className="bg-gray-700 dark:bg-gray-600 text-white text-xs px-2 py-0.5 rounded-full">Coming Soon</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Create tailored cover letters for job applications</span>
            </div>
            <div className="bg-gray-200 dark:bg-gray-600 p-2 rounded-full">
              <PenTool className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </button>
        </div>
        
        <div>
          <button
            disabled
            className="w-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-4 rounded-lg flex items-center justify-between shadow-sm opacity-80 cursor-not-allowed"
          >
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-semibold">Job Matching Tool</span>
                <span className="bg-gray-700 dark:bg-gray-600 text-white text-xs px-2 py-0.5 rounded-full">Coming Soon</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Find jobs that match your skills and experience</span>
            </div>
            <div className="bg-gray-200 dark:bg-gray-600 p-2 rounded-full">
              <Briefcase className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureSelection;