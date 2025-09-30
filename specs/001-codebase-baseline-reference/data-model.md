# Data Model: RapidAI Website Baseline Reference

## Content Collections
- **Services** (`content/services/manifest.json`, `service*/index.<lang>.md`)
  - Markdown frontmatter includes `title`, `subtitle`, `description`, `features` array.
  - Loader: `loadServicesContent(lang)` in `script.js` renders cards with localized features.
- **Education** (`content/education/manifest.json`, markdown files)
  - Fields: `title`, `excerpt`, `read_time`, `cta_label`, `slug` (frontmatter).
  - Loader: `loadEducationContent(lang)` merges with blog entries for resources overview.
- **News** (`content/news/manifest.json`, markdown files)
  - Frontmatter: `title`, `date`, `category`, `author`, `summary`.
  - Loader: `loadNewsContent(lang)` populates news section with loading/empty translations.
- **Case Studies** (`content/cases/manifest.json`, json files)
  - JSON fields: `title`, `subtitle`, `challenge`, `solution`, `outcome`, `cta_label`.
  - Loader: `loadSuccessStoriesContent(lang)` uses localized labels via `data-translate` attributes.
- **Testimonials** (`content/testimonials/manifest.json`, json)
  - Fields: `quote`, `author`, `role`, `company`.
  - Loader: `loadTestimonialsContent(lang)` with fallback to English.
- **Partners** (`content/partners/manifest.json`, json)
  - Fields: `name`, `description`, `website`, `icon` classes.
  - Loader: `loadPartnersContent(lang)` normalizes Font Awesome classes.
- **Values**, **Intro**, **About**, **Resources Intro** (JSON)
  - Provide homepage hero copy, company story, and resource messaging.
  - Loaders: `loadValuesContent`, `loadIntroContent`, `loadAboutContent`, `loadResourcesIntro`.
- **Contact Settings** (`content/contact/settings.<lang>.json`)
  - Toggles and URLs for social/contact links; loader `loadContactSettings` controls DOM visibility.

## Localization Entities
- **Translation Catalogs** (`translations/en.json`, `es.json`, `fr.json`)
  - Master key/value pairs for static interface copy.
  - `applyTranslations(lang)` binds data-translate attributes across DOM.
- **Language Preference**
  - Stored in `localStorage` under `selectedLanguage` by `initializeLanguage()`.
  - Fallback order: stored -> supported browser locale -> `en`.

## OAuth & Session Entities
- **PKCE Verifier & State**
  - Generated client-side, persisted via secure HttpOnly cookie (`_oauth_pkce`) and `sessionStorage`.
  - Netlify function `oauth.js` honors server-stored verifier, fallback to client-provided value.
- **Access Token Payload**
  - Stored in `localStorage` under `netlify-cms-user`; `admin/index.html` accepts `user.token` or `user.access_token`.
- **Diagnostics**
  - Endpoints: `/oauth/version`, `/oauth/client_id`; outputs used for debugging login issues.

## Deployment & Tooling Entities
- **Netlify Build**
  - Triggered from `main` branch; `netlify.toml` defines redirects and CSP.
- **Manifest Generator**
  - `scripts/generate-manifests.js` scans content directories; idempotent outputs ensure CMS parity.
- **Translation Test**
  - `scripts/test-translations.js` ensures keys present in each locale.

## Accessibility & UX Structures
- Loading states use dedicated translation keys (e.g., `loading-testimonials`) and placeholders in DOM.
- `loadValuesContent` uses DocumentFragment pattern to avoid empty sections on failures.
- Newsletter form integrated with Netlify Forms requires hidden detection form and Netlify metadata.

## Notes
- Spanish locale must remain informal (tuteo); audit flagged in `DEVELOPMENT_PLAN.md`.
- Performance KPIs currently unspecified; consider capturing in future monitoring tasks.
