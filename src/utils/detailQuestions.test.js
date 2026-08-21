import { getDetailQuestionPlaceholder } from './detailQuestions';

describe('getDetailQuestionPlaceholder', () => {
  it('combines matching examples for mixed scale questions', () => {
    expect(getDetailQuestionPlaceholder(
      'About how many people, systems, or dollars were involved?'
    )).toBe('e.g. 8 people, 3 systems, $400K');
  });

  it('uses a tools example for methods questions', () => {
    expect(getDetailQuestionPlaceholder(
      'What tools or methods did you actually use?'
    )).toBe('e.g. React, PostgreSQL');
  });

  it('uses metric and outcome examples when both are asked', () => {
    expect(getDetailQuestionPlaceholder(
      'What changed because of this work (metric, outcome, or decision)?'
    )).toBe('e.g. 25%, unblocked launch');
  });

  it('uses a users example without treating impact as a metric', () => {
    expect(getDetailQuestionPlaceholder(
      'How many users were impacted by this performance improvement?'
    )).toBe('e.g. 12,000 users');
  });

  it('falls back when the question has no matching hint', () => {
    expect(getDetailQuestionPlaceholder('What specific features did you implement?'))
      .toBe('A short fact you can stand behind');
  });
});
