import {
  addBulletToJob,
  addJobToResume,
  ensureResumeIds,
  getBulletId,
  removeBulletFromJob,
  removeJobFromResume,
} from './resumeIds';

describe('resumeIds', () => {
  it('keeps legacy index ids for old sessions without achievementIds', () => {
    const ensured = ensureResumeIds({
      bullet_points: [
        { company: 'Acme', position: 'Eng', achievements: ['Built APIs', 'Shipped search'] },
      ],
    }, { generateMissing: false });

    expect(getBulletId(ensured.bullet_points[0], 0, 1)).toBe('job0-bullet1');
  });

  it('generates stable ids on a fresh parse', () => {
    const ensured = ensureResumeIds({
      bullet_points: [
        { company: 'Acme', position: 'Eng', achievements: ['Built APIs'] },
      ],
    }, { generateMissing: true });

    const id = getBulletId(ensured.bullet_points[0], 0, 0);
    expect(id).toMatch(/^bullet_/);
    expect(id).not.toBe('job0-bullet0');
  });

  it('add and delete keep remaining bullet ids stable', () => {
    let data = ensureResumeIds({
      bullet_points: [
        { company: 'Acme', position: 'Eng', achievements: ['First', 'Second'] },
      ],
    }, { generateMissing: true });

    const firstId = data.bullet_points[0].achievementIds[0];
    const secondId = data.bullet_points[0].achievementIds[1];

    data = addBulletToJob(data, 0);
    expect(data.bullet_points[0].achievements).toHaveLength(3);
    expect(data.bullet_points[0].achievementIds[0]).toBe(firstId);
    expect(data.bullet_points[0].achievementIds[1]).toBe(secondId);
    expect(data.bullet_points[0].achievementIds[2]).not.toBe(firstId);

    data = removeBulletFromJob(data, 0, 1);
    expect(data.bullet_points[0].achievements).toEqual(['First', '']);
    expect(data.bullet_points[0].achievementIds[0]).toBe(firstId);
    expect(data.bullet_points[0].achievementIds).not.toContain(secondId);
  });

  it('add and delete jobs without rewriting other job ids', () => {
    let data = ensureResumeIds({
      bullet_points: [
        { company: 'Acme', position: 'Eng', achievements: ['First'] },
      ],
    }, { generateMissing: true });
    const originalJobId = data.bullet_points[0].id;
    const originalBulletId = data.bullet_points[0].achievementIds[0];

    data = addJobToResume(data);
    expect(data.bullet_points).toHaveLength(2);
    expect(data.bullet_points[0].id).toBe(originalJobId);
    expect(data.bullet_points[1].id).not.toBe(originalJobId);

    data = removeJobFromResume(data, 1);
    expect(data.bullet_points).toHaveLength(1);
    expect(data.bullet_points[0].achievementIds[0]).toBe(originalBulletId);
  });
});
