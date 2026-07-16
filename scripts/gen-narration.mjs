// Pre-generate story narration MP3s with Google Cloud Text-to-Speech, so
// Telugu/Tamil (and optionally English/Hindi) read-aloud works on EVERY device,
// not just ones with the right browser voice installed.
//
// This runs ONCE on your machine. Nothing sensitive is committed: the API key
// lives only in your shell, the app ships only the resulting static MP3s.
//
// ── Setup ────────────────────────────────────────────────────────────────
//   1. Create a Google Cloud project, enable "Cloud Text-to-Speech API",
//      and make an API key (APIs & Services → Credentials → Create API key).
//   2. In your terminal:
//        Windows PowerShell:  $env:GOOGLE_TTS_API_KEY = "AIza..."
//        macOS/Linux/bash:    export GOOGLE_TTS_API_KEY="AIza..."
//   3. Run (defaults to Telugu + Tamil, the ones browsers lack):
//        node scripts/gen-narration.mjs
//      Or choose languages explicitly:
//        node scripts/gen-narration.mjs --langs te,ta,en,hi
//   4. Commit the new assets/audio/narration/*.mp3 and the updated
//      data/festivals.json, then deploy.
//
// Cost is a few cents total (one-time). Hosting the MP3s is free.
// NOTE: this narrates the STORY/why only — NOT the shloka recitation, which
// should be a human recording (TTS mispronounces Sanskrit/Tamil verses).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'assets', 'audio', 'narration');
const dataFile = resolve(root, 'data', 'festivals.json');

const API_KEY = process.env.GOOGLE_TTS_API_KEY;
if (!API_KEY) {
  console.error(
    'Missing GOOGLE_TTS_API_KEY. See the setup notes at the top of this file.'
  );
  process.exit(1);
}

// Which languages to generate (default: the two browsers usually can't do).
const langArg = process.argv.find((a) => a.startsWith('--langs='));
const langsFromEquals = langArg ? langArg.split('=')[1] : null;
const idx = process.argv.indexOf('--langs');
const langsFromSpace = idx !== -1 ? process.argv[idx + 1] : null;
const LANGS = (langsFromEquals || langsFromSpace || 'te,ta')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Voice per language. Swap these for other/newer voices from the Google console
// (e.g. Chirp3-HD voices) if you prefer — just keep the languageCode correct.
const VOICES = {
  en: { languageCode: 'en-IN', name: 'en-IN-Neural2-A' },
  hi: { languageCode: 'hi-IN', name: 'hi-IN-Neural2-A' },
  te: { languageCode: 'te-IN', name: 'te-IN-Standard-A' },
  ta: { languageCode: 'ta-IN', name: 'ta-IN-Wavenet-A' },
};

const MAX_BYTES = 4000; // stay well under the 5000-byte request limit (UTF-8)
const bytes = (s) => Buffer.byteLength(s, 'utf8');

function splitSentences(text) {
  return text
    .split(/(?<=[.!?।॥])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Group sentences into chunks under the byte limit (Indic scripts are ~3 B/char).
function chunkText(text) {
  const chunks = [];
  let cur = '';
  for (const sentence of splitSentences(text)) {
    const piece = cur ? cur + ' ' + sentence : sentence;
    if (bytes(piece) > MAX_BYTES && cur) {
      chunks.push(cur);
      cur = sentence;
    } else {
      cur = piece;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

async function synth(text, voice) {
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: voice.languageCode, name: voice.name },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 0.92 },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TTS ${res.status}: ${body.slice(0, 300)}`);
  }
  const { audioContent } = await res.json();
  return Buffer.from(audioContent, 'base64');
}

const data = JSON.parse(await readFile(dataFile, 'utf8'));
await mkdir(outDir, { recursive: true });

let made = 0;
for (const f of data.festivals) {
  for (const lang of LANGS) {
    const c = f.languages[lang];
    if (!c) continue;
    const voice = VOICES[lang];
    if (!voice) {
      console.warn(`No voice configured for "${lang}" — skipping.`);
      continue;
    }
    const narrative = [c.title, c.story, c.rituals, c.importance]
      .filter(Boolean)
      .join('. ');
    try {
      const parts = [];
      for (const chunk of chunkText(narrative)) {
        parts.push(await synth(chunk, voice));
      }
      const rel = `assets/audio/narration/${f.id}-${lang}.mp3`;
      await writeFile(resolve(root, rel), Buffer.concat(parts));
      c.narration = rel; // record path so the app plays it
      made++;
      console.log(`✓ ${f.id} [${lang}]`);
    } catch (err) {
      console.error(`✗ ${f.id} [${lang}]: ${err.message}`);
    }
  }
}

await writeFile(dataFile, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(
  `\nDone. Generated ${made} narration file(s) for [${LANGS.join(', ')}].`
);
console.log(
  'Commit assets/audio/narration/*.mp3 + data/festivals.json, then deploy.'
);
