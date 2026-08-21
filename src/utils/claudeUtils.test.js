const {
  modelOmitsSamplingParams,
  extractClaudeText,
  summarizeClaudeError,
  buildClaudeMessagesBody,
  formatBulletImprovement,
} = require('../../server/claudeUtils');
const { parseJsonFromModelResponse } = require('../../server/resumeParser');

describe('Claude request helpers', () => {
  it('omits sampling params for Claude 5 and 4.7+, but not 4.5 or 4.6', () => {
    expect(modelOmitsSamplingParams('claude-sonnet-5')).toBe(true);
    expect(modelOmitsSamplingParams('claude-opus-5-20260801')).toBe(true);
    expect(modelOmitsSamplingParams('claude-opus-4-7')).toBe(true);
    expect(modelOmitsSamplingParams('claude-sonnet-4-5-20250929')).toBe(false);
    expect(modelOmitsSamplingParams('claude-sonnet-4-6')).toBe(false);
    expect(modelOmitsSamplingParams('claude-3-5-sonnet-20241022')).toBe(false);
  });

  it('reads text from later content blocks when thinking comes first', () => {
    const text = extractClaudeText({
      content: [
        { type: 'thinking', thinking: 'Let me rewrite this carefully.' },
        { type: 'text', text: '{"multipleSuggestions":["Rewrote the bullet"]}' },
      ],
    });
    expect(text).toContain('Rewrote the bullet');
    expect(extractClaudeText({ content: [{ type: 'thinking', thinking: '...' }] })).toBe('');
  });

  it('drops temperature from the request body for Claude 5', () => {
    const body = buildClaudeMessagesBody({
      model: 'claude-sonnet-5',
      maxTokens: 1024,
      system: 'sys',
      prompt: 'user',
      temperature: 0.7,
      omitSamplingParams: true,
    });
    expect(body.temperature).toBeUndefined();
    expect(body.model).toBe('claude-sonnet-5');
  });

  it('keeps temperature for older models', () => {
    const body = buildClaudeMessagesBody({
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 1024,
      system: 'sys',
      prompt: 'user',
      temperature: 0.2,
      omitSamplingParams: false,
    });
    expect(body.temperature).toBe(0.2);
  });

  it('surfaces the inner Claude error message', () => {
    expect(summarizeClaudeError('{"type":"error","error":{"message":"`temperature` is deprecated for this model."}}'))
      .toBe('`temperature` is deprecated for this model.');
  });

  it('uses the first suggestion as the improved bullet', () => {
    const result = formatBulletImprovement({
      multipleSuggestions: ['Outcome rewrite', 'Methods rewrite'],
      reasoning: 'Varied emphasis',
    });
    expect(result.success).toBe(true);
    expect(result.improvedBulletPoint).toBe('Outcome rewrite');
    expect(result.multipleSuggestions).toHaveLength(2);
  });
});

describe('parseJsonFromModelResponse', () => {
  it('parses JSON after preamble and ignores trailing commentary', () => {
    const parsed = parseJsonFromModelResponse(`
Here is the rewrite:
{
  "multipleSuggestions": ["Led the launch of Project X"],
  "reasoning": "Leads with impact"
}
Thanks!
`);
    expect(parsed.multipleSuggestions[0]).toBe('Led the launch of Project X');
    expect(parsed.reasoning).toBe('Leads with impact');
  });

  it('parses fenced JSON', () => {
    const parsed = parseJsonFromModelResponse(`\`\`\`json
{"multipleSuggestions":["Concise rewrite"],"reasoning":"Shorter"}
\`\`\``);
    expect(parsed.multipleSuggestions).toEqual(['Concise rewrite']);
  });

  it('returns null for missing or empty input instead of throwing', () => {
    expect(parseJsonFromModelResponse(undefined)).toBeNull();
    expect(parseJsonFromModelResponse('')).toBeNull();
    expect(parseJsonFromModelResponse('no json here')).toBeNull();
  });
});
