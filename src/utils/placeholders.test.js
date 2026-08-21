import { extractPlaceholders, hasInventedNumbers, countPlaceholders } from './placeholders';

describe('placeholders', () => {
  it('extracts bracket placeholders', () => {
    const text = 'Grew revenue [X%] and saved [$Y] for [N people]';
    expect(extractPlaceholders(text)).toEqual(['[X%]', '[$Y]', '[N people]']);
    expect(countPlaceholders(text)).toBe(3);
  });

  it('does not treat placeholders as invented numbers', () => {
    expect(hasInventedNumbers(
      'Grew the product',
      'Grew the product by [X%] and saved [$Y]',
      ''
    )).toBe(false);
  });

  it('flags a concrete number that was not in the original or user context', () => {
    expect(hasInventedNumbers(
      'Grew the product',
      'Grew the product by 23%',
      ''
    )).toBe(true);
  });

  it('allows numbers the user provided', () => {
    expect(hasInventedNumbers(
      'Grew the product',
      'Grew the product by 23%',
      'We grew 23%'
    )).toBe(false);
  });

  it('keeps numbers that were already in the original', () => {
    expect(hasInventedNumbers(
      'Reduced latency 40%',
      'Cut latency 40% by simplifying the path',
      ''
    )).toBe(false);
  });
});
