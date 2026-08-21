import { getBulletId } from './resumeIds';

const STOP_WORDS = new Set([
  'with', 'from', 'that', 'this', 'have', 'will', 'your', 'into', 'using',
  'and', 'the', 'for', 'are', 'was', 'were', 'been', 'able',
]);

export function tokenize(text) {
  return (String(text || '').toLowerCase().match(/[a-z][a-z0-9+.#]{2,}/g) || [])
    .filter((word) => !STOP_WORDS.has(word));
}

export const MAX_JOB_DESCRIPTIONS = 10;

export function normalizeJobDescriptions(jobDescriptionOrList) {
  if (Array.isArray(jobDescriptionOrList)) {
    return jobDescriptionOrList.map((item) => String(item || '').trim()).filter(Boolean);
  }
  const text = String(jobDescriptionOrList || '').trim();
  return text ? [text] : [];
}

export function joinJobDescriptions(jobDescriptionOrList) {
  return normalizeJobDescriptions(jobDescriptionOrList).join('\n\n');
}

export function hydrateJobDescriptionFields(storedTarget = {}, { minFields = 1, maxFields = MAX_JOB_DESCRIPTIONS } = {}) {
  const source = Array.isArray(storedTarget.jobDescriptions)
    ? storedTarget.jobDescriptions
    : storedTarget.jobDescription;
  const fields = Array.isArray(source)
    ? source.map((item) => String(item ?? ''))
    : (String(source || '') ? [String(source)] : ['']);
  const limited = (fields.length ? fields : ['']).slice(0, maxFields);
  while (limited.length < minFields) {
    limited.push('');
  }
  return limited;
}

export function rankBullet({ jobIndex, bulletIndex, bulletId, text }, { targetRole = '', jobDescription, jobDescriptions } = {}) {
  let score = 0;
  const reasons = [];

  if (jobIndex < 2) {
    score += 3;
    reasons.push('Recent role');
  }

  if (!/\d/.test(text || '')) {
    score += 4;
    reasons.push('No metric');
  }

  const haystack = `${targetRole} ${joinJobDescriptions(jobDescriptions ?? jobDescription)}`.toLowerCase();
  if (haystack.trim()) {
    const overlap = tokenize(text).filter((word) => word.length > 3 && haystack.includes(word));
    if (overlap.length > 0) {
      score += 2;
      reasons.push('Matches target role');
    }
  }

  return {
    jobIndex,
    bulletIndex,
    bulletId,
    text,
    score,
    reasons,
  };
}

export function listRankedBullets(resumeData, options = {}) {
  const items = [];
  (resumeData?.bullet_points || []).forEach((job, jobIndex) => {
    (job.achievements || []).forEach((text, bulletIndex) => {
      items.push(rankBullet({
        jobIndex,
        bulletIndex,
        text,
        bulletId: getBulletId(job, jobIndex, bulletIndex),
      }, options));
    });
  });

  return items.sort((a, b) => (
    b.score - a.score
    || a.jobIndex - b.jobIndex
    || a.bulletIndex - b.bulletIndex
  ));
}

export function getTopUnsaved(ranked, savedBullets = {}, skippedBullets = {}, limit = 6) {
  return ranked
    .filter((item) => !savedBullets[item.bulletId] && !skippedBullets[item.bulletId])
    .slice(0, limit);
}

export function analysisContextKey(targetRole = '', jobDescriptions) {
  return JSON.stringify({
    role: String(targetRole || '').trim(),
    jds: normalizeJobDescriptions(jobDescriptions),
  });
}

export function buildTargetContext(targetRole, jobDescription, maxJdLength = 8000) {
  const parts = [];
  const descriptions = normalizeJobDescriptions(jobDescription);

  if (targetRole?.trim()) {
    parts.push(`The candidate is targeting this role: ${targetRole.trim()}.`);
    parts.push('Foreground skills and keywords from this posting when they are true to the original bullet.');
  }

  if (descriptions.length === 1) {
    parts.push(`Job description:\n${descriptions[0].slice(0, maxJdLength)}`);
  } else if (descriptions.length > 1) {
    parts.push(
      `The candidate collected ${descriptions.length} job descriptions. Tailor toward overlapping skills, keywords, and language across these postings when they are true to the original bullet.`
    );
    const perJd = Math.max(600, Math.floor(maxJdLength / descriptions.length));
    descriptions.forEach((text, index) => {
      parts.push(`Job description ${index + 1}:\n${text.slice(0, perJd)}`);
    });
  }

  return parts.join('\n');
}

export function formatRewrittenResumeText(resumeData, improvements = {}) {
  const blocks = [];
  (resumeData?.bullet_points || []).forEach((job, jobIndex) => {
    const heading = [job.position, job.company].filter(Boolean).join(' · ');
    const date = job.time_period ? ` (${job.time_period})` : '';
    const lines = [`${heading}${date}`.trim() || 'Role'];
    (job.achievements || []).forEach((bullet, bulletIndex) => {
      const bulletId = getBulletId(job, jobIndex, bulletIndex);
      const text = improvements[bulletId]?.improvedBulletPoint || bullet;
      lines.push(`• ${String(text).replace(/^•\s*/, '').trim()}`);
    });
    blocks.push(lines.join('\n'));
  });
  return blocks.join('\n\n');
}
