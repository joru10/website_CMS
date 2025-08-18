#!/usr/bin/env node
/*
  Generate manifests for dynamic content sections.
  - content/cases/manifest.json: derived from folder names under content/cases/*
  Order: newest directory first (by mtime), then alphabetical as fallback.
*/
const fs = require('fs');
const path = require('path');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function writeJSON(filePath, data) {
  const content = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Wrote ${filePath}`);
}

function listDirs(root) {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => !name.startsWith('.'));
}

function getMTime(p) {
  try {
    return fs.statSync(p).mtimeMs || 0;
  } catch (_) {
    return 0;
  }
}

function generateCasesManifest() {
  const casesRoot = path.join(process.cwd(), 'content', 'cases');
  ensureDir(casesRoot);

  const dirs = listDirs(casesRoot);
  const items = dirs.map((slug) => {
    const dirPath = path.join(casesRoot, slug);
    const hasAnyIndex = fs
      .readdirSync(dirPath)
      .some((f) => /^index\.[a-z]{2}\.json$/i.test(f));
    return {
      slug,
      mtime: getMTime(dirPath),
      valid: hasAnyIndex,
    };
  });

  const valid = items.filter((x) => x.valid);
  valid.sort((a, b) => {
    if (b.mtime !== a.mtime) return b.mtime - a.mtime; // newest first
    return a.slug.localeCompare(b.slug);
  });

  const slugs = valid.map((x) => x.slug);
  const outPath = path.join(casesRoot, 'manifest.json');
  writeJSON(outPath, { slugs });
}

function main() {
  generateCasesManifest();
}

main();
