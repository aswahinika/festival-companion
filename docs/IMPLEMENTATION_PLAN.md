# Implementation Plan — Festival Companion

_Concise plan produced after inspecting the original single-file prototype._

## 1. What the original prototype contained

- **One file:** `index.html` (~2,010 lines, ~419 KB) — HTML + CSS + JS inline.
- **21 festivals**, each in **4 languages** (English, Telugu, Tamil, Hindi). All 21
  have complete content in all 4 languages (verified — 0 missing fields).
- Per festival/language: title, subtitle, story, temple rituals, "why", shloka
  (Sanskrit + transliteration + meaning), and a 4-question quiz.
- **Date logic** decoupled by year (`DATES["2026"]`) with a graceful fallback to the
  most recent year — a genuinely good design worth keeping.
- **Language fallback** to English when a translation is missing.
- Inline SVG icons (one per festival) + animated header diya (SMIL).
- Warm temple palette (cream/maroon/marigold/gold), responsive `max-width:760px`.

## 2. Findings

### Bugs / correctness
- Quiz results communicated **by color only** (`.correct`/`.wrong`) — fails WCAG 1.4.1.
- No `aria-live` announcement of quiz feedback or score for screen readers.
- **Font rule hazard** (`[lang="te"] p, [lang="ta"] p, [lang="hi"] p { font-family: 'Noto Sans Telugu','Noto Sans Tamil','Noto Sans Devanagari' }`):
  a single stack applied to all Indic languages, listing Telugu **first** for Tamil/Hindi
  content and applying it to the Devanagari Sanskrit shloka regardless of UI language.
  Exactly the mis-application the brief warns about.
- Language + festival selection **not persisted** across reloads.
- Language buttons lacked `aria-pressed`; `<select>`/labels usable but minimal.

### Security / maintainability
- Everything rendered via **`innerHTML`** with data interpolated into template strings.
  Safe while data is hardcoded, but becomes an injection surface once data is external.
- 1,400+ lines of content interleaved with logic — hard for a volunteer to edit.
- Inline `onclick=` handlers; no CSP; external Google Fonts undocumented.

### Missing vs. brief
- No temple branding/config, no "Back to Temple"/calendar link, no disclaimer.
- No tests, docs, PWA, or privacy statement.

## 3. Approach (MVP-first, preserve design & content)

1. **Content → data/festivals.json** via a one-off transform script (`scripts/extract.mjs`)
   that slices the legacy objects and re-emits them — no hand-retyping, Unicode preserved.
   New schema per the brief (id/slug/order/deity/icon/image/languages → title, subtitle,
   story, rituals, importance, shloka{original,transliteration,meaning,audio}, quiz).
2. **Split JS** into ES modules: `utils.js` (safe DOM, fetch, validation, external links),
   `i18n.js` (UI strings, language state + localStorage, fallback), `quiz.js` (state,
   scoring, a11y), `icons.js` (SVG constants), `config.js` (branding/links/disclaimer),
   `app.js` (orchestration). **No framework.**
3. **Safe rendering:** build DOM with `createElement`/`textContent`; multiline shloka via
   CSS `white-space: pre-line` (no `innerHTML` on JSON data). Icons parsed via `DOMParser`.
4. **CSS → css/styles.css**; fix per-script fonts using `:lang(te|ta|hi|sa)`; add visible
   focus, ≥44px touch targets, contrast, reduced-motion, print link, quiz ✓/✗ (not color).
5. **index.html** = semantic shell only + CSP meta + branding/calendar links + disclaimer.
6. **PWA:** `manifest.webmanifest` + versioned `sw.js` (cache-first shell, network-first
   data so new content appears) + icon placeholders. App still works without install.
7. **Tests:** Vitest — data schema/quiz indices/language coverage/fallback + quiz scoring
   + i18n. **Docs:** README, CONTENT_GUIDE, REVIEW_CHECKLIST, ARCHITECTURE.

## 4. Explicitly out of scope (per brief)
Backend, DB, auth, profiles, separate calendar, donations, social, chatbot, framework
migration. No content rewrites beyond encoding/spelling/format fixes. No fabricated
translations, shlokas, dates, deities, or recordings.

## 5. Items flagged for human review
Deity field left `null` (not fabricated); all religious content, translations, shlokas,
transliterations, and quiz answers to be verified per `docs/REVIEW_CHECKLIST.md`.
