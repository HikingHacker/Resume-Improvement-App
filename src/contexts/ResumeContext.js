import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import useResumeService from '../services/hooks/useResumeService';
import { PHASES, isValidPhase, migrateSavedStep } from '../constants/workflow';
import {
  addBulletToJob,
  addJobToResume,
  buildOriginalBulletsMap,
  ensureResumeIds,
  getBulletId as getStableBulletId,
  removeBulletFromJob,
  removeJobFromResume,
} from '../utils/resumeIds';
import { analysisContextKey, buildTargetContext, formatRewrittenResumeText, hydrateJobDescriptionFields, listRankedBullets, getTopUnsaved } from '../utils/bulletPriority';
import { buildInsightContext, buildInsightTasks, getGuideForBullet } from '../utils/insightTasks';

const FALLBACK_DETAIL_QUESTIONS = [
  'What changed because of this work (metric, outcome, or decision)?',
  'About how many people, systems, or dollars were involved?',
  'What tools or methods did you actually use?',
];

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
  SET_ANALYSIS_TARGET_KEY: 'SET_ANALYSIS_TARGET_KEY',
  SET_SAVED_BULLETS: 'SET_SAVED_BULLETS',
  SET_ORIGINAL_BULLETS: 'SET_ORIGINAL_BULLETS',
  SET_RESUME_EDITED: 'SET_RESUME_EDITED',
  SET_EDITING_JOB_INDEX: 'SET_EDITING_JOB_INDEX',
  SET_EDITING_JOB: 'SET_EDITING_JOB',
  SET_EDITING_BULLET_INFO: 'SET_EDITING_BULLET_INFO',
  SET_EDITED_BULLET: 'SET_EDITED_BULLET',
  SET_RESUMABLE_PHASE: 'SET_RESUMABLE_PHASE',
  SET_TARGET_ROLE: 'SET_TARGET_ROLE',
  SET_JOB_DESCRIPTIONS: 'SET_JOB_DESCRIPTIONS',
  SET_SKIPPED_BULLETS: 'SET_SKIPPED_BULLETS',
  START_REQUEST: 'START_REQUEST',
  COMPLETE_REQUEST: 'COMPLETE_REQUEST',
  RESET_STATE: 'RESET_STATE',
};

