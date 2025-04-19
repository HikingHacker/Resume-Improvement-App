import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import useResumeService from '../services/hooks/useResumeService';

// Define action types as constants to avoid typos
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

// Initial state with logical grouping of related state items
const initialState = {
  // UI navigation state
  step: 0,
  
  // Resume content state
  resumeData: { bullet_points: [] },
  flatBulletPoints: [],
  resumeAnalysis: null,
  resumeEdited: false,
  
  // Selection state
  currentJobIndex: null,
  currentBulletIndex: null,
  
  // Improvements state
  improvements: {},
  additionalContexts: {},
  showFollowUpForBullets: {},
  savedBullets: {},
  originalBullets: {},
  
  // Editing state
  editingJobIndex: null,
  editingJob: null,
  editingBulletInfo: { jobIndex: null, bulletIndex: null },
  editedBullet: "",
};

// Reducer with improved structure and organization by state section
function resumeReducer(state, action) {
  const { type, payload } = action;
  
  switch (type) {
    // UI navigation actions
    case ActionTypes.SET_STEP:
      return { ...state, step: payload };
    
    // Resume content actions
    case ActionTypes.SET_RESUME_DATA:
      return { ...state, resumeData: payload };
    case ActionTypes.SET_FLAT_BULLET_POINTS:
      return { ...state, flatBulletPoints: payload };
    case ActionTypes.SET_RESUME_ANALYSIS:
      return { ...state, resumeAnalysis: payload };
    case ActionTypes.SET_RESUME_EDITED:
      return { ...state, resumeEdited: payload };
    
    // Selection actions  
    case ActionTypes.SET_CURRENT_JOB_INDEX:
      return { ...state, currentJobIndex: payload };
    case ActionTypes.SET_CURRENT_BULLET_INDEX:
      return { ...state, currentBulletIndex: payload };
    
    // Improvements actions
    case ActionTypes.SET_IMPROVEMENTS:
      return { ...state, improvements: payload };
    case ActionTypes.UPDATE_IMPROVEMENT:
      return { 
        ...state, 
        improvements: { 
          ...state.improvements, 
          [payload.bulletId]: {
            ...state.improvements[payload.bulletId],
            ...payload.improvement
          }
        } 
      };
    case ActionTypes.SET_ADDITIONAL_CONTEXTS:
      return { ...state, additionalContexts: payload };
    case ActionTypes.SET_SHOW_FOLLOW_UP:
      return { ...state, showFollowUpForBullets: payload };
    case ActionTypes.SET_SAVED_BULLETS:
      return { ...state, savedBullets: payload };
    case ActionTypes.SET_ORIGINAL_BULLETS:
      return { ...state, originalBullets: payload };
    
    // Editing actions
    case ActionTypes.SET_EDITING_JOB_INDEX:
      return { ...state, editingJobIndex: payload };
    case ActionTypes.SET_EDITING_JOB:
      return { ...state, editingJob: payload };
    case ActionTypes.SET_EDITING_BULLET_INFO:
      return { ...state, editingBulletInfo: payload };
    case ActionTypes.SET_EDITED_BULLET:
      return { ...state, editedBullet: payload };
    
    // Reset action
    case ActionTypes.RESET_STATE:
      return initialState;
    
    default:
      return state;
  }
}

// Storage keys for localStorage persistence
export const STORAGE_KEYS = Object.freeze({
  RESUME_DATA: 'resume-improvement-app-data',
  RESUME_STEP: 'resume-improvement-app-step',
  RESUME_ANALYSIS: 'resume-improvement-app-analysis',
  RESUME_IMPROVEMENTS: 'resume-improvement-app-improvements'
});

// Create context (using null for stronger typing with useContext)
const ResumeContext = createContext(null);

