// Read-aloud using the browser's built-in Web Speech API (SpeechSynthesis).
// Free, offline-capable, no API keys, no data leaves the device. Only the
// child-facing narrative (title + story + rituals + importance) is read — the
// shloka's original text is intentionally NOT spoken, since TTS mispronounces
// Sanskrit/Tamil recitation (leave that to human recordings).

const BCP47 = { en: 'en-IN', te: 'te-IN', ta: 'ta-IN', hi: 'hi-IN' };

/** Map an app language code to a speech BCP-47 tag. */
export function bcp47(lang) {
  return BCP47[lang] || 'en-US';
}

/** True when the browser can synthesize speech. */
export function speechSupported() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
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
 * Create a read-aloud controller. `onState({playing, paused})` is called on
 * every state change so the UI can update its button.
 */
export function createReader(onState = () => {}) {
  if (!speechSupported()) return null;
  const synth = window.speechSynthesis;
  let playing = false;
  let paused = false;
  let remaining = 0;

  const emit = () => onState({ playing, paused });

  function speak(segments, lang) {
    stop();
    const utterances = []
      .concat(segments)
      .filter(Boolean)
      .flatMap(splitSentences)
      .map((sentence) => {
        const u = new SpeechSynthesisUtterance(sentence);
        u.lang = bcp47(lang);
        u.rate = 0.95;
        u.addEventListener('end', () => {
          remaining -= 1;
          if (remaining <= 0) {
            playing = false;
            paused = false;
            emit();
          }
        });
        u.addEventListener('error', () => {
          remaining -= 1;
          if (remaining <= 0) {
            playing = false;
            paused = false;
            emit();
          }
        });
        return u;
      });

    if (!utterances.length) return;
    remaining = utterances.length;
    playing = true;
    paused = false;
    utterances.forEach((u) => synth.speak(u));
    emit();
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
