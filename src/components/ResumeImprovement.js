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
  const { loading, errors, parseResume, getAISuggestions, analyzeResume, exportResume } = useResumeService();
  const [step, setStep] = useState(0); // 0: feature selection, 1: upload, 2: overview, 2.5: analysis, 3: bullet improvement, 4: final review
  const [resumeData, setResumeData] = useState({ bullet_points: [] });
  const [flatBulletPoints, setFlatBulletPoints] = useState([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [currentBulletIndex, setCurrentBulletIndex] = useState(0);
  const [improvements, setImprovements] = useState({});
  const [additionalContexts, setAdditionalContexts] = useState({});
  const [showFollowUpForBullets, setShowFollowUpForBullets] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  
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
    setResumeAnalysis(null);
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
        navigateBulletPoints('next');
      } else if (step < 4) {
        // Handle special case for floating point step
        if (step === 2.5) {
          setStep(3);
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
              onClick={() => setStep(1)} 
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
            After reviewing and correcting your resume data, continue to view your resume analysis or go back to upload a different file.
          </p>
          <Button 
            onClick={() => setStep(2.5)} 
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Continue to Resume Analysis
          </Button>
        </div>
      </div>
    );
  };
  
  // Function to get resume analysis from AI when moving to analysis page
  const getResumeAnalysis = async () => {
    if (!resumeAnalysis) {
      try {
        const analysis = await analyzeResume(resumeData);
        if (analysis) {
          setResumeAnalysis(analysis);
        }
      } catch (error) {
        console.error("Error getting resume analysis:", error);
      }
    }
  };

  // Effect to trigger analysis when reaching the analysis step
  React.useEffect(() => {
    if (step === 2.5 && !resumeAnalysis) {
      getResumeAnalysis();
    }
  }, [step, resumeAnalysis, resumeData]);

  // New function to render the resume analysis screen
  const renderResumeAnalysis = () => {
    
    // Default placeholder for loading state
    if (!resumeAnalysis && loading.analyze) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl">
          <h2 className="text-2xl font-bold mb-4">Resume Analysis</h2>
          
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              Our AI is analyzing your resume to provide personalized insights. This may take a moment...
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center py-10">
            <svg className="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-center mb-2">Analyzing your resume...</p>
            <p className="text-sm text-gray-400 text-center">This can take 15-20 seconds</p>
          </div>
        </div>
      );
    }

    // Error state
    if (!resumeAnalysis && errors.analyze) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl">
          <h2 className="text-2xl font-bold mb-4">Resume Analysis</h2>
          
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-medium text-red-800">Error analyzing your resume</h3>
                <p className="text-sm text-red-700">{errors.analyze || "There was an issue generating your resume analysis. Please try again."}</p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={getResumeAnalysis} 
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </Button>
        </div>
      );
    }

    // No data yet, continue with loading
    if (!resumeAnalysis) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl">
          <h2 className="text-2xl font-bold mb-4">Resume Analysis</h2>
          
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              Preparing your resume analysis...
            </p>
          </div>
          
          <Button 
            onClick={getResumeAnalysis} 
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Generate Analysis
          </Button>
        </div>
      );
    }
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-4">Resume Analysis</h2>
        
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <p className="text-sm text-blue-800">
            Based on the information in your resume, we've prepared a comprehensive analysis to help you understand your strengths and areas for improvement. Use these insights to enhance your resume and prepare for job applications.
          </p>
        </div>
        
        {/* Strengths Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3 text-green-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Resume Strengths
          </h3>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <ul className="space-y-2">
              {resumeAnalysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Weaknesses Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3 text-yellow-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Areas for Improvement
          </h3>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <ul className="space-y-2">
              {resumeAnalysis.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Recommendations Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3 text-blue-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Recommended Improvements
          </h3>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <ul className="space-y-2">
              {resumeAnalysis.areasForImprovement.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Top Industries Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3 text-emerald-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H7a1 1 0 00-1 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
            </svg>
            Top Industries for Your Skills
          </h3>
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <div className="space-y-4">
              {resumeAnalysis.topIndustries.map((industry, index) => (
                <div key={index} className="border-b border-emerald-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-emerald-800">{industry.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      industry.match === "High" 
                        ? "bg-green-100 text-green-800" 
                        : industry.match === "Medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {industry.match} Match
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {industry.keySkills.map((skill, skillIndex) => (
                      <span 
                        key={skillIndex}
                        className="bg-white text-emerald-700 text-xs px-2 py-1 rounded border border-emerald-200"
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
        
        {/* Top Companies Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3 text-rose-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Companies to Apply To
          </h3>
          <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
            <div className="mb-4">
              <h4 className="font-medium text-rose-800 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l.707.707L15.414 4l.707-.707a1 1 0 111.414 1.414L16.829 5.5l.707.707a1 1 0 01-1.414 1.414L15.414 7l-.707.707a1 1 0 01-1.414-1.414l.707-.707-.707-.707a1 1 0 010-1.414zM17 11a1 1 0 01.707.293l.707.707L19.414 13l.707-.707a1 1 0 111.414 1.414L20.829 14.5l.707.707a1 1 0 01-1.414 1.414L19.414 16l-.707.707a1 1 0 01-1.414-1.414l.707-.707-.707-.707A1 1 0 0117 13z" clipRule="evenodd" />
                </svg>
                Top-tier companies in your field
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {resumeAnalysis.companies.major.map((company, index) => (
                  <div 
                    key={index} 
                    className="bg-white border border-rose-200 rounded-lg p-2 text-center hover:shadow-md transition-shadow flex items-center justify-center"
                  >
                    <span className="text-rose-700 font-medium text-sm">{company}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-rose-800 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
                Promising companies with growth potential
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {resumeAnalysis.companies.promising.map((company, index) => (
                  <div 
                    key={index} 
                    className="bg-white border border-rose-200 rounded-lg p-2 text-center hover:shadow-md transition-shadow flex items-center justify-center relative group"
                  >
                    <span className="text-rose-700 font-medium text-sm">{company}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Missing Skills Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3 text-purple-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Skills to Consider Adding
          </h3>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex flex-wrap gap-2">
              {resumeAnalysis.missingSkills.map((skill, index) => (
                <span 
                  key={index} 
                  className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Recommended Roles Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3 text-indigo-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
              <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
            </svg>
            Recommended Roles
          </h3>
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {resumeAnalysis.recommendedRoles.map((role, index) => (
                <div 
                  key={index} 
                  className="bg-white border border-indigo-200 rounded-lg p-3 text-center hover:shadow-md transition-shadow"
                >
                  <span className="text-indigo-700 font-medium">{role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ATS Keyword Optimization Section */}
        {resumeAnalysis.atsKeywords && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-3 text-cyan-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              ATS Keyword Optimization
            </h3>
            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
              <p className="text-sm text-cyan-800 mb-3">
                Applicant Tracking Systems (ATS) scan resumes for relevant keywords. Below are keywords that are important for your target roles:
              </p>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-cyan-800 mb-2 flex items-center">
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
                              ? "bg-green-100 text-green-800" 
                              : keyword.priority === "Medium"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {keyword.keyword}
                          {keyword.priority === "High" && <span className="ml-1">★</span>}
                        </span>
                      ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-cyan-800 mb-2 flex items-center">
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
                              ? "bg-red-100 text-red-800 border border-red-200" 
                              : keyword.priority === "Medium"
                              ? "bg-orange-100 text-orange-800 border border-orange-200"
                              : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          }`}
                        >
                          {keyword.keyword}
                          {keyword.priority === "High" && <span className="ml-1">★</span>}
                        </span>
                      ))}
                  </div>
                  <p className="text-xs text-cyan-600 mt-2">
                    <strong>Priority Guide:</strong> Keywords with ★ are high priority and should be included if relevant to your experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div>
          <Button 
            onClick={() => setStep(3)} 
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Continue to Bullet Improvement
          </Button>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return renderFeatureSelection();
      case 1:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl">
            <h2 className="text-2xl font-bold mb-3 text-center">Resume Improvement Assistant</h2>
            
            <div className="mb-6 text-center">
              <p className="text-gray-600">Transform your resume with AI-powered insights and improvements</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">How It Works:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                      <span className="text-blue-600 font-medium">1</span>
                    </div>
                    <span className="font-medium">Upload</span>
                  </div>
                  <p className="text-sm text-gray-600">Upload your resume in PDF or text format</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                      <span className="text-blue-600 font-medium">2</span>
                    </div>
                    <span className="font-medium">Analyze</span>
                  </div>
                  <p className="text-sm text-gray-600">Receive a comprehensive analysis with strengths and improvement areas</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                      <span className="text-blue-600 font-medium">3</span>
                    </div>
                    <span className="font-medium">Improve</span>
                  </div>
                  <p className="text-sm text-gray-600">Get AI-generated improvements for each bullet point</p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Key Features:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Comprehensive resume analysis</span>
                </div>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">AI-powered bullet point improvements</span>
                </div>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Identification of missing skills</span>
                </div>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Suggested job roles matching your experience</span>
                </div>
              </div>
            </div>
            
            <h3 className="font-semibold mb-3">Upload Your Resume:</h3>
            <div className="flex flex-col items-center space-y-4">
              <label className="flex flex-col items-center p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 w-full transition-colors">
                <Upload className="w-10 h-10 mb-3 text-blue-500" />
                <span className="font-medium mb-1">Choose a file</span>
                <span className="text-xs text-gray-500 mb-1">PDF, DOC, DOCX or TXT files supported</span>
                <span className="text-xs text-gray-400">Max file size: 5MB</span>
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.doc,.docx" />
              </label>
              {errors.parse && (
                <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-200 w-full">
                  {errors.parse}
                </div>
              )}
              {loading.parse && (
                <div className="text-blue-500 text-sm p-3 bg-blue-50 rounded-lg border border-blue-200 w-full flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing your file... This may take a moment
                </div>
              )}
            </div>
            
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>Your privacy is important to us. Files are processed securely and not stored permanently.</p>
            </div>
          </div>
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
                         'Finish' : 'Next' : 
                         'Next';

    // Don't show the next button on screens with their own continue buttons
    // Upload page (1), overview (2), analysis (2.5)
    const hideNextButton = step === 1 || step === 2 || step === 2.5;

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