#!/usr/bin/env node
/**
 * Translation validation checks
 * - Ensures each locale JSON file parses correctly
 * - Detects duplicate keys per locale
 * - Confirms all locales expose the same set of keys
 * - Guards informal tone requirements for Spanish (no "su" / "sus" / "usted")
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TRANSLATIONS_DIR = path.join(ROOT, 'translations');
const LOCALES = ['en', 'es', 'fr'];

const errors = [];
const warnings = [];
const localeKeySets = new Map();

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
  }
}

function main() {
  ensureTranslationDir();
  LOCALES.forEach(loadLocale);
  compareLocaleKeySets();

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
