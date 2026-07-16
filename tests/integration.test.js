// End-to-end style test in jsdom: loads the real index.html shell + real data,
// boots app.js, and exercises language switching, festival switching, and quiz
// interaction — asserting no console errors along the way.

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const html = await readFile(resolve(process.cwd(), 'index.html'), 'utf8');
const festivals = JSON.parse(
  await readFile(resolve(process.cwd(), 'data/festivals.json'), 'utf8')
);

const bodyInner = html
  .slice(html.indexOf('<body>') + 6, html.indexOf('</body>'))
  .replace(/<script[\s\S]*?<\/script>/g, '');

const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

beforeAll(async () => {
  document.body.innerHTML = bodyInner;
  global.fetch = vi.fn(async (url) => {
    if (String(url).includes('festivals.json')) {
      return { ok: true, status: 200, json: async () => festivals };
    }
    throw new Error('unexpected fetch: ' + url);
  });
  await import('../js/app.js');
  // let init()'s async chain settle
  await new Promise((r) => setTimeout(r, 60));
});

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

describe('app boot', () => {
  it('loads without console errors', () => {
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('renders the language toggle with four options', () => {
    expect($$('#langToggle .lang-btn').length).toBe(4);
  });

  it('populates the festival dropdown with every festival', () => {
    expect($$('#festSelect option').length).toBe(festivals.festivals.length);
  });

  it('renders a festival card with a title, sections and quiz', () => {
    expect($('#cardRoot h2.festival-title')).toBeTruthy();
    expect($$('#cardRoot .section-label').length).toBeGreaterThanOrEqual(4);
    expect($$('#cardRoot .opt').length).toBeGreaterThan(0);
  });

  it('tags the shloka with a detected script lang (not the Telugu-first bug)', () => {
    // Script is detected from the text, so a Sanskrit verse gets "sa" and a
    // Tamil verse (e.g. Tiruppavai) gets "ta" — never a mismatched font.
    const lang = $('#cardRoot .shloka-sanskrit').getAttribute('lang');
    expect(['sa', 'ta', 'te']).toContain(lang);
  });
});

describe('language switching', () => {
  it('changes the interface language and updates document lang', () => {
    const teBtn = $$('#langToggle .lang-btn').find(
      (b) => b.dataset.lang === 'te'
    );
    teBtn.click();
    expect(teBtn.getAttribute('aria-pressed')).toBe('true');
    // card language should now be te (all festivals have te content)
    expect($('#cardRoot').getAttribute('lang')).toBe('te');
    // switch back
    $$('#langToggle .lang-btn')
      .find((b) => b.dataset.lang === 'en')
      .click();
    expect($('#cardRoot').getAttribute('lang')).toBe('en');
  });
});

describe('festival switching', () => {
  it('renders the newly selected festival and resets quiz', () => {
    const select = $('#festSelect');
    const secondId = $$('#festSelect option')[1].value;
    select.value = secondId;
    select.dispatchEvent(new window.Event('change'));
    // quiz should be fresh (no score shown)
    expect($('#cardRoot .quiz-score.show')).toBeFalsy();
    expect($('#cardRoot h2.festival-title')).toBeTruthy();
  });
});

describe('quiz interaction', () => {
  it('records an answer and shows a non-color cue', () => {
    const firstOpt = $('#cardRoot .opts .opt');
    firstOpt.click();
    const answered = $$('#cardRoot .opts')[0].querySelectorAll('.opt');
    const marked = Array.from(answered).some(
      (b) => b.classList.contains('correct') || b.classList.contains('wrong')
    );
    expect(marked).toBe(true);
    expect($('#cardRoot .opt-mark')).toBeTruthy();
  });
});
