# Quickstart Guide: RapidAI Website Baseline Reference

## Purpose
Use this guide to navigate the baseline documentation for the RapidAI marketing site and Decap CMS integration. It explains where canonical information lives and how to validate the current setup before building new features.

## Prerequisites
- Node.js 18+ (matching Netlify Functions runtime).
- `npm` available on PATH.
- Git access to `joru10/website_CMS` repository.
- `netlify-cli` installed globally or via `npx`.

## Getting Started
1. **Clone & Checkout Baseline Branch**
   ```bash
   git clone https://github.com/joru10/website_CMS.git
   cd website_CMS
   git checkout 001-codebase-baseline-reference
   ```
2. **Install Dependencies**
   ```bash
   npm install
   ```
3. **Run Translation Integrity Test**
   ```bash
   npm run test:translations
   ```
   Confirms locale coverage and highlights missing keys.
4. **Regenerate Manifests (optional)**
   ```bash
   npm run generate:manifests
   ```
   Ensures content manifests align with current `content/` directories.

## Reviewing Baseline Docs
- `spec.md` — High-level scope, user stories, and functional requirements of the baseline reference.
- `plan.md` — Implementation strategy aligned with the project constitution.
- `research.md` — Source inventory, localization behavior, OAuth flow, tooling notes.
- `data-model.md` — Entities representing content collections, localization catalogs, OAuth session, and deployment tooling.

## Validating CMS & OAuth
1. **Start Netlify Dev (optional)**
   ```bash
   npx netlify dev
   ```
2. **Visit CMS**
   - Full CMS: `http://localhost:8888/admin/`
   - Minimal CMS: `http://localhost:8888/admin/minimal-cms.html`
3. **Check Diagnostics**
   - `http://localhost:8888/oauth/version`
   - `http://localhost:8888/oauth/client_id`
   Ensure PKCE flow returns expected client ID and build metadata.

## Content Loading Verification
- Open `index.html` in browser (`netlify dev` or static serve) and toggle languages via UI to confirm dynamic sections populate.
- Monitor console for warnings emitted by loaders (e.g., missing locale files, slug guard messages).

## Accessibility & UX Checklist
- Confirm loading placeholders (e.g., testimonials, partners) display localized text before content resolves.
- Verify ARIA attributes on forms and navigation links remain intact.
- Inspect contact and footer blocks for conditional social icons based on CMS settings.

## When Adding New Features
1. Review existing loaders in `script.js` to extend patterns instead of duplicating logic.
2. Update corresponding manifest generators or queue scripts if introducing new content collections.
3. Maintain Spanish tuteo tone and ensure new translation keys are added across all locales.
4. Document modifications by updating baseline artifacts (`research.md`, `data-model.md`) to keep reference current.

## Related Utilities
- `scripts/generate-content.js` — Creates content from YAML/JSON queues.
- `queues/content-seed.yaml` — Example batch for automated content generation.
- `logs/last-response.md` — Cached admin URLs for testing OAuth flows.

## Support Contacts
- Primary maintainer: `Cascade AI Assistant`
- Live site: https://comfy-panda-0d488a.netlify.app/
- Admin portal: https://comfy-panda-0d488a.netlify.app/admin/
