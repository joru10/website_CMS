#!/usr/bin/env node
/**
 * Translation validation checks
 * - Ensures each locale JSON file parses correctly
 * - Detects duplicate keys per locale
 * - Confirms all locales expose the same set of keys
 * - Guards informal tone requirements for Spanish (no "su" / "sus" / "usted")
 * - Reports missing translation keys per locale and optional coverage summary
 * - (Stub) Validates that CMS content files provide localized variants
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TRANSLATIONS_DIR = path.join(ROOT, 'translations');
const LOCALES = ['en', 'es', 'fr'];
const CONTENT_DIR = path.join(ROOT, 'content');

const errors = [];
const warnings = [];
const localeKeySets = new Map();
const localeKeyOrder = new Map();
const missingContentLocales = [];
const STRICT_CONTENT_I18N = process.env.STRICT_CONTENT_I18N === 'true';

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function ensureTranslationDir() {
  if (!fs.existsSync(TRANSLATIONS_DIR)) {
    addError(`Translations directory not found: ${TRANSLATIONS_DIR}`);
  }
}

function loadLocale(locale) {
  const filePath = path.join(TRANSLATIONS_DIR, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    addError(`Missing translation file for locale '${locale}': ${filePath}`);
    return;
  }

  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    addError(`Unable to read ${filePath}: ${err.message}`);
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    addError(`JSON parse error in ${filePath}: ${err.message}`);
    return;
  }

  if (!parsed || !Array.isArray(parsed.strings)) {
    addError(`${filePath} must export an object with a "strings" array`);
    return;
  }

  const keys = new Set();

  parsed.strings.forEach((item, index) => {
    const pointer = `${filePath} -> strings[${index}]`;
    if (!item || typeof item.key !== 'string') {
      addError(`${pointer} is missing a valid "key" property`);
      return;
    }
    if (typeof item.value !== 'string') {
      addError(`${pointer} is missing a valid "value" property (must be string)`);
    }
    if (keys.has(item.key)) {
      addError(`${filePath} contains duplicated key "${item.key}"`);
    }
    keys.add(item.key);
    localeKeyOrder.set(`${locale}:${item.key}`, index);

    if (locale === 'es' && typeof item.value === 'string') {
      checkSpanishTone(item.value, pointer, item.key);
    }
  });

  localeKeySets.set(locale, keys);
}

const REGEX_FORMAL_SPANISH = /\b(su|sus|usted|ustedes)\b/i;

function checkSpanishTone(value, pointer, key) {
  const match = value.match(REGEX_FORMAL_SPANISH);
  if (match) {
    addError(`${pointer} (key: "${key}") contains formal Spanish term "${match[0]}"; use informal tone instead`);
  }
}

function compareLocaleKeySets() {
  if (localeKeySets.size === 0) {
    return;
  }
  const baseLocale = LOCALES[0];
  const baseKeys = localeKeySets.get(baseLocale);

  if (!baseKeys) {
    addError(`Base locale '${baseLocale}' did not load successfully; unable to compare key sets.`);
    return;
  }

  for (const [locale, keySet] of localeKeySets.entries()) {
    if (locale === baseLocale) continue;

    const missing = [...baseKeys].filter((key) => !keySet.has(key));
    const extras = [...keySet].filter((key) => !baseKeys.has(key));

    if (missing.length) {
      addError(`Locale '${locale}' is missing ${missing.length} key(s): ${missing.join(', ')}`);
    }
    if (extras.length) {
      addWarning(`Locale '${locale}' has ${extras.length} extra key(s) not present in '${baseLocale}': ${extras.join(', ')}`);
    }

    const outOfOrder = [...keySet].filter((key) => baseKeys.has(key)).filter((key) => {
      const baseIndex = localeKeyOrder.get(`${baseLocale}:${key}`);
      const localeIndex = localeKeyOrder.get(`${locale}:${key}`);
      return typeof localeIndex === 'number' && typeof baseIndex === 'number' && localeIndex < baseIndex;
    });
    if (outOfOrder.length) {
      addWarning(`Locale '${locale}' has ${outOfOrder.length} key(s) out of order compared to '${baseLocale}': ${outOfOrder.join(', ')}`);
    }
  }
}

function reportCoverage() {
  const baseLocale = LOCALES[0];
  const baseKeys = localeKeySets.get(baseLocale) || new Set();
  console.log('Translation coverage summary:');
  LOCALES.forEach((locale) => {
    const keys = localeKeySets.get(locale);
    if (!keys) {
      console.log(`  • ${locale}: 0 / ${baseKeys.size} keys`);
      return;
    }
    const count = keys.size;
    const pct = baseKeys.size ? Math.round((count / baseKeys.size) * 100) : 100;
    console.log(`  • ${locale}: ${count} / ${baseKeys.size} keys (${pct}%)`);
  });
}

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    addError(`Unable to read or parse JSON file ${filePath}: ${err.message}`);
    return null;
  }
}

function ensureLocalizedFileExists(basePath, locale, extensions = ['.json', '.md', '.markdown']) {
  const candidates = [];
  extensions.forEach((ext) => {
    candidates.push(`${basePath}.${locale}${ext}`);
    candidates.push(`${basePath}.${locale}${ext.toUpperCase()}`);
  });
  candidates.push(`${basePath}.${locale}`);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return true;
    }
  }
  return false;
}

function flagMissingLocale(collection, slug, locale, basePath) {
  const message = `[${collection}] Missing localized file for slug '${slug}' locale '${locale}' (looked for ${basePath}.${locale}.md|json)`;
  if (STRICT_CONTENT_I18N) {
    addError(message);
  } else {
    addWarning(message);
  }
  missingContentLocales.push({ collection, slug, locale });
}

function validateContentLocalization() {
  if (!fs.existsSync(CONTENT_DIR)) {
    addWarning(`Content directory not found: ${CONTENT_DIR}`);
    return;
  }

  const collections = ['blog', 'news', 'education', 'cases', 'services'];
  collections.forEach((collection) => {
    const collectionDir = path.join(CONTENT_DIR, collection);
    const manifestPath = path.join(collectionDir, 'manifest.json');
    if (!fs.existsSync(collectionDir)) {
      addWarning(`Collection directory missing: ${collectionDir}`);
      return;
    }
    if (!fs.existsSync(manifestPath)) {
      addWarning(`Manifest missing for ${collection}: ${manifestPath}`);
      return;
    }
    const manifest = readJson(manifestPath);
    if (!manifest || !Array.isArray(manifest.slugs)) {
      addError(`Manifest for ${collection} must include a 'slugs' array: ${manifestPath}`);
      return;
    }

    manifest.slugs.forEach((slug) => {
      const slugDir = path.join(collectionDir, slug);
      if (!fs.existsSync(slugDir)) {
        addError(`[${collection}] Missing directory for slug '${slug}': ${slugDir}`);
        return;
      }

      LOCALES.forEach((locale) => {
        const basePath = path.join(slugDir, 'index');
        const found = ensureLocalizedFileExists(basePath, locale);
        if (!found) {
          flagMissingLocale(collection, slug, locale, basePath);
        }
      });
    });
  });
}

function main() {
  ensureTranslationDir();
  LOCALES.forEach(loadLocale);
  compareLocaleKeySets();
  reportCoverage();
  validateContentLocalization();

  if (warnings.length) {
    console.warn('Warnings:');
    warnings.forEach((message) => console.warn(`  • ${message}`));
  }

  if (errors.length) {
    console.error('Errors:');
    errors.forEach((message) => console.error(`  • ${message}`));
    process.exit(1);
  }

  console.log(`✅ Translation validation passed for locales: ${LOCALES.join(', ')}`);
}

main();
