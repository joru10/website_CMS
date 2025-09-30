# Research Findings: RapidAI Website Baseline Reference

## Source Inventory
- index.html — main landing page with multilingual sections and data-translate attributes.
- script.js — language initialization, dynamic content loaders for services, cases, testimonials, partners, news, education, values, contact settings, stats.
- translations/ — static JSON catalogs (`en.json`, `es.json`, `fr.json`).
- content/ — CMS-managed content (JSON + Markdown) with manifests per collection.
- admin/index.html & admin/minimal-cms.html — Decap CMS OAuth + collections setup, PKCE integration.
- netlify/functions/oauth.js — GitHub OAuth Netlify Function (PKCE, diagnostics endpoints).
- scripts/generate-manifests.js — regenerates collection manifests from content folders.
- scripts/generate-content.js — queue-driven content generator.
- scripts/test-translations.js — translation completeness check.
- DEVELOPMENT_PLAN.md — existing roadmap and known issues.
- .specify/inventory/tree.txt & loc.json — snapshot of file structure and LOC counts.

## Localization Behavior
- `initializeLanguage()` in `script.js` prefers saved language, falls back to browser only if supported, defaults to `en`.
- `setLanguage()` loads translation JSON, then kicks off content loaders (services, education, partners, etc.) before applying translated strings to DOM.
- Each loader fetches manifest (e.g., `content/services/manifest.json`) then localized files (`index.<lang>.md/json`), with fallback to English when localized file missing.
- Spanish locale expected to use informal tuteo; enforced manually in content (`translations/es.json` plus locale-specific CMS files). Outstanding TODO in roadmap to audit remaining formal language.

## Content Collections
- Services, Testimonials, Partners, Education, News, Cases, Values, About, Intro, Resources Intro, Contact Settings — all organized under `content/` with per-locale documents.
- Manifests list slugs; loaders reference them to fetch markdown/JSON.
- Queue-based generator (`scripts/generate-content.js`) supports YAML/JSON queues (see `queues/content-seed.yaml`).

## OAuth & CMS Flow
- Netlify function `/oauth` exposes `/authorize`, `/callback`, `/access_token`, `/client_id`, `/version`.
- PKCE verifier stored via secure HttpOnly cookie; fallback to client-provided verifier if cookie missing.
- `admin/index.html` fetches client ID from `/oauth/client_id`, configures Decap with `auth_type: 'pkce'`, manual init, slug guard hooks, and diagnostics logging.
- `admin/minimal-cms.html` mirrors collections for smoke testing.
- `logs/last-response.md` captures cache-busted admin URLs for debugging.

## Deployment & Tooling
- Netlify deploys from `main`; instructions emphasize auto-commit/push to trigger deploys (per user preference).
- Newsletter form integrated with Netlify Forms (`index.html`, hidden detection form, `netlify-forms-detect.html`).
- `netlify.toml` sets CSP (including Tailwind CDN) and redirects `/oauth/*` -> function.
- Build/test workflow relies on `npm run test:translations` and manifest regeneration when content changes.

## Accessibility & UX Patterns
- Loading/empty state translation keys for sections (e.g., `loading-testimonials`, `no-news-items`).
- `loadValuesContent()` uses DocumentFragment to avoid flicker; contact/social blocks hidden until data loaded.
- Partners/testimonials/services use feature cards, Font Awesome normalization, and responsive layout via Tailwind classes.

## Open Questions / Needs Clarification
- Confirm remaining formal Spanish strings across all locales. (Source: `DEVELOPMENT_PLAN.md` Priority 1 & 2 items.)
- Document real performance metrics (current plan references targets but no measured data).
- Verify OAuth diagnostics expectations once production login retested post-latest commits.
