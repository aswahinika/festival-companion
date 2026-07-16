import { describe, it, expect, vi } from 'vitest';
import {
  el,
  clear,
  svgFromString,
  makeExternalLink,
  readPref,
  writePref,
  fetchJson,
  detectScriptLang,
} from '../js/utils.js';

describe('el()', () => {
  it('sets text via textContent (no HTML injection)', () => {
    const node = el('p', { text: '<script>alert(1)</script>' });
    expect(node.textContent).toBe('<script>alert(1)</script>');
    expect(node.querySelector('script')).toBeNull();
  });

  it('applies class, attributes and children', () => {
    const node = el('div', { class: 'x', 'data-y': '1' }, [
      el('span', { text: 'hi' }),
    ]);
    expect(node.className).toBe('x');
    expect(node.getAttribute('data-y')).toBe('1');
    expect(node.querySelector('span').textContent).toBe('hi');
  });

  it('skips null/false children and attrs', () => {
    const node = el('div', { hidden: false }, [null, false, 'text']);
    expect(node.hasAttribute('hidden')).toBe(false);
    expect(node.textContent).toBe('text');
  });
});

describe('clear()', () => {
  it('removes all children', () => {
    const node = el('div', {}, ['a', el('span'), 'b']);
    clear(node);
    expect(node.childNodes.length).toBe(0);
  });
});

describe('svgFromString()', () => {
  it('parses a trusted SVG string into an element', () => {
    const svg = svgFromString(
      '<svg xmlns="http://www.w3.org/2000/svg"><circle r="1"/></svg>'
    );
    expect(svg).not.toBeNull();
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('returns null for empty input', () => {
    expect(svgFromString('')).toBeNull();
  });
});

describe('makeExternalLink()', () => {
  it('opens safely in a new tab with a screen-reader hint', () => {
    const a = makeExternalLink(
      el('a', { text: 'Calendar' }),
      'https://example.org'
    );
    expect(a.href).toBe('https://example.org/');
    expect(a.target).toBe('_blank');
    expect(a.rel).toBe('noopener noreferrer');
    expect(a.querySelector('.sr-only').textContent).toContain('new tab');
  });
});

describe('detectScriptLang()', () => {
  it('detects Devanagari (Sanskrit) as "sa"', () => {
    expect(detectScriptLang('ॐ नमः शिवाय')).toBe('sa');
  });
  it('detects Tamil as "ta" (e.g. Tiruppavai)', () => {
    expect(detectScriptLang('மார்கழித் திங்கள்')).toBe('ta');
  });
  it('detects Telugu as "te"', () => {
    expect(detectScriptLang('ఓం నమః శివాయ')).toBe('te');
  });
  it('returns null for Latin/empty', () => {
    expect(detectScriptLang('Om Namah Shivaya')).toBeNull();
    expect(detectScriptLang('')).toBeNull();
  });
});

describe('preferences', () => {
  it('reads back what it writes', () => {
    writePref('fc.test', 'ta');
    expect(readPref('fc.test')).toBe('ta');
  });

  it('returns fallback when missing', () => {
    expect(readPref('fc.missing', 'en')).toBe('en');
  });
});

describe('fetchJson()', () => {
  it('throws a clear error on non-OK response', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 404 }));
    await expect(fetchJson('data/x.json')).rejects.toThrow(/HTTP 404/);
  });

  it('throws a clear error on invalid JSON', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('bad');
      },
    }));
    await expect(fetchJson('data/x.json')).rejects.toThrow(/not valid JSON/);
  });
});
