export const PHASES = Object.freeze({
  UPLOAD: 'upload',
  CONFIRM: 'confirm',
  TARGET: 'target',
  INSIGHTS: 'insights',
  IMPROVE: 'improve',
  REVIEW: 'review',
});

export const PHASE_ORDER = Object.freeze([
  PHASES.UPLOAD,
  PHASES.CONFIRM,
  PHASES.TARGET,
  PHASES.INSIGHTS,
  PHASES.IMPROVE,
  PHASES.REVIEW,
]);

export const PHASE_LABELS = Object.freeze({
  [PHASES.UPLOAD]: 'Upload',
  [PHASES.CONFIRM]: 'Confirm',
  [PHASES.TARGET]: 'Target',
  [PHASES.INSIGHTS]: 'Insights',
  [PHASES.IMPROVE]: 'Improve',
  [PHASES.REVIEW]: 'Review',
});

export const getPhaseIndex = (phase) => PHASE_ORDER.indexOf(phase);

export const getPreviousPhase = (phase) => {
  const index = getPhaseIndex(phase);
  return index > 0 ? PHASE_ORDER[index - 1] : null;
};

export const getNextPhase = (phase) => {
  const index = getPhaseIndex(phase);
  return index >= 0 && index < PHASE_ORDER.length - 1 ? PHASE_ORDER[index + 1] : null;
};

export const isValidPhase = (phase) => PHASE_ORDER.includes(phase);

/**
 * Map a persisted step (legacy numbers or current phase strings) to a phase ID.
 */
export const migrateSavedStep = (savedStep, hasResumeData) => {
  if (!hasResumeData) {
    return PHASES.UPLOAD;
  }

  if (isValidPhase(savedStep)) {
    return savedStep;
  }

  if (savedStep === 0 || savedStep === 1) {
    return PHASES.UPLOAD;
  }
  if (savedStep === 2) {
    return PHASES.CONFIRM;
  }
  if (savedStep === 2.5 || savedStep === 3) {
    return PHASES.IMPROVE;
  }
  if (savedStep === 3.5 || savedStep === 3.75 || savedStep === 4) {
    return PHASES.REVIEW;
  }

  return PHASES.CONFIRM;
};
