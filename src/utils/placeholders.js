export const PLACEHOLDER_PATTERN = /\[[^\]\n]{1,48}\]/g;

export function extractPlaceholders(text) {
  if (!text) return [];
  return [...String(text).matchAll(PLACEHOLDER_PATTERN)].map((match) => match[0]);
}

export function countPlaceholders(text) {
  return extractPlaceholders(text).length;
}

export function hasPlaceholders(text) {
  return countPlaceholders(text) > 0;
}

/**
 * Numbers that look like metrics, excluding tokens inside [placeholders]
 * and 4-digit years.
 */
export function extractConcreteNumbers(text) {
  if (!text) return [];
  const withoutPlaceholders = String(text).replace(PLACEHOLDER_PATTERN, ' ');
  const matches = withoutPlaceholders.match(/\$\d[\d,]*(?:\.\d+)?|\d+(?:\.\d+)?%|\b\d{1,3}(?:,\d{3})+\b|\b\d{1,3}\b/g) || [];
  return matches.filter((token) => !/^(19|20)\d{2}$/.test(token));
}

export function hasInventedNumbers(original, suggestion, userContext = '') {
  const allowed = new Set([
    ...extractConcreteNumbers(original),
    ...extractConcreteNumbers(userContext),
  ]);
  return extractConcreteNumbers(suggestion).some((token) => !allowed.has(token));
}

export function countPlaceholderBullets(resumeData, improvements, getBulletId) {
  return (resumeData?.bullet_points || []).reduce((count, job, jobIndex) => {
    return count + (job.achievements || []).reduce((inner, bullet, bulletIndex) => {
      const bulletId = getBulletId(jobIndex, bulletIndex);
      const text = improvements[bulletId]?.currentlyEditing
        || improvements[bulletId]?.improvedBulletPoint
        || bullet;
      return inner + (hasPlaceholders(text) ? 1 : 0);
    }, 0);
  }, 0);
}
