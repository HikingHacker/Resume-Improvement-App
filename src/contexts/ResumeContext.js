import React, { createContext, useContext, useReducer, useCallback } from 'react';
import useResumeService from '../services/hooks/useResumeService';

// Initial state
const initialState = {
  step: 0,
  resumeData: { bullet_points: [] },
  flatBulletPoints: [],
  currentJobIndex: null,
  currentBulletIndex: null,
  improvements: {},
  additionalContexts: {},
  showFollowUpForBullets: {},
  resumeAnalysis: null,
  savedBullets: {},
  originalBullets: {},
  resumeEdited: false,
  editingJobIndex: null,
  editingJob: null,
  editingBulletInfo: { jobIndex: null, bulletIndex: null },
  editedBullet: "",
};

// Action types
const ActionTypes = {
  SET_STEP: 'SET_STEP',
  SET_RESUME_DATA: 'SET_RESUME_DATA',
  SET_FLAT_BULLET_POINTS: 'SET_FLAT_BULLET_POINTS',
  SET_CURRENT_JOB_INDEX: 'SET_CURRENT_JOB_INDEX',
  SET_CURRENT_BULLET_INDEX: 'SET_CURRENT_BULLET_INDEX',
  SET_IMPROVEMENTS: 'SET_IMPROVEMENTS',
  UPDATE_IMPROVEMENT: 'UPDATE_IMPROVEMENT',
  SET_ADDITIONAL_CONTEXTS: 'SET_ADDITIONAL_CONTEXTS',
  SET_SHOW_FOLLOW_UP: 'SET_SHOW_FOLLOW_UP',
  SET_RESUME_ANALYSIS: 'SET_RESUME_ANALYSIS',
  SET_SAVED_BULLETS: 'SET_SAVED_BULLETS',
  SET_ORIGINAL_BULLETS: 'SET_ORIGINAL_BULLETS',
  SET_RESUME_EDITED: 'SET_RESUME_EDITED',
  SET_EDITING_JOB_INDEX: 'SET_EDITING_JOB_INDEX',
  SET_EDITING_JOB: 'SET_EDITING_JOB',
  SET_EDITING_BULLET_INFO: 'SET_EDITING_BULLET_INFO',
  SET_EDITED_BULLET: 'SET_EDITED_BULLET',
  RESET_STATE: 'RESET_STATE',
};

// Reducer
function resumeReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_STEP:
      return { ...state, step: action.payload };
    case ActionTypes.SET_RESUME_DATA:
      return { ...state, resumeData: action.payload };
    case ActionTypes.SET_FLAT_BULLET_POINTS:
      return { ...state, flatBulletPoints: action.payload };
    case ActionTypes.SET_CURRENT_JOB_INDEX:
      return { ...state, currentJobIndex: action.payload };
    case ActionTypes.SET_CURRENT_BULLET_INDEX:
      return { ...state, currentBulletIndex: action.payload };
    case ActionTypes.SET_IMPROVEMENTS:
      return { ...state, improvements: action.payload };
    case ActionTypes.UPDATE_IMPROVEMENT:
      return { 
        ...state, 
        improvements: { 
          ...state.improvements, 
          [action.payload.bulletId]: {
            ...state.improvements[action.payload.bulletId],
            ...action.payload.improvement
          }
        } 
      };
    case ActionTypes.SET_ADDITIONAL_CONTEXTS:
      return { ...state, additionalContexts: action.payload };
    case ActionTypes.SET_SHOW_FOLLOW_UP:
      return { ...state, showFollowUpForBullets: action.payload };
    case ActionTypes.SET_RESUME_ANALYSIS:
      return { ...state, resumeAnalysis: action.payload };
    case ActionTypes.SET_SAVED_BULLETS:
      return { ...state, savedBullets: action.payload };
    case ActionTypes.SET_ORIGINAL_BULLETS:
      return { ...state, originalBullets: action.payload };
    case ActionTypes.SET_RESUME_EDITED:
      return { ...state, resumeEdited: action.payload };
    case ActionTypes.SET_EDITING_JOB_INDEX:
      return { ...state, editingJobIndex: action.payload };
    case ActionTypes.SET_EDITING_JOB:
      return { ...state, editingJob: action.payload };
    case ActionTypes.SET_EDITING_BULLET_INFO:
      return { ...state, editingBulletInfo: action.payload };
    case ActionTypes.SET_EDITED_BULLET:
      return { ...state, editedBullet: action.payload };
    case ActionTypes.RESET_STATE:
      return initialState;
    default:
      return state;
  }
}

