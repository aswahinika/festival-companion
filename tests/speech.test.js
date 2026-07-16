import { describe, it, expect } from 'vitest';
import { bcp47, splitSentences, speechSupported } from '../js/speech.js';

describe('speech helpers', () => {
  it('maps app languages to BCP-47 speech tags', () => {
    expect(bcp47('en')).toBe('en-IN');
    expect(bcp47('te')).toBe('te-IN');
    expect(bcp47('ta')).toBe('ta-IN');
    expect(bcp47('hi')).toBe('hi-IN');
    expect(bcp47('zz')).toBe('en-US'); // fallback
  });

  it('splits text into sentence chunks (Latin + Devanagari danda)', () => {
    expect(splitSentences('One. Two! Three?')).toEqual([
      'One.',
      'Two!',
      'Three?',
    ]);
    expect(splitSentences('श्लोक एक। श्लोक दो॥').length).toBe(2);
    expect(splitSentences('')).toEqual([]);
    expect(splitSentences(null)).toEqual([]);
  });

  it('reports no speech support in the jsdom test environment', () => {
    // jsdom has no speechSynthesis; the app hides the control gracefully.
    expect(speechSupported()).toBe(false);
  });
});