// Create action creators
const actionCreators = {
  setStep: (step) => ({ type: ActionTypes.SET_STEP, payload: step }),
  setResumeData: (data) => ({ type: ActionTypes.SET_RESUME_DATA, payload: data }),
  setFlatBulletPoints: (points) => ({ type: ActionTypes.SET_FLAT_BULLET_POINTS, payload: points }),
  setCurrentJobIndex: (index) => ({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: index }),
  setCurrentBulletIndex: (index) => ({ type: ActionTypes.SET_CURRENT_BULLET_INDEX, payload: index }),
  setImprovements: (improvements) => ({ type: ActionTypes.SET_IMPROVEMENTS, payload: improvements }),
  updateImprovement: (bulletId, improvement) => ({ 
    type: ActionTypes.UPDATE_IMPROVEMENT, 
    payload: { bulletId, improvement } 
  }),
  setAdditionalContexts: (contexts) => ({ type: ActionTypes.SET_ADDITIONAL_CONTEXTS, payload: contexts }),
  setShowFollowUp: (bullets) => ({ type: ActionTypes.SET_SHOW_FOLLOW_UP, payload: bullets }),
  setResumeAnalysis: (analysis) => ({ type: ActionTypes.SET_RESUME_ANALYSIS, payload: analysis }),
  setSavedBullets: (bullets) => ({ type: ActionTypes.SET_SAVED_BULLETS, payload: bullets }),
  setOriginalBullets: (bullets) => ({ type: ActionTypes.SET_ORIGINAL_BULLETS, payload: bullets }),
  setResumeEdited: (edited) => ({ type: ActionTypes.SET_RESUME_EDITED, payload: edited }),
  setEditingJobIndex: (index) => ({ type: ActionTypes.SET_EDITING_JOB_INDEX, payload: index }),
  setEditingJob: (job) => ({ type: ActionTypes.SET_EDITING_JOB, payload: job }),
  setEditingBulletInfo: (info) => ({ type: ActionTypes.SET_EDITING_BULLET_INFO, payload: info }),
  setEditedBullet: (bullet) => ({ type: ActionTypes.SET_EDITED_BULLET, payload: bullet }),
  resetState: () => ({ type: ActionTypes.RESET_STATE })
};

/**
 * Load state from localStorage
 * @returns {Object} Saved state or empty object if nothing is saved
 */
const loadStateFromStorage = () => {
  try {
    // Load step from localStorage
    const savedStep = localStorage.getItem(STORAGE_KEYS.RESUME_STEP);
    const step = savedStep ? JSON.parse(savedStep) : initialState.step;
    
    // Load resume data from localStorage
    const savedResumeData = localStorage.getItem(STORAGE_KEYS.RESUME_DATA);
    const resumeData = savedResumeData ? JSON.parse(savedResumeData) : initialState.resumeData;
    
    // Load resume analysis from localStorage
    const savedAnalysis = localStorage.getItem(STORAGE_KEYS.RESUME_ANALYSIS);
    const resumeAnalysis = savedAnalysis ? JSON.parse(savedAnalysis) : initialState.resumeAnalysis;
    
    // Load improvements from localStorage
    const savedImprovements = localStorage.getItem(STORAGE_KEYS.RESUME_IMPROVEMENTS);
    const improvements = savedImprovements ? JSON.parse(savedImprovements) : initialState.improvements;
    
    return {
      ...initialState,
      step,
      resumeData,
      resumeAnalysis,
      improvements,
      // Don't restore selection state to avoid potential errors
      currentJobIndex: null,
      currentBulletIndex: null
    };
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    return initialState;
  }
};

