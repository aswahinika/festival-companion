# Festival Companion

A warm, child-friendly, **static** web app that introduces Hindu festivals — the
story, why we celebrate, what happens at the temple, and a related shloka — so
children can learn a little **before visiting the temple**.

It is designed to be offered as a free add-on to an existing temple website. It
does **not** duplicate the temple's calendar, events, donations, or announcements
— it links to the temple's own calendar.

- 🪔 21 festivals, each in **English, Telugu, Tamil, and Hindi**
- 📖 Story · At the Temple · Why We Do This · Shloka (with transliteration & meaning)
- 🧩 A short, accessible quiz for each festival and language
- 🎨 Decorative per-festival art (generated SVG banners in the temple palette)
- 🔊 Optional read-aloud of the story using the browser's built-in voice (no cost, offline)
- 📱 Mobile-first, installable (PWA), works offline once loaded
- ♿ Built toward WCAG 2.2 AA
- 🔒 No accounts, no database, no tracking — completely anonymous
- 💸 Hosts for free on static hosting

## Purpose

Help children understand a festival's **story, importance, rituals, and shloka**
before a temple visit. That narrow focus is deliberate; see
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for what is intentionally left out.

## Features

- Festival selector ordered by the current year's dates, with the title shown in
  the chosen language.
- Language toggle (English / Telugu / Tamil / Hindi) with the preference and the
  last-selected festival remembered in the browser.
- Graceful fallback to English when a translation is missing.
- Per-script fonts (Telugu / Tamil / Devanagari) and Sanskrit shlokas rendered in
  Devanagari.
- Accessible quiz: keyboard-friendly, ✓/✗ symbols and text (not color alone),
  screen-reader announcements, score, retry, and reset on switch.
- Optional (ready but off until you add files): shloka **audio**, festival
  **images**, and a **printable activity** link.
- Configurable temple branding, calendar link, disclaimer, and "Back to Temple"
  link — all in one file.

## Folder structure

```
festival-companion/
├── index.html                 App shell
├── css/styles.css             Styles
├── js/
│   ├── app.js  quiz.js  i18n.js  utils.js  validate.js  icons.js  config.js
├── data/festivals.json        All content + festival dates by year
├── assets/{images,audio,icons}
├── docs/
│   ├── CONTENT_GUIDE.md  REVIEW_CHECKLIST.md  ARCHITECTURE.md  IMPLEMENTATION_PLAN.md
├── scripts/                   dev server, data validator, icon/asset builders
├── tests/                     Vitest suite
├── sw.js  manifest.webmanifest
├── package.json  README.md
```

## How to run locally

You need [Node.js](https://nodejs.org) 18+ (only for the dev server and tests —
the app itself has no build step).

```bash
npm install          # one time, installs test/lint tools
npm run dev          # serve at http://localhost:5173
```

Open <http://localhost:5173>. Any static server works too; e.g.
`python -m http.server 5173`. Opening `index.html` directly via `file://` mostly
works but the service worker and `fetch` are disabled under `file://`, so prefer
the dev server.

## How to run tests

```bash
npm test             # run the Vitest suite once
npm run test:watch   # watch mode
npm run validate     # check data/festivals.json against the schema
npm run lint         # eslint
npm run format       # prettier --write
```

The suite covers data integrity (every festival/field/quiz-answer), language
handling and fallback, quiz scoring/reset, safe rendering, and an end-to-end boot
of the app in jsdom (asserting no console errors).

## How to edit festival content

