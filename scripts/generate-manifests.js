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

function generatePartnersManifest() {
  const partnersRoot = path.join(process.cwd(), 'content', 'partners');
  ensureDir(partnersRoot);

  const dirs = listDirs(partnersRoot);
  const items = dirs.map((slug) => {
    const dirPath = path.join(partnersRoot, slug);
    let hasAnyIndex = false;
    try {
      const files = fs.readdirSync(dirPath);
      hasAnyIndex = files.some((f) => /^index\.[a-z]{2}\.json$/i.test(f));
    } catch (_) {
      hasAnyIndex = false;
    }
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
  const outPath = path.join(partnersRoot, 'manifest.json');
  writeJSON(outPath, { slugs });
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

function generateTestimonialsManifest() {
  const testimonialsRoot = path.join(process.cwd(), 'content', 'testimonials');
  ensureDir(testimonialsRoot);

  const dirs = listDirs(testimonialsRoot);
  const items = dirs.map((slug) => {
    const dirPath = path.join(testimonialsRoot, slug);
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
  const outPath = path.join(testimonialsRoot, 'manifest.json');
  writeJSON(outPath, { slugs });
}

function generateSectionManifestMd(section) {
  const root = path.join(process.cwd(), 'content', section);
  ensureDir(root);

  const dirs = listDirs(root);
  const items = dirs.map((slug) => {
    const dirPath = path.join(root, slug);
    let hasAnyIndex = false;
    try {
      const files = fs.readdirSync(dirPath);
      hasAnyIndex = files.some((f) => /^index\.[a-z]{2}\.md$/i.test(f));
    } catch (_) {
      hasAnyIndex = false;
    }
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
  const outPath = path.join(root, 'manifest.json');
  writeJSON(outPath, { slugs });
}

function main() {
  generateCasesManifest();
  generateTestimonialsManifest();
  generatePartnersManifest();
  // Markdown-based sections
  generateSectionManifestMd('blog');
  generateSectionManifestMd('news');
  generateSectionManifestMd('education');
}

main();