// Provider component
export function ResumeProvider({ children }) {
  // Initialize state from localStorage or use initialState as fallback
  const [state, dispatch] = useReducer(resumeReducer, loadStateFromStorage());
  const resumeService = useResumeService();
  
  // Create bound action dispatchers
  const actions = Object.entries(actionCreators).reduce((acc, [key, actionCreator]) => {
    acc[key] = (...args) => dispatch(actionCreator(...args));
    return acc;
  }, {});

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
      actions.setResumeAnalysis(null);
      actions.setCurrentJobIndex(null);
      actions.setCurrentBulletIndex(null);
      actions.setImprovements({});
      actions.setSavedBullets({});
      
      const result = await resumeService.parseResume(file);
      
      // Handle structured data format
      if (result.parsedData && result.parsedData.bullet_points) {
        actions.setResumeData(result.parsedData);
        actions.setFlatBulletPoints(result.bulletPoints || []);
        
        // Store original bullets
        const originalBulletsMap = {};
        result.parsedData.bullet_points.forEach((job, jobIndex) => {
          job.achievements?.forEach((bullet, bulletIndex) => {
            const bulletId = getBulletId(jobIndex, bulletIndex);
            originalBulletsMap[bulletId] = bullet;
          });
        });
        actions.setOriginalBullets(originalBulletsMap);
        
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
        actions.setFlatBulletPoints(result.bulletPoints);
        
        // Create a structured format from the flat list
        const structuredData = createStructuredDataFromFlatBullets(result.bulletPoints);
        actions.setResumeData(structuredData);
        
        // Store original bullets
        const originalBulletsMap = {};
        structuredData.bullet_points.forEach((job, jobIndex) => {
          job.achievements?.forEach((bullet, bulletIndex) => {
            const bulletId = getBulletId(jobIndex, bulletIndex);
            originalBulletsMap[bulletId] = bullet;
          });
        });
        actions.setOriginalBullets(originalBulletsMap);
      } 
      else {
        resumeService.setErrors(prev => ({ 
          ...prev, 
          parse: "Failed to extract any content from your resume. Please try a different file format." 
        }));
        return false;
      }
      
      actions.setResumeEdited(false);
      
      // Start background analysis
      resumeService.setLoading(prev => ({ ...prev, analyze: true }));
      
      // Use the structured data created earlier or the parsed data
      const structuredData = result.parsedData ? null : createStructuredDataFromFlatBullets(result.bulletPoints || []);
      const dataToAnalyze = result.parsedData || structuredData;
      resumeService.analyzeResume(dataToAnalyze)
        .then(analysis => {
          if (analysis) {
            actions.setResumeAnalysis(analysis);
          }
        })
        .catch(error => {
          console.error("Background analysis error:", error);
        });
      
      actions.setStep(2);
      return true;
    } catch (error) {
      console.error("Error parsing resume:", error);
      resumeService.setErrors(prev => ({ ...prev, parse: error.message || "Failed to parse your resume" }));
      return false;
    }
  }, [resumeService, getBulletId, actions]);

  // Helper function to convert flat bullet points to structured format
  const createStructuredDataFromFlatBullets = (flatBullets) => {
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
  };

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
  const resetStateInternal = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_STATE });
  }, [dispatch]);

  // Function to get resume analysis - with flag to prevent multiple calls
  const getResumeAnalysis = useCallback(async () => {
    // Use loading state to prevent duplicate requests
    if (resumeService.loading.analyze) {
      console.log("Analysis already in progress, skipping duplicate request");
      return;
    }
    
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
  }, [state.resumeAnalysis, state.resumeEdited, state.resumeData, resumeService, dispatch]);

  // Function to handle step navigation
  const handleStepNavigation = useCallback((newStep) => {
    // Check if step should be accessible
    // Exception for step 1 (upload) which should always be accessible
    if (newStep > 1 && state.resumeData.bullet_points.length === 0) {
      // Can't navigate to steps that require resume data
      console.log("Navigation blocked: Resume data required for step", newStep);
      return;
    }

    if (newStep === 2.5 && (!state.resumeAnalysis || state.resumeEdited)) {
      // Trigger analysis when navigating directly to analysis step
      // Only if we don't already have an analysis or if the resume was edited
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

    console.log("Navigating to step:", newStep);
    dispatch({ type: ActionTypes.SET_STEP, payload: newStep });
  }, [state.step, state.resumeData, state.resumeAnalysis, getResumeAnalysis, dispatch]);


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

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      // Save step
      localStorage.setItem(STORAGE_KEYS.RESUME_STEP, JSON.stringify(state.step));
      
      // Save resume data only if we have actual data (bullet points)
      if (state.resumeData.bullet_points.length > 0) {
        localStorage.setItem(STORAGE_KEYS.RESUME_DATA, JSON.stringify(state.resumeData));
      }
      
      // Save resume analysis
      if (state.resumeAnalysis) {
        localStorage.setItem(STORAGE_KEYS.RESUME_ANALYSIS, JSON.stringify(state.resumeAnalysis));
      }
      
      // Save improvements if we have any
      if (Object.keys(state.improvements).length > 0) {
        localStorage.setItem(STORAGE_KEYS.RESUME_IMPROVEMENTS, JSON.stringify(state.improvements));
      }
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }, [state.step, state.resumeData, state.resumeAnalysis, state.improvements]);

  // Clear storage and reset state
  const clearStorageAndResetState = useCallback(() => {
    try {
      // Clear all related localStorage items
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Reset state
      resetStateInternal();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }, [resetStateInternal]);

  // Organize context value into logical sections
  const value = {
    // State values
    ...state,
    
    // Service methods
    ...resumeService,
    
    // Action creators/dispatchers
    ...actions,
    
    // Helper functions
    getBulletId,
    getCurrentBulletId,
    getTotalBulletPoints,
    getCurrentBulletPointNumber,
    
    // Business logic methods
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
    
    // Storage management
    clearStorageAndResetState,
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