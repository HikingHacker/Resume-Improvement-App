import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Send, ArrowLeft, ArrowRight, AlertTriangle, PenTool, Briefcase, Calendar, Briefcase as Job, Building, Sun, Moon, CheckCircle, X, Info, Sparkles, ClipboardList, LineChart, Zap, Layers } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from './ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Skeleton, SkeletonText } from './ui/Skeleton';
import { useTheme } from './ui/ThemeProvider';
import useResumeService from '../services/hooks/useResumeService';

const ConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
  // Handle keyboard events for accessibility
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    // Lock body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'visible';
    };
  }, [isOpen, onCancel]);
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onCancel} // Allow clicking outside to close
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full animate-slide-in"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full mr-3">
              <AlertTriangle className="text-yellow-500 dark:text-yellow-400 w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white" id="modal-title">
              Confirm Restart
            </h3>
          </div>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to go back? This will restart the process and all changes will be lost.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button 
            onClick={onCancel} 
            variant="ghost"
            aria-label="Cancel and close dialog"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            variant="danger"
            aria-label="Confirm restart"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

// Navigation steps component
const StepNavigation = ({ currentStep, steps, onStepClick, disabled = [], isStepCompleted }) => {
  return (
    <div className="w-full mb-8 flex justify-center">
      <div className="flex items-center max-w-4xl w-full">
        {steps.map((step, index) => {
          const isActive = currentStep === step.value;
          const isDisabled = disabled.includes(step.value);
          const isCompleted = isStepCompleted(step.value);
          const isLast = index === steps.length - 1;
          
          return (
            <React.Fragment key={index}>
              {/* Step item */}
              <div className="flex flex-col items-center justify-center relative z-10">
                {/* Step circle */}
                <button 
                  onClick={() => !isDisabled && onStepClick(step.value)}
                  disabled={isDisabled}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-200 relative
                    ${isActive 
                      ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-md' 
                      : isCompleted
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-2 border-primary-600 dark:border-primary-500'
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600'
                    }
                    ${isDisabled ? 'cursor-not-allowed opacity-60' : 'hover:shadow-lg'}
                  `}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  ) : (
                    <span className="text-sm font-semibold">{step.icon || index + 1}</span>
                  )}
                </button>
                
                {/* Step label */}
                <span className={`
                  mt-2 text-xs font-medium text-center w-20 transition-colors duration-200
                  ${isActive 
                    ? 'text-primary-700 dark:text-primary-300' 
                    : isCompleted
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {step.label}
                </span>
              </div>
              
              {/* Connecting line */}
              {!isLast && (
                <div 
                  className={`flex-1 h-0.5 mx-1 ${
                    isCompleted && isStepCompleted(steps[index + 1].value) 
                      ? 'bg-primary-600 dark:bg-primary-500' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                ></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const ResumeImprovement = () => {
  const { loading, setLoading, errors, setErrors, parseResume, getAISuggestions, analyzeResume, exportResume } = useResumeService();
  const [step, setStep] = useState(0); // 0: feature selection, 1: upload, 2: overview, 2.5: analysis, 3: bullet improvement, 4: final review
  const [resumeData, setResumeData] = useState({ bullet_points: [] });
  const [flatBulletPoints, setFlatBulletPoints] = useState([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(null);
  const [currentBulletIndex, setCurrentBulletIndex] = useState(null);
  const [improvements, setImprovements] = useState({});
  const [additionalContexts, setAdditionalContexts] = useState({});
  const [showFollowUpForBullets, setShowFollowUpForBullets] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [savedBullets, setSavedBullets] = useState({});
  const [resumeEdited, setResumeEdited] = useState(false);
  
  // State for editing job details in overview
  const [editingJobIndex, setEditingJobIndex] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [editingBulletInfo, setEditingBulletInfo] = useState({ jobIndex: null, bulletIndex: null });
  const [editedBullet, setEditedBullet] = useState("");

  const resetState = () => {
    setStep(0);
    setResumeData({ bullet_points: [] });
    setFlatBulletPoints([]);
    setCurrentJobIndex(null);
    setCurrentBulletIndex(null);
    setImprovements({});
    setAdditionalContexts({});
    setShowFollowUpForBullets({});
    setEditingJobIndex(null);
    setEditingJob(null);
    setEditingBulletInfo({ jobIndex: null, bulletIndex: null });
    setEditedBullet("");
    setResumeAnalysis(null);
    setSavedBullets({});
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        // Reset all state related to the resume when a new file is uploaded
        setResumeAnalysis(null);
        setCurrentJobIndex(null);
        setCurrentBulletIndex(null);
        setImprovements({});
        setSavedBullets({});
        
        const result = await parseResume(file);
        console.log("Resume parsing result:", result);
        
        // Handle various response formats
        if (result.parsedData && result.parsedData.bullet_points) {
          // New structured format
          console.log("Using structured data format with", 
            result.parsedData.bullet_points.length, "job positions and",
            result.parsedData.bullet_points.reduce((sum, job) => sum + (job.achievements?.length || 0), 0), 
            "total bullet points");
          
          setResumeData(result.parsedData);
          setFlatBulletPoints(result.bulletPoints || []);
          
          // Check if we actually have any bullet points
          const totalBullets = result.parsedData.bullet_points.reduce(
            (sum, job) => sum + (job.achievements?.length || 0), 0
          );
          
          if (totalBullets === 0) {
            console.error("No bullet points found in parsed data");
            setErrors(prev => ({ ...prev, parse: "No bullet points were extracted from your resume. Please try a different file." }));
            return;
          }
        } else if (result.bulletPoints && result.bulletPoints.length > 0) {
          // Legacy flat format
          console.log("Using legacy format with", result.bulletPoints.length, "bullet points");
          setFlatBulletPoints(result.bulletPoints);
          
          // Create a structured format from the flat list
          const structuredData = createStructuredDataFromFlatBullets(result.bulletPoints);
          setResumeData(structuredData);
        } else {
          // No usable data
          console.error("No usable data in parsing result");
          setErrors(prev => ({ ...prev, parse: "Failed to extract any content from your resume. Please try a different file format." }));
          return;
        }
        
        setResumeEdited(false); // Reset edit flag on new upload
        
        // Immediately begin the resume analysis in the background
        // This preloads the analysis while the user is on the overview page
        console.log("Starting background analysis after file upload...");
        const dataToAnalyze = result.parsedData || structuredData;
        setLoading(prev => ({ ...prev, analyze: true }));
        
        // Trigger analysis immediately to prepare data before user goes to analysis page
        analyzeResume(dataToAnalyze)
          .then(analysis => {
            if (analysis) {
              setResumeAnalysis(analysis);
              console.log("Background analysis completed successfully");
            }
          })
          .catch(error => {
            console.error("Background analysis error:", error);
          });
        
        setStep(2); // Go to resume overview page (now step 2)
      } catch (error) {
        console.error("Error parsing resume:", error);
        setErrors(prev => ({ ...prev, parse: error.message || "Failed to parse your resume" }));
      }
    }
  };
  
  // Helper function to convert flat bullet points to structured format
  const createStructuredDataFromFlatBullets = (flatBullets) => {
    const structuredData = { bullet_points: [] };
    let currentJob = null;
    
    for (const bullet of flatBullets) {
      // Check if this is a position/job header
      if (bullet.startsWith("POSITION:") || bullet.includes(" at ")) {
        // Extract company and position information
        let position = "Unknown Position";
        let company = "Unknown Company";
        let timePeriod = "";
        
        // Try to parse the position line
        const positionLine = bullet.replace("POSITION:", "").trim();
        
        // Check for "Position at Company (Date)" format
        const positionMatch = positionLine.match(/(.+?)\s+at\s+(.+?)(?:\s+\((.+?)\))?$/);
        if (positionMatch) {
          position = positionMatch[1].trim();
          company = positionMatch[2].trim();
          timePeriod = positionMatch[3] ? positionMatch[3].trim() : "";
        } else {
          // Just use the whole line as position
          position = positionLine;
        }
        
        // Create a new job entry
        currentJob = {
          company,
          position,
          time_period: timePeriod,
          achievements: []
        };
        
        structuredData.bullet_points.push(currentJob);
      } 
      // If it's a bullet point and we have a current job, add it as an achievement
      else if (currentJob && (bullet.startsWith("•") || bullet.startsWith("-") || bullet.startsWith("*") || /^\d+\./.test(bullet))) {
        // Clean the bullet point
        const cleanBullet = bullet.replace(/^[•\-*]\s*/, "").trim();
        currentJob.achievements.push(cleanBullet);
      }
      // If there's no current job yet, create a default one
      else if (!currentJob && bullet.trim()) {
        currentJob = {
          company: "Unknown Company",
          position: "Unknown Position",
          time_period: "",
          achievements: [bullet.trim()]
        };
        structuredData.bullet_points.push(currentJob);
      }
    }
    
    // If we didn't find any structured data, create a default job with all bullets
    if (structuredData.bullet_points.length === 0 && flatBullets.length > 0) {
      structuredData.bullet_points.push({
        company: "Unknown Company",
        position: "Unknown Position",
        time_period: "",
        achievements: flatBullets.map(b => b.replace(/^[•\-*]\s*/, "").trim())
      });
    }
    
    console.log("Created structured data:", structuredData);
    return structuredData;
  };

  // Get the current bullet point based on job and bullet indices
  const getCurrentBulletPoint = () => {
    const jobs = resumeData.bullet_points;
    if (jobs.length === 0 || currentJobIndex === null || currentBulletIndex === null) return null;
    
    const currentJob = jobs[currentJobIndex];
    if (!currentJob || !currentJob.achievements || currentJob.achievements.length === 0) return null;
    
    return currentJob.achievements[currentBulletIndex];
  };

  // Calculate a unique ID for each bullet point
  const getBulletId = (jobIndex, bulletIndex) => {
    return `job${jobIndex}-bullet${bulletIndex}`;
  };

  const getCurrentBulletId = () => {
    if (currentJobIndex === null || currentBulletIndex === null) return null;
    return getBulletId(currentJobIndex, currentBulletIndex);
  };

  const handleBulletPointImprovement = async () => {
    const currentBullet = getCurrentBulletPoint();
    if (!currentBullet) return;
    
    const currentJob = resumeData.bullet_points[currentJobIndex];
    const bulletId = getCurrentBulletId();
    
    try {
      // Include job context in the additional context
      const jobContext = `This is for a ${currentJob.position} role at ${currentJob.company} during ${currentJob.time_period || 'unknown time period'}.`;
      const userContext = Object.values(additionalContexts[bulletId] || {}).join(' ');
      const contextToSend = [jobContext, userContext].filter(Boolean).join(' ');
      
      const suggestions = await getAISuggestions(currentBullet, contextToSend);
      
      if (suggestions) {
        setImprovements(prev => ({
          ...prev,
          [bulletId]: suggestions
        }));
        setShowFollowUpForBullets(prev => ({
          ...prev,
          [bulletId]: true
        }));
      }
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
    }
  };

  const handleAdditionalContextChange = (questionIndex, value) => {
    const bulletId = getCurrentBulletId();
    setAdditionalContexts(prev => ({
      ...prev,
      [bulletId]: {
        ...(prev[bulletId] || {}),
        [questionIndex]: value
      }
    }));
  };

  const handleAdditionalContextSubmit = async () => {
    const currentBullet = getCurrentBulletPoint();
    if (!currentBullet) return;
    
    const currentJob = resumeData.bullet_points[currentJobIndex];
    const bulletId = getCurrentBulletId();
    
    try {
      // Include job context in the additional context
      const jobContext = `This is for a ${currentJob.position} role at ${currentJob.company} during ${currentJob.time_period || 'unknown time period'}.`;
      const userContext = Object.values(additionalContexts[bulletId] || {}).join(' ');
      const contextToSend = [jobContext, userContext].filter(Boolean).join(' ');
      
      const newSuggestions = await getAISuggestions(currentBullet, contextToSend);
      
      if (newSuggestions) {
        setImprovements(prev => ({
          ...prev,
          [bulletId]: newSuggestions
        }));
      }
    } catch (error) {
      console.error("Error getting updated AI suggestions:", error);
    }
  };

  // Navigate between bullet points within and across jobs
  const navigateBulletPoints = (direction) => {
    const jobs = resumeData.bullet_points;
    if (jobs.length === 0) return;
    
    // If no current selection, select the first bullet of the first job
    if (currentJobIndex === null || currentBulletIndex === null) {
      setCurrentJobIndex(0);
      setCurrentBulletIndex(0);
      return;
    }
    
    const currentJob = jobs[currentJobIndex];
    if (!currentJob || !currentJob.achievements) return;
    
    if (direction === 'next') {
      // If not at the last bullet point in the current job
      if (currentBulletIndex < currentJob.achievements.length - 1) {
        setCurrentBulletIndex(currentBulletIndex + 1);
      }
      // If at the last bullet point of the current job but not the last job
      else if (currentJobIndex < jobs.length - 1) {
        setCurrentJobIndex(currentJobIndex + 1);
        setCurrentBulletIndex(0);
      }
      // At the very last bullet point
      else {
        // Move to final review
        setStep(4);
      }
    } else if (direction === 'prev') {
      // If not at the first bullet point in the current job
      if (currentBulletIndex > 0) {
        setCurrentBulletIndex(currentBulletIndex - 1);
      }
      // If at the first bullet point of the current job but not the first job
      else if (currentJobIndex > 0) {
        setCurrentJobIndex(currentJobIndex - 1);
        const prevJob = jobs[currentJobIndex - 1];
        if (prevJob && prevJob.achievements) {
          setCurrentBulletIndex(Math.max(0, prevJob.achievements.length - 1));
        }
      }
    }
  };

  // Define the navigation steps
  const navigationSteps = [
    { value: 0, label: "Select Feature" },
    { value: 1, label: "Upload Resume", icon: <Upload className="w-4 h-4" /> },
    { value: 2, label: "Resume Overview", icon: <FileText className="w-4 h-4" /> },
    { value: 2.5, label: "Resume Analysis", icon: <LineChart className="w-4 h-4" /> },
    { value: 3, label: "Improve Bullets", icon: <Zap className="w-4 h-4" /> },
    { value: 4, label: "Final Overview", icon: <Layers className="w-4 h-4" /> }
  ];
  
  // Helper function to determine step completion status
  const isStepCompleted = (stepValue) => {
    // Handle the special case of step 2.5
    if (step === 2.5 && stepValue === 2) {
      return true;
    }
    
    // For all other cases, use normal comparison
    return step > stepValue;
  };

  // Function to handle direct step navigation
  const handleStepNavigation = (newStep) => {
    // Check if step should be accessible
    if (newStep > 0 && resumeData.bullet_points.length === 0) {
      // Can't navigate to steps that require resume data
      return;
    }

    if (newStep === 2.5 && !resumeAnalysis) {
      // Trigger analysis when navigating directly to analysis step
      getResumeAnalysis();
    }

    // Special case for moving back to bullet improvement from final review
    if (step === 4 && newStep === 3) {
      // Go to the last bullet point
      const jobs = resumeData.bullet_points;
      if (jobs.length > 0) {
        const lastJobIndex = jobs.length - 1;
        const lastJob = jobs[lastJobIndex];
        if (lastJob && lastJob.achievements) {
          setCurrentJobIndex(lastJobIndex);
          setCurrentBulletIndex(Math.max(0, lastJob.achievements.length - 1));
        }
      }
    }

    setStep(newStep);
  };

  const handleNavigation = (direction) => {
    if (direction === 'back') {
      if (step === 1) {
        // From upload back to feature selection
        setStep(0);
      } else if (step === 2) {
        // From overview back to upload
        setStep(1);
      } else if (step === 2.5) {
        // From analysis back to overview
        setStep(2);
      } else if (step === 3) {
        // From bullet improvement back to analysis
        setStep(2.5);
      } else if (step === 4) {
        // From final review back to bullet improvement
        setStep(3);
        
        // Go to the last bullet point
        const jobs = resumeData.bullet_points;
        if (jobs.length > 0) {
          const lastJobIndex = jobs.length - 1;
          const lastJob = jobs[lastJobIndex];
          if (lastJob && lastJob.achievements) {
            setCurrentJobIndex(lastJobIndex);
            setCurrentBulletIndex(Math.max(0, lastJob.achievements.length - 1));
          }
        }
      } else if (step > 0) {
        setStep(step - 1);
      }
    } else if (direction === 'forward') {
      if (step === 3) {
        // If we're in the bullet improvement step and there's no selection yet,
        // select the first bullet point of the first job
        if (currentJobIndex === null || currentBulletIndex === null) {
          const jobs = resumeData.bullet_points;
          if (jobs.length > 0) {
            setCurrentJobIndex(0);
            setCurrentBulletIndex(0);
          }
        } else {
          navigateBulletPoints('next');
        }
      } else if (step < 4) {
        // Handle special case for floating point step
        if (step === 2.5) {
          setStep(3);
          
          // Initialize selection to first bullet if needed
          if (currentJobIndex === null || currentBulletIndex === null) {
            const jobs = resumeData.bullet_points;
            if (jobs.length > 0) {
              setCurrentJobIndex(0);
              setCurrentBulletIndex(0);
            }
          }
        } else {
          setStep(step + 1);
        }
      }
    }
  };

  const handleConfirmReset = () => {
    resetState();
    setShowConfirmModal(false);
  };

  const getTotalBulletPoints = () => {
    return resumeData.bullet_points.reduce((total, job) => {
      return total + (job.achievements ? job.achievements.length : 0);
    }, 0);
  };

  const getCurrentBulletPointNumber = () => {
    let count = 0;
    const jobs = resumeData.bullet_points;
    
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      if (!job.achievements) continue;
      
      if (i < currentJobIndex) {
        count += job.achievements.length;
      } else if (i === currentJobIndex) {
        count += currentBulletIndex + 1;
        break;
      }
    }
    
    return count;
  };

  const renderProgressBar = () => {
    const totalBullets = getTotalBulletPoints();
    const currentBulletNumber = getCurrentBulletPointNumber();
    const progress = totalBullets > 0 ? (currentBulletNumber / totalBullets) * 100 : 0;
    
    return (
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4 transition-colors duration-200">
        <div 
          className="bg-primary-600 dark:bg-primary-500 h-2.5 rounded-full transition-all duration-200" 
          style={{width: `${progress}%`}}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
    );
  };

  const renderFeatureSelection = () => {
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
              onClick={() => setStep(1)} 
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

  const renderJobCard = (job, index) => {
    if (!job) return null;
    
    return (
      <Card key={index} className="p-4 mb-6 transition-colors duration-200">
        <div className="flex items-start mb-2">
          <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-full mr-3">
            <Building className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{job.company}</h3>
            <div className="flex items-center">
              <Job className="w-4 h-4 mr-1 text-gray-600 dark:text-gray-400" />
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
      </Card>
    );
  };

  // New function to render job navigation tabs/dropdown
  const renderJobNavigation = () => {
    const jobs = resumeData.bullet_points;
    if (!jobs || jobs.length <= 1) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Jump to Position:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {jobs.map((job, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentJobIndex(index);
                setCurrentBulletIndex(0);
              }}
              className={`
                px-3 py-2 text-left rounded border transition-colors text-sm
                flex items-center
                ${currentJobIndex === index 
                  ? 'bg-primary-100 dark:bg-primary-900 border-primary-300 dark:border-primary-700 text-primary-800 dark:text-primary-200' 
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
              aria-pressed={currentJobIndex === index}
            >
              <div className="mr-2 flex-shrink-0">
                <Building className={`w-4 h-4 ${currentJobIndex === index ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`} />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-medium truncate dark:text-white">{job.position}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.company} {job.time_period ? `• ${job.time_period}` : ''}</div>
              </div>
              <div className="ml-2 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs">
                {job.achievements?.length || 0}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // New function to render bullet point navigation within a job
  const renderBulletNavigation = () => {
    const jobs = resumeData.bullet_points;
    if (!jobs || jobs.length === 0) return null;
    
    const currentJob = jobs[currentJobIndex];
    if (!currentJob || !currentJob.achievements || currentJob.achievements.length <= 1) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mb-4">
        {currentJob.achievements.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentBulletIndex(index)}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm
              transition-colors duration-200
              ${currentBulletIndex === index 
                ? 'bg-primary-600 dark:bg-primary-700 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
            aria-current={currentBulletIndex === index ? 'step' : undefined}
            aria-label={`Bullet point ${index + 1}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    );
  };

  const renderBulletImprovement = () => {
    const jobs = resumeData.bullet_points;
    if (!jobs || jobs.length === 0) {
      console.error("No resume data found");
      return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-4">No Resume Data Found</h2>
          <p className="text-red-500 dark:text-red-400">
            The resume parser couldn't extract any bullet points from your resume. 
            Please try uploading again or use a different file format.
          </p>
          <Button 
            onClick={() => setStep(0)} 
            variant="primary"
            className="mt-4"
          >
            Return to Upload
          </Button>
        </div>
      );
    }
    
    // Get the current bullet ID if we have one selected
    const bulletId = currentJobIndex !== null && currentBulletIndex !== null ? 
      getBulletId(currentJobIndex, currentBulletIndex) : null;
    
    const totalBullets = getTotalBulletPoints();
    
    return (
      <Card className="w-full shadow-md transition-colors duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Improve Your Bullet Points</CardTitle>
          <CardDescription>
            Review and enhance each bullet point with AI-powered suggestions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress indicator */}
          {renderProgressBar()}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {totalBullets} bullet points total
          </p>
          
          <div className="space-y-6">
            {/* Job & Bullet points section in a scrollable container */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                  Job History & Bullet Points
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Select a bullet point to get AI improvement suggestions
                </p>
              </div>
              
              {/* Static Job Selection Header with Improved Stats - Always Visible */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850">
                <div className="mb-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Select a Job Position:</h4>
                      
                      {/* Overall progress indicator */}
                      <div className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg text-xs flex items-center">
                        <div className="flex items-center mr-1.5 text-gray-700 dark:text-gray-300">
                          <CheckCircle className="w-3 h-3 mr-1 text-green-500 dark:text-green-400" />
                          <span>
                            {Object.keys(savedBullets).length} 
                          </span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-500">/</span>
                        <div className="flex items-center ml-1.5 text-gray-700 dark:text-gray-300">
                          <span>{getTotalBulletPoints()}</span>
                          <span className="ml-1 text-gray-500 dark:text-gray-500">total</span>
                        </div>
                      </div>
                    </div>
                    
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {currentJobIndex !== null ? 
                        `${jobs[currentJobIndex]?.position} at ${jobs[currentJobIndex]?.company} selected` : 
                        "No position selected"}
                    </span>
                  </div>
                  
                  {/* Progress bar for overall completion */}
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 mb-3">
                    <div 
                      className="h-1.5 bg-green-500 dark:bg-green-400 rounded-full"
                      style={{ width: `${(Object.keys(savedBullets).length / getTotalBulletPoints()) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {jobs.map((job, jobIndex) => {
                      // Calculate improved bullets for this job
                      const totalJobBullets = job.achievements?.length || 0;
                      const improvedJobBullets = job.achievements?.reduce((count, _, bulletIndex) => {
                        const bulletId = getBulletId(jobIndex, bulletIndex);
                        return savedBullets[bulletId] ? count + 1 : count;
                      }, 0) || 0;
                      
                      // Calculate progress percentage
                      const progressPercent = totalJobBullets > 0 
                        ? Math.round((improvedJobBullets / totalJobBullets) * 100) 
                        : 0;
                      
                      return (
                        <button 
                          key={jobIndex}
                          onClick={() => {
                            setCurrentJobIndex(jobIndex);
                            setCurrentBulletIndex(0); // Always select the first bullet point
                          }}
                          className={`
                            py-1 px-3 rounded-full text-sm border transition-colors flex items-center
                            ${currentJobIndex === jobIndex 
                              ? 'border-primary-400 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                              : progressPercent === 100
                                ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                : progressPercent > 0
                                  ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }
                          `}
                          title={`${job.position} at ${job.company}${job.time_period ? ` (${job.time_period})` : ''}\n${improvedJobBullets}/${totalJobBullets} bullet points improved`}
                        >
                          <span className="truncate max-w-[120px]">{job.company}</span>
                          
                          {currentJobIndex === jobIndex && (
                            <CheckCircle className="w-3.5 h-3.5 ml-1 text-primary-600 dark:text-primary-400" />
                          )}
                          
                          {/* Progress indicator for this job */}
                          <div className="ml-1.5 flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-1.5 py-0.5 text-xs">
                            <span className={progressPercent === 100 ? "text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}>
                              {improvedJobBullets}
                            </span>
                            <span className="mx-0.5 text-gray-500">/</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {totalJobBullets}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Scrollable Bullet Points Section */}
              <div className="overflow-auto max-h-[35vh] p-4">
                <div className="space-y-6">
                  {/* Bullet Points Only Shown After Job Selection */}
                  {currentJobIndex !== null && (
                    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                          Bullet Points for {jobs[currentJobIndex]?.position} at {jobs[currentJobIndex]?.company}:
                        </h4>
                        <Button 
                          onClick={() => startEditingJob(currentJobIndex)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Edit Details
                        </Button>
                      </div>
                      
                      {/* Edit Job Modal */}
                      {editingJobIndex === currentJobIndex && (
                        <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
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
                              onClick={() => {setEditingJobIndex(null); setEditingJob(null);}} 
                              variant="ghost"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        {jobs[currentJobIndex]?.achievements?.map((bullet, bulletIndex) => {
                          const isSelected = currentJobIndex !== null && currentBulletIndex === bulletIndex;
                          const thisBulletId = getBulletId(currentJobIndex, bulletIndex);
                          const hasImprovement = improvements[thisBulletId]?.improvedBulletPoint;
                          const isSaved = savedBullets[thisBulletId];
                          
                          return (
                            <div 
                              key={bulletIndex} 
                              className={`
                                p-3 rounded-md border transition-colors cursor-pointer relative
                                ${isSelected 
                                  ? 'border-primary-400 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/30 shadow-md' 
                                  : isSaved
                                    ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                                    : hasImprovement
                                      ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10'
                                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }
                              `}
                              onClick={() => setCurrentBulletIndex(bulletIndex)}
                            >
                              <div className="flex items-start">
                                <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 h-6 w-6 flex items-center justify-center rounded-full mr-2 flex-shrink-0 text-sm font-medium">
                                  {bulletIndex + 1}
                                </div>
                                <p className="text-sm text-gray-800 dark:text-gray-200">{bullet}</p>
                              </div>
                              
                              {isSaved && !isSelected && (
                                <div className="absolute top-2 right-2">
                                  <div className="bg-green-100 dark:bg-green-800 p-1 rounded-full">
                                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  </div>
                                </div>
                              )}
                              
                              {hasImprovement && !isSaved && !isSelected && (
                                <div className="absolute top-2 right-2">
                                  <div className="bg-yellow-100 dark:bg-yellow-800 p-1 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* AI Improvement UI */}
            <div className={`
              border rounded-lg shadow-sm overflow-hidden
              ${bulletId && improvements[bulletId] ? 'border-green-200 dark:border-green-700' : 'border-gray-200 dark:border-gray-700'}
            `}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                  AI Improvement Suggestions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {improvements[bulletId] 
                    ? "Review the AI-enhanced version of your bullet point" 
                    : "Select a bullet point and get AI-powered improvements"}
                </p>
              </div>
              <div className="p-5 divide-y divide-gray-200 dark:divide-gray-700">
              {currentJobIndex !== null && currentBulletIndex !== null ? (
                <>
                  <div className="pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Original Bullet Point</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                      {jobs[currentJobIndex]?.achievements?.[currentBulletIndex] || "No bullet point selected"}
                    </div>
                    
                    {!improvements[bulletId] && (
                      <Button 
                        onClick={handleBulletPointImprovement} 
                        variant="primary"
                        loading={loading.improve}
                        className="mt-4"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {loading.improve ? 'Processing...' : 'Get AI Suggestions'}
                      </Button>
                    )}
                  </div>
                  
                  {errors.improve && (
                    <div className="text-red-500 dark:text-red-400 p-3 my-4 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
                      {errors.improve}
                    </div>
                  )}
                  
                  {improvements[bulletId] && (
                    <>
                      <div className="py-4">
                        <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Improved Version
                        </h3>
                        <div className="mb-3">
                          <Textarea
                            value={improvements[bulletId]?.improvedBulletPoint || ""}
                            onChange={(e) => {
                              const updatedImprovements = {...improvements};
                              updatedImprovements[bulletId] = {
                                ...updatedImprovements[bulletId],
                                improvedBulletPoint: e.target.value
                              };
                              setImprovements(updatedImprovements);
                            }}
                            rows={3}
                            className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 focus:border-green-300 dark:focus:border-green-700"
                          />
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            onClick={() => {
                              // Update the resume data with the improved bullet point
                              const updatedJobs = [...resumeData.bullet_points];
                              updatedJobs[currentJobIndex].achievements[currentBulletIndex] = improvements[bulletId].improvedBulletPoint;
                              setResumeData({...resumeData, bullet_points: updatedJobs});
                              
                              // Mark this bullet as saved
                              setSavedBullets({...savedBullets, [bulletId]: true});

                              // Show a temporary success message
                              const tempMessage = document.createElement('div');
                              tempMessage.className = 'text-green-600 dark:text-green-400 text-sm mt-2 animate-fade-in';
                              tempMessage.innerHTML = 'Bullet point updated successfully!';
                              document.getElementById('save-button-container').appendChild(tempMessage);
                              
                              // Remove the message after 3 seconds
                              setTimeout(() => {
                                if (tempMessage.parentNode) {
                                  tempMessage.parentNode.removeChild(tempMessage);
                                }
                              }, 3000);
                            }}
                            variant="secondary"
                            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Save Improved Version
                          </Button>
                          
                          <Button
                            onClick={() => {
                              // Save the current bullet point
                              const updatedJobs = [...resumeData.bullet_points];
                              updatedJobs[currentJobIndex].achievements[currentBulletIndex] = improvements[bulletId].improvedBulletPoint;
                              setResumeData({...resumeData, bullet_points: updatedJobs});
                              
                              // Mark this bullet as saved
                              setSavedBullets({...savedBullets, [bulletId]: true});
                              
                              // Navigate to next bullet point
                              navigateBulletPoints('next');
                            }}
                            variant="primary"
                            className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white"
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Save & Next Bullet
                          </Button>
                        </div>
                        <div id="save-button-container" className="mt-2"></div>
                      </div>
                      
                      <div className="py-4">
                        <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-400 mb-2 flex items-center">
                          <Info className="w-5 h-5 mr-2" />
                          Reasoning
                        </h3>
                        <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded border border-primary-200 dark:border-primary-800 text-gray-800 dark:text-gray-200">
                          {improvements[bulletId]?.reasoning}
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center">
                          <ClipboardList className="w-5 h-5 mr-2" />
                          Follow-up Questions
                        </h3>
                        
                        {showFollowUpForBullets[bulletId] && improvements[bulletId]?.followUpQuestions ? (
                          <div className="space-y-4">
                            {improvements[bulletId].followUpQuestions.map((question, index) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                                <p className="text-gray-800 dark:text-gray-200 mb-2">{question}</p>
                                <Textarea
                                  label="Your response"
                                  placeholder="Provide additional context..."
                                  value={additionalContexts[bulletId]?.[index] || ""}
                                  onChange={(e) => handleAdditionalContextChange(index, e.target.value)}
                                  rows={2}
                                />
                              </div>
                            ))}
                            <Button 
                              onClick={handleAdditionalContextSubmit} 
                              variant="secondary"
                              loading={loading.improve}
                              className="mt-2"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              {loading.improve ? 'Processing...' : 'Submit Additional Context'}
                            </Button>
                          </div>
                        ) : (
                          <div className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                            No follow-up questions available.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                    <Sparkles className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a Bullet Point
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    Click on any bullet point from the job listings to get AI-powered suggestions for improvement.
                  </p>
                </div>
              )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFinalReview = () => {
    return (
      <Card className="w-full shadow-md transition-colors duration-200">
        <CardHeader>
          <CardTitle className="text-xl mb-2">Final Review</CardTitle>
          <CardDescription>
            Review all your improved bullet points before downloading your enhanced resume.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {resumeData.bullet_points.map((job, jobIndex) => (
            <div key={jobIndex} className="space-y-4">
              {renderJobCard(job, jobIndex)}
              
              <Table variant="bordered">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2">Original Bullet Point</TableHead>
                    <TableHead className="w-1/2">Improved Bullet Point</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {job.achievements?.map((bullet, bulletIndex) => {
                    const bulletId = getBulletId(jobIndex, bulletIndex);
                    const improved = improvements[bulletId]?.improvedBulletPoint;
                    return (
                      <TableRow key={bulletIndex}>
                        <TableCell className="align-top">{bullet}</TableCell>
                        <TableCell className={improved ? "align-top bg-green-50 dark:bg-green-900/20" : "align-top bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}>
                          {improved || "Not improved yet"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ))}
          
          <div className="flex justify-center pt-6">
            <Button 
              onClick={() => {
                // Collect all improved bullets organized by job
                const improvedResumeData = {
                  bullet_points: resumeData.bullet_points.map((job, jobIndex) => ({
                    ...job,
                    achievements: job.achievements?.map((bullet, bulletIndex) => {
                      const bulletId = getBulletId(jobIndex, bulletIndex);
                      return improvements[bulletId]?.improvedBulletPoint || bullet;
                    })
                  }))
                };
                
                // For backward compatibility, create a flat array of bullet points
                const flatBullets = [];
                improvedResumeData.bullet_points.forEach(job => {
                  flatBullets.push(`POSITION: ${job.position} at ${job.company} (${job.time_period || 'N/A'})`);
                  job.achievements?.forEach(bullet => {
                    flatBullets.push(`• ${bullet.startsWith('•') ? bullet.substring(1).trim() : bullet}`);
                  });
                });
                
                exportResume(flatBullets);
              }}
              variant="primary"
              size="lg"
              loading={loading.export}
              className="mt-4"
            >
              <Download className="w-5 h-5 mr-2" />
              {loading.export ? 'Generating...' : 'Download Improved Resume'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Functions for editing job details
  const startEditingJob = (jobIndex) => {
    setEditingJobIndex(jobIndex);
    setEditingJob({...resumeData.bullet_points[jobIndex]});
  };
  
  const saveEditedJob = () => {
    if (editingJob && editingJobIndex !== null) {
      const updatedJobs = [...resumeData.bullet_points];
      updatedJobs[editingJobIndex] = editingJob;
      setResumeData({...resumeData, bullet_points: updatedJobs});
      setEditingJobIndex(null);
      setEditingJob(null);
    }
  };
  
  // Functions for editing bullet points
  const startEditingBullet = (jobIndex, bulletIndex, bulletText) => {
    setEditingBulletInfo({ jobIndex, bulletIndex });
    setEditedBullet(bulletText);
  };
  
  const saveEditedBullet = () => {
    if (editingBulletInfo.jobIndex !== null && editingBulletInfo.bulletIndex !== null) {
      const updatedJobs = [...resumeData.bullet_points];
      updatedJobs[editingBulletInfo.jobIndex].achievements[editingBulletInfo.bulletIndex] = editedBullet;
      setResumeData({...resumeData, bullet_points: updatedJobs});
      setEditingBulletInfo({ jobIndex: null, bulletIndex: null });
      setEditedBullet("");
    }
  };

  // New function to render the resume overview screen
  const renderResumeOverview = () => {
    const totalJobs = resumeData.bullet_points.length;
    const totalBullets = getTotalBulletPoints();
    
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
                  <Building className="w-5 h-5 text-primary-600 dark:text-primary-400" />
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
                        onClick={() => {setEditingJobIndex(null); setEditingJob(null);}} 
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
                      <div className="text-sm text-gray-500 dark:text-gray-500">{job.time_period}</div>
                    )}
                    <div className="mt-1 text-xs text-primary-600 dark:text-primary-400">Click to edit details</div>
                  </div>
                )}
                
                {/* Bullet points section */}
                <div>
                  <h4 className="font-medium text-sm mb-2 text-gray-800 dark:text-gray-200">Bullet Points:</h4>
                  <div className="space-y-2">
                    {job.achievements?.map((bullet, bulletIndex) => (
                      <div key={bulletIndex} className="relative">
                        {editingBulletInfo.jobIndex === jobIndex && editingBulletInfo.bulletIndex === bulletIndex ? (
                          <div className="border border-primary-300 dark:border-primary-700 rounded p-3 bg-white dark:bg-gray-800">
                            <Textarea
                              rows={3}
                              value={editedBullet}
                              onChange={(e) => setEditedBullet(e.target.value)}
                              className="mb-2"
                            />
                            <div className="flex space-x-2">
                              <Button 
                                onClick={saveEditedBullet} 
                                variant="secondary"
                                size="sm"
                              >
                                Save
                              </Button>
                              <Button 
                                onClick={() => setEditingBulletInfo({ jobIndex: null, bulletIndex: null })} 
                                variant="ghost"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="border border-gray-200 dark:border-gray-700 rounded p-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                            onClick={() => startEditingBullet(jobIndex, bulletIndex, bullet)}
                          >
                            {bullet}
                            <div className="mt-1 text-xs text-primary-600 dark:text-primary-400">Click to edit</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            After reviewing and correcting your resume data, continue to view your resume analysis or go back to upload a different file.
            {resumeAnalysis && !resumeEdited && (
              <span className="block mt-2 text-green-600 dark:text-green-400">
                <CheckCircle className="inline-block w-4 h-4 mr-1" />
                Your analysis is ready to view!
              </span>
            )}
            {!resumeAnalysis && !loading.analyze && (
              <span className="block mt-2 text-gray-500 dark:text-gray-400">
                <Info className="inline-block w-4 h-4 mr-1" />
                Analysis will begin when you continue.
              </span>
            )}
            {loading.analyze && (
              <span className="block mt-2 text-primary-600 dark:text-primary-400">
                <svg className="inline-block w-4 h-4 mr-1 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing your resume in the background...
              </span>
            )}
          </p>
          <Button 
            onClick={() => setStep(2.5)} 
            variant="primary"
            className="w-full"
          >
            {resumeAnalysis ? "View Your Resume Analysis" : "Continue to Resume Analysis"}
          </Button>
        </div>
        </CardContent>
      </Card>
    );
  };
  
  // Function to get resume analysis from AI when moving to analysis page
  const getResumeAnalysis = async () => {
    // Don't run analysis if we already have it, unless forceRefresh is true
    if (!resumeAnalysis) {
      try {
        console.log("Starting resume analysis on analysis page...");
        const analysis = await analyzeResume(resumeData);
        if (analysis) {
          setResumeAnalysis(analysis);
          console.log("Analysis completed successfully");
        }
      } catch (error) {
        console.error("Error getting resume analysis:", error);
      }
    } else {
      console.log("Using existing resume analysis data");
    }
  };

  // Effect to trigger analysis when reaching the analysis step
  React.useEffect(() => {
    // Only analyze if we're on the analysis step AND either:
    // 1. We don't have an analysis yet, OR
    // 2. The resume was edited (flag set elsewhere in the code)
    if (step === 2.5 && (!resumeAnalysis || resumeEdited)) {
      getResumeAnalysis();
      
      // Reset the edited flag after triggering a re-analysis
      if (resumeEdited) {
        setResumeEdited(false);
      }
    }
  }, [step, resumeAnalysis, resumeEdited, resumeData]);
  

  // New function to render the resume analysis screen
  const renderResumeAnalysis = () => {
    
    // Default placeholder for loading state
    if (!resumeAnalysis && loading.analyze) {
      return (
        <Card className="w-full shadow-md transition-colors duration-200">
          <CardHeader>
            <CardTitle className="text-xl">Resume Analysis</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-4 rounded-lg">
              <p className="text-sm text-primary-800 dark:text-primary-300">
                Our AI is analyzing your resume to provide personalized insights. This may take a moment...
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center py-10">
              <div className="bg-primary-100 dark:bg-primary-900/50 p-4 rounded-full mb-4">
                <svg className="animate-spin h-10 w-10 text-primary-600 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-center mb-2 font-medium">Analyzing your resume...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">This can take 15-20 seconds</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Error state
    if (!resumeAnalysis && errors.analyze) {
      return (
        <Card className="w-full shadow-md transition-colors duration-200">
          <CardHeader>
            <CardTitle className="text-xl">Resume Analysis</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="bg-red-100 dark:bg-red-800 p-2 rounded-full mr-3 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-300 mb-1">Error analyzing your resume</h3>
                  <p className="text-sm text-red-700 dark:text-red-400">{errors.analyze || "There was an issue generating your resume analysis. Please try again."}</p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={getResumeAnalysis} 
              variant="primary"
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    // No data yet, continue with loading
    if (!resumeAnalysis) {
      return (
        <Card className="w-full shadow-md transition-colors duration-200">
          <CardHeader>
            <CardTitle className="text-xl">Resume Analysis</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-4 rounded-lg">
              <p className="text-sm text-primary-800 dark:text-primary-300">
                Preparing your resume analysis...
              </p>
            </div>
            
            <Button 
              onClick={getResumeAnalysis} 
              variant="primary"
              className="w-full"
            >
              Generate Analysis
            </Button>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="w-full shadow-md transition-colors duration-200">
        <CardHeader>
          <CardTitle className="text-xl">Resume Analysis</CardTitle>
          <CardDescription>
            Comprehensive analysis of your resume with personalized insights
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-4 rounded-lg">
            <p className="text-sm text-primary-800 dark:text-primary-300">
              Based on the information in your resume, we've prepared a comprehensive analysis to help you understand your strengths and areas for improvement. Use these insights to enhance your resume and prepare for job applications.
            </p>
          </div>
          
          {/* Main analysis content in single column */}
          <div className="space-y-8">
              {/* Strengths Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-700 dark:text-green-400 flex items-center">
                  <div className="bg-green-100 dark:bg-green-900/50 p-1.5 rounded-full mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Resume Strengths
                </h3>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <ul className="space-y-3">
                    {resumeAnalysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 dark:text-green-400 mr-2 font-bold">•</span>
                        <span className="text-gray-800 dark:text-gray-200">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
        
              {/* Weaknesses Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-yellow-700 dark:text-yellow-500 flex items-center">
                  <div className="bg-yellow-100 dark:bg-yellow-900/50 p-1.5 rounded-full mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Areas for Improvement
                </h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <ul className="space-y-3">
                    {resumeAnalysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-600 dark:text-yellow-400 mr-2 font-bold">•</span>
                        <span className="text-gray-800 dark:text-gray-200">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {/* Recommendations Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary-700 dark:text-primary-400 flex items-center">
                  <div className="bg-primary-100 dark:bg-primary-900/50 p-1.5 rounded-full mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 dark:text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Recommended Improvements
                </h3>
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
                  <ul className="space-y-3">
                    {resumeAnalysis.areasForImprovement.map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary-600 dark:text-primary-400 mr-2 font-bold">•</span>
                        <span className="text-gray-800 dark:text-gray-200">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
        
              {/* ATS Keyword Optimization Section */}
              {resumeAnalysis.atsKeywords && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3 text-cyan-700 dark:text-cyan-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    ATS Keyword Optimization
                  </h3>
                  <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800">
                    <p className="text-sm text-cyan-800 dark:text-cyan-300 mb-3">
                      Applicant Tracking Systems (ATS) scan resumes for relevant keywords. Below are keywords that are important for your target roles:
                    </p>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-cyan-800 dark:text-cyan-400 mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Keywords Present in Your Resume
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {resumeAnalysis.atsKeywords
                            .filter(keyword => keyword.present)
                            .map((keyword, index) => (
                              <span 
                                key={index} 
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  keyword.priority === "High" 
                                    ? "bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-300" 
                                    : keyword.priority === "Medium"
                                    ? "bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                }`}
                              >
                                {keyword.keyword}
                                {keyword.priority === "High" && <span className="ml-1">★</span>}
                              </span>
                            ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-cyan-800 dark:text-cyan-400 mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                          Keywords to Add to Your Resume
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {resumeAnalysis.atsKeywords
                            .filter(keyword => !keyword.present)
                            .map((keyword, index) => (
                              <span 
                                key={index} 
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  keyword.priority === "High" 
                                    ? "bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800" 
                                    : keyword.priority === "Medium"
                                    ? "bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
                                    : "bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"
                                }`}
                              >
                                {keyword.keyword}
                                {keyword.priority === "High" && <span className="ml-1">★</span>}
                              </span>
                            ))}
                        </div>
                        <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-2">
                          <strong>Priority Guide:</strong> Keywords with ★ are high priority and should be included if relevant to your experience.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Missing Skills Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-purple-700 dark:text-purple-400 flex items-center">
                  <div className="bg-purple-100 dark:bg-purple-900/50 p-1.5 rounded-full mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Skills to Consider Adding
                </h3>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex flex-wrap gap-2">
                    {resumeAnalysis.missingSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Top Industries Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-emerald-700 dark:text-emerald-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H7a1 1 0 00-1 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                  Top Industries for Your Skills
                </h3>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="space-y-4">
                    {resumeAnalysis.topIndustries.map((industry, index) => (
                      <div key={index} className="border-b border-emerald-100 dark:border-emerald-800/50 pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-emerald-800 dark:text-emerald-300">{industry.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            industry.match === "High" 
                              ? "bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-300" 
                              : industry.match === "Medium"
                              ? "bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-300"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                          }`}>
                            {industry.match} Match
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {industry.keySkills.map((skill, skillIndex) => (
                            <span 
                              key={skillIndex}
                              className="bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 text-xs px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            {/* Recommended Roles Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-indigo-700 dark:text-indigo-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                </svg>
                Recommended Roles
              </h3>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {resumeAnalysis.recommendedRoles.map((role, index) => (
                    <div 
                      key={index} 
                      className="bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 text-center hover:shadow-md transition-shadow"
                    >
                      <span className="text-indigo-700 dark:text-indigo-300 font-medium">{role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Companies Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-rose-700 dark:text-rose-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Companies to Apply To
              </h3>
              <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-lg border border-rose-200 dark:border-rose-800">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-rose-800 dark:text-rose-300 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l.707.707L15.414 4l.707-.707a1 1 0 111.414 1.414L16.829 5.5l.707.707a1 1 0 01-1.414 1.414L15.414 7l-.707.707a1 1 0 01-1.414-1.414l.707-.707-.707-.707a1 1 0 010-1.414zM17 11a1 1 0 01.707.293l.707.707L19.414 13l.707-.707a1 1 0 111.414 1.414L20.829 14.5l.707.707a1 1 0 01-1.414 1.414L19.414 16l-.707.707a1 1 0 01-1.414-1.414l.707-.707-.707-.707A1 1 0 0117 13z" clipRule="evenodd" />
                      </svg>
                      Top-tier companies in your field
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                      {resumeAnalysis.companies.major.map((company, index) => (
                        <div 
                          key={index} 
                          className="bg-white dark:bg-gray-800 border border-rose-200 dark:border-rose-800 rounded-lg p-2 text-center hover:shadow-md transition-shadow flex items-center justify-center"
                        >
                          <span className="text-rose-700 dark:text-rose-300 font-medium text-sm">{company}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-rose-800 dark:text-rose-300 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                      </svg>
                      Promising companies with growth potential
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                      {resumeAnalysis.companies.promising.map((company, index) => (
                        <div 
                          key={index} 
                          className="bg-white dark:bg-gray-800 border border-rose-200 dark:border-rose-800 rounded-lg p-2 text-center hover:shadow-md transition-shadow flex items-center justify-center relative group"
                        >
                          <span className="text-rose-700 dark:text-rose-300 font-medium text-sm">{company}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        
          {/* Continue button aligned under the content */}
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              onClick={() => setStep(3)} 
              variant="primary"
              className="w-full"
            >
              Continue to Bullet Improvement
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return renderFeatureSelection();
      case 1:
        return (
          <Card className="w-full shadow-md dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Resume Improvement Assistant</CardTitle>
              <CardDescription className="text-center">
                Transform your resume with AI-powered insights and improvements
              </CardDescription>
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
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.doc,.docx" aria-label="Upload resume file" />
              </label>
              
              {errors.parse && (
                <div className="text-red-500 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800 w-full">
                  {errors.parse}
                </div>
              )}
              
              {loading.parse && (
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
          </Card>
        );
      case 2:
        return renderResumeOverview();
      case 2.5:
        return renderResumeAnalysis();
      case 3:
        return renderBulletImprovement();
      case 4:
        return renderFinalReview();
      default:
        return null;
    }
  };

  const renderNavigationButtons = () => {
    // Don't show navigation on feature selection screen (first screen)
    if (step === 0) return null;

    const canGoBack = step > 0;
    const canGoForward = step < 4 || 
                         (step === 3 && 
                          (currentJobIndex < resumeData.bullet_points.length - 1 || 
                           (currentJobIndex === resumeData.bullet_points.length - 1 && 
                            currentBulletIndex < (resumeData.bullet_points[currentJobIndex]?.achievements?.length || 0) - 1)
                          ));
    
    const forwardLabel = step === 3 ? 
                         (currentJobIndex === resumeData.bullet_points.length - 1 && 
                          currentBulletIndex === (resumeData.bullet_points[currentJobIndex]?.achievements?.length || 0) - 1) ? 
                         'Finish' : 'Next Bullet' : 
                         'Next';

    // Find the next step based on current step
    const findNextStep = () => {
      const currentIndex = navigationSteps.findIndex(s => s.value === step);
      if (currentIndex === -1 || currentIndex >= navigationSteps.length - 1) return null;
      return navigationSteps[currentIndex + 1];
    };

    // Find the previous step based on current step
    const findPrevStep = () => {
      const currentIndex = navigationSteps.findIndex(s => s.value === step);
      if (currentIndex <= 0) return null;
      return navigationSteps[currentIndex - 1];
    };

    const nextStep = findNextStep();
    const prevStep = findPrevStep();

    // Don't show the next button on screens with their own continue buttons
    // Upload page (1), overview (2), analysis (2.5)
    const hideNextButton = step === 1 || step === 2 || step === 2.5;

    return (
      <div className="flex justify-between items-center mt-8 w-full">
        <Button 
          onClick={() => handleNavigation('back')} 
          variant={canGoBack ? "outline" : "ghost"}
          disabled={!canGoBack}
          aria-label={prevStep ? `Go back to ${prevStep.label}` : "Go back"}
          className="flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {prevStep ? (
            <span className="flex items-center">
              <span className="hidden sm:inline">Back to </span> 
            </span>
          ) : (
            "Back"
          )}
        </Button>
        
        {!hideNextButton && (
          <Button 
            onClick={() => handleNavigation('forward')} 
            variant={canGoForward ? "primary" : "ghost"}
            disabled={!canGoForward}
            aria-label={nextStep ? `Continue to ${nextStep.label}` : `${forwardLabel}`}
            className="flex items-center"
          >
            {nextStep && step !== 3 ? (
              <span className="flex items-center">
                <span className="hidden sm:inline">Continue to </span>
                {nextStep.icon && <span className="mr-1">{nextStep.icon}</span>}
                <span className="hidden sm:inline">{nextStep.label}</span>
              </span>
            ) : (
              forwardLabel
            )}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    );
  };

  const { theme } = useTheme();

  // Determine which steps should be disabled
  const disabledSteps = () => {
    const disabledArr = [];
    
    // If we don't have resume data yet, disable steps that need it
    if (resumeData.bullet_points.length === 0) {
      disabledArr.push(2, 2.5, 3, 4);
    }
    
    // If we're still on feature selection, disable all other steps
    if (step === 0) {
      disabledArr.push(1, 2, 2.5, 3, 4);
    }
    
    return disabledArr;
  };

  return (
    <div className="min-h-screen flex flex-col items-center transition-colors duration-200">
      <div className="w-full max-w-7xl flex flex-col items-center justify-center flex-grow py-8 px-4">
        <div className="w-full text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white transition-colors">
            Resume Improvement Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4 mx-auto max-w-2xl transition-colors">
            Enhance your resume with AI-powered insights and improvements
          </p>
        </div>
        
        {/* Navigation steps - only show if we're past feature selection */}
        {step > 0 && (
          <div className="w-full px-2 mb-6 mt-2 animate-fade-in">
            <StepNavigation 
              currentStep={step} 
              steps={navigationSteps.slice(1)} // Skip feature selection step in nav
              onStepClick={handleStepNavigation}
              disabled={disabledSteps()}
              isStepCompleted={isStepCompleted}
            />
          </div>
        )}
        
        <div key={step} className="w-full flex justify-center">
          <div className={`w-full animate-slide-in ${
            // Different max widths based on the step
            step === 3 
              ? 'max-w-[95vw] lg:max-w-6xl xl:max-w-7xl' // Wider for bullet improvement
              : step === 2.5 
                ? 'max-w-[90vw] lg:max-w-5xl' // Medium width for analysis
                : 'max-w-[90vw] lg:max-w-4xl' // Regular width for other steps
          }`}>
            {renderStep()}
          </div>
        </div>
        
        <div className={`w-full mt-6 animate-fade-in ${
          step === 3 
            ? 'max-w-[95vw] lg:max-w-6xl xl:max-w-7xl' 
            : step === 2.5 
              ? 'max-w-[90vw] lg:max-w-5xl'
              : 'max-w-[90vw] lg:max-w-4xl'
        }`}>
          {renderNavigationButtons()}
        </div>
      </div>
      
      <ConfirmationModal 
        isOpen={showConfirmModal}
        onConfirm={handleConfirmReset}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};

export default ResumeImprovement;