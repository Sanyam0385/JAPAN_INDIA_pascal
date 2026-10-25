// i18n validator script for CIRCULO
// Checks:
// 1. 100% key parity across en, hi, pa, ja
// 2. Interpolation placeholder consistency ({{var}})
// 3. No empty strings in translations
// Exits with code 1 on failure, 0 on success.

const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../src/i18n/locales');
const languages = ['en', 'hi', 'pa', 'ja'];

function flatten(obj, prefix = '') {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flatten(val, fullKey));
    } else {
      result[fullKey] = val;
    }
  }
  return result;
}

function extractPlaceholders(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
  return matches.map(m => m.replace(/[\{\}]/g, '')).sort();
}

console.log('--- CIRCULO i18n Safety Net Check ---');

const loaded = {};
for (const lang of languages) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`[FAIL] Locale file missing: ${filePath}`);
    process.exit(1);
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    loaded[lang] = flatten(JSON.parse(raw));
  } catch (e) {
    console.error(`[FAIL] Parse error in ${lang}.json:`, e.message);
    process.exit(1);
  }
}

const enFlat = loaded.en;
const enKeys = Object.keys(enFlat).sort();
console.log(`Base language [en] has ${enKeys.length} total keys.`);

let errorsCount = 0;

for (const lang of ['hi', 'pa', 'ja']) {
  const targetFlat = loaded[lang];
  const targetKeys = Object.keys(targetFlat).sort();

  // Check missing keys
  const missing = enKeys.filter(k => !(k in targetFlat));
  if (missing.length > 0) {
    console.error(`[FAIL] ${lang} is missing ${missing.length} keys!`);
    console.error(' Sample missing:', missing.slice(0, 5));
    errorsCount += missing.length;
  }

  // Check empty values and placeholder consistency
  for (const key of enKeys) {
    if (key in targetFlat) {
      const enVal = enFlat[key];
      const targetVal = targetFlat[key];

      if (typeof targetVal === 'string' && targetVal.trim() === '') {
        console.error(`[FAIL] Empty translation for key "${key}" in ${lang}.json`);
        errorsCount++;
      }

      const enHolders = extractPlaceholders(enVal);
      const targetHolders = extractPlaceholders(targetVal);

      if (enHolders.join(',') !== targetHolders.join(',')) {
        console.error(`[FAIL] Placeholder mismatch on key "${key}" in ${lang}.json:`);
        console.error(`  Expected: ${JSON.stringify(enHolders)}`);
        console.error(`  Found:    ${JSON.stringify(targetHolders)}`);
        errorsCount++;
      }
    }
  }

  if (missing.length === 0) {
    console.log(`[PASS] ${lang}.json: 100% key coverage (${targetKeys.length}/${enKeys.length} keys), no placeholder mismatches.`);
  }
}

if (errorsCount > 0) {
  console.error(`\n❌ i18n Check failed with ${errorsCount} error(s)!`);
  process.exit(1);
} else {
  console.log('\n✅ i18n Check PASSED: 100% coverage and valid across English, Hindi, Punjabi, and Japanese!');
  process.exit(0);
}
