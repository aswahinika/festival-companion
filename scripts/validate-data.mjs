// CLI content validator for volunteers: `npm run validate`.
// Checks that data/festivals.json is valid JSON and matches the schema, and
// prints clear, line-free error messages. Exits non-zero on failure so it can
// be wired into a pre-deploy check.

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFestivalData, SUPPORTED_LANGS } from '../js/validate.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'data', 'festivals.json');

let data;
try {
  data = JSON.parse(await readFile(file, 'utf8'));
} catch (err) {
  console.error('❌ data/festivals.json is not valid JSON:');
  console.error('   ' + err.message);
  process.exit(1);
}

const { ok, errors } = validateFestivalData(data);

if (!ok) {
  console.error(`❌ Found ${errors.length} content problem(s):`);
  for (const e of errors) console.error('   • ' + e);
  process.exit(1);
}

// Friendly coverage summary (not an error — English is the only required lang).
console.log(`✅ ${data.festivals.length} festivals, valid.`);
for (const f of data.festivals) {
  const missing = SUPPORTED_LANGS.filter((l) => !f.languages[l]);
  if (missing.length) {
    console.log(
      `   ℹ ${f.id}: no translation yet for [${missing.join(', ')}] (will fall back to English)`
    );
  }
}
console.log('All good. 🎉');
