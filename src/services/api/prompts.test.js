import {
  getBulletImprovementPrompt,
  getBulletDetailsPrompt,
  getResumeAnalysisPrompt,
  getResumeParserPrompt,
  getSkillBulletPrompt,
  BULLET_IMPROVEMENT_SYSTEM_PROMPT,
  BULLET_DETAILS_SYSTEM_PROMPT,
  SKILL_BULLET_SYSTEM_PROMPT,
} from './prompts';

const sampleResume = {
  summary: 'Product designer with platform experience',
  skills: ['Figma', 'Research'],
  bullet_points: [
    {
      company: 'Acme',
      position: 'Staff Designer',
      time_period: '2023-2025',
      achievements: ['Led the design system'],
    },
  ],
};

describe('AI prompts', () => {
  it('asks rewrites to use placeholders instead of made-up figures', () => {
    expect(BULLET_IMPROVEMENT_SYSTEM_PROMPT).toMatch(/\[X%\]/);
    expect(BULLET_IMPROVEMENT_SYSTEM_PROMPT).toMatch(/placeholder/i);
    expect(BULLET_IMPROVEMENT_SYSTEM_PROMPT).not.toMatch(/make up reasonable numbers/i);
    expect(getBulletImprovementPrompt('Led the team', 'Job:\nStaff Engineer at Acme'))
      .toContain('Use placeholders for any quantity the user has not supplied');
  });

  it('asks for missing facts instead of rewriting when gathering details', () => {
    expect(BULLET_DETAILS_SYSTEM_PROMPT).toMatch(/Do not rewrite the bullet/);
    expect(getBulletDetailsPrompt('Led the team', 'Job:\nStaff Engineer at Acme'))
      .toContain('Write 3 to 4 questions');
    expect(getBulletDetailsPrompt('Led the team', 'Job:\nStaff Engineer at Acme'))
      .toContain('Staff Engineer at Acme');
  });

  it('includes the target role and job descriptions in analysis', () => {
    const prompt = getResumeAnalysisPrompt(sampleResume, {
      targetRole: 'Staff Product Designer',
      jobDescriptions: ['Need design systems and research'],
    });
    expect(prompt).toContain('Staff Product Designer');
    expect(prompt).toContain('Need design systems and research');
    expect(prompt).toContain('SKILLS LISTED ON THE RESUME');
    expect(prompt).toContain('Figma');
    expect(prompt).toContain('Led the design system');
  });

  it('tells partial parser chunks not to invent missing jobs', () => {
    const prompt = getResumeParserPrompt('Education only', { chunkIndex: 1, chunkCount: 3 });
    expect(prompt).toContain('section 2 of 3');
    expect(prompt).toContain('Do not invent roles');
  });

  it('drafts skill bullets with placeholders for the user to fill in', () => {
    expect(SKILL_BULLET_SYSTEM_PROMPT).toMatch(/\[X%\]/);
    expect(SKILL_BULLET_SYSTEM_PROMPT).not.toMatch(/make up reasonable numbers/i);
    const prompt = getSkillBulletPrompt(
      'Mentorship',
      'Show how you developed others',
      { position: 'Staff Engineer', company: 'Acme', time_period: '2024' }
    );
    expect(prompt).toContain('Mentorship');
    expect(prompt).toContain('Acme');
    expect(prompt).toMatch(/\[X%\]|\[\$Y\]|\[N people\]/);
    expect(prompt).not.toMatch(/you can make up/i);
  });
});