// Initial state with logical grouping of related state items
const initialState = {
  // UI navigation state
  step: PHASES.UPLOAD,
  resumablePhase: null,

  // Resume content state
  resumeData: { bullet_points: [] },
  flatBulletPoints: [],
  resumeAnalysis: null,
  analysisTargetKey: null,
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
  skippedBullets: {},
  targetRole: '',
  jobDescriptions: [''],

  // Request tracking state for deduplication
  inProgressRequests: {}, // Track in-progress requests to handle StrictMode double invocation

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
    case ActionTypes.SET_ANALYSIS_TARGET_KEY:
      return { ...state, analysisTargetKey: payload };
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
    case ActionTypes.SET_SKIPPED_BULLETS:
      return { ...state, skippedBullets: payload };
    case ActionTypes.SET_TARGET_ROLE:
      return { ...state, targetRole: payload };
    case ActionTypes.SET_JOB_DESCRIPTIONS:
      return { ...state, jobDescriptions: payload };

    // Request tracking actions
    case ActionTypes.START_REQUEST:
      return {
        ...state,
        inProgressRequests: {
          ...state.inProgressRequests,
          [payload.requestId]: {
            timestamp: Date.now(),
            promise: payload.promise
          }
        }
      };
    case ActionTypes.COMPLETE_REQUEST:
      const updatedRequests = { ...state.inProgressRequests };
      delete updatedRequests[payload.requestId];
      return {
        ...state,
        inProgressRequests: updatedRequests
      };

    // Editing actions
    case ActionTypes.SET_EDITING_JOB_INDEX:
      return { ...state, editingJobIndex: payload };
    case ActionTypes.SET_EDITING_JOB:
      return { ...state, editingJob: payload };
    case ActionTypes.SET_EDITING_BULLET_INFO:
      return { ...state, editingBulletInfo: payload };
    case ActionTypes.SET_EDITED_BULLET:
      return { ...state, editedBullet: payload };
    case ActionTypes.SET_RESUMABLE_PHASE:
      return { ...state, resumablePhase: payload };

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
  RESUME_IMPROVEMENTS: 'resume-improvement-app-improvements',
  RESUME_TARGET: 'resume-improvement-app-target',
  RESUME_PROGRESS: 'resume-improvement-app-progress',
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
  setAnalysisTargetKey: (key) => ({ type: ActionTypes.SET_ANALYSIS_TARGET_KEY, payload: key }),
  setSavedBullets: (bullets) => ({ type: ActionTypes.SET_SAVED_BULLETS, payload: bullets }),
  setOriginalBullets: (bullets) => ({ type: ActionTypes.SET_ORIGINAL_BULLETS, payload: bullets }),
  setSkippedBullets: (bullets) => ({ type: ActionTypes.SET_SKIPPED_BULLETS, payload: bullets }),
  setTargetRole: (role) => ({ type: ActionTypes.SET_TARGET_ROLE, payload: role }),
  setJobDescriptions: (descriptions) => ({ type: ActionTypes.SET_JOB_DESCRIPTIONS, payload: descriptions }),
  setResumeEdited: (edited) => ({ type: ActionTypes.SET_RESUME_EDITED, payload: edited }),
  startRequest: (requestId, promise) => ({
    type: ActionTypes.START_REQUEST,
    payload: { requestId, promise }
  }),
  completeRequest: (requestId) => ({
    type: ActionTypes.COMPLETE_REQUEST,
    payload: { requestId }
  }),
  setEditingJobIndex: (index) => ({ type: ActionTypes.SET_EDITING_JOB_INDEX, payload: index }),
  setEditingJob: (job) => ({ type: ActionTypes.SET_EDITING_JOB, payload: job }),
  setEditingBulletInfo: (info) => ({ type: ActionTypes.SET_EDITING_BULLET_INFO, payload: info }),
  setEditedBullet: (bullet) => ({ type: ActionTypes.SET_EDITED_BULLET, payload: bullet }),
  setResumablePhase: (phase) => ({ type: ActionTypes.SET_RESUMABLE_PHASE, payload: phase }),
  resetState: () => ({ type: ActionTypes.RESET_STATE })
};

/**
 * Load state from localStorage
 * @returns {Object} Saved state or empty object if nothing is saved
 */
