import {
  getTopUnsaved,
  listRankedBullets,
  formatRewrittenResumeText,
  rankBullet,
  buildTargetContext,
  analysisContextKey,
  hydrateJobDescriptionFields,
  normalizeJobDescriptions,
} from './bulletPriority';
import { ensureResumeIds } from './resumeIds';

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

describe('bulletPriority', () => {
  it('ranks recent bullets without metrics above older quantified ones', () => {
    const ranked = listRankedBullets(sampleResume, {
      targetRole: 'Staff Engineer',
      jobDescription: 'platform latency reliability',
    });

    expect(ranked[0].text).toBe('Led platform work');
    expect(ranked[0].reasons).toEqual(expect.arrayContaining(['Recent role', 'No metric']));
  });

  it('boosts bullets that overlap the target job description', () => {
    const result = rankBullet(
      { jobIndex: 2, bulletIndex: 0, bulletId: 'x', text: 'Built a latency platform for reliability' },
      { targetRole: 'Staff Engineer', jobDescription: 'platform latency reliability' }
    );
    expect(result.reasons).toContain('Matches target role');
    expect(result.score).toBeGreaterThan(0);
  });

  it('returns the top unsaved bullets', () => {
    const ranked = listRankedBullets(sampleResume);
    const top = getTopUnsaved(ranked, { [ranked[0].bulletId]: true }, {}, 6);
    expect(top).toHaveLength(2);
    expect(top.find((item) => item.bulletId === ranked[0].bulletId)).toBeUndefined();
  });

  it('formats export text without a POSITION prefix', () => {
    const text = formatRewrittenResumeText(sampleResume, {
      [sampleResume.bullet_points[0].achievementIds[0]]: {
        improvedBulletPoint: 'Owned the platform, cutting [X%] latency',
      },
    });

    expect(text).not.toMatch(/POSITION:/);
    expect(text).toContain('Staff Engineer · Acme (2023-2025)');
    expect(text).toContain('• Owned the platform, cutting [X%] latency');
    expect(text).toContain('• Reduced latency 40%');
  });

  it('normalizes stored job descriptions from a legacy string or array', () => {
    expect(normalizeJobDescriptions('  One posting  ')).toEqual(['One posting']);
    expect(normalizeJobDescriptions(['First', '  ', 'Second'])).toEqual(['First', 'Second']);
    expect(hydrateJobDescriptionFields({ jobDescription: 'Legacy posting' })).toEqual(['Legacy posting']);
    expect(hydrateJobDescriptionFields({ jobDescriptions: ['A', 'B'] })).toEqual(['A', 'B']);
    expect(hydrateJobDescriptionFields({})).toEqual(['']);
  });

  it('boosts bullets that overlap any of several job descriptions', () => {
    const result = rankBullet(
      { jobIndex: 2, bulletIndex: 0, bulletId: 'x', text: 'Shipped kubernetes platform work' },
      { jobDescriptions: ['latency reliability', 'kubernetes platform'] }
    );
    expect(result.reasons).toContain('Matches target role');
  });

  it('labels multiple job descriptions in target context', () => {
    const context = buildTargetContext('Staff Engineer', [
      'Need kubernetes experience',
      'Need platform reliability',
    ]);
    expect(context).toContain('targeting this role: Staff Engineer');
    expect(context).toContain('collected 2 job descriptions');
    expect(context).toContain('Job description 1:');
    expect(context).toContain('Job description 2:');
    expect(context).toContain('Need kubernetes experience');
  });

  it('builds a stable analysis context key from role and job descriptions', () => {
    expect(analysisContextKey(' Staff Engineer ', ['Need kubernetes', '']))
      .toBe(analysisContextKey('Staff Engineer', ['Need kubernetes']));
    expect(analysisContextKey('Staff Engineer', ['A']))
      .not.toBe(analysisContextKey('Staff Engineer', ['B']));
  });
});
