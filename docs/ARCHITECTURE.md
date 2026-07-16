# Architecture

## Overview

Festival Companion is a **static, framework-free web app**: plain HTML, CSS, and
ES-module JavaScript, plus one JSON content file. It can be hosted on any static
host at (near) zero cost, and works offline once loaded.

```
index.html            App shell (semantic markup only, no content, no inline JS)
css/styles.css        All styling (warm temple theme, per-script fonts, a11y)
js/
  app.js              Orchestrator: load → validate → build controls → render
  i18n.js             UI strings, active language, persistence, fallback rule
  quiz.js             Quiz state (pure) + accessible rendering
  validate.js         Runtime schema validation (shared with tests & CLI)
  utils.js            Safe DOM builder, fetch, external links, storage helpers
  icons.js            Inline SVG icons (trusted internal constants)
  config.js           Temple branding & links (the one place to configure)
data/festivals.json   All festival content + festival dates by year
assets/               Optional images, audio, app icons
sw.js                 Service worker (offline shell + fresh content)
manifest.webmanifest  PWA manifest
```

## Why no backend (intentional)

The brief is narrow: help children learn about festivals before a temple visit.
That need is fully met by static content. A backend would add hosting cost,
security surface, maintenance burden, and privacy risk (especially for a
children's app) with no benefit today. The temple website already owns the
calendar, donations, events, and announcements — this app deliberately does not
duplicate them; it just links to the calendar.

So: **no server, no database, no accounts, no profiles, no tracking.** The app is
anonymous and reads a JSON file.

## How content is loaded

1. `app.js` calls `fetchJson('data/festivals.json')`.
2. The parsed object is checked by `validateFestivalData()` (`js/validate.js`).
   If anything is malformed, the app shows a clear, friendly message and logs the
   specific problem — it never renders half-broken content.
3. Valid data is held in memory and rendered on demand.

Content is **rendered as DOM text** (`createElement` + `textContent`), never via
`innerHTML` on data. Multi-line shlokas use CSS `white-space: pre-line`. The only
markup injected is the icon SVGs, which are **internal constants** in `icons.js`
parsed with `DOMParser` — never anything from the JSON file.

## How language fallback works

- The four supported languages are `en`, `te`, `ta`, `hi`; **English is the
  guaranteed fallback**.
- `resolveLang(festival, wanted)` returns `wanted` if that translation exists on
  the festival, otherwise `'en'`.
- The chosen language is stored in `localStorage` (`festivalCompanion.lang`) and
  restored on the next visit.
- Each rendered piece of text carries a correct `lang` attribute so screen
  readers pronounce it properly and the right font applies:
  - Telugu → `:lang(te)`, Tamil → `:lang(ta)`, Hindi → `:lang(hi)`.
  - The shloka's original text is Sanskrit and is tagged **`lang="sa"`** so it
    always uses the Devanagari font — fixing a bug in the prototype where a single
    font stack (Telugu-first) was applied to all Indic scripts including Sanskrit.
- `document.documentElement.lang` is updated on switch so assistive tech detects
  the language change.

## How quiz state works

- State is **per festival + language** (`"{festivalId}:{lang}"`), held in memory
  for the session. Switching festival or language shows that combination's own
  fresh quiz — satisfying "reset on switch."
- Pure functions in `quiz.js` (`newQuizState`, `recordAnswer`, `isComplete`,
  `scoreOf`) hold all the logic and are unit-tested directly. `recordAnswer`
  scores a question **at most once**, preventing double-counting.
- Results are communicated **not by color alone**: correct/incorrect options get a
  ✓/✗ symbol plus a visually-hidden "Correct answer"/"Your answer" label, and each
  answer is announced through a polite `aria-live` region.
- Quiz progress is intentionally **not** persisted across reloads (keeps the
  "reset on switch" behavior simple and avoids confusing stale progress).

## How PWA caching works

`sw.js` uses two strategies chosen so **stale caching never hides new content**:

- **App shell** (HTML/CSS/JS/icons): *cache-first*, refreshed in the background
  (stale-while-revalidate) — instant loads, and offline.
- **Content (`festivals.json`) and page navigations**: *network-first*, falling
  back to the last cached copy when offline. So a freshly deployed
  `festivals.json` appears immediately while online; the last-seen content is
  still available offline.
- Only **same-origin** requests are cached. Third-party requests (e.g. Google
  Fonts) are never cached by the worker.

### Publishing updates

The cache name is versioned: `festival-companion-<CACHE_VERSION>` in `sw.js`.

- Editing **only `data/festivals.json`**: no version bump needed — it's fetched
  network-first, so online users get it right away.
- Editing **code or shell files** (HTML/CSS/JS): bump `CACHE_VERSION` (e.g.
  `'v1'` → `'v2'`) in `sw.js` and redeploy. On next visit the old cache is
  deleted and the new shell is fetched. `skipWaiting()` + `clients.claim()` make
  the update take effect promptly.

The app also works perfectly as an ordinary website if the service worker is
unsupported or the user never installs it.

## How a future API or CMS could replace the JSON file

The UI depends only on the **shape** of the data (`js/validate.js` is the
contract), not on where it comes from. To move to an API or headless CMS later:

1. Keep the same object shape (or transform the API response into it).
2. Change the single call `fetchJson('data/festivals.json')` in `app.js` to point
   at the API endpoint.
3. Keep running `validateFestivalData()` on the response so bad data still fails
   safely.

No rendering, quiz, i18n, or styling code needs to change. Because content is
already separated from presentation, an admin editor or multi-temple setup can be
layered on without rewriting the UI.

## Accessibility & security notes

- Semantic landmarks (`header`/`main`/`footer`), one `h1`, festival `h2`, section
  `h3`s; skip link; visible focus; ≥44px touch targets; reduced-motion support.
- A recommended **Content Security Policy** is set via `<meta>` in `index.html`.
  `frame-ancestors` cannot be set from a meta tag — if you embed this app in the
  temple site with an `<iframe>`, add that directive as an HTTP header on the host
  (see README → Security).
- No analytics, no ads, no third-party scripts. The only external resource is
  Google Fonts (documented; the app degrades to system fonts without it).
