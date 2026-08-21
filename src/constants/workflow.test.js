import {
  PHASES,
  PHASE_LABELS,
  PHASE_ORDER,
  getNextPhase,
  getPreviousPhase,
  isValidPhase,
  migrateSavedStep,
} from './workflow';

describe('workflow', () => {
  it('orders Target after Confirm and Insights after Target', () => {
    expect(PHASE_ORDER).toEqual([
      PHASES.UPLOAD,
      PHASES.CONFIRM,
      PHASES.TARGET,
      PHASES.INSIGHTS,
      PHASES.IMPROVE,
      PHASES.REVIEW,
    ]);
    expect(PHASE_LABELS[PHASES.TARGET]).toBe('Target');
    expect(getNextPhase(PHASES.CONFIRM)).toBe(PHASES.TARGET);
    expect(getPreviousPhase(PHASES.INSIGHTS)).toBe(PHASES.TARGET);
    expect(getNextPhase(PHASES.TARGET)).toBe(PHASES.INSIGHTS);
    expect(getPreviousPhase(PHASES.TARGET)).toBe(PHASES.CONFIRM);
    expect(getNextPhase(PHASES.INSIGHTS)).toBe(PHASES.IMPROVE);
    expect(getPreviousPhase(PHASES.IMPROVE)).toBe(PHASES.INSIGHTS);
  });

  it('migrates legacy numeric steps and keeps known phase strings', () => {
    expect(migrateSavedStep(null, false)).toBe(PHASES.UPLOAD);
    expect(migrateSavedStep(PHASES.INSIGHTS, true)).toBe(PHASES.INSIGHTS);
    expect(migrateSavedStep(PHASES.TARGET, true)).toBe(PHASES.TARGET);
    expect(migrateSavedStep(PHASES.CONFIRM, true)).toBe(PHASES.CONFIRM);
    expect(migrateSavedStep(2, true)).toBe(PHASES.CONFIRM);
    expect(migrateSavedStep(3, true)).toBe(PHASES.IMPROVE);
    expect(migrateSavedStep(4, true)).toBe(PHASES.REVIEW);
    expect(isValidPhase('target')).toBe(true);
    expect(isValidPhase('insights')).toBe(true);
    expect(isValidPhase('analysis')).toBe(false);
  });
});
