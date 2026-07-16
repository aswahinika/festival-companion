# Shloka audio (optional)

Drop optional **human-recorded** shloka audio here, then reference it from
`data/festivals.json` under each language's `shloka.audio` field, e.g.:

```json
"shloka": {
  "original": "…",
  "transliteration": "…",
  "meaning": "…",
  "audio": "assets/audio/shivaratri-en.mp3"
}
```

Guidelines:

- Audio is **optional** — when `audio` is `null`, no player is shown.
- The player never autoplays and includes play/pause plus a restart button.
- Use **human recordings** by a qualified reciter. **Do not** use AI-generated
  audio for religious recitation at this stage.
- Recommended format: MP3 or M4A, mono, ~96 kbps is plenty for speech.
- Keep files small; they are only loaded when the child presses play (`preload="none"`).
- A missing or broken audio file fails gracefully (the player hides itself).
- Have pronunciation reviewed (see `docs/REVIEW_CHECKLIST.md`).

No sample recordings are included, to avoid shipping fake religious audio.
