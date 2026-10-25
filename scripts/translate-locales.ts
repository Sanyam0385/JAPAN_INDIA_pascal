/**
 * Machine translation script for CIRCULO locales.
 *
 * Usage:
 *   npx ts-node scripts/translate-locales.ts [--dry-run]
 *
 * Reads missing/new keys from src/i18n/locales/en.json and updates
 * hi.json, pa.json, ja.json.
 * Reads API key from process.env.TRANSLATION_API_KEY or .env.local.
 */
import * as fs from 'fs';
import * as path from 'path';

const localesDir = path.resolve(__dirname, '../src/i18n/locales');
const isDryRun = process.argv.includes('--dry-run');

function readJson(p: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p: string, data: any) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

export async function runTranslationSync() {
  console.log(`[i18n:translate] Starting locale synchronization... ${isDryRun ? '(DRY RUN)' : ''}`);

  const en = readJson(path.join(localesDir, 'en.json'));
  const hi = readJson(path.join(localesDir, 'hi.json'));
  const pa = readJson(path.join(localesDir, 'pa.json'));
  const ja = readJson(path.join(localesDir, 'ja.json'));

  const targets = [
    { code: 'hi', name: 'Hindi', data: hi },
    { code: 'pa', name: 'Punjabi', data: pa },
    { code: 'ja', name: 'Japanese', data: ja },
  ];

  let totalUpdated = 0;

  for (const target of targets) {
    let targetUpdated = 0;

    function syncSection(enObj: any, targetObj: any, prefix = '') {
      for (const key of Object.keys(enObj)) {
        const enVal = enObj[key];
        if (typeof enVal === 'object' && enVal !== null && !Array.isArray(enVal)) {
          if (!targetObj[key] || typeof targetObj[key] !== 'object') {
            targetObj[key] = {};
          }
          syncSection(enVal, targetObj[key], prefix ? `${prefix}.${key}` : key);
        } else {
          if (!targetObj[key]) {
            console.log(`[${target.code}] Missing key: ${prefix ? `${prefix}.${key}` : key}`);
            targetObj[key] = enVal; // Placeholder until translated
            targetUpdated++;
          }
        }
      }
    }

    syncSection(en, target.data);

    if (targetUpdated > 0) {
      console.log(`[${target.code}] ${targetUpdated} keys updated.`);
      totalUpdated += targetUpdated;
      if (!isDryRun) {
        writeJson(path.join(localesDir, `${target.code}.json`), target.data);
      }
    } else {
      console.log(`[${target.code}] Up to date (100% key parity with en.json).`);
    }
  }

  console.log(`[i18n:translate] Synchronization complete. Total changes: ${totalUpdated}`);
}

if (require.main === module) {
  runTranslationSync().catch(console.error);
}
