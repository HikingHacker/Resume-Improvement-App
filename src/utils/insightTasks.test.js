import { ensureResumeIds } from './resumeIds';
import {
  MAX_INSIGHT_TASKS,
  buildInsightContext,
  buildInsightTasks,
  getBulletInsightChips,
  getGuideForBullet,
} from './insightTasks';

const sampleResume = ensureResumeIds({
  bullet_points: [
    {
      company: 'Acme',
      position: 'Staff Engineer',
      time_period: '2023-2025',
      achievements: [
        'Led platform work',
        'Reduced latency 40%',
      ],
    },
    {
      company: 'OldCo',
      position: 'Intern',
      time_period: '2016',
      achievements: [
        'Helped with intern tasks',
      ],
    },
  ],
}, { generateMissing: true });

const analysis = {
  strengths: ['Recent Staff-level ownership'],
  weaknesses: ['Too many duty statements'],
  areasForImprovement: [
    'Lead with outcome, not collaboration',
    'Name the systems you owned',
  ],
  missingSkills: ['Incident response'],
  atsKeywords: [
    { keyword: 'Kubernetes', present: false, priority: 'High' },
    { keyword: 'platform', present: true, priority: 'High' },
    { keyword: 'excel', present: false, priority: 'Low' },
  ],
};

describe('insightTasks', () => {
  it('maps unquantified bullets to an add-a-metric task', () => {
    const tasks = buildInsightTasks(sampleResume, analysis);
    const metrics = tasks.find((task) => task.source === 'metrics');
    expect(metrics).toBeTruthy();
    expect(metrics.bulletIds).toHaveLength(2);
    expect(metrics.detail).toMatch(/2 of 3/);
  });

  it('maps missing high-priority ATS keywords to bullets that do not already contain them', () => {
    const tasks = buildInsightTasks(sampleResume, analysis);
    const ats = tasks.find((task) => task.source === 'ats');
    expect(ats.keyword).toBe('Kubernetes');
    expect(ats.bulletIds.length).toBeGreaterThan(0);
    expect(tasks.find((task) => task.keyword === 'excel')).toBeUndefined();
    expect(tasks.find((task) => task.keyword === 'platform')).toBeUndefined();
  });

  it('caps the task list and falls back unmatched areas to top unsaved bullets', () => {
    const tasks = buildInsightTasks(sampleResume, analysis);
    expect(tasks.length).toBeLessThanOrEqual(MAX_INSIGHT_TASKS);
    const area = tasks.find((task) => task.source === 'areasForImprovement');
    expect(area.bulletIds.length).toBeGreaterThan(0);
  });

  it('builds a per-bullet guide from matching tasks and remaining weakness', () => {
    const tasks = buildInsightTasks(sampleResume, analysis);
    const firstId = sampleResume.bullet_points[0].achievementIds[0];
    const guide = getGuideForBullet(
      {
        bulletId: firstId,
        text: 'Led platform work',
        reasons: ['Recent role', 'No metric'],
      },
      {
        analysis,
        improvement: {
          remainingWeaknesses: 'Does not say what shipped.',
          followUpQuestions: ['What did you migrate from?'],
        },
        tasks,
      }
    );

    expect(guide.reasons).toEqual(['Recent role', 'No metric']);
    expect(guide.matchingTasks.some((task) => task.source === 'metrics')).toBe(true);
    expect(guide.keywords).toContain('Kubernetes');
    expect(guide.remainingWeakness).toBe('Does not say what shipped.');
    expect(guide.followUp).toBe('What did you migrate from?');
  });

  it('includes matching task titles in rewrite context', () => {
    const context = buildInsightContext({
      matchingTasks: [{ title: 'Add a metric to bullets that only describe duties' }],
      keywords: ['Kubernetes'],
      remainingWeakness: 'Does not say what shipped.',
    });
    expect(context).toContain('Focus this rewrite on: Add a metric');
    expect(context).toContain('Kubernetes');
    expect(context).toContain('Does not say what shipped.');
  });

  it('keeps local bullet chips for missing metrics and remaining weakness', () => {
    expect(getBulletInsightChips('Led platform work', {
      remainingWeaknesses: 'Does not say what shipped.',
    })).toEqual(['Add a metric', 'Does not say what shipped.']);
    expect(getBulletInsightChips('Reduced latency 40%', {
      remainingWeaknesses: 'No specific weaknesses identified.',
    })).toEqual([]);
  });
});
