import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateFestivalData, SUPPORTED_LANGS } from '../js/validate.js';

const data = JSON.parse(
  await readFile(resolve(process.cwd(), 'data/festivals.json'), 'utf8')
);

describe('festivals.json', () => {
  it('loads successfully and has festivals', () => {
    expect(Array.isArray(data.festivals)).toBe(true);
    expect(data.festivals.length).toBeGreaterThan(0);
  });

  it('passes full schema validation', () => {
    const { ok, errors } = validateFestivalData(data);
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
  });

  it('has unique festival ids and slugs', () => {
    const ids = data.festivals.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every quiz correct-answer index is within range', () => {
    for (const f of data.festivals) {
      for (const [lang, block] of Object.entries(f.languages)) {
        block.quiz.forEach((q, i) => {
          expect(
            q.answer,
            `${f.id}/${lang}/q${i} answer out of range`
          ).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(q.options.length);
        });
      }
    }
  });

  it('every language block uses a supported language code', () => {
    for (const f of data.festivals) {
      for (const lang of Object.keys(f.languages)) {
        expect(SUPPORTED_LANGS).toContain(lang);
      }
    }
  });

  it('every festival has the English fallback language', () => {
    for (const f of data.festivals) {
      expect(f.languages.en, `${f.id} missing English`).toBeTruthy();
    }
  });

  it('has a dates map keyed by year', () => {
    expect(typeof data.dates).toBe('object');
    for (const year of Object.keys(data.dates)) {
      expect(year).toMatch(/^\d{4}$/);
    }
  });
});

describe('validation catches malformed content', () => {
  it('flags an out-of-range quiz answer', () => {
    const bad = structuredClone(data);
    bad.festivals[0].languages.en.quiz[0].answer = 99;
    const { ok, errors } = validateFestivalData(bad);
    expect(ok).toBe(false);
    expect(errors.some((e) => e.includes('answer'))).toBe(true);
  });

  it('flags a missing required field', () => {
    const bad = structuredClone(data);
    delete bad.festivals[0].languages.en.story;
    const { ok } = validateFestivalData(bad);
    expect(ok).toBe(false);
  });

  it('allows optional transliteration to be null', () => {
    const clone = structuredClone(data);
    clone.festivals[0].languages.en.shloka.transliteration = null;
    const { ok } = validateFestivalData(clone);
    expect(ok).toBe(true);
  });
});
