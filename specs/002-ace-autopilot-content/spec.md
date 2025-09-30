# Feature Specification: ACE Autopilot Content Engine

**Feature Branch**: `002-ace-autopilot-content`  
**Created**: 2025-09-30  
**Status**: Draft  
**Input**: User description: "ACE autopilot content engine"

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
As the RapidAI content lead, I want an autopilot engine that assembles daily and weekly multilingual content packages (News Digest, Blog Insight, Use-Case Spotlight) so we can grow leads and social reach without manually drafting every piece.

### Acceptance Scenarios
1. **Given** a weekday morning at 07:00 CET, **When** the News Digest pipeline completes, **Then** the reviewer dashboard presents 4–8 curated items (with inline add/remove/reorder controls, SME why-it-matters copy, and ≥2 corroborating links each) ready for approval and pre-translated into ES/FR.
2. **Given** a Friday 16:00 CET candidate review session, **When** the Blog Insight scorer evaluates the prior week’s news pool, **Then** the reviewer sees 3–5 candidates with business-value scores ≥65, outlines, and suggested search terms, and can approve one for drafting.
3. **Given** a Monday 09:00 CET Use-Case Spotlight review, **When** the system proposes 2–3 candidates combining seed news and manual suggestions, **Then** the reviewer can approve one with ROI framing to trigger full drafts and translations by Tuesday 16:00 CET.
4. **Given** any track’s draft passes QA gates, **When** the reviewer approves and schedules publication, **Then** the system creates a Git PR with type-specific front-matter (including candidate scores/seed IDs), JSON-LD, assets, RSS entries, and LinkedIn copy queued for Netlify deployment.

### Edge Cases
- What happens when sources fail or provide duplicate stories? The engine must dedupe items, pull from overflow RSS caches, and invite manual inserts before promoting drafts.
- How does the system behave when Blog/Use-Case candidate scores fall below thresholds? The reviewer is notified with fallback suggestions (extended window, manual seed) and no auto-draft occurs until approval.
- What if translation quality drops below configured confidence? The reviewer must receive warnings with per-segment QE scores; drafts stay in "QA-passed" but blocked from scheduling.
- How should the system respond if candidate traceability (seed news IDs) is missing? Publishing must be blocked until provenance links are re-established.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: The engine MUST deliver News Digest drafts Monday–Friday with 4–8 items sourced from news.smol.ai, configured RSS feeds, and optional manual inserts, each containing "what happened", "why it matters", and ≥2 corroborating links.
- **FR-002**: The engine MUST surface Blog Insight candidates weekly (3–5 options with Business-Value Score ≥65) and generate approved drafts following the BI template with internal links to related News/Use-Case content.
- **FR-003**: The engine MUST surface Use-Case Spotlight candidates weekly (2–3 options with Business-Value Score ≥60) incorporating ROI framing, manual suggestions, and publish selected drafts following the US template.
- **FR-004**: All tracks MUST enforce track-specific workflows (candidate pool, manual insert step, state transitions) and allow reviewers to approve, hold, or edit items through the UI.
- **FR-005**: Quality gates MUST include readability ≥60, link health, duplicate detection across recent corpus, translation QE ≥0.7, schema validation (NewsArticle/BlogPosting/CaseStudy), and advisory flagging for unsupported claims.
- **FR-006**: Publishing MUST create Git PRs containing EN/ES/FR Markdown with type-aware front-matter (`track_meta` fields, candidate scores, seed IDs), JSON-LD snippets, assets, RSS updates, and LinkedIn share copy.
- **FR-007**: All published artifacts MUST be indexed into the RAG store with track tags and provenance for future scoring and internal link suggestions.
- **FR-008**: The reviewer dashboard MUST provide track-specific views (News board with manual insert, Blog/Use-Case candidate tables with scores and actions) and reflect state transitions in real time.

*Open clarifications:*
- **FR-009**: Deployment model for reviewer UI and orchestration services [NEEDS CLARIFICATION: confirm hosting preference—local docker vs managed environment].
- **FR-010**: Final RSS/search allowlist and manual seed workflows [NEEDS CLARIFICATION: pending content team confirmation].
- **FR-011**: Branding assets and typography for hero/banner generator [NEEDS CLARIFICATION: design team input required].
- **FR-012**: Whether BI/US drafts should support MDX components (charts/diagrams) in addition to Markdown [NEEDS CLARIFICATION].

### Key Entities *(include if feature involves data)*
- **Content Jobs**: Scheduled runs describing cadence, track (news/blog/use-case), target times, and states.
- **Candidate Pool**: Ranked list of potential Blog/Use-Case topics with business-value scores, seed news IDs, and reviewer decisions.
- **Draft Packages**: Bundles of outlines, full drafts, track templates, translations, quality metrics, and provenance metadata.
- **Manual Insert Records**: Reviewer-submitted News items with source metadata, priority, and inclusion status.
- **Source Library**: Catalog of ingestion connectors, feeds, cached articles, dedupe fingerprints, and search snapshots.
- **Review Queue**: Track-specific UI states, manual insert buffers, candidate selection logs.
- **Publishing Artifacts**: Git PR metadata, RSS entries, LinkedIn copy, schema JSON, asset references, audit logs.

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
