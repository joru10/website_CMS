# RapidAI Website Constitution

<!--
Sync Impact Report
- Version change: (n/a) → 1.0.0
- Modified principles: Initial ratification
- Added sections: Additional Constraints, Delivery Workflow, Governance
- Removed sections: none
- Templates requiring updates: ✅ .specify/templates/plan-template.md, ✅ .specify/templates/spec-template.md, ✅ .specify/templates/tasks-template.md
- Follow-up TODOs: none
-->

## Core Principles

### I. CMS-Driven Content Integrity
All customer-facing copy, media references, and manifests MUST originate from Decap CMS content living under `content/` and its manifests. Manual edits to published HTML or JSON outside CMS exports are forbidden except for emergency hotfixes that are documented and backfilled into CMS within 24 hours.

### II. Localization Parity Across EN/ES/FR
Every feature MUST ship with English, Spanish (informal tuteo), and French variants. Content loaders (`script.js`) must fall back to English only when localized assets are genuinely missing. Any new translation keys shall be added to `translations/*.json` and mirrored in CMS-managed files before deployment.

### III. Secure OAuth and Secrets Hygiene
GitHub authentication flows MUST traverse Netlify Functions under `netlify/functions/oauth.js`. Client-side code SHALL NEVER embed secrets or client secrets. PKCE, secure cookies, and HTTPS redirects are mandatory. Changes to OAuth infrastructure require coordinated validation in production admin URLs and updated diagnostics in `logs/`.

### IV. Deployment Confidence via Automated Checks
Only the `main` branch deploys to production. Prior to merge, contributors MUST run `npm run test:translations` and re-generate manifests when content sources change. Netlify deploy previews must show successful content hydration for all locales before approval.

### V. Progressive Enhancement & Accessibility
UI additions must respect existing progressive loading patterns (loading/empty states) and maintain accessibility standards (ARIA labels, keyboard focus visibility). Any new section requires skeleton/loading translation keys and responsive behavior validated across breakpoints.

## Additional Constraints

- Tailwind CDN usage is locked to the CSP entries defined in `netlify.toml`; introducing new external scripts requires CSP updates reviewed alongside implementation.
- Media assets must live under `static/uploads/` with corresponding `.gitkeep` entries when directories are empty to keep CMS references stable.
- Queue-based content generation scripts in `scripts/` must remain idempotent; generated files belong under `content/` and are committed.

## Delivery Workflow

1. Work must originate from short-lived branches named `###-summary` (three-digit tracker + slug).
2. Run `.specify/scripts/bash/check-prerequisites.sh` before major workstreams to ensure tooling parity.
3. Content changes require simultaneous updates to manifests, translation keys, and CMS previews (`admin/minimal-cms.html`).
4. Pull requests must document testing evidence: translation tests, OAuth flow validation (console logs or screenshots), and Netlify deploy preview link.
5. Merge requires at least one reviewer verifying constitution alignment plus successful deploy preview.

## Governance

- This constitution is authoritative over conflicting documentation. Any variance must be highlighted in PR descriptions and resolved prior to merge.
- Amendments require consensus between the maintainer and content lead, recorded via PR comments. Version increments follow semantic rules (major for principle changes, minor for new sections, patch for clarifications).
- Ratification and amendment dates are tracked in this file, and every change must update the Sync Impact Report comment.
- Compliance checks occur at least monthly; deviations trigger backlog tasks within one sprint.

**Version**: 1.0.0 | **Ratified**: 2025-09-29 | **Last Amended**: 2025-09-29