import { getTopUnsaved, listRankedBullets, tokenize } from './bulletPriority';

export const MAX_INSIGHT_TASKS = 5;
const NO_WEAKNESS = 'No specific weaknesses identified.';

export function slugInsight(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'item';
}

export function getBulletInsightChips(bulletText, improvement) {
  const chips = [];
  if (bulletText && !/\d/.test(bulletText)) {
    chips.push('Add a metric');
  }
  const weakness = improvement?.remainingWeaknesses;
  if (typeof weakness === 'string' && weakness.trim() && weakness !== NO_WEAKNESS) {
    chips.push(weakness.trim());
  }
  return chips;
}

function skillName(skill) {
  if (typeof skill === 'string') return skill;
  return skill?.name || '';
}

function isPriorityAts(keyword) {
  const priority = String(keyword?.priority || '').toLowerCase();
  return keyword && keyword.present !== true && (priority === 'high' || priority === 'medium');
}

function matchPhraseToBulletIds(phrase, ranked) {
  const tokens = tokenize(phrase).filter((token) => token.length > 3);
  if (tokens.length === 0) return [];
  return ranked
    .filter((item) => {
      const text = String(item.text || '').toLowerCase();
      return tokens.some((token) => text.includes(token));
    })
    .map((item) => item.bulletId);
}

function uniqueIds(ids) {
  return [...new Set(ids.filter(Boolean))];
}

export function buildInsightTasks(resumeData, analysis, {
  targetRole = '',
  jobDescriptions,
  savedBullets = {},
  skippedBullets = {},
} = {}) {
  const ranked = listRankedBullets(resumeData, { targetRole, jobDescriptions });
  const fallbackIds = getTopUnsaved(ranked, savedBullets, skippedBullets, 6).map((item) => item.bulletId);
  const tasks = [];

  const noMetric = ranked.filter((item) => !/\d/.test(item.text || ''));
  if (noMetric.length > 0) {
    tasks.push({
      id: 'metrics',
      title: 'Add a metric to bullets that only describe duties',
      detail: `${noMetric.length} of ${ranked.length} bullets have no number, %, $, or time saved.`,
      bulletIds: uniqueIds(noMetric.map((item) => item.bulletId)),
      source: 'metrics',
    });
  }

  const missingAts = (analysis?.atsKeywords || []).filter(isPriorityAts).slice(0, 2);
  missingAts.forEach((entry) => {
    const keyword = String(entry.keyword || '').trim();
    if (!keyword) return;
    const lower = keyword.toLowerCase();
    const candidates = ranked.filter((item) => !String(item.text || '').toLowerCase().includes(lower));
    if (candidates.length === 0) return;
    tasks.push({
      id: `ats-${slugInsight(keyword)}`,
      title: `Surface “${keyword}” if it is true of the work`,
      detail: `${keyword} is missing and marked ${entry.priority} priority for ATS.`,
      bulletIds: uniqueIds(candidates.slice(0, 6).map((item) => item.bulletId)),
      source: 'ats',
      keyword,
    });
  });

  (analysis?.areasForImprovement || []).forEach((area) => {
    if (tasks.length >= MAX_INSIGHT_TASKS) return;
    const title = String(area || '').trim();
    if (!title) return;
    const matched = matchPhraseToBulletIds(title, ranked);
    tasks.push({
      id: `improve-${slugInsight(title)}`,
      title,
      detail: 'From the resume diagnosis.',
      bulletIds: uniqueIds(matched.length ? matched : fallbackIds),
      source: 'areasForImprovement',
    });
  });

  (analysis?.missingSkills || []).forEach((skill) => {
    if (tasks.length >= MAX_INSIGHT_TASKS) return;
    const name = skillName(skill).trim();
    if (!name) return;
    const matched = matchPhraseToBulletIds(name, ranked);
    tasks.push({
      id: `skill-${slugInsight(name)}`,
      title: `Show “${name}” only if you actually used it`,
      detail: 'Suggested skill from the diagnosis.',
      bulletIds: uniqueIds(matched.length ? matched : fallbackIds),
      source: 'missingSkills',
      keyword: name,
    });
  });

  return tasks.slice(0, MAX_INSIGHT_TASKS);
}

export function getGuideForBullet(bullet = {}, {
  analysis,
  improvement,
  tasks = [],
} = {}) {
  const bulletId = bullet.bulletId;
  const text = bullet.text || '';
  const matchingTasks = tasks.filter((task) => task.bulletIds.includes(bulletId));
  const remainingWeakness = typeof improvement?.remainingWeaknesses === 'string'
    && improvement.remainingWeaknesses.trim()
    && improvement.remainingWeaknesses !== NO_WEAKNESS
    ? improvement.remainingWeaknesses.trim()
    : (matchingTasks[0]?.title || null);

  const fromTasks = matchingTasks.map((task) => task.keyword).filter(Boolean);
  const fromAts = (analysis?.atsKeywords || [])
    .filter((entry) => entry && entry.present !== true && entry.keyword)
    .map((entry) => entry.keyword)
    .filter((keyword) => !String(text).toLowerCase().includes(String(keyword).toLowerCase()));
  const keywords = [...new Set([...fromTasks, ...fromAts])].slice(0, 5);

  const followUp = Array.isArray(improvement?.followUpQuestions)
    ? (improvement.followUpQuestions.find((question) => String(question || '').trim()) || null)
    : null;

  const openTasks = tasks.filter((task) => !task.bulletIds.includes(bulletId)).slice(0, 3);

  return {
    reasons: bullet.reasons || [],
    matchingTasks,
    keywords,
    remainingWeakness,
    followUp,
    openTasks,
  };
}

export function buildInsightContext(guide) {
  if (!guide) return '';
  const parts = [];
  if (guide.matchingTasks?.length) {
    parts.push(`Focus this rewrite on: ${guide.matchingTasks.map((task) => task.title).join('; ')}`);
  }
  if (guide.keywords?.length) {
    parts.push(`Try to incorporate these keywords only if they are true of the original work: ${guide.keywords.join(', ')}`);
  }
  if (guide.remainingWeakness) {
    parts.push(`Remaining gap: ${guide.remainingWeakness}`);
  }
  return parts.join('\n');
}
