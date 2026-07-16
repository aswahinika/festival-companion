// Small, dependency-free helpers shared across the app.

/**
 * Create a DOM element with attributes and children.
 * Text is always set via textContent, never innerHTML, so any content coming
 * from data/festivals.json is inert and cannot inject markup.
 *
 * @param {string} tag
 * @param {Object} [attrs] - attributes; `class`, `text`, `html` handled specially
 * @param {Array<Node|string>} [children]
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') {
      for (const [dk, dv] of Object.entries(value)) node.dataset[dk] = dv;
    } else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, value);
    }
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(
      child.nodeType ? child : document.createTextNode(String(child))
    );
  }
  return node;
}

/** Remove all children of a node. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/**
 * Parse a trusted internal SVG string (from js/icons.js — NOT external data)
 * into a live SVG element. Uses DOMParser instead of innerHTML for consistency
 * with our no-innerHTML rendering policy.
 * @returns {SVGElement|null}
 */
export function svgFromString(svgString) {
  if (!svgString) return null;
  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg || doc.querySelector('parsererror')) return null;
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  return svg;
}

/**
 * Fetch and parse a JSON file relative to the app.
 * Throws a clear, human-readable error on network or parse failure.
 */
export async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url, { cache: 'no-cache' });
  } catch (cause) {
    throw new Error(`Could not load ${url} (network error).`, { cause });
  }
  if (!response.ok) {
    throw new Error(`Could not load ${url} (HTTP ${response.status}).`);
  }
  try {
    return await response.json();
  } catch (cause) {
    throw new Error(
      `${url} is not valid JSON. Run "npm run validate" to find the error.`,
      { cause }
    );
  }
}

/**
 * Configure an anchor to open an external URL safely and accessibly.
 * Adds target=_blank, rel=noopener noreferrer, and a screen-reader hint.
 */
export function makeExternalLink(anchor, url) {
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  const sr = el('span', { class: 'sr-only', text: ' (opens in a new tab)' });
  anchor.append(sr);
  return anchor;
}

/** Read a string from localStorage, tolerating privacy modes that throw. */
export function readPref(key, fallback = null) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

/** Write a string to localStorage, silently ignoring failures. */
export function writePref(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode, quota) — preferences just won't persist */
  }
}

/**
 * Detect the dominant Indic script of a string and return a BCP-47 language tag
 * suitable for choosing the right font. Shlokas are mostly Sanskrit (Devanagari),
 * but some — e.g. Andal's Tiruppavai — are in Tamil; guessing "always Sanskrit"
 * would tag Tamil text with the Devanagari font. Returns 'sa' (Devanagari),
 * 'ta' (Tamil), 'te' (Telugu), or null for Latin/other.
 */
export function detectScriptLang(text) {
  if (!text) return null;
  let deva = 0;
  let tamil = 0;
  let telugu = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0);
    if (c >= 0x0900 && c <= 0x097f) deva++;
    else if (c >= 0x0b80 && c <= 0x0bff) tamil++;
    else if (c >= 0x0c00 && c <= 0x0c7f) telugu++;
  }
  const max = Math.max(deva, tamil, telugu);
  if (max === 0) return null;
  if (max === deva) return 'sa';
  if (max === tamil) return 'ta';
  return 'te';
}

/** True when the user's OS requests reduced motion. */
export function prefersReducedMotion() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
