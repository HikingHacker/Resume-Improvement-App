const HINTS = [
  {
    test: /\b(tools?|methods?|techniques?|technolog(?:y|ies)|frameworks?|stack|languages?)\b/i,
    example: 'React, PostgreSQL',
  },
  {
    test: /\b(people|person|team|engineers?|headcount|collaborat)/i,
    example: '8 people',
  },
  {
    test: /\b(systems?|services?|apps?|products?|platforms?)\b/i,
    example: '3 systems',
  },
  {
    test: /\b(dollars?|budget|revenue|cost|savings?|spend|\$)/i,
    example: '$400K',
  },
  {
    test: /\b(%|percent(?:age)?s?|metrics?)\b/i,
    example: '25%',
  },
  {
    test: /\b(how long|duration|timeline|months?|weeks?|hours?|sprints?)\b/i,
    example: '3 months',
  },
  {
    test: /\b(users?|customers?|clients?|accounts?)\b/i,
    example: '12,000 users',
  },
  {
    test: /\b(outcome|impact|changed|decision|result)\b/i,
    example: 'unblocked launch',
  },
  {
    test: /\b(challeng|blocker|constraint|risk)\b/i,
    example: 'legacy API, tight deadline',
  },
];

const DEFAULT_PLACEHOLDER = 'A short fact you can stand behind';

export function getDetailQuestionPlaceholder(question) {
  const text = String(question || '').trim();
  if (!text) return DEFAULT_PLACEHOLDER;

  const examples = HINTS
    .filter(({ test }) => test.test(text))
    .map(({ example }) => example);

  if (examples.length === 0) return DEFAULT_PLACEHOLDER;
  return `e.g. ${[...new Set(examples)].slice(0, 3).join(', ')}`;
}
