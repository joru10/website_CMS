#!/usr/bin/env node
/**
 * Content Generator for blog, news, and education sections.
 *
 * Creates localized Markdown entries at:
 *   content/<section>/<slug>/index.<locale>.md
 *
 * Usage examples:
 *   node scripts/generate-content.js --section blog --slug my-first-post \
 *     --title "My First Post" --date 2025-09-10 --description "Short summary" \
 *     --locales en,es,fr
 *
 *   node scripts/generate-content.js --section news --slug release-1-0 \
 *     --title "Version 1.0 Released" --description "Highlights" --locales en
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = args[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i++;
    } else {
      out[key] = true;
    }
  }
  return out;
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function ymd() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function createEntry({ section, slug, title, date, description, locales }) {
  const root = path.join(process.cwd(), 'content', section, slug);
  ensureDir(root);

  const fm = (locale) => `---\n` +
`title: ${title || slug}\n` +
`date: ${date || ymd()}\n` +
`description: ${description || ''}\n` +
`locale: ${locale}\n` +
`---\n\n` +
`# ${title || slug}\n\n` +
`Write your ${section} content for (${locale}) here.\n`;

  let created = [];
  locales.forEach((locale) => {
    const filePath = path.join(root, `index.${locale}.md`);
    if (fs.existsSync(filePath)) {
      console.log(`Skipped existing: ${filePath}`);
      return;
    }
    fs.writeFileSync(filePath, fm(locale), 'utf8');
    created.push(filePath);
  });

  return { root, created };
}

function main() {
  const args = parseArgs();
  const section = (args.section || '').toLowerCase();
  const slug = args.slug;
  const title = args.title;
  const date = args.date;
  const description = args.description;
  const locales = (args.locales || 'en,es,fr').split(',').map((s) => s.trim()).filter(Boolean);

  if (!['blog', 'news', 'education'].includes(section)) {
    console.error(`Error: --section must be one of blog, news, education`);
    process.exit(1);
  }
  if (!slug) {
    console.error(`Error: --slug is required`);
    process.exit(1);
  }

  const { root, created } = createEntry({ section, slug, title, date, description, locales });
  console.log(`Created ${created.length} files under ${root}`);
  console.log(`Next steps:`);
  console.log(`- Edit the generated Markdown files as needed.`);
  console.log(`- Run: npm run build (regenerates manifests for blog/news/education).`);
}

if (require.main === module) {
  main();
}