See **[`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md)** — written for
nontechnical volunteers. In short: edit `data/festivals.json`, run
`npm run validate`, preview with `npm run dev`, then request review via
[`docs/REVIEW_CHECKLIST.md`](docs/REVIEW_CHECKLIST.md).

## How to configure temple branding

Edit **`js/config.js`**. Every value has a comment. Leave a value as `""` to hide
that element.

```js
export const CONFIG = {
  templeName: 'Sri … Temple',
  templeLogo: 'assets/images/temple-logo.png',
  templeWebsiteUrl: 'https://your-temple.org',
  templeCalendarUrl: 'https://your-temple.org/calendar',
  activitySheetUrl: '',
  footerMessage: '…',
  contentReviewAttribution: 'Content reviewed by …',
  disclaimer: '…',
};
```

## How to configure the temple calendar URL

This app has **no calendar of its own**. Set `templeCalendarUrl` in `js/config.js`
to the temple's existing calendar page. A "View the Temple Calendar" button then
appears and opens it safely in a new tab. Leave it `""` to hide the button.

## How to add audio

1. Add a **human-recorded** file to `assets/audio/` (see that folder's README).
2. Point the shloka's `"audio"` field at it in `data/festivals.json`.
   The player (play / pause / restart, no autoplay) appears automatically; a
   missing file hides itself gracefully. No AI-generated recitation.

## Read-aloud (browser voice)

Each festival shows a **🔊 Read aloud** button that speaks the story, rituals, and
"why" using the browser's built-in **Web Speech API** — free, no API keys, no data
sent anywhere, works offline, and follows the selected language. It appears only
in browsers that support speech, offers play/pause/resume/stop, never autoplays,
and pronunciation quality depends on the voices installed on the device. The
**shloka's original text is deliberately not spoken** (TTS mispronounces Sanskrit/
Tamil recitation) — use a human recording for that (see "How to add audio").

## Festival art

Each festival has a decorative SVG banner (temple arch, marigold toran, rangoli,
and a per-deity symbol such as a lamp, lotus, conch, or vel). These are **symbolic
motifs, not depictions of deities' faces/forms**, chosen to avoid iconography
errors. They're generated by `node scripts/make-art.mjs` into `assets/images/<id>.svg`.
To replace one, drop your own licensed image in `assets/images/` and set that
festival's `"image"` field in `data/festivals.json` (it overrides the generated art).

## Content disclaimer

A respectful disclaimer is shown near the top of the app and is fully editable in
`js/config.js`:

> Festival traditions and practices may vary by family, region, and temple. This
> content is intended as a child-friendly introduction and should be reviewed with
> a parent, elder, teacher, or priest.

## Privacy

The app works **completely anonymously** — no account or login. It uses local
browser storage only for your **preferred language** and **last selected festival**.
It does **not** collect names, birth dates, email, location, behavioral profiles,
advertising identifiers, or any cross-site tracking data, and includes no
analytics or ad trackers. It is not intended to collect children's personal
information.

## How to deploy

The app is just static files — upload the folder as-is (no build step). Exclude
`node_modules/`, `tests/`, `scripts/`, and `index.original.backup.html` if you
like; they aren't needed at runtime (but they're harmless).

> After deploying **code** changes with the PWA enabled, bump `CACHE_VERSION` in
> `sw.js`. Content-only changes to `festivals.json` need no bump (it's fetched
> network-first). See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

### 1. The temple's existing static hosting

Copy the project folder (or a subfolder like `/festivals/`) to the web root via
the host's file manager, FTP, or control panel. Ensure `.webmanifest` is served
as `application/manifest+json` (most hosts do). Visit the URL — done. If you
deploy to a subfolder, the app uses relative paths and will still work.

### 2. GitHub Pages

```bash
git init && git add . && git commit -m "Festival Companion"
git branch -M main
git remote add origin https://github.com/<you>/festival-companion.git
git push -u origin main
```

In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a
branch → `main` / root**. Your site appears at
`https://<you>.github.io/festival-companion/`. (Relative paths make the subpath
work.)

### 3. Cloudflare Pages

- **Dashboard → Workers & Pages → Create → Pages → Connect to Git**, pick the repo.
- Build command: **(leave empty)**. Build output directory: **`/`** (root).
- Deploy. You get a free `*.pages.dev` URL and can attach a custom domain.

Any equivalent static host (Netlify, GitLab Pages, S3+CloudFront, plain Nginx)
works the same way — no server code required.

## How to embed or link from the temple website

- **Link (recommended):** add a normal link/button to the deployed URL, e.g.
  "Learn about our festivals (for kids)."
- **Embed:** `<iframe src="https://…/festival-companion/" title="Festival Companion"
  style="width:100%;height:900px;border:0" loading="lazy"></iframe>`.
  To allow embedding, the host must send a
  `Content-Security-Policy: frame-ancestors 'self' https://your-temple.org;`
  header (the `frame-ancestors` directive can't be set from the app's `<meta>`
  CSP). See **Security** below.

## Security

- Content is rendered as text (no `innerHTML` on data); icons are internal
  constants parsed via `DOMParser`.
- A restrictive **Content Security Policy** is set via `<meta>` in `index.html`.
  For `frame-ancestors` (embedding) and stronger transport security, set headers
  on the host, e.g.:
  ```
  Content-Security-Policy: frame-ancestors 'self' https://your-temple.org;
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  ```
- External links use `target="_blank"` with `rel="noopener noreferrer"`.
- The only third-party resource is **Google Fonts** (`fonts.googleapis.com`,
  `fonts.gstatic.com`); the app falls back to system fonts if it's blocked. To
  remove the third party entirely, self-host the fonts and update the CSP.

## Performance

- No framework and minimal JS; content lazy-renders per festival.
- Fonts load with `display=swap`; images (when added) are `loading="lazy"`; audio
  uses `preload="none"`.
- Service worker caches the shell for instant repeat loads and offline use.

## Known limitations

- Content accuracy depends on human review — see `docs/REVIEW_CHECKLIST.md`.
  The `deity` field is intentionally blank (not guessed).
- Some **interface labels** were auto-translated during the refactor and need a
  native speaker's confirmation (listed in the review checklist).
- App icons and (optional) images/audio ship as placeholders or are absent by
  design; replace with real, licensed assets.
- Festival dates are provided for one year (2026) and should be verified and
  extended from the temple's published calendar.

## Future enhancement ideas

More festivals and languages; human audio narration; optional festival
illustrations; printable activity pages; parent discussion questions. The content
model is kept clean so a CMS or API could later replace the JSON file without
rewriting the UI (see `docs/ARCHITECTURE.md`).

## Credits & licensing

Built from an existing prototype; the original multilingual content was preserved.
Choose and add a license file appropriate for your temple before publishing, and
ensure any images/audio you add are properly licensed.
