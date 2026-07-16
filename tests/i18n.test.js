import { describe, it, expect, beforeEach } from 'vitest';
import {
  SUPPORTED_LANGS,
  UI_STRINGS,
  getLang,
  setLang,
  ui,
  resolveLang,
} from '../js/i18n.js';

describe('i18n', () => {
  beforeEach(() => setLang('en'));

  it('supports the four required languages', () => {
    expect(SUPPORTED_LANGS).toEqual(['en', 'te', 'ta', 'hi']);
    for (const lang of SUPPORTED_LANGS) {
      expect(UI_STRINGS[lang]).toBeTruthy();
    }
  });

  it('every language has the same UI string keys', () => {
    const enKeys = Object.keys(UI_STRINGS.en).sort();
    for (const lang of SUPPORTED_LANGS) {
      expect(Object.keys(UI_STRINGS[lang]).sort()).toEqual(enKeys);
    }
  });

  it('switches language and reflects it', () => {
    expect(getLang()).toBe('en');
    setLang('ta');
    expect(getLang()).toBe('ta');
    expect(ui().story).toBe(UI_STRINGS.ta.story);
  });

  it('ignores an unsupported language', () => {
    setLang('ta');
    setLang('zz');
    expect(getLang()).toBe('ta');
  });

  it('falls back to English when a translation is missing', () => {
    const festival = { languages: { en: { title: 'X' } } };
    expect(resolveLang(festival, 'te')).toBe('en');
  });

  it('uses the requested language when present', () => {
    const festival = { languages: { en: {}, te: {} } };
    expect(resolveLang(festival, 'te')).toBe('te');
  });
});
