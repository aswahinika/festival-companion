# Content Guide (for volunteers)

This guide is for a **nontechnical volunteer**. You do **not** need to know how to
program. Almost everything lives in one file: **`data/festivals.json`**.

> 💡 Golden rule: after any edit, run `npm run validate`. It checks your work and
> tells you — in plain language — if something is off, before it ever reaches a child.

## The tools you'll use

- A plain text editor (VS Code is free and recommended).
- A terminal, only for two simple commands:
  - `npm run dev` — preview the app at <http://localhost:5173>
  - `npm run validate` — check the content file for mistakes

If you have never run these, see the README section **"How to run locally."**

## Where things live

| You want to change… | Edit this file |
| --- | --- |
| A story, ritual, importance, shloka, quiz | `data/festivals.json` |
| Festival dates for a new year | `data/festivals.json` → `"dates"` |
| Temple name, logo, website, calendar link, disclaimer | `js/config.js` |
| Interface words (buttons, labels) | `js/i18n.js` |
| A festival image | `assets/images/` + the `"image"` field |
| A shloka recording | `assets/audio/` + the `"audio"` field |

## The shape of one festival

Each festival looks like this (shortened). **Keep the quotes, colons, and commas
exactly as shown.**

```json
{
  "id": "diwali",
  "slug": "diwali",
  "order": 18,
  "deity": null,
  "icon": "diwali",
  "image": null,
  "languages": {
    "en": {
      "title": "Diwali",
      "subtitle": "The festival of lights",
      "story": "Long ago …",
      "rituals": "At the temple …",
      "importance": "We celebrate because …",
      "shloka": {
        "original": "…",
        "transliteration": "…",
        "meaning": "…",
        "audio": null
      },
      "quiz": [
        {
          "question": "What do we light on Diwali?",
          "options": ["Lamps (diyas)", "Candles only", "Nothing"],
          "answer": 0,
          "explanation": "Diwali means a row of lamps."
        }
      ]
    },
    "te": { "…": "…" },
    "ta": { "…": "…" },
    "hi": { "…": "…" }
  }
}
```

Key points:

- `"answer"` is the **position** of the correct option, **counting from 0**.
  First option = `0`, second = `1`, third = `2`.
- `"transliteration"`, `"explanation"`, `"audio"`, `"image"`, and `"deity"` are
  **optional** — use `null` when you don't have them. Everything else is required.
- `"en"` (English) must always be present. If a language is missing, the app
  automatically shows English instead.

---

## How to… (step by step)

### Add or update a translation

1. Find the festival by its `"id"` in `data/festivals.json`.
2. Inside `"languages"`, find the language code (`en`, `te`, `ta`, `hi`).
3. Edit the text between the quotes. Keep the surrounding structure.
4. Save, then run `npm run validate`, then `npm run dev` to preview.
5. Request a content review (see below).

### Add a new quiz question

Inside a language's `"quiz"` list, add another block, separated by a comma:

```json
{
  "question": "Your question?",
  "options": ["First", "Second", "Third"],
  "answer": 1,
  "explanation": "Why the second one is correct."
}
```

Remember: `"answer": 1` means the **second** option is correct.

### Add a whole new festival

1. Copy an existing festival block `{ … }` (from `{` to its matching `}`).
2. Paste it into the `"festivals"` list, separated by a comma.
3. Change `"id"` and `"slug"` to a new, lowercase, no-spaces name (e.g. `"holi"`).
4. Update all the text in each language.
5. Add an icon: either reuse an existing `"icon"` value, or ask a developer to add
   a new SVG to `js/icons.js`. (If the icon name is unknown, the festival still
   works — it just shows no icon.)
6. Add a date (optional) under `"dates"` (see next).
7. `npm run validate`, then preview.

### Add or update a shloka

Edit the `"shloka"` object for each language:

```json
"shloka": {
  "original": "The shloka in its original script",
  "transliteration": "How to say it (or null)",
  "meaning": "What it means in this language",
  "audio": null
}
```

The `original` shloka is treated as **Sanskrit** and shown in the Devanagari font.

### Add audio for a shloka

1. Put the recording in `assets/audio/` (see that folder's README for guidelines).
2. Set the `"audio"` field to its path, e.g. `"assets/audio/diwali-en.mp3"`.
3. Only **human recordings** — no AI-generated recitation. Have pronunciation
   reviewed.

### Add an image for a festival

1. Put an optimized image in `assets/images/` (see that folder's README).
2. Set the festival's `"image"` field, e.g. `"assets/images/diwali.jpg"`.
3. Use only clearly-licensed or original artwork.

### Update festival dates for a new year

In `data/festivals.json`, find `"dates"`. Copy the most recent year's block,
rename the year, and edit the values from the temple's published calendar:

```json
"dates": {
  "2026": { "diwali": { "display": "Nov 8", "sort": "11-08" } },
  "2027": { "diwali": { "display": "Nov ?", "sort": "11-??" } }
}
```

- `display` is what people see (e.g. `"Nov 8"` or `"Apr 7-10"`).
- `sort` controls ordering; always `MM-DD` with leading zeros (e.g. `"11-08"`).
- The app automatically uses the current year, falling back to the latest year
  present. Nothing else needs to change.

### Update the temple calendar URL, name, or logo

Open `js/config.js` and edit the values in quotes. Leave a value as `""` to hide
that element. This app does **not** have its own calendar — the calendar link
points to the temple's existing calendar page.

### Validate JSON

```bash
npm run validate
```

Green check = good. A red ✗ lists exactly what to fix (which festival, which
language, which field). Common mistakes: a missing comma, a missing quote, or an
`"answer"` number that is too big.

### Preview changes locally

```bash
npm run dev
```

Then open <http://localhost:5173> and try each language and festival.

### Request content review

Open `docs/REVIEW_CHECKLIST.md`, find the festival you changed, and ask a priest,
elder, teacher, or native-language reviewer to check it and sign off.

### Deploy an update

See the README section **"How to deploy."** In short: upload the whole folder to
your static host (or push to GitHub). **If you use the PWA/offline feature, also
bump the cache version** — see `docs/ARCHITECTURE.md` → "Publishing updates."