const loadStateFromStorage = () => {
  try {
    const savedStep = localStorage.getItem(STORAGE_KEYS.RESUME_STEP);
    const parsedStep = savedStep ? JSON.parse(savedStep) : null;

    const savedResumeData = localStorage.getItem(STORAGE_KEYS.RESUME_DATA);
    const parsedResumeData = savedResumeData ? JSON.parse(savedResumeData) : initialState.resumeData;
    const resumeData = ensureResumeIds(parsedResumeData, { generateMissing: false });

    const savedAnalysis = localStorage.getItem(STORAGE_KEYS.RESUME_ANALYSIS);
    const resumeAnalysis = savedAnalysis ? JSON.parse(savedAnalysis) : initialState.resumeAnalysis;

    const savedImprovements = localStorage.getItem(STORAGE_KEYS.RESUME_IMPROVEMENTS);
    const improvements = savedImprovements ? JSON.parse(savedImprovements) : initialState.improvements;

    const savedTarget = localStorage.getItem(STORAGE_KEYS.RESUME_TARGET);
    const target = savedTarget ? JSON.parse(savedTarget) : {};

    const savedProgress = localStorage.getItem(STORAGE_KEYS.RESUME_PROGRESS);
    const progress = savedProgress ? JSON.parse(savedProgress) : {};

    const hasData = resumeData?.bullet_points?.length > 0;
    const migratedPhase = migrateSavedStep(parsedStep, hasData);
    const resumablePhase = hasData
      ? (migratedPhase === PHASES.UPLOAD ? PHASES.CONFIRM : migratedPhase)
      : null;

    return {
      ...initialState,
      // Always land on upload so returning users choose continue vs start over
      step: PHASES.UPLOAD,
      resumablePhase,
      resumeData,
      resumeAnalysis,
      improvements,
      targetRole: target.targetRole || '',
      jobDescriptions: hydrateJobDescriptionFields(target),
      analysisTargetKey: target.analysisTargetKey || null,
      savedBullets: progress.savedBullets || {},
      skippedBullets: progress.skippedBullets || {},
      originalBullets: progress.originalBullets || {},
      currentJobIndex: null,
      currentBulletIndex: null,
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
    const job = state.resumeData.bullet_points[jobIndex];
    return getStableBulletId(job, jobIndex, bulletIndex);
  }, [state.resumeData]);

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
      actions.setAnalysisTargetKey(null);
      actions.setCurrentJobIndex(null);
      actions.setCurrentBulletIndex(null);
        actions.setImprovements({});
        actions.setSavedBullets({});
        actions.setSkippedBullets({});
        actions.setOriginalBullets({});

      const result = await resumeService.parseResume(file);

      // Handle structured data format
        if (result.parsedData && result.parsedData.bullet_points) {
          const structuredData = ensureResumeIds(result.parsedData, { generateMissing: true });
          actions.setResumeData(structuredData);
          actions.setFlatBulletPoints(result.bulletPoints || []);
          actions.setOriginalBullets(buildOriginalBulletsMap(structuredData));

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
          const structuredData = ensureResumeIds(
            createStructuredDataFromFlatBullets(result.bulletPoints),
            { generateMissing: true }
          );
          actions.setResumeData(structuredData);
          actions.setOriginalBullets(buildOriginalBulletsMap(structuredData));
      }
      else {
        resumeService.setErrors(prev => ({
          ...prev,
          parse: "Failed to extract any content from your resume. Please try a different file format."
        }));
        return false;
      }

      actions.setResumeEdited(false);
      actions.setResumablePhase(null);

      actions.setStep(PHASES.CONFIRM);
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
      if (bullet.startsWith("POSITION:") || bullet.includes(" at")) {
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

  // Helper function to create a shared promise for deduplication
  const createSharedBulletPromise = useCallback(async (bulletId, promiseFn) => {
    // Check if we already have an in-progress request for this bullet
    if (state.inProgressRequests[bulletId]) {
      console.log(`Reusing in-progress request for bullet ${bulletId}`);
      return state.inProgressRequests[bulletId].promise;
    }

    // Create a new promise that will wrap our underlying API promise
    // This allows us to properly handle both successful and error cases
    const wrappedPromise = new Promise((resolve, reject) => {
      // Execute the actual async operation
      const originalPromise = promiseFn();

      originalPromise
        .then(result => {
          console.log(`Request for bullet ${bulletId} completed successfully`);
          resolve(result);
        })
        .catch(error => {
          console.error(`Request for bullet ${bulletId} failed:`, error);
          reject(error);
        })
        .finally(() => {
          // Always clean up the request from tracking
          dispatch(actionCreators.completeRequest(bulletId));
        });
    });

    // Store the wrapped promise in state for deduplication
    dispatch(actionCreators.startRequest(bulletId, wrappedPromise));

    return wrappedPromise;
  }, [state.inProgressRequests, dispatch]);

  const buildRewriteContext = useCallback((bulletId, currentJob, extraUserContext = '') => {
    const jobContext = `This is for a ${currentJob.position} role at ${currentJob.company} during ${currentJob.time_period || 'unknown time period'}.`;
    const userContext = extraUserContext || Object.values(state.additionalContexts[bulletId] || {}).join(' ');
    const targetContext = buildTargetContext(state.targetRole, state.jobDescriptions);
    const bulletText = currentJob?.achievements?.[state.currentBulletIndex] || '';
    const ranked = listRankedBullets(state.resumeData, {
      targetRole: state.targetRole,
      jobDescriptions: state.jobDescriptions,
    });
    const rankedBullet = ranked.find((item) => item.bulletId === bulletId);
    const tasks = buildInsightTasks(state.resumeData, state.resumeAnalysis, {
      targetRole: state.targetRole,
      jobDescriptions: state.jobDescriptions,
      savedBullets: state.savedBullets,
      skippedBullets: state.skippedBullets,
    });
    const insightContext = buildInsightContext(getGuideForBullet(
      { bulletId, text: bulletText, reasons: rankedBullet?.reasons || [] },
      {
        analysis: state.resumeAnalysis,
        improvement: state.improvements[bulletId],
        tasks,
      }
    ));
    return [jobContext && `Job:\n${jobContext}`, targetContext && `Target:\n${targetContext}`, insightContext && `Gaps to address:\n${insightContext}`, userContext && `User-provided facts:\n${userContext}`].filter(Boolean).join('\n\n');
  }, [
    state.additionalContexts,
    state.currentBulletIndex,
    state.improvements,
    state.jobDescriptions,
    state.resumeAnalysis,
    state.resumeData,
    state.savedBullets,
    state.skippedBullets,
    state.targetRole,
  ]);

  // Function to get bullet point improvements
  const handleBulletPointImprovement = useCallback(async (customRequestId = null) => {
    const currentBulletId = getCurrentBulletId();
    if (!currentBulletId) return null;

    // Generate a request ID - use custom ID if provided (for new variations)
    // Otherwise use the bulletId for standard improvements
    const requestId = customRequestId || currentBulletId;

    // For standard requests (not variations/context submissions):
    // Check if we already have data for this bullet point
    if (!customRequestId) {
      const existingImprovement = state.improvements[currentBulletId];
      if (existingImprovement && existingImprovement.improvedBulletPoint) {
        console.log(`Using existing improvement data for bullet ${currentBulletId}`);
        return existingImprovement;
      }
    }

    // Check if this exact request is already being processed (StrictMode protection)
    if (state.inProgressRequests[requestId]) {
      console.log(`Request ${requestId} already in progress, reusing request`);
      return state.inProgressRequests[requestId].promise;
    }

    // Extract data needed for the request outside the promise function
    const currentJob = state.resumeData.bullet_points[state.currentJobIndex];
    const currentBullet = currentJob.achievements[state.currentBulletIndex];
    const contextToSend = buildRewriteContext(currentBulletId, currentJob);

    // Log what type of request this is
    if (customRequestId) {
      if (customRequestId.includes('variation')) {
        console.log(`Generating new variation for bullet ${currentBulletId} with request ID ${customRequestId}`);
      } else if (customRequestId.includes('context')) {
        console.log(`Submitting additional context for bullet ${currentBulletId} with request ID ${customRequestId}`);
      } else {
        console.log(`Custom request for bullet ${currentBulletId} with ID ${customRequestId}`);
      }
    } else {
      console.log(`Standard improvement request for bullet ${currentBulletId}`);
    }

    // Create the shared promise using the appropriate request ID
    return createSharedBulletPromise(requestId, async () => {
      try {
        console.log(`Starting improvement request for bullet ${currentBulletId}`);

        // Pass the bulletId for bullet-specific loading state tracking
        const suggestions = await resumeService.getAISuggestions(
          currentBullet,
          contextToSend,
          currentBulletId // Pass the bulletId for service-level deduplication
        );

        if (suggestions) {
          const existing = state.improvements[currentBulletId];
          const improvement = existing?.followUpQuestions?.length
            ? { ...suggestions, followUpQuestions: existing.followUpQuestions }
            : suggestions;
          dispatch({
            type: ActionTypes.UPDATE_IMPROVEMENT,
            payload: { bulletId: currentBulletId, improvement }
          });

          return suggestions;
        }
        return null;
      } catch (error) {
        console.error(`Error getting AI suggestions for bullet ${currentBulletId}:`, error);
        return null;
      }
    });
  }, [
    state.resumeData,
    state.currentJobIndex,
    state.currentBulletIndex,
    state.additionalContexts,
    state.improvements,
    state.inProgressRequests,
    state.targetRole,
    state.jobDescriptions,
    resumeService,
    getCurrentBulletId,
    createSharedBulletPromise,
    buildRewriteContext,
  ]);

  const handleBulletDetails = useCallback(async () => {
    const currentBulletId = getCurrentBulletId();
    if (!currentBulletId) return null;

    const requestId = `${currentBulletId}-details`;
    if (state.inProgressRequests[requestId]) {
      return state.inProgressRequests[requestId].promise;
    }

    const currentJob = state.resumeData.bullet_points[state.currentJobIndex];
    const currentBullet = currentJob.achievements[state.currentBulletIndex];
    const contextToSend = buildRewriteContext(currentBulletId, currentJob);

    return createSharedBulletPromise(requestId, async () => {
      const applyQuestions = (questions, remainingWeaknesses = '') => {
        const followUpQuestions = questions.length ? questions : FALLBACK_DETAIL_QUESTIONS;
        dispatch({
          type: ActionTypes.UPDATE_IMPROVEMENT,
          payload: {
            bulletId: currentBulletId,
            improvement: {
              followUpQuestions,
              remainingWeaknesses,
              detailsRequested: true,
            },
          },
        });
        dispatch({
          type: ActionTypes.SET_SHOW_FOLLOW_UP,
          payload: { ...state.showFollowUpForBullets, [currentBulletId]: true },
        });
        return followUpQuestions;
      };

      try {
        const result = await resumeService.getAISuggestions(
          currentBullet,
          contextToSend,
          `${currentBulletId}-details`,
          { task: 'details' }
        );
        const questions = Array.isArray(result?.followUpQuestions)
          ? result.followUpQuestions.map((question) => String(question || '').trim()).filter(Boolean)
          : [];
        return applyQuestions(questions, result?.remainingWeaknesses || '');
      } catch (error) {
        console.error(`Error getting follow-up questions for bullet ${currentBulletId}:`, error);
        return applyQuestions(FALLBACK_DETAIL_QUESTIONS);
      }
    });
  }, [
    state.resumeData,
    state.currentJobIndex,
    state.currentBulletIndex,
    state.showFollowUpForBullets,
    state.inProgressRequests,
    state.targetRole,
    state.jobDescriptions,
    resumeService,
    getCurrentBulletId,
    createSharedBulletPromise,
    buildRewriteContext,
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

    // Generate a unique request ID for this context submission
    // This allows multiple context submissions for the same bullet
    const contextRequestId = `${bulletId}-context-${Date.now()}`;

    // Check if this bullet is already being processed (StrictMode protection)
    if (state.inProgressRequests[contextRequestId]) {
      console.log(`Context submission already in progress for ${contextRequestId}, reusing request`);
      return state.inProgressRequests[contextRequestId].promise;
    }

    // Extract data needed for the request outside the promise function
    const currentJob = state.resumeData.bullet_points[state.currentJobIndex];
    const currentBullet = currentJob.achievements[state.currentBulletIndex];
    const contextToSend = buildRewriteContext(
      bulletId,
      currentJob,
      Object.values(state.additionalContexts[bulletId] || {}).join(' ')
    );

    // Create the shared promise for this context submission
    return createSharedBulletPromise(contextRequestId, async () => {
      try {
        console.log(`Starting context submission for bullet ${bulletId}`);

        // Pass the bulletId for bullet-specific loading state tracking
        const newSuggestions = await resumeService.getAISuggestions(
          currentBullet,
          contextToSend,
          bulletId // Pass the bulletId for service-level deduplication
        );

        if (newSuggestions) {
          const existing = state.improvements[bulletId];
          const improvement = existing?.followUpQuestions?.length
            ? { ...newSuggestions, followUpQuestions: existing.followUpQuestions }
            : newSuggestions;
          dispatch({
            type: ActionTypes.UPDATE_IMPROVEMENT,
            payload: { bulletId, improvement }
          });
          return newSuggestions;
        }
        return null;
      } catch (error) {
        console.error(`Error getting updated AI suggestions for bullet ${bulletId}:`, error);
        return null;
      }
    });
  }, [
    state.resumeData,
    state.currentJobIndex,
    state.currentBulletIndex,
    state.additionalContexts,
    state.improvements,
    state.inProgressRequests,
    state.targetRole,
    state.jobDescriptions,
    resumeService,
    getCurrentBulletId,
    createSharedBulletPromise,
    buildRewriteContext,
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
        dispatch({ type: ActionTypes.SET_STEP, payload: PHASES.REVIEW });
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
    const targetKey = analysisContextKey(state.targetRole, state.jobDescriptions);
    if (resumeService.loading.analyze && state.analysisTargetKey === targetKey) {
      console.log("Analysis already in progress, skipping duplicate request");
      return;
    }

    if (state.resumeAnalysis && !state.resumeEdited && state.analysisTargetKey === targetKey) {
      return;
    }

    try {
      const analysis = await resumeService.analyzeResume(state.resumeData, {
        targetRole: state.targetRole,
        jobDescriptions: state.jobDescriptions,
      });
      if (analysis) {
        dispatch({ type: ActionTypes.SET_RESUME_ANALYSIS, payload: analysis });
        dispatch({ type: ActionTypes.SET_ANALYSIS_TARGET_KEY, payload: targetKey });

        if (state.resumeEdited) {
          dispatch({ type: ActionTypes.SET_RESUME_EDITED, payload: false });
        }
      }
    } catch (error) {
      console.error("Error getting resume analysis:", error);
    }
  }, [state.resumeAnalysis, state.resumeEdited, state.resumeData, state.targetRole, state.jobDescriptions, state.analysisTargetKey, resumeService, dispatch]);

  const selectFirstBullet = useCallback(() => {
    const ranked = listRankedBullets(state.resumeData, {
      targetRole: state.targetRole,
      jobDescriptions: state.jobDescriptions,
    });
    const top = getTopUnsaved(ranked, state.savedBullets, state.skippedBullets, 1)[0] || ranked[0];
    if (top) {
      dispatch({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: top.jobIndex });
      dispatch({ type: ActionTypes.SET_CURRENT_BULLET_INDEX, payload: top.bulletIndex });
    }
  }, [state.resumeData, state.targetRole, state.jobDescriptions, state.savedBullets, state.skippedBullets, dispatch]);

  const selectLastBullet = useCallback(() => {
      const jobs = state.resumeData.bullet_points;
    if (jobs.length === 0) return;
        const lastJobIndex = jobs.length - 1;
        const lastJob = jobs[lastJobIndex];
        if (lastJob && lastJob.achievements) {
          dispatch({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: lastJobIndex });
          dispatch({
            type: ActionTypes.SET_CURRENT_BULLET_INDEX,
        payload: Math.max(0, lastJob.achievements.length - 1),
      });
    }
  }, [state.resumeData, dispatch]);

  const selectBullet = useCallback((jobIndex, bulletIndex) => {
    dispatch({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: jobIndex });
    dispatch({ type: ActionTypes.SET_CURRENT_BULLET_INDEX, payload: bulletIndex });
  }, [dispatch]);

  // Function to handle step navigation
  const handleStepNavigation = useCallback((newStep, selection = null) => {
    if (!isValidPhase(newStep)) {
      return;
    }

    if (newStep !== PHASES.UPLOAD && state.resumeData.bullet_points.length === 0) {
      return;
    }

    if (newStep === PHASES.IMPROVE) {
      if (selection?.first) {
        selectFirstBullet();
      } else if (selection && selection.jobIndex != null && selection.bulletIndex != null) {
        dispatch({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: selection.jobIndex });
        dispatch({ type: ActionTypes.SET_CURRENT_BULLET_INDEX, payload: selection.bulletIndex });
      } else if (state.step === PHASES.REVIEW) {
        if (state.currentJobIndex === null || state.currentBulletIndex === null) {
          selectLastBullet();
        }
      } else if (state.currentJobIndex === null || state.currentBulletIndex === null) {
        selectFirstBullet();
      }
    }

    dispatch({ type: ActionTypes.SET_STEP, payload: newStep });
  }, [state.step, state.resumeData, state.currentJobIndex, state.currentBulletIndex, selectFirstBullet, selectLastBullet, dispatch]);


  const handleNavigation = useCallback((direction) => {
    if (direction === 'back') {
      if (state.step === PHASES.REVIEW) {
        selectLastBullet();
        dispatch({ type: ActionTypes.SET_STEP, payload: PHASES.IMPROVE });
        return;
      }
      if (state.step === PHASES.IMPROVE) {
        dispatch({ type: ActionTypes.SET_STEP, payload: PHASES.INSIGHTS });
        return;
      }
      if (state.step === PHASES.INSIGHTS) {
        dispatch({ type: ActionTypes.SET_STEP, payload: PHASES.TARGET });
        return;
      }
      if (state.step === PHASES.TARGET) {
        dispatch({ type: ActionTypes.SET_STEP, payload: PHASES.CONFIRM });
        return;
      }
      if (state.step === PHASES.CONFIRM) {
        dispatch({ type: ActionTypes.SET_STEP, payload: PHASES.UPLOAD });
      }
    } else if (direction === 'forward') {
      if (state.step === PHASES.IMPROVE) {
        if (state.currentJobIndex === null || state.currentBulletIndex === null) {
          selectFirstBullet();
        } else {
          navigateBulletPoints('next');
        }
        return;
      }
      if (state.step === PHASES.UPLOAD) {
        handleStepNavigation(PHASES.CONFIRM);
        return;
      }
      if (state.step === PHASES.CONFIRM) {
        handleStepNavigation(PHASES.TARGET);
        return;
      }
      if (state.step === PHASES.TARGET) {
        handleStepNavigation(PHASES.INSIGHTS);
        return;
      }
      if (state.step === PHASES.INSIGHTS) {
        handleStepNavigation(PHASES.IMPROVE);
      }
    }
  }, [state.step, state.currentJobIndex, state.currentBulletIndex, navigateBulletPoints, selectFirstBullet, selectLastBullet, handleStepNavigation]);

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

    const updatedJobs = [...state.resumeData.bullet_points];
    updatedJobs[state.currentJobIndex].achievements[state.currentBulletIndex] = improvedText;

    dispatch({
      type: ActionTypes.SET_RESUME_DATA,
      payload: { ...state.resumeData, bullet_points: updatedJobs }
    });

    dispatch({
      type: ActionTypes.SET_SAVED_BULLETS,
      payload: { ...state.savedBullets, [bulletId]: true }
    });

    if (state.skippedBullets[bulletId]) {
      const nextSkipped = { ...state.skippedBullets };
      delete nextSkipped[bulletId];
      dispatch({ type: ActionTypes.SET_SKIPPED_BULLETS, payload: nextSkipped });
    }

    return true;
  }, [state.resumeData, state.currentJobIndex, state.currentBulletIndex, state.savedBullets, state.skippedBullets]);

  const skipBullet = useCallback((bulletId) => {
    if (!bulletId) return;
    dispatch({
      type: ActionTypes.SET_SKIPPED_BULLETS,
      payload: { ...state.skippedBullets, [bulletId]: true },
    });
  }, [state.skippedBullets]);

  const skipRestOfRole = useCallback(() => {
    const job = state.resumeData.bullet_points[state.currentJobIndex];
    if (!job) return;
    const nextSkipped = { ...state.skippedBullets };
    (job.achievements || []).forEach((_, bulletIndex) => {
      if (bulletIndex >= (state.currentBulletIndex || 0)) {
        const bulletId = getBulletId(state.currentJobIndex, bulletIndex);
        if (!state.savedBullets[bulletId]) {
          nextSkipped[bulletId] = true;
        }
      }
    });
    dispatch({ type: ActionTypes.SET_SKIPPED_BULLETS, payload: nextSkipped });

    const jobs = state.resumeData.bullet_points;
    if (state.currentJobIndex < jobs.length - 1) {
      dispatch({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: state.currentJobIndex + 1 });
      dispatch({ type: ActionTypes.SET_CURRENT_BULLET_INDEX, payload: 0 });
    } else {
      dispatch({ type: ActionTypes.SET_STEP, payload: PHASES.REVIEW });
    }
  }, [state.resumeData, state.currentJobIndex, state.currentBulletIndex, state.skippedBullets, state.savedBullets, getBulletId]);

  const applyResumeEdit = useCallback((nextData, extraOriginals = {}) => {
    dispatch({
      type: ActionTypes.SET_RESUME_DATA,
      payload: nextData,
    });
    if (Object.keys(extraOriginals).length > 0) {
      dispatch({
        type: ActionTypes.SET_ORIGINAL_BULLETS,
        payload: { ...state.originalBullets, ...extraOriginals },
      });
    }
    dispatch({ type: ActionTypes.SET_RESUME_EDITED, payload: true });
  }, [state.originalBullets]);

  const addJob = useCallback(() => {
    const nextData = addJobToResume(state.resumeData);
    const newJob = nextData.bullet_points[nextData.bullet_points.length - 1];
    const extra = {};
    newJob.achievementIds.forEach((id, index) => {
      extra[id] = newJob.achievements[index] || '';
    });
    applyResumeEdit(nextData, extra);
  }, [state.resumeData, applyResumeEdit]);

  const addBullet = useCallback((jobIndex) => {
    const nextData = addBulletToJob(state.resumeData, jobIndex);
    const job = nextData.bullet_points[jobIndex];
    const lastIndex = job.achievements.length - 1;
    const bulletId = getStableBulletId(job, jobIndex, lastIndex);
    applyResumeEdit(nextData, { [bulletId]: job.achievements[lastIndex] || '' });
  }, [state.resumeData, applyResumeEdit]);

  const removeBullet = useCallback((jobIndex, bulletIndex) => {
    applyResumeEdit(removeBulletFromJob(state.resumeData, jobIndex, bulletIndex));
    if (state.currentJobIndex === jobIndex && state.currentBulletIndex === bulletIndex) {
      dispatch({ type: ActionTypes.SET_CURRENT_BULLET_INDEX, payload: Math.max(0, bulletIndex - 1) });
    }
  }, [state.resumeData, applyResumeEdit, state.currentJobIndex, state.currentBulletIndex]);

  const removeJob = useCallback((jobIndex) => {
    applyResumeEdit(removeJobFromResume(state.resumeData, jobIndex));
    if (state.currentJobIndex === jobIndex) {
      dispatch({ type: ActionTypes.SET_CURRENT_JOB_INDEX, payload: null });
      dispatch({ type: ActionTypes.SET_CURRENT_BULLET_INDEX, payload: null });
    }
  }, [state.resumeData, applyResumeEdit, state.currentJobIndex]);

  const getRewrittenResumeText = useCallback(() => {
    return formatRewrittenResumeText(state.resumeData, state.improvements);
  }, [state.resumeData, state.improvements]);

  const copyRewrittenBullets = useCallback(async () => {
    const text = getRewrittenResumeText();
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Error copying rewritten bullets:', error);
      return false;
    }
  }, [getRewrittenResumeText]);

  const downloadRewrittenAsText = useCallback(() => {
    const text = getRewrittenResumeText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resume-rewrite-pack.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }, [getRewrittenResumeText]);

  const handleExportResume = useCallback(async () => {
    return downloadRewrittenAsText();
  }, [downloadRewrittenAsText]);

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

  // Clean up stale in-progress requests
  useEffect(() => {
    // Set up a periodic cleanup timer
    const cleanupTimer = setInterval(() => {
      const now = Date.now();
      const MAX_REQUEST_AGE = 30000; // 30 seconds
      let hasStaleRequests = false;

      // Check for stale requests
      Object.entries(state.inProgressRequests).forEach(([requestId, requestInfo]) => {
        const age = now - requestInfo.timestamp;
        if (age > MAX_REQUEST_AGE) {
          console.log(`Cleaning up stale request: ${requestId} (${age}ms old)`);
          hasStaleRequests = true;
          dispatch(actionCreators.completeRequest(requestId));
        }
      });

      // Only log if we actually cleaned something
      if (hasStaleRequests) {
        console.log("Cleaned up stale requests");
      }
    }, 10000); // Run every 10 seconds

    // Clean up timer on unmount
    return () => clearInterval(cleanupTimer);
  }, [state.inProgressRequests, dispatch]);

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

      localStorage.setItem(STORAGE_KEYS.RESUME_TARGET, JSON.stringify({
        targetRole: state.targetRole,
        jobDescriptions: state.jobDescriptions,
        analysisTargetKey: state.analysisTargetKey,
      }));

      localStorage.setItem(STORAGE_KEYS.RESUME_PROGRESS, JSON.stringify({
        savedBullets: state.savedBullets,
        skippedBullets: state.skippedBullets,
        originalBullets: state.originalBullets,
      }));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }, [state.step, state.resumeData, state.resumeAnalysis, state.analysisTargetKey, state.improvements, state.targetRole, state.jobDescriptions, state.savedBullets, state.skippedBullets, state.originalBullets]);

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
    handleBulletDetails,
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
    skipBullet,
    skipRestOfRole,
    addJob,
    addBullet,
    removeBullet,
    removeJob,
    handleExportResume,
    getRewrittenResumeText,
    copyRewrittenBullets,
    downloadRewrittenAsText,
    selectBullet,
    selectFirstBullet,
    selectLastBullet,

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