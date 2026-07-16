// Strong runtime validation for data/festivals.json.
// Goal: malformed content produces a clear, specific error message instead of
// a blank page or a confusing crash deep in the render code.
//
// Pure (no DOM), so it is reused directly by the Vitest suite.

export const SUPPORTED_LANGS = ['en', 'te', 'ta', 'hi'];

// Every language block must contain these text fields (non-empty strings).
const REQUIRED_TEXT_FIELDS = [
  'title',
  'subtitle',
  'story',
  'rituals',
  'importance',
];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate the parsed festivals data object.
 * @returns {{ok: boolean, errors: string[]}}
 */
export function validateFestivalData(data) {
  const errors = [];
  const add = (msg) => errors.push(msg);

  if (!data || typeof data !== 'object') {
    return { ok: false, errors: ['Data root is not an object.'] };
  }
  if (!Array.isArray(data.festivals) || data.festivals.length === 0) {
    return { ok: false, errors: ['"festivals" must be a non-empty array.'] };
  }

  const seenIds = new Set();

  data.festivals.forEach((f, fi) => {
    const where = `festival[${fi}]${f && f.id ? ` (id="${f.id}")` : ''}`;

    if (!isNonEmptyString(f.id)) add(`${where}: missing "id".`);
    else if (seenIds.has(f.id)) add(`${where}: duplicate id "${f.id}".`);
    else seenIds.add(f.id);

    if (!isNonEmptyString(f.slug)) add(`${where}: missing "slug".`);

    if (!f.languages || typeof f.languages !== 'object') {
      add(`${where}: missing "languages" object.`);
      return;
    }

    // English is the fallback language and must always be present.
    if (!f.languages.en) {
      add(`${where}: English ("en") content is required as the fallback.`);
    }

    for (const [lang, block] of Object.entries(f.languages)) {
      if (!SUPPORTED_LANGS.includes(lang)) {
        add(`${where}: unsupported language code "${lang}".`);
        continue;
      }
      const lw = `${where} lang="${lang}"`;

      for (const field of REQUIRED_TEXT_FIELDS) {
        if (!isNonEmptyString(block[field])) {
          add(`${lw}: missing or empty "${field}".`);
        }
      }

      // Shloka
      if (!block.shloka || typeof block.shloka !== 'object') {
        add(`${lw}: missing "shloka" object.`);
      } else {
        if (!isNonEmptyString(block.shloka.original)) {
          add(`${lw}: shloka.original is required.`);
        }
        if (!isNonEmptyString(block.shloka.meaning)) {
          add(`${lw}: shloka.meaning is required.`);
        }
        // transliteration and audio are optional (null allowed)
        if (
          block.shloka.transliteration != null &&
          typeof block.shloka.transliteration !== 'string'
        ) {
          add(`${lw}: shloka.transliteration must be text or null.`);
        }
      }

      // Quiz
      if (!Array.isArray(block.quiz) || block.quiz.length === 0) {
        add(`${lw}: "quiz" must be a non-empty array.`);
      } else {
        block.quiz.forEach((q, qi) => {
          const qw = `${lw} quiz[${qi}]`;
          if (!isNonEmptyString(q.question)) add(`${qw}: missing "question".`);
          if (!Array.isArray(q.options) || q.options.length < 2) {
            add(`${qw}: "options" must have at least 2 choices.`);
            return;
          }
          if (!q.options.every(isNonEmptyString)) {
            add(`${qw}: every option must be non-empty text.`);
          }
          if (
            !Number.isInteger(q.answer) ||
            q.answer < 0 ||
            q.answer >= q.options.length
          ) {
            add(
              `${qw}: "answer" (${q.answer}) must be a valid index 0..${
                q.options.length - 1
              }.`
            );
          }
        });
      }
    }
  });

  return { ok: errors.length === 0, errors };
}
