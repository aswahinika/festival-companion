// Read-aloud using the browser's built-in Web Speech API (SpeechSynthesis).
// Free, offline-capable, no API keys, no data leaves the device. Only the
// child-facing narrative (title + story + rituals + importance) is read — the
// shloka's original text is intentionally NOT spoken, since TTS mispronounces
// Sanskrit/Tamil recitation (leave that to human recordings).
//
// Voice quality is device-dependent. We (1) ask for Indian English (en-IN),
// (2) prefer the most natural-sounding voice available (Google/Natural/Neural/
// Online), and (3) report when a language has NO installed voice so the UI can
// disable the button instead of failing silently.

const BCP47 = { en: 'en-IN', te: 'te-IN', ta: 'ta-IN', hi: 'hi-IN' };

/** Map an app language code to a speech BCP-47 tag (Indian English by default). */
export function bcp47(lang) {
  return BCP47[lang] || 'en-IN';
}

/** True when the browser can synthesize speech at all. */
export function speechSupported() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

// Voices can load asynchronously; cache them and notify listeners when ready.
let voicesCache = [];
const voiceListeners = new Set();

function refreshVoices() {
  if (!speechSupported()) return;
  const v = window.speechSynthesis.getVoices();
  if (v && v.length) {
    voicesCache = v;
    voiceListeners.forEach((cb) => cb());
  }
}

if (speechSupported()) {
  refreshVoices();
  // Fired when the voice list becomes available/changes.
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}

/** Subscribe to voice-list changes; returns an unsubscribe function. */
export function onVoicesChanged(cb) {
  voiceListeners.add(cb);
  return () => voiceListeners.delete(cb);
}

// Score a voice for a target BCP-47 tag. Rejects wrong-language voices (< 0) so
// we never read Telugu text with, say, an English voice (which sounds like
// gibberish). Higher = better.
function scoreVoice(voice, tag) {
  const want = tag.toLowerCase();
  const base = want.split('-')[0];
  const vl = (voice.lang || '').toLowerCase().replace('_', '-');
  // Must be the right language, otherwise the audio is gibberish.
  if (!(vl === want || vl.startsWith(base + '-') || vl === base)) return -1;
  let score = 40; // correct language
  // "No robotic audio" is the priority: natural/cloud voices win decisively,
  // even over a robotic exact-locale (e.g. a natural en-US beats a robotic en-IN).
  if (/google|natural|neural|online|premium|enhanced|siri/i.test(voice.name))
    score += 50;
  if (voice.localService === false) score += 20; // cloud voices are the nicer ones
  if (vl === want) score += 15; // prefer exact locale (Indian English) when close
  if (/india|indian|hindi|telugu|tamil/i.test(voice.name)) score += 15;
  return score;
}

/** Best available voice for an app language, or null if none installed. */
export function pickVoice(lang) {
  const tag = bcp47(lang);
  let best = null;
  let bestScore = -1;
  for (const v of voicesCache) {
    const s = scoreVoice(v, tag);
    if (s > bestScore) {
      bestScore = s;
      best = v;
    }
  }
  return bestScore >= 0 ? best : null;
}

/** Whether a usable voice exists for this language on this device. */
export function hasVoice(lang) {
  return pickVoice(lang) !== null;
}

/**
 * Split text into sentence-sized chunks. Short utterances keep progress smooth
 * and sidestep the ~15s Chrome cutoff on long single utterances. Handles Latin
 * punctuation and the Devanagari danda (। ॥).
 */
export function splitSentences(text) {
  if (!text) return [];
  return text
    .split(/(?<=[.!?।॥])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Create a read-aloud controller. `onState({playing, paused})` fires on every
 * state change so the UI can update its button.
 */
export function createReader(onState = () => {}) {
  if (!speechSupported()) return null;
  const synth = window.speechSynthesis;
  let playing = false;
  let paused = false;
  let remaining = 0;

  const emit = () => onState({ playing, paused });

  /** @returns {boolean} true if speech started, false if no voice for lang. */
  function speak(segments, lang) {
    stop();
    const voice = pickVoice(lang);
    if (!voice) return false; // caller shows a "no voice" message

    const utterances = []
      .concat(segments)
      .filter(Boolean)
      .flatMap(splitSentences)
      .map((sentence) => {
        const u = new SpeechSynthesisUtterance(sentence);
        u.voice = voice;
        u.lang = voice.lang || bcp47(lang);
        u.rate = 0.95;
        u.pitch = 1;
        const done = () => {
          remaining -= 1;
          if (remaining <= 0) {
            playing = false;
            paused = false;
            emit();
          }
        };
        u.addEventListener('end', done);
        u.addEventListener('error', done);
        return u;
      });

    if (!utterances.length) return false;
    remaining = utterances.length;
    playing = true;
    paused = false;
    utterances.forEach((u) => synth.speak(u));
    emit();
    return true;
  }

  function pause() {
    if (playing && !paused) {
      synth.pause();
      paused = true;
      emit();
    }
  }

  function resume() {
    if (playing && paused) {
      synth.resume();
      paused = false;
      emit();
    }
  }

  function stop() {
    synth.cancel();
    playing = false;
    paused = false;
    remaining = 0;
    emit();
  }

  return {
    speak,
    pause,
    resume,
    stop,
    isPlaying: () => playing,
    isPaused: () => paused,
  };
}
