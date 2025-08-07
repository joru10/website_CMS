#!/usr/bin/env node
/*
  RapidAI CMS Diagnostics
  -----------------------
  Quick CLI to verify that Netlify CMS can detect all service entries.
  1. Parses `admin/config.yml` to ensure the `services` collection exists and has sane settings.
  2. Ensures field names are unique and required keys are present.
  3. Scans `content/services/**` for `index.md` default-locale files.
  4. Reads front-matter with `gray-matter` to confirm mandatory fields (`title`, `description`).
  5. Prints a summary and exits with non-zero code if issues are found.
*/

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const matter = require('gray-matter');

const projectRoot = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(projectRoot, 'admin', 'config.yml');
const SERVICES_DIR = path.join(projectRoot, 'content', 'services');

let exitCode = 0;
const issues = [];

function logIssue(msg) {
  issues.push(msg);
  exitCode = 1;
}

// 1. Load and inspect config.yml
let config;
try {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  config = yaml.load(raw);
} catch (e) {
  console.error('Error reading admin/config.yml:', e.message);
  process.exit(1);
}

// Validate global i18n structure
if (!config.i18n || config.i18n.structure !== 'multiple_files') {
  logIssue('Global i18n.structure should be `multiple_files`.');
}

// Find services collection
const services = (config.collections || []).find(
  (c) => c.name === 'services'
);
if (!services) {
  logIssue('`services` collection not found in config.yml');
} else {
  // Validate required keys
  const requiredKeys = ['folder', 'create', 'slug', 'i18n', 'format', 'fields'];
  requiredKeys.forEach((k) => {
    if (!(k in services)) {
      logIssue(`services collection missing required key '${k}'`);
    }
  });
  // Field name uniqueness
  if (services.fields) {
    const names = services.fields.map((f) => f.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    if (dupes.length) {
      logIssue(`Duplicate field names in services collection: ${[...new Set(dupes)].join(', ')}`);
    }
  }
}

// 2. Verify content/services directory
if (!fs.existsSync(SERVICES_DIR)) {
  logIssue('Directory content/services is missing.');
} else {
  const serviceFolders = fs
    .readdirSync(SERVICES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  if (serviceFolders.length === 0) {
    logIssue('No service sub-folders found inside content/services.');
  }

  serviceFolders.forEach((folder) => {
    const defaultMd = path.join(SERVICES_DIR, folder, 'index.md');
    if (!fs.existsSync(defaultMd)) {
      logIssue(`Default locale file missing: ${path.relative(projectRoot, defaultMd)}`);
      return;
    }
    try {
      const fm = matter.read(defaultMd);
      if (!fm.data.title) {
        logIssue(`Missing 'title' front-matter in ${path.relative(projectRoot, defaultMd)}`);
      }
      if (!fm.data.description) {
        logIssue(`Missing 'description' front-matter in ${path.relative(projectRoot, defaultMd)}`);
      }
    } catch (err) {
      logIssue(`Cannot parse front-matter of ${path.relative(projectRoot, defaultMd)}: ${err.message}`);
    }
  });
}

// Output summary
if (issues.length) {
  console.error('\nDiagnostics found issues:');
  issues.forEach((m) => console.error(' •', m));
} else {
  console.log('✓ All diagnostics passed. CMS should list all services entries.');
}

process.exit(exitCode);
