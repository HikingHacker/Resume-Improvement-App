/**
 * Helpers for Claude Messages API requests.
 * Newer models (4.7+) reject temperature/top_p/top_k; thinking blocks
 * also mean the first content item is often not `text`.
 */

function modelOmitsSamplingParams(modelId) {
  const model = String(modelId || '').toLowerCase();
  if (!model) return false;
  if (model.includes('mythos')) return true;
  if (/(?:^|-)(?:opus|sonnet|haiku)-5(?:$|[^0-9])/.test(model)) return true;
  if (/claude-5(?:$|[^0-9])/.test(model)) return true;
  // 4.7, 4.8, 4.9, 4.10+ — not 4.5 or 4.6
  if (/-4-(?:[7-9]|[1-9]\d+)(?:$|[^0-9])/.test(model)) return true;
  return false;
}

function extractClaudeText(data) {
  const blocks = data?.content;
  if (typeof blocks === 'string') return blocks.trim();
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return '';
  }

  return blocks
    .map((block) => {
      if (typeof block === 'string') return block;
      if (block?.text) return block.text;
      return '';
    })
    .join('\n')
    .trim();
}

function summarizeClaudeError(errorText) {
  const raw = String(errorText || '').trim();
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    return parsed?.error?.message || parsed?.message || raw.slice(0, 300);
  } catch (error) {
    return raw.slice(0, 300);
  }
}

function buildClaudeMessagesBody({
  model,
  maxTokens,
  system,
  prompt,
  temperature,
  omitSamplingParams,
}) {
  const body = {
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  };
  if (!omitSamplingParams && typeof temperature === 'number') {
    body.temperature = temperature;
  }
  return body;
}

function formatBulletImprovement(parsedResponse = {}) {
  let suggestions = Array.isArray(parsedResponse.multipleSuggestions)
    ? parsedResponse.multipleSuggestions.filter((item) => typeof item === 'string' && item.trim())
    : [];
  if (suggestions.length === 0 && parsedResponse.improvedBulletPoint) {
    suggestions = [String(parsedResponse.improvedBulletPoint)];
  }

  return {
    success: true,
    multipleSuggestions: suggestions,
    improvedBulletPoint: suggestions[0] || parsedResponse.improvedBulletPoint,
    reasoning: parsedResponse.reasoning,
    remainingWeaknesses: parsedResponse.remainingWeaknesses || 'No specific weaknesses identified.',
    followUpQuestions: parsedResponse.followUpQuestions,
  };
}

function formatBulletDetails(parsedResponse = {}) {
  const questions = Array.isArray(parsedResponse.followUpQuestions)
    ? parsedResponse.followUpQuestions
      .map((question) => String(question || '').trim())
      .filter(Boolean)
    : [];

  return {
    success: true,
    followUpQuestions: questions,
    remainingWeaknesses: parsedResponse.remainingWeaknesses || '',
  };
}

module.exports = {
  modelOmitsSamplingParams,
  extractClaudeText,
  summarizeClaudeError,
  buildClaudeMessagesBody,
  formatBulletImprovement,
  formatBulletDetails,
};
