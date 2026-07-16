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

// --dry-run: validate the plan (festivals, languages, chunking) without a key
// or any API calls — nothing is written.
const DRY = process.argv.includes('--dry-run');

const API_KEY = process.env.GOOGLE_TTS_API_KEY;
if (!API_KEY && !DRY) {
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

const LC = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN' };

// Candidate voices per language, MOST human-sounding first. The script probes
// them once (a tiny, ~free call) and uses the first one enabled for your project
// — so a single run gives you the best available voice (Chirp3-HD, Google's most
// natural "human" tier — Indian accent via the en-IN locale) with automatic
// fallback to Neural2/Wavenet if Chirp3 isn't available. No trial and error.
const VOICE_CANDIDATES = {
  en: [
    'en-IN-Chirp3-HD-Kore',
    'en-IN-Chirp3-HD-Aoede',
    'en-IN-Neural2-A',
    'en-IN-Wavenet-A',
    'en-IN-Standard-A',
  ],
  hi: [
    'hi-IN-Chirp3-HD-Kore',
    'hi-IN-Neural2-A',
    'hi-IN-Wavenet-A',
    'hi-IN-Standard-A',
  ],
  te: ['te-IN-Chirp3-HD-Kore', 'te-IN-Standard-A', 'te-IN-Standard-B'],
  ta: ['ta-IN-Chirp3-HD-Kore', 'ta-IN-Wavenet-A', 'ta-IN-Standard-A'],
};
const resolvedVoice = {};

async function resolveVoice(lang) {
  if (lang in resolvedVoice) return resolvedVoice[lang];
  const languageCode = LC[lang];
  for (const name of VOICE_CANDIDATES[lang] || []) {
    try {
      await synth('Namaste', { languageCode, name }); // tiny probe (~free)
      resolvedVoice[lang] = { languageCode, name };
      console.log(`Voice for ${lang}: ${name}`);
      return resolvedVoice[lang];
    } catch {
      // not enabled for this project/region — try the next candidate
    }
  }
  console.error(`No usable voice for "${lang}".`);
  resolvedVoice[lang] = null;
  return null;
}

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
        // Chirp3-HD ignores/limits speakingRate — omit it there so the probe and
        // synthesis succeed and we keep the natural pace.
        audioConfig: /Chirp3/i.test(voice.name)
          ? { audioEncoding: 'MP3' }
          : { audioEncoding: 'MP3', speakingRate: 0.92 },
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

    let voice;
    if (DRY) {
      voice = {
        languageCode: LC[lang],
        name: (VOICE_CANDIDATES[lang] || ['?'])[0],
      };
    } else {
      voice = await resolveVoice(lang);
      if (!voice) continue;
    }
    const narrative = [c.title, c.story, c.rituals, c.importance]
      .filter(Boolean)
      .join('. ');
    const chunks = chunkText(narrative);

    if (DRY) {
      console.log(
        `• ${f.id} [${lang}] via ${voice.name}: ${chunks.length} chunk(s), ${bytes(narrative)} bytes`
      );
      made++;
      continue;
    }

    try {
      const parts = [];
      for (const chunk of chunks) {
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

if (DRY) {
  console.log(
    `\nDry run: would generate ${made} file(s) for [${LANGS.join(', ')}]. No key used, nothing written.`
  );
  process.exit(0);
}

await writeFile(dataFile, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(
  `\nDone. Generated ${made} narration file(s) for [${LANGS.join(', ')}].`
);
console.log(
  'Commit assets/audio/narration/*.mp3 + data/festivals.json, then deploy.'
);
