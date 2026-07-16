# Festival images (optional)

Drop optional festival illustrations here, then reference them from
`data/festivals.json` via each festival's `"image"` field, e.g.:

```json
"image": "assets/images/diwali.jpg"
```

Guidelines:

- Images are **optional** — a festival with `"image": null` simply shows no image.
- Provide **descriptive alt text** naturally: the app uses `"<title> illustration"`.
- Keep files small (aim for < 150 KB; use WebP or optimized JPG/PNG).
- Recommended size: ~840 px wide (displayed at up to 420 px, 2× for sharpness).
- Images are **lazy-loaded** automatically.
- **Do not** add copyrighted images downloaded from the internet.
- Use clearly-licensed artwork, temple-provided photos, or original illustrations.
- Placeholder art should be clearly marked as a placeholder.
