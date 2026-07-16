// One-off build script: transforms the legacy inline data objects from the
// original index.html into the new data/festivals.json schema and js/icons.js.
// Run with: node scripts/extract.mjs
// It slices the four `const` literals out of the original HTML by text markers,
// loads them as a module, and re-emits them. Nothing is retyped by hand, so all
// Unicode (Telugu/Tamil/Devanagari/Sanskrit) is preserved byte-for-byte.

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const html = await readFile(
  resolve(root, 'index.original.backup.html'),
  'utf8'
);

function slice(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  if (start === -1) throw new Error(`marker not found: ${startMarker}`);
  const end = html.indexOf(endMarker, start);
  if (end === -1) throw new Error(`end marker not found: ${endMarker}`);
  return html.slice(start, end);
}

const dataChunk = slice('const DATA = {', '\nconst DATES');
const datesChunk = slice('const DATES = {', '\nconst UI_STRINGS');
const uiChunk = slice('const UI_STRINGS = {', '\nconst ICONS');
const iconsChunk = slice('const ICONS = {', '\nlet currentLang');

const tempModule =
  `${dataChunk}\n${datesChunk}\n${uiChunk}\n${iconsChunk}\n` +
  `export { DATA, DATES, UI_STRINGS, ICONS };\n`;

const tempPath = resolve(root, 'scripts', '_legacy.mjs');
await writeFile(tempPath, tempModule, 'utf8');

const { DATA, DATES, UI_STRINGS, ICONS } = await import(
  pathToFileURL(tempPath).href
);

// --- Build a sort order from the most recent year we have dates for ---
const years = Object.keys(DATES).sort();
const latestYear = years[years.length - 1];
const yearDates = DATES[latestYear];

const festivalKeys = Object.keys(DATA);
const ordered = festivalKeys.slice().sort((a, b) => {
  const sa = (yearDates[a] && yearDates[a].sort) || '99-99';
  const sb = (yearDates[b] && yearDates[b].sort) || '99-99';
  return sa.localeCompare(sb);
});

const LANGS = ['en', 'te', 'ta', 'hi'];

function mapLang(entry) {
  if (!entry) return undefined;
  return {
    title: entry.title,
    subtitle: entry.sub,
    story: entry.story,
    rituals: entry.temple,
    importance: entry.why,
    shloka: {
      original: entry.shlokaSanskrit ?? null,
      transliteration: entry.shlokaTranslit ?? null,
      meaning: entry.shlokaMeaning ?? null,
      audio: null, // optional human recording, added later; see CONTENT_GUIDE.md
    },
    quiz: (entry.quiz || []).map((q) => ({
      question: q.q,
      options: q.opts,
      answer: q.a,
      explanation: null, // optional; shown after answering when present
    })),
  };
}

const festivals = ordered.map((key, index) => {
  const languages = {};
  for (const lang of LANGS) {
    const mapped = mapLang(DATA[key][lang]);
    if (mapped) languages[lang] = mapped;
  }
  return {
    id: key,
    slug: key,
    order: index + 1,
    deity: null, // optional metadata; fill in during content review if desired
    icon: key, // key into js/icons.js
    image: null, // optional illustration; see CONTENT_GUIDE.md
    languages,
  };
});

const out = {
  schemaVersion: 1,
  // Festival dates by year, kept separate from story/quiz content so a
  // volunteer can roll the app to a new year by copying the latest block.
  dates: DATES,
  festivals,
};

await writeFile(
  resolve(root, 'data', 'festivals.json'),
  JSON.stringify(out, null, 2) + '\n',
  'utf8'
);

// --- icons.js as a proper ES module (SVG strings are internal constants) ---
const iconsModule =
  `// Inline SVG icons, one per festival, keyed by festival id.\n` +
  `// These are trusted internal constants (not user/external content) and are\n` +
  `// rendered via a DOMParser helper in utils.js, never via innerHTML on data.\n` +
  `export const ICONS = ${JSON.stringify(ICONS, null, 2)};\n`;
await writeFile(resolve(root, 'js', 'icons.js'), iconsModule, 'utf8');

// --- UI strings module (used as a fallback / for tests) ---
console.log('Festivals:', festivals.length);
console.log('Languages present per festival:');
for (const f of festivals) {
  const present = LANGS.filter((l) => f.languages[l]);
  const missing = LANGS.filter((l) => !f.languages[l]);
  if (missing.length) {
    console.log(`  ${f.id}: has [${present}] MISSING [${missing}]`);
  }
}
console.log('UI_STRINGS langs:', Object.keys(UI_STRINGS).join(', '));
console.log('Done.');
