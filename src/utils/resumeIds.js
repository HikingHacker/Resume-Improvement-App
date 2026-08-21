/**
 * Stable ids for jobs and bullets so add/delete/reorder does not break
 * improvements, saved state, or original-text maps.
 */

export function createId(prefix = 'id') {
  const suffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${suffix}`;
}

export function legacyBulletId(jobIndex, bulletIndex) {
  return `job${jobIndex}-bullet${bulletIndex}`;
}

export function getBulletId(job, jobIndex, bulletIndex) {
  if (job?.achievementIds?.[bulletIndex]) {
    return job.achievementIds[bulletIndex];
  }
  return legacyBulletId(jobIndex, bulletIndex);
}

export function createEmptyJob() {
  return {
    id: createId('job'),
    company: '',
    position: '',
    time_period: '',
    achievements: [''],
    achievementIds: [createId('bullet')],
  };
}

/**
 * Ensure every job and bullet has an id.
 * For persisted sessions without ids, reuse the historical jobN-bulletM keys
 * so existing improvements still match. Pass generateMissing: true on a fresh parse.
 */
export function ensureResumeIds(resumeData, { generateMissing = false } = {}) {
  const jobs = (resumeData?.bullet_points || []).map((job, jobIndex) => {
    const id = job.id || createId('job');
    const achievements = job.achievements || [];
    const existingIds = job.achievementIds || [];
    const achievementIds = achievements.map((_, bulletIndex) => {
      if (existingIds[bulletIndex]) {
        return existingIds[bulletIndex];
      }
      return generateMissing ? createId('bullet') : legacyBulletId(jobIndex, bulletIndex);
    });
    return {
      ...job,
      id,
      achievements,
      achievementIds,
    };
  });

  return {
    ...resumeData,
    bullet_points: jobs,
  };
}

export function addJobToResume(resumeData) {
  return {
    ...resumeData,
    bullet_points: [...(resumeData.bullet_points || []), createEmptyJob()],
  };
}

export function addBulletToJob(resumeData, jobIndex) {
  const jobs = (resumeData.bullet_points || []).map((job, index) => {
    if (index !== jobIndex) return job;
    return {
      ...job,
      achievements: [...(job.achievements || []), ''],
      achievementIds: [...(job.achievementIds || []), createId('bullet')],
    };
  });
  return { ...resumeData, bullet_points: jobs };
}

export function removeBulletFromJob(resumeData, jobIndex, bulletIndex) {
  const jobs = (resumeData.bullet_points || []).map((job, index) => {
    if (index !== jobIndex) return job;
    const achievements = [...(job.achievements || [])];
    const achievementIds = [...(job.achievementIds || [])];
    achievements.splice(bulletIndex, 1);
    achievementIds.splice(bulletIndex, 1);
    return { ...job, achievements, achievementIds };
  });
  return { ...resumeData, bullet_points: jobs };
}

export function removeJobFromResume(resumeData, jobIndex) {
  return {
    ...resumeData,
    bullet_points: (resumeData.bullet_points || []).filter((_, index) => index !== jobIndex),
  };
}

export function looksUnknown(value) {
  return !value || /^unknown(\s|$)/i.test(String(value).trim());
}

export function buildOriginalBulletsMap(resumeData) {
  const map = {};
  (resumeData?.bullet_points || []).forEach((job, jobIndex) => {
    (job.achievements || []).forEach((bullet, bulletIndex) => {
      map[getBulletId(job, jobIndex, bulletIndex)] = bullet;
    });
  });
  return map;
}