// Create context
const ResumeContext = createContext();

// Provider component
export function ResumeProvider({ children }) {
  const [state, dispatch] = useReducer(resumeReducer, initialState);
  const resumeService = useResumeService();

  // Helper function to calculate a unique ID for each bullet point
  const getBulletId = useCallback((jobIndex, bulletIndex) => {
    return `job${jobIndex}-bullet${bulletIndex}`;
  }, []);

  // Helper function to get current bullet ID
  const getCurrentBulletId = useCallback(() => {
    if (state.currentJobIndex === null || state.currentBulletIndex === null) return null;
    return getBulletId(state.currentJobIndex, state.currentBulletIndex);
  }, [state.currentJobIndex, state.currentBulletIndex, getBulletId]);

  // Function to handle resume parsing
  const handleFileUpload = useCallback(async (file) => {
    try {
      // Reset analysis-related state
      dispatch({ type: ActionTypes.SET_RESUME_ANALYSIS, payload: null });
      dispatch({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: null });
      dispatch({ type: ActionTypes.SET_CURRENT_BULLET_INDEX, payload: null });
      dispatch({ type: ActionTypes.SET_IMPROVEMENTS, payload: {} });
      dispatch({ type: ActionTypes.SET_SAVED_BULLETS, payload: {} });
      
      const result = await resumeService.parseResume(file);
      
      // Handle structured data format
      if (result.parsedData && result.parsedData.bullet_points) {
        dispatch({ type: ActionTypes.SET_RESUME_DATA, payload: result.parsedData });
        dispatch({ type: ActionTypes.SET_FLAT_BULLET_POINTS, payload: result.bulletPoints || [] });
        
        // Store original bullets
        const originalBulletsMap = {};
        result.parsedData.bullet_points.forEach((job, jobIndex) => {
          job.achievements?.forEach((bullet, bulletIndex) => {
            const bulletId = getBulletId(jobIndex, bulletIndex);
            originalBulletsMap[bulletId] = bullet;
          });
        });
        dispatch({ type: ActionTypes.SET_ORIGINAL_BULLETS, payload: originalBulletsMap });
        
        // Check if we have any bullet points
        const totalBullets = result.parsedData.bullet_points.reduce(
          (sum, job) => sum + (job.achievements?.length || 0), 0
        );
        
        if (totalBullets === 0) {
          resumeService.setErrors(prev => ({ 
            ...prev, 
            parse: "No bullet points were extracted from your resume. Please try a different file." 
          }));
          return false;
        }
      } 
      // Handle legacy flat format
      else if (result.bulletPoints && result.bulletPoints.length > 0) {
        dispatch({ type: ActionTypes.SET_FLAT_BULLET_POINTS, payload: result.bulletPoints });
        
        // Create a structured format from the flat list
        const structuredData = createStructuredDataFromFlatBullets(result.bulletPoints);
        dispatch({ type: ActionTypes.SET_RESUME_DATA, payload: structuredData });
        
        // Store original bullets
        const originalBulletsMap = {};
        structuredData.bullet_points.forEach((job, jobIndex) => {
          job.achievements?.forEach((bullet, bulletIndex) => {
            const bulletId = getBulletId(jobIndex, bulletIndex);
            originalBulletsMap[bulletId] = bullet;
          });
        });
        dispatch({ type: ActionTypes.SET_ORIGINAL_BULLETS, payload: originalBulletsMap });
      } 
      else {
        resumeService.setErrors(prev => ({ 
          ...prev, 
          parse: "Failed to extract any content from your resume. Please try a different file format." 
        }));
        return false;
      }
      
      dispatch({ type: ActionTypes.SET_RESUME_EDITED, payload: false });
      
      // Start background analysis
      resumeService.setLoading(prev => ({ ...prev, analyze: true }));
      
      const dataToAnalyze = result.parsedData || structuredData;
      resumeService.analyzeResume(dataToAnalyze)
        .then(analysis => {
          if (analysis) {
            dispatch({ type: ActionTypes.SET_RESUME_ANALYSIS, payload: analysis });
          }
        })
        .catch(error => {
          console.error("Background analysis error:", error);
        });
      
      dispatch({ type: ActionTypes.SET_STEP, payload: 2 });
      return true;
    } catch (error) {
      console.error("Error parsing resume:", error);
      resumeService.setErrors(prev => ({ ...prev, parse: error.message || "Failed to parse your resume" }));
      return false;
    }
  }, [resumeService, getBulletId]);

  // Helper function to convert flat bullet points to structured format
  const createStructuredDataFromFlatBullets = useCallback((flatBullets) => {
    const structuredData = { bullet_points: [] };
    let currentJob = null;
    
    for (const bullet of flatBullets) {
      // Check if this is a position/job header
      if (bullet.startsWith("POSITION:") || bullet.includes(" at ")) {
        let position = "Unknown Position";
        let company = "Unknown Company";
        let timePeriod = "";
        
        const positionLine = bullet.replace("POSITION:", "").trim();
        
        const positionMatch = positionLine.match(/(.+?)\s+at\s+(.+?)(?:\s+\((.+?)\))?$/);
        if (positionMatch) {
          position = positionMatch[1].trim();
          company = positionMatch[2].trim();
          timePeriod = positionMatch[3] ? positionMatch[3].trim() : "";
        } else {
          position = positionLine;
        }
        
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
    
    return structuredData;
  }, []);

  // Function to get bullet point improvements
  const handleBulletPointImprovement = useCallback(async () => {
    const currentBulletId = getCurrentBulletId();
    if (!currentBulletId) return null;
    
    const currentJob = state.resumeData.bullet_points[state.currentJobIndex];
    const currentBullet = currentJob.achievements[state.currentBulletIndex];
    
    try {
      // Include job context in the additional context
      const jobContext = `This is for a ${currentJob.position} role at ${currentJob.company} during ${currentJob.time_period || 'unknown time period'}.`;
      const userContext = Object.values(state.additionalContexts[currentBulletId] || {}).join(' ');
      const contextToSend = [jobContext, userContext].filter(Boolean).join(' ');
      
      const suggestions = await resumeService.getAISuggestions(currentBullet, contextToSend);
      
      if (suggestions) {
        dispatch({ 
          type: ActionTypes.UPDATE_IMPROVEMENT, 
          payload: { bulletId: currentBulletId, improvement: suggestions }
        });
        
        dispatch({ 
          type: ActionTypes.SET_SHOW_FOLLOW_UP, 
          payload: { ...state.showFollowUpForBullets, [currentBulletId]: true }
        });
        
        return suggestions;
      }
      return null;
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      return null;
    }
  }, [
    state.resumeData, 
    state.currentJobIndex, 
    state.currentBulletIndex, 
    state.additionalContexts, 
    state.showFollowUpForBullets,
    resumeService,
    getCurrentBulletId
  ]);

  // Function to handle additional context for a bullet point
  const handleAdditionalContextChange = useCallback((questionIndex, value) => {
    const bulletId = getCurrentBulletId();
    if (!bulletId) return;
    
    dispatch({ 
      type: ActionTypes.SET_ADDITIONAL_CONTEXTS, 
      payload: {
        ...state.additionalContexts,
        [bulletId]: {
          ...(state.additionalContexts[bulletId] || {}),
          [questionIndex]: value
        }
      }
    });
  }, [state.additionalContexts, getCurrentBulletId]);

  // Function to submit additional context and get updated suggestions
  const handleAdditionalContextSubmit = useCallback(async () => {
    const bulletId = getCurrentBulletId();
    if (!bulletId) return null;
    
    const currentJob = state.resumeData.bullet_points[state.currentJobIndex];
    const currentBullet = currentJob.achievements[state.currentBulletIndex];
    
    try {
      // Include job context in the additional context
      const jobContext = `This is for a ${currentJob.position} role at ${currentJob.company} during ${currentJob.time_period || 'unknown time period'}.`;
      const userContext = Object.values(state.additionalContexts[bulletId] || {}).join(' ');
      const contextToSend = [jobContext, userContext].filter(Boolean).join(' ');
      
      const newSuggestions = await resumeService.getAISuggestions(currentBullet, contextToSend);
      
      if (newSuggestions) {
        dispatch({ 
          type: ActionTypes.UPDATE_IMPROVEMENT, 
          payload: { bulletId, improvement: newSuggestions }
        });
        return newSuggestions;
      }
      return null;
    } catch (error) {
      console.error("Error getting updated AI suggestions:", error);
      return null;
    }
  }, [
    state.resumeData, 
    state.currentJobIndex, 
    state.currentBulletIndex, 
    state.additionalContexts,
    resumeService,
    getCurrentBulletId
  ]);

  // Function to navigate between bullet points
  const navigateBulletPoints = useCallback((direction) => {
    const jobs = state.resumeData.bullet_points;
    if (jobs.length === 0) return;
    
    // If no current selection, select the first bullet of the first job
    if (state.currentJobIndex === null || state.currentBulletIndex === null) {
      dispatch({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: 0 });
      dispatch({ type: ActionTypes.SET_CURRENT_BULLET_INDEX, payload: 0 });
      return;
    }
    
    const currentJob = jobs[state.currentJobIndex];
    if (!currentJob || !currentJob.achievements) return;
    
    if (direction === 'next') {
      // If not at the last bullet point in the current job
      if (state.currentBulletIndex < currentJob.achievements.length - 1) {
        dispatch({ type: ActionTypes.SET_CURRENT_BULLET_INDEX, payload: state.currentBulletIndex + 1 });
      }
      // If at the last bullet point of the current job but not the last job
      else if (state.currentJobIndex < jobs.length - 1) {
        dispatch({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: state.currentJobIndex + 1 });
        dispatch({ type: ActionTypes.SET_CURRENT_BULLET_INDEX, payload: 0 });
      }
      // At the very last bullet point
      else {
        // Move to final review
        dispatch({ type: ActionTypes.SET_STEP, payload: 4 });
      }
    } else if (direction === 'prev') {
      // If not at the first bullet point in the current job
      if (state.currentBulletIndex > 0) {
        dispatch({ type: ActionTypes.SET_CURRENT_BULLET_INDEX, payload: state.currentBulletIndex - 1 });
      }
      // If at the first bullet point of the current job but not the first job
      else if (state.currentJobIndex > 0) {
        const prevJobIndex = state.currentJobIndex - 1;
        dispatch({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: prevJobIndex });
        
        const prevJob = jobs[prevJobIndex];
        if (prevJob && prevJob.achievements) {
          dispatch({ 
            type: ActionTypes.SET_CURRENT_BULLET_INDEX, 
            payload: Math.max(0, prevJob.achievements.length - 1)
          });
        }
      }
    }
  }, [state.resumeData, state.currentJobIndex, state.currentBulletIndex]);

  // Function to reset the state
  const resetState = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_STATE });
  }, []);

  // Function to handle step navigation
  const handleStepNavigation = useCallback((newStep) => {
    // Check if step should be accessible
    if (newStep > 0 && state.resumeData.bullet_points.length === 0) {
      // Can't navigate to steps that require resume data
      return;
    }

    if (newStep === 2.5 && !state.resumeAnalysis) {
      // Trigger analysis when navigating directly to analysis step
      getResumeAnalysis();
    }

    // Special case for moving back to bullet improvement from final review
    if (state.step === 4 && newStep === 3) {
      // Go to the last bullet point
      const jobs = state.resumeData.bullet_points;
      if (jobs.length > 0) {
        const lastJobIndex = jobs.length - 1;
        const lastJob = jobs[lastJobIndex];
        if (lastJob && lastJob.achievements) {
          dispatch({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: lastJobIndex });
          dispatch({ 
            type: ActionTypes.SET_CURRENT_BULLET_INDEX, 
            payload: Math.max(0, lastJob.achievements.length - 1)
          });
        }
      }
    }

    dispatch({ type: ActionTypes.SET_STEP, payload: newStep });
  }, [state.step, state.resumeData, state.resumeAnalysis]);

  // Function to get resume analysis
  const getResumeAnalysis = useCallback(async () => {
    // Don't run analysis if we already have it, unless resumeEdited is true
    if (!state.resumeAnalysis || state.resumeEdited) {
      try {
        const analysis = await resumeService.analyzeResume(state.resumeData);
        if (analysis) {
          dispatch({ type: ActionTypes.SET_RESUME_ANALYSIS, payload: analysis });
          
          // Reset the edited flag after triggering a re-analysis
          if (state.resumeEdited) {
            dispatch({ type: ActionTypes.SET_RESUME_EDITED, payload: false });
          }
        }
      } catch (error) {
        console.error("Error getting resume analysis:", error);
      }
    }
  }, [state.resumeAnalysis, state.resumeEdited, state.resumeData, resumeService]);

  // Navigation functions
  const handleNavigation = useCallback((direction) => {
    if (direction === 'back') {
      if (state.step === 1) {
        // From upload back to feature selection
        dispatch({ type: ActionTypes.SET_STEP, payload: 0 });
      } else if (state.step === 2) {
        // From overview back to upload
        dispatch({ type: ActionTypes.SET_STEP, payload: 1 });
      } else if (state.step === 2.5) {
        // From analysis back to overview
        dispatch({ type: ActionTypes.SET_STEP, payload: 2 });
      } else if (state.step === 3) {
        // From bullet improvement back to analysis
        dispatch({ type: ActionTypes.SET_STEP, payload: 2.5 });
      } else if (state.step === 4) {
        // From final review back to bullet improvement
        dispatch({ type: ActionTypes.SET_STEP, payload: 3 });
        
        // Go to the last bullet point
        const jobs = state.resumeData.bullet_points;
        if (jobs.length > 0) {
          const lastJobIndex = jobs.length - 1;
          const lastJob = jobs[lastJobIndex];
          if (lastJob && lastJob.achievements) {
            dispatch({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: lastJobIndex });
            dispatch({ 
              type: ActionTypes.SET_CURRENT_BULLET_INDEX, 
              payload: Math.max(0, lastJob.achievements.length - 1)
            });
          }
        }
      } else if (state.step > 0) {
        dispatch({ type: ActionTypes.SET_STEP, payload: state.step - 1 });
      }
    } else if (direction === 'forward') {
      if (state.step === 3) {
        // If we're in the bullet improvement step and there's no selection yet,
        // select the first bullet point of the first job
        if (state.currentJobIndex === null || state.currentBulletIndex === null) {
          const jobs = state.resumeData.bullet_points;
          if (jobs.length > 0) {
            dispatch({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: 0 });
            dispatch({ type: ActionTypes.SET_CURRENT_BULLET_INDEX, payload: 0 });
          }
        } else {
          navigateBulletPoints('next');
        }
      } else if (state.step < 4) {
        // Handle special case for floating point step
        if (state.step === 2.5) {
          dispatch({ type: ActionTypes.SET_STEP, payload: 3 });
          
          // Initialize selection to first bullet if needed
          if (state.currentJobIndex === null || state.currentBulletIndex === null) {
            const jobs = state.resumeData.bullet_points;
            if (jobs.length > 0) {
              dispatch({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: 0 });
              dispatch({ type: ActionTypes.SET_CURRENT_BULLET_INDEX, payload: 0 });
            }
          }
        } else {
          dispatch({ type: ActionTypes.SET_STEP, payload: state.step + 1 });
        }
      }
    }
  }, [state.step, state.resumeData, state.currentJobIndex, state.currentBulletIndex, navigateBulletPoints]);

  // Job editing functions
  const startEditingJob = useCallback((jobIndex) => {
    dispatch({ type: ActionTypes.SET_EDITING_JOB_INDEX, payload: jobIndex });
    dispatch({ 
      type: ActionTypes.SET_EDITING_JOB, 
      payload: { ...state.resumeData.bullet_points[jobIndex] }
    });
  }, [state.resumeData]);

  const saveEditedJob = useCallback(() => {
    if (state.editingJob && state.editingJobIndex !== null) {
      const updatedJobs = [...state.resumeData.bullet_points];
      updatedJobs[state.editingJobIndex] = state.editingJob;
      
      dispatch({ 
        type: ActionTypes.SET_RESUME_DATA, 
        payload: { ...state.resumeData, bullet_points: updatedJobs }
      });
      
      dispatch({ type: ActionTypes.SET_EDITING_JOB_INDEX, payload: null });
      dispatch({ type: ActionTypes.SET_EDITING_JOB, payload: null });
      dispatch({ type: ActionTypes.SET_RESUME_EDITED, payload: true });
    }
  }, [state.editingJob, state.editingJobIndex, state.resumeData]);

  // Bullet point editing functions
  const startEditingBullet = useCallback((jobIndex, bulletIndex, bulletText) => {
    dispatch({ 
      type: ActionTypes.SET_EDITING_BULLET_INFO, 
      payload: { jobIndex, bulletIndex }
    });
    dispatch({ type: ActionTypes.SET_EDITED_BULLET, payload: bulletText });
  }, []);

  const saveEditedBullet = useCallback(() => {
    if (state.editingBulletInfo.jobIndex !== null && state.editingBulletInfo.bulletIndex !== null) {
      const updatedJobs = [...state.resumeData.bullet_points];
      updatedJobs[state.editingBulletInfo.jobIndex].achievements[state.editingBulletInfo.bulletIndex] = state.editedBullet;
      
      dispatch({ 
        type: ActionTypes.SET_RESUME_DATA, 
        payload: { ...state.resumeData, bullet_points: updatedJobs }
      });
      
      dispatch({ 
        type: ActionTypes.SET_EDITING_BULLET_INFO, 
        payload: { jobIndex: null, bulletIndex: null }
      });
      
      dispatch({ type: ActionTypes.SET_EDITED_BULLET, payload: "" });
      dispatch({ type: ActionTypes.SET_RESUME_EDITED, payload: true });
    }
  }, [state.editingBulletInfo, state.editedBullet, state.resumeData]);

  // Save an improved bullet point
  const saveBulletPoint = useCallback((bulletId, improvedText) => {
    if (!bulletId) return;
    
    // Update the resume data with the improved bullet point
    const updatedJobs = [...state.resumeData.bullet_points];
    updatedJobs[state.currentJobIndex].achievements[state.currentBulletIndex] = improvedText;
    
    dispatch({ 
      type: ActionTypes.SET_RESUME_DATA, 
      payload: { ...state.resumeData, bullet_points: updatedJobs }
    });
    
    // Mark this bullet as saved
    dispatch({ 
      type: ActionTypes.SET_SAVED_BULLETS, 
      payload: { ...state.savedBullets, [bulletId]: true }
    });
    
    return true;
  }, [state.resumeData, state.currentJobIndex, state.currentBulletIndex, state.savedBullets]);

  // Export the resume
  const handleExportResume = useCallback(async () => {
    // Collect all improved bullets organized by job
    const improvedResumeData = {
      bullet_points: state.resumeData.bullet_points.map((job, jobIndex) => ({
        ...job,
        achievements: job.achievements?.map((bullet, bulletIndex) => {
          const bulletId = getBulletId(jobIndex, bulletIndex);
          return state.improvements[bulletId]?.improvedBulletPoint || bullet;
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
    
    return await resumeService.exportResume(flatBullets);
  }, [state.resumeData, state.improvements, getBulletId, resumeService]);

  // Functions to get totals and current position
  const getTotalBulletPoints = useCallback(() => {
    return state.resumeData.bullet_points.reduce((total, job) => {
      return total + (job.achievements ? job.achievements.length : 0);
    }, 0);
  }, [state.resumeData]);

  const getCurrentBulletPointNumber = useCallback(() => {
    let count = 0;
    const jobs = state.resumeData.bullet_points;
    
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      if (!job.achievements) continue;
      
      if (i < state.currentJobIndex) {
        count += job.achievements.length;
      } else if (i === state.currentJobIndex) {
        count += state.currentBulletIndex + 1;
        break;
      }
    }
    
    return count;
  }, [state.resumeData, state.currentJobIndex, state.currentBulletIndex]);

  const value = {
    ...state,
    ...resumeService,
    resetState,
    getBulletId,
    getCurrentBulletId,
    handleFileUpload,
    handleBulletPointImprovement,
    handleAdditionalContextChange,
    handleAdditionalContextSubmit,
    navigateBulletPoints,
    handleStepNavigation,
    getResumeAnalysis,
    handleNavigation,
    startEditingJob,
    saveEditedJob,
    startEditingBullet,
    saveEditedBullet,
    saveBulletPoint,
    handleExportResume,
    getTotalBulletPoints,
    getCurrentBulletPointNumber,
    setStep: (step) => dispatch({ type: ActionTypes.SET_STEP, payload: step }),
    setCurrentJobIndex: (index) => dispatch({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: index }),
    setCurrentBulletIndex: (index) => dispatch({ type: ActionTypes.SET_CURRENT_BULLET_INDEX, payload: index }),
    setResumeData: (data) => dispatch({ type: ActionTypes.SET_RESUME_DATA, payload: data }),
    setEditingJob: (job) => dispatch({ type: ActionTypes.SET_EDITING_JOB, payload: job }),
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
}

// Custom hook to use the resume context
export function useResumeContext() {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error('useResumeContext must be used within a ResumeProvider');
  }
  return context;
}