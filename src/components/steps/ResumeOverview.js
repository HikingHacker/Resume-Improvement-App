import React from 'react';
import { Building, Briefcase, Calendar, AlertTriangle, FileText, Building as CompanyIcon } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter,
  Button,
  Input
} from '../ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useResumeContext } from '../../contexts/ResumeContext';

/**
 * Resume Overview component
 * Displays the parsed resume data and allows the user to edit job details
 */
const ResumeOverview = ({ onBack, onNext }) => {
  const {
    resumeData,
    loading,
    editingJobIndex, 
    editingJob,
    startEditingJob,
    saveEditedJob,
    setEditingJob,
    getResumeAnalysis,
    resumeAnalysis,
    setStep
  } = useResumeContext();
  
  const totalJobs = resumeData.bullet_points.length;
  const totalBullets = resumeData.bullet_points.reduce((total, job) => {
    return total + (job.achievements ? job.achievements.length : 0);
  }, 0);
  
  const renderJobCard = (job, index) => {
    if (!job) return null;
    
    return (
      <Card key={index} className="mb-6 transition-colors duration-200">
        <CardContent className="p-4">
          <div className="flex items-start mb-2">
            <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-full mr-3">
              <Building className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{job.company}</h3>
              <div className="flex items-center">
                <Briefcase className="w-4 h-4 mr-1 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{job.position}</span>
              </div>
              {job.time_period && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{job.time_period}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Card className="w-full shadow-md transition-colors duration-200">
      <CardHeader>
        <CardTitle className="text-xl">Resume Overview</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="bg-yellow-100 dark:bg-yellow-800 p-2 rounded-full mr-3 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">Review Your Parsed Resume Data</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Please review the information below and make corrections if needed. Accurate data will lead to better improvement suggestions.
              </p>
              {loading.analyze && (
                <p className="mt-2 text-sm text-primary-600 dark:text-primary-400 flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing your resume in the background...
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <p className="mb-2 text-gray-700 dark:text-gray-300">We've extracted the following from your resume:</p>
          <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-100 dark:border-primary-800">
            <div className="flex items-center mb-3">
              <div className="bg-primary-100 dark:bg-primary-800 p-2 rounded-full mr-3">
                <CompanyIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{totalJobs} job positions</span>
            </div>
            <div className="flex items-center">
              <div className="bg-primary-100 dark:bg-primary-800 p-2 rounded-full mr-3">
                <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{totalBullets} bullet points</span>
            </div>
          </div>
        </div>
      
        <div className="mt-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Job History:</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">Click any field to edit</span>
          </div>
          
          <div className="space-y-6 pr-2">
            {resumeData.bullet_points.map((job, jobIndex) => (
              <div key={jobIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
                {/* Job details section */}
                {editingJobIndex === jobIndex ? (
                  <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label>
                      <Input 
                        type="text" 
                        value={editingJob.position}
                        onChange={(e) => setEditingJob({...editingJob, position: e.target.value})}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                      <Input 
                        type="text" 
                        value={editingJob.company}
                        onChange={(e) => setEditingJob({...editingJob, company: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Period</label>
                      <Input 
                        type="text" 
                        value={editingJob.time_period || ""}
                        onChange={(e) => setEditingJob({...editingJob, time_period: e.target.value})}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={saveEditedJob} 
                        variant="secondary"
                        size="sm"
                      >
                        Save Changes
                      </Button>
                      <Button 
                        onClick={() => {
                          startEditingJob(null);
                        }} 
                        variant="ghost"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2 transition-colors duration-200" 
                    onClick={() => startEditingJob(jobIndex)}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{job.position}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{job.company}</div>
                    {job.time_period && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{job.time_period}</div>
                    )}
                    <div className="mt-1 text-xs text-primary-600 dark:text-primary-400">Click to edit details</div>
                  </div>
                )}
                
                {/* Bullet points preview */}
                <div>
                  <h4 className="font-medium text-sm mb-2 text-gray-800 dark:text-gray-200">Bullet Points:</h4>
                  <div className="space-y-2">
                    {(job.achievements || []).slice(0, 3).map((bullet, bulletIndex) => (
                      <div 
                        key={bulletIndex} 
                        className="border border-gray-200 dark:border-gray-700 rounded p-3 text-sm text-gray-800 dark:text-gray-200"
                      >
                        {bullet}
                      </div>
                    ))}
                    {job.achievements && job.achievements.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-3 pt-1">
                        + {job.achievements.length - 3} more bullet points
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </CardContent>
      
      <CardFooter className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
        <Button 
          onClick={onBack}
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Resume Upload
        </Button>
        
        <Button 
          onClick={() => {
            window.scrollTo(0, 50);
            setStep(2.5);
          }}
          variant="primary"
        >
          {resumeAnalysis ? "View Resume Analysis" : "Continue to Analysis"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResumeOverview;