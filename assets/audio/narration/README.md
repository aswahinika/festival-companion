# Generated story narration (MP3)

These MP3s are **generated**, not hand-recorded. Create them with:

```bash
# set your Google Cloud TTS key first (see the script header), then:
node scripts/gen-narration.mjs --langs te,ta         # Telugu + Tamil
node scripts/gen-narration.mjs --langs te,ta,en,hi   # all four
```

The script writes `<festivalId>-<lang>.mp3` here and records each path in
`data/festivals.json` (`languages.<lang>.narration`). The app then **plays the
MP3** for that language's Read-aloud instead of the browser voice, so Telugu and
Tamil work on every device. Where no MP3 exists, the app falls back to the
browser's built-in voice.

This covers the **story/why narration only** — shloka recitation should be a
**human recording** (see `assets/audio/README.md`), since TTS mispronounces
Sanskrit/Tamil verses.

Commit the generated `.mp3` files together with the updated `festivals.json`.
