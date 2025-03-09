import React, { useState } from 'react';
import { Upload, FileText, Download, Send, ArrowLeft, ArrowRight, AlertTriangle, PenTool, Briefcase, Calendar, Briefcase as Job, Building } from 'lucide-react';
import Button from './ui/Button';
import useResumeService from '../services/hooks/useResumeService';

const ConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-yellow-500 w-6 h-6 mr-2" />
          <h3 className="text-lg font-bold">Confirm Restart</h3>
        </div>
        <p className="mb-4">Are you sure you want to go back? This will restart the process and all changes will be lost.</p>
        <div className="flex justify-end space-x-2">
          <Button onClick={onCancel} className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

const ResumeImprovement = () => {
  const { loading, errors, parseResume, getAISuggestions, exportResume } = useResumeService();
  const [step, setStep] = useState(0); // 0: upload, 1: overview, 2: feature selection, 3: bullet improvement, 4: final review
  const [resumeData, setResumeData] = useState({ bullet_points: [] });
  const [flatBulletPoints, setFlatBulletPoints] = useState([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [currentBulletIndex, setCurrentBulletIndex] = useState(0);
  const [improvements, setImprovements] = useState({});
  const [additionalContexts, setAdditionalContexts] = useState({});
  const [showFollowUpForBullets, setShowFollowUpForBullets] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // State for editing job details in overview
  const [editingJobIndex, setEditingJobIndex] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [editingBulletInfo, setEditingBulletInfo] = useState({ jobIndex: null, bulletIndex: null });
  const [editedBullet, setEditedBullet] = useState("");

  const resetState = () => {
    setStep(0);
    setResumeData({ bullet_points: [] });
    setFlatBulletPoints([]);
    setCurrentJobIndex(0);
    setCurrentBulletIndex(0);
    setImprovements({});
    setAdditionalContexts({});
    setShowFollowUpForBullets({});
    setEditingJobIndex(null);
    setEditingJob(null);
    setEditingBulletInfo({ jobIndex: null, bulletIndex: null });
    setEditedBullet("");
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
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
        
        setStep(1); // Go to resume overview page
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
    if (jobs.length === 0) return null;
    
    const currentJob = jobs[currentJobIndex];
    if (!currentJob || !currentJob.achievements || currentJob.achievements.length === 0) return null;
    
    return currentJob.achievements[currentBulletIndex];
  };

  // Calculate a unique ID for each bullet point
  const getBulletId = (jobIndex, bulletIndex) => {
    return `job${jobIndex}-bullet${bulletIndex}`;
  };

  const getCurrentBulletId = () => {
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

  const handleNavigation = (direction) => {
    if (direction === 'back') {
      if (step === 1) {
        // From overview back to upload
        setShowConfirmModal(true);
      } else if (step === 2) {
        // From tool selection back to overview
        setStep(1);
      } else if (step === 3) {
        // From bullet improvement back to tool selection
        setStep(2);
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
      } else if (step > 1) {
        setStep(step - 1);
      }
    } else if (direction === 'forward') {
      if (step === 3) {
        navigateBulletPoints('next');
      } else if (step < 4) {
        setStep(step + 1);
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
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{width: `${progress}%`}}
        ></div>
      </div>
    );
  };

  const renderFeatureSelection = () => {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Choose a Feature</h2>
        <p className="text-gray-600 mb-6 text-center">Select one of our AI-powered tools to enhance your job search materials</p>
        
        <div className="space-y-4">
          {/* Active Feature */}
          <div className="group">
            <Button 
              onClick={() => setStep(3)} 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-lg flex items-center justify-between hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex flex-col items-start">
                <span className="text-lg font-semibold">Resume Improvement Assistant</span>
                <span className="text-sm text-blue-100">Enhance your bullet points with AI suggestions</span>
              </div>
              <div className="bg-blue-400 p-2 rounded-full group-hover:bg-blue-300 transition-colors">
                <FileText className="w-6 h-6" />
              </div>
            </Button>
          </div>
          
          {/* Coming Soon Features */}
          <div>
            <button
              disabled
              className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-lg flex items-center justify-between shadow-sm opacity-80 cursor-not-allowed"
            >
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-semibold">Cover Letter Generator</span>
                  <span className="bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full">Coming Soon</span>
                </div>
                <span className="text-sm text-gray-500">Create tailored cover letters for job applications</span>
              </div>
              <div className="bg-gray-200 p-2 rounded-full">
                <PenTool className="w-6 h-6 text-gray-600" />
              </div>
            </button>
          </div>
          
          <div>
            <button
              disabled
              className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-lg flex items-center justify-between shadow-sm opacity-80 cursor-not-allowed"
            >
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-semibold">Job Matching Tool</span>
                  <span className="bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full">Coming Soon</span>
                </div>
                <span className="text-sm text-gray-500">Find jobs that match your skills and experience</span>
              </div>
              <div className="bg-gray-200 p-2 rounded-full">
                <Briefcase className="w-6 h-6 text-gray-600" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderJobCard = (job, index) => {
    if (!job) return null;
    
    return (
      <div key={index} className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-start mb-4">
          <Building className="w-5 h-5 mr-2 mt-1 text-blue-600" />
          <div>
            <h3 className="font-bold text-lg">{job.company}</h3>
            <div className="flex items-center">
              <Job className="w-4 h-4 mr-1 text-gray-600" />
              <span className="text-gray-700">{job.position}</span>
            </div>
            {job.time_period && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-gray-600" />
                <span className="text-gray-700">{job.time_period}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // New function to render job navigation tabs/dropdown
  const renderJobNavigation = () => {
    const jobs = resumeData.bullet_points;
    if (!jobs || jobs.length <= 1) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Jump to Position:</h3>
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
                  ? 'bg-blue-100 border-blue-300 text-blue-800' 
                  : 'bg-white border-gray-300 hover:bg-gray-100'
                }
              `}
            >
              <div className="mr-2 flex-shrink-0">
                <Building className={`w-4 h-4 ${currentJobIndex === index ? 'text-blue-600' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-medium truncate">{job.position}</div>
                <div className="text-xs text-gray-500 truncate">{job.company} {job.time_period ? `• ${job.time_period}` : ''}</div>
              </div>
              <div className="ml-2 px-1.5 py-0.5 bg-gray-200 text-gray-800 rounded text-xs">
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
              ${currentBulletIndex === index 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }
            `}
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
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-4">No Resume Data Found</h2>
          <p className="text-red-500">
            The resume parser couldn't extract any bullet points from your resume. 
            Please try uploading again or use a different file format.
          </p>
          <Button 
            onClick={() => setStep(0)} 
            className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
          >
            Return to Upload
          </Button>
        </div>
      );
    }
    
    // Ensure currentJobIndex is valid
    if (currentJobIndex >= jobs.length) {
      console.log("Invalid job index, resetting to 0");
      setCurrentJobIndex(0);
    }
    
    const currentJob = jobs[currentJobIndex];
    if (!currentJob) {
      console.error("No job data found for index", currentJobIndex);
      return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Job Data Not Found</h2>
          <p className="text-red-500">
            The selected job position couldn't be found. This may be due to an error in resume parsing.
          </p>
          <Button 
            onClick={() => setStep(0)} 
            className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
          >
            Return to Upload
          </Button>
        </div>
      );
    }
    
    // If no achievements for the current job, add a placeholder
    if (!currentJob.achievements || currentJob.achievements.length === 0) {
      console.log("No achievements found for job, adding placeholder");
      currentJob.achievements = ["No bullet points were extracted for this position. Consider adding some manually."];
    }
    
    // Ensure currentBulletIndex is valid
    if (currentBulletIndex >= currentJob.achievements.length) {
      console.log("Invalid bullet index, resetting to 0");
      setCurrentBulletIndex(0);
    }
    
    const currentBullet = getCurrentBulletPoint();
    if (!currentBullet) {
      console.error("No bullet point found");
      return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-4">No Bullet Points Found</h2>
          <p className="text-red-500">
            No bullet points were found for this job position. Please try uploading a different resume.
          </p>
          <Button 
            onClick={() => setStep(0)} 
            className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
          >
            Return to Upload
          </Button>
        </div>
      );
    }
    
    console.log("Rendering bullet improvement for:", currentBullet);
    const bulletId = getCurrentBulletId();
    const totalBullets = getTotalBulletPoints();
    const currentBulletNumber = getCurrentBulletPointNumber();
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl">
        <h2 className="text-xl font-bold mb-4">Improve Your Bullet Points</h2>
        
        {/* Progress indicators */}
        {renderProgressBar()}
        <p className="mb-4 text-sm text-gray-600">
          Bullet Point {currentBulletNumber} of {totalBullets} total
        </p>
        
        {/* Job-Level Navigation */}
        {renderJobNavigation()}
        
        {/* Current job card */}
        {renderJobCard(currentJob)}
        
        {/* Bullet navigation within current job */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-700">Bullet Points:</h3>
            <span className="text-sm text-gray-500">
              {currentBulletIndex + 1} of {currentJob.achievements.length}
            </span>
          </div>
          {renderBulletNavigation()}
        </div>
        
        <div className="mb-4">
          <h3 className="font-bold">Original Bullet Point:</h3>
          <p className="bg-gray-50 p-3 rounded border border-gray-200">{currentBullet}</p>
        </div>
        
        <Button 
          onClick={handleBulletPointImprovement} 
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
          disabled={loading.improve}
        >
          {loading.improve ? 'Processing...' : 'Get AI Suggestions'}
        </Button>
        
        {errors.improve && (
          <div className="text-red-500 mb-4">{errors.improve}</div>
        )}
        
        <div className="mb-4">
          <h3 className="font-bold">Improved Version:</h3>
          <p className="bg-green-50 p-3 rounded border border-green-200">
            {improvements[bulletId]?.improvedBulletPoint || "AI suggestions will appear here after you click 'Get AI Suggestions'."}
          </p>
        </div>
        
        <div className="mb-4">
          <h3 className="font-bold">Reasoning:</h3>
          <p className="bg-blue-50 p-3 rounded border border-blue-200">
            {improvements[bulletId]?.reasoning || "The AI's reasoning for the improvements will be shown here."}
          </p>
        </div>
        
        <div className="mb-4">
          <h3 className="font-bold">Follow-up Questions:</h3>
          {showFollowUpForBullets[bulletId] && improvements[bulletId]?.followUpQuestions ? (
            improvements[bulletId].followUpQuestions.map((question, index) => (
              <div key={index} className="mt-2">
                <p>{question}</p>
                <textarea
                  className="w-full p-2 border rounded mt-1"
                  placeholder="Provide additional context..."
                  value={additionalContexts[bulletId]?.[index] || ""}
                  onChange={(e) => handleAdditionalContextChange(index, e.target.value)}
                />
              </div>
            ))
          ) : (
            <p>Follow-up questions will appear here after AI suggestions are generated.</p>
          )}
          
          {showFollowUpForBullets[bulletId] && (
            <Button 
              onClick={handleAdditionalContextSubmit} 
              className="bg-green-500 text-white px-4 py-2 rounded mt-4"
              disabled={loading.improve}
            >
              <Send className="w-4 h-4 mr-2 inline" />
              {loading.improve ? 'Processing...' : 'Submit Additional Context'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderFinalReview = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl">
        <h2 className="text-xl font-bold mb-4">Final Review</h2>
        
        {resumeData.bullet_points.map((job, jobIndex) => (
          <div key={jobIndex} className="mb-8">
            {renderJobCard(job, jobIndex)}
            
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 text-left">Original Bullet Point</th>
                  <th className="border p-2 text-left">Improved Bullet Point</th>
                </tr>
              </thead>
              <tbody>
                {job.achievements?.map((bullet, bulletIndex) => {
                  const bulletId = getBulletId(jobIndex, bulletIndex);
                  return (
                    <tr key={bulletIndex}>
                      <td className="border p-2">{bullet}</td>
                      <td className="border p-2">
                        {improvements[bulletId]?.improvedBulletPoint || "Not improved yet"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
        
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
          className="bg-green-500 text-white px-4 py-2 rounded mt-6"
          disabled={loading.export}
        >
          <Download className="w-4 h-4 mr-2 inline" />
          {loading.export ? 'Generating...' : 'Download Improved Resume'}
        </Button>
      </div>
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
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl">
        <h2 className="text-xl font-bold mb-4">Resume Overview</h2>
        
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 mt-1" />
            <div>
              <h3 className="font-medium text-yellow-800">Review Your Parsed Resume Data</h3>
              <p className="text-sm text-yellow-700">
                Please review the information below and make corrections if needed. Accurate data will lead to better improvement suggestions.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="mb-2">We've extracted the following from your resume:</p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              <span className="font-semibold">{totalJobs} job positions</span>
            </div>
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              <span className="font-semibold">{totalBullets} bullet points</span>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Job History:</h3>
            <span className="text-sm text-gray-500">Click any field to edit</span>
          </div>
          
          <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
            {resumeData.bullet_points.map((job, jobIndex) => (
              <div key={jobIndex} className="border rounded-lg p-4 bg-gray-50">
                {/* Job details section */}
                {editingJobIndex === jobIndex ? (
                  <div className="mb-3 pb-3 border-b">
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded"
                        value={editingJob.position}
                        onChange={(e) => setEditingJob({...editingJob, position: e.target.value})}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded"
                        value={editingJob.company}
                        onChange={(e) => setEditingJob({...editingJob, company: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded"
                        value={editingJob.time_period || ""}
                        onChange={(e) => setEditingJob({...editingJob, time_period: e.target.value})}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={saveEditedJob} 
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Save Changes
                      </Button>
                      <Button 
                        onClick={() => {setEditingJobIndex(null); setEditingJob(null);}} 
                        className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="mb-3 pb-3 border-b cursor-pointer hover:bg-gray-100 rounded p-2" 
                    onClick={() => startEditingJob(jobIndex)}
                  >
                    <div className="font-medium">{job.position}</div>
                    <div className="text-sm text-gray-600">{job.company}</div>
                    {job.time_period && (
                      <div className="text-sm text-gray-500">{job.time_period}</div>
                    )}
                    <div className="mt-1 text-xs text-blue-600">Click to edit details</div>
                  </div>
                )}
                
                {/* Bullet points section */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Bullet Points:</h4>
                  <div className="space-y-2">
                    {job.achievements?.map((bullet, bulletIndex) => (
                      <div key={bulletIndex} className="relative">
                        {editingBulletInfo.jobIndex === jobIndex && editingBulletInfo.bulletIndex === bulletIndex ? (
                          <div className="border border-blue-300 rounded p-2 bg-white">
                            <textarea
                              className="w-full p-2 border rounded mb-2"
                              rows="3"
                              value={editedBullet}
                              onChange={(e) => setEditedBullet(e.target.value)}
                            />
                            <div className="flex space-x-2">
                              <Button 
                                onClick={saveEditedBullet} 
                                className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                              >
                                Save
                              </Button>
                              <Button 
                                onClick={() => setEditingBulletInfo({ jobIndex: null, bulletIndex: null })} 
                                className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="border border-gray-200 rounded p-2 text-sm hover:bg-gray-100 cursor-pointer"
                            onClick={() => startEditingBullet(jobIndex, bulletIndex, bullet)}
                          >
                            {bullet}
                            <div className="mt-1 text-xs text-blue-600">Click to edit</div>
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
        
        <div>
          <p className="text-sm text-gray-600 mb-4">
            After reviewing and correcting your resume data, continue to select a tool to improve your resume or go back to upload a different file.
          </p>
          <Button 
            onClick={() => setStep(2)} 
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Continue to Improvement Tools
          </Button>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Upload Your Resume</h2>
            <div className="flex flex-col items-center space-y-4">
              <label className="flex flex-col items-center p-4 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 w-full">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Choose a file</span>
                <span className="text-xs text-gray-500 mt-1">PDF or text files recommended</span>
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.doc,.docx" />
              </label>
              {errors.parse && (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded w-full">
                  {errors.parse}
                </div>
              )}
              {loading.parse && (
                <div className="text-blue-500 text-sm p-2 bg-blue-50 rounded w-full">
                  Processing your file... This may take a moment
                </div>
              )}
            </div>
          </div>
        );
      case 1:
        return renderResumeOverview();
      case 2:
        return renderFeatureSelection();
      case 3:
        return renderBulletImprovement();
      case 4:
        return renderFinalReview();
      default:
        return null;
    }
  };

  const renderNavigationButtons = () => {
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
                         'Finish' : 'Next' : 
                         'Next';

    // Don't show the next button on step 1 (overview) since it has its own continue button
    // or on step 2 (feature selection) since it has its own buttons
    const hideNextButton = step === 1 || step === 2;

    return (
      <div className="flex justify-between mt-6 w-full max-w-2xl">
        <Button 
          onClick={() => handleNavigation('back')} 
          className={`px-4 py-2 rounded flex items-center ${canGoBack ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          disabled={!canGoBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {!hideNextButton && (
          <Button 
            onClick={() => handleNavigation('forward')} 
            className={`px-4 py-2 rounded flex items-center ${canGoForward ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            disabled={!canGoForward}
          >
            {forwardLabel}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col items-center justify-center flex-grow py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Resume Improvement Assistant</h1>
        {renderStep()}
        {renderNavigationButtons()}
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