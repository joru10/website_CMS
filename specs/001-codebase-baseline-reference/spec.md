# Feature Specification: RapidAI Website Baseline Reference

**Feature Branch**: `001-codebase-baseline-reference`  
**Created**: 2025-09-30  
**Status**: Draft  
**Input**: User description: "codebase baseline reference"

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a product stakeholder, I want a single document that captures how the existing RapidAI marketing website and CMS operate today so that future feature work can reference authoritative behaviors, content flows, and constraints.

### Acceptance Scenarios
1. **Given** the current production-like codebase (`index.html`, `script.js`, `content/`, `translations/`), **When** a contributor reviews this baseline, **Then** they can enumerate all dynamic sections, data sources, and locale behaviors without opening the code.
2. **Given** the Netlify/Decap CMS integration, **When** reviewing OAuth or content governance, **Then** the reference highlights required endpoints (`netlify/functions/oauth.js`) and CMS entry points (`admin/index.html`, `admin/minimal-cms.html`).

### Edge Cases
- What happens when a locale-specific content file is missing? Baseline must document the English fallback behavior implemented in `script.js` loaders.
- How does the system behave if OAuth credentials are unavailable? Baseline should record the PKCE fallback and diagnostic URLs in `logs/` and `netlify/functions/oauth.js` to ensure future work preserves access.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: Baseline documentation MUST list every CMS-managed content collection under `content/` with locale coverage (EN/ES/FR) and associated front-end loaders in `script.js`.
- **FR-002**: Baseline documentation MUST describe the localization flow (translation JSON files, loading order, fallback logic) and any known gaps (e.g., Spanish tuteo requirement).
- **FR-003**: Baseline documentation MUST outline authentication architecture (PKCE OAuth endpoints, Netlify Functions, CMS manual init) and reference diagnostic URLs.
- **FR-004**: Baseline documentation MUST capture deployment and tooling expectations (Netlify main branch deploys, `npm run test:translations`, manifest generation scripts).
- **FR-005**: Baseline documentation MUST highlight accessibility and UX patterns already implemented (loading/empty states, progressive enhancement) to guide future work.

*Open clarifications:*
- **FR-006**: Baseline SHOULD document any outstanding translation debt ([NEEDS CLARIFICATION: confirm remaining inconsistent keys across `translations/es.json`]).
- **FR-007**: Baseline SHOULD note performance targets or monitoring KPIs ([NEEDS CLARIFICATION: confirm actual production thresholds vs. roadmap in `DEVELOPMENT_PLAN.md`]).

### Key Entities *(include if feature involves data)*
- **Content Manifests**: JSON files (e.g., `content/services/manifest.json`, `content/testimonials/manifest.json`) listing slugs consumed by `script.js` loaders to fetch per-locale markdown/JSON.
- **OAuth Session**: PKCE flow artifacts stored via secure cookies and localStorage tokens as orchestrated by `netlify/functions/oauth.js` and `admin/index.html`.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---
