
# Implementation Plan: RapidAI Website Baseline Reference

**Branch**: `001-codebase-baseline-reference` | **Date**: 2025-09-30 | **Spec**: [`specs/001-codebase-baseline-reference/spec.md`](./spec.md)
**Input**: Feature specification from `/specs/001-codebase-baseline-reference/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Document the current RapidAI marketing website and Decap CMS integration so future feature work can rely on a single, authoritative baseline. This pass will catalogue dynamic sections, localization flows, OAuth infrastructure, deployment expectations, and accessibility patterns by inspecting existing code (`index.html`, `script.js`, `content/`, `translations/`) and operational docs (`DEVELOPMENT_PLAN.md`).

## Technical Context
**Language/Version**: HTML5, vanilla JavaScript (ES6), Tailwind CDN classes, Netlify Functions (Node 18).  
**Primary Dependencies**: `axios`, `gray-matter`, `js-yaml`, Netlify CLI utilities; Decap CMS loaded via CDN.  
**Storage**: Static content under `content/` (Markdown/JSON) committed to git; media under `static/uploads/`.  
**Testing**: `npm run test:translations` (ensures translation parity); manual CMS/OAuth tests documented in `logs/`.  
**Target Platform**: Netlify static hosting with serverless OAuth proxy.  
**Project Type**: Single web project (static site + CMS).  
**Performance Goals**: NEEDS CLARIFICATION (no explicit KPIs in repo; reference roadmap in `DEVELOPMENT_PLAN.md`).  
**Constraints**: CSP locked in `netlify.toml`; PKCE OAuth only; Spanish locale must use tuteo; manifests must remain idempotent.  
**Scale/Scope**: Three primary locales (EN/ES/FR); content manifests for services, testimonials, partners, education, news, cases.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **CMS-Driven Content Integrity**: Plan only reads committed CMS outputs (`content/`, manifests); no manual overrides introduced. ✅
- **Localization Parity**: Baseline will audit locale coverage and flag gaps; no changes reduce parity. ✅
- **Secure OAuth & Secrets Hygiene**: Documentation references existing Netlify function behavior without altering secrets. ✅
- **Deployment Confidence**: Tasks include recording required checks (`npm run test:translations`, manifest regeneration). ✅
- **Progressive Enhancement & Accessibility**: Plan captures current loading/empty-state patterns to preserve future compliance. ✅

## Project Structure

### Documentation (this feature)
```
specs/001-codebase-baseline-reference/
├── spec.md             # Baseline specification
├── plan.md             # This implementation plan
├── research.md         # Source inventory & findings (to be authored in Phase 0)
├── data-model.md       # Content/OAuth entity catalog (Phase 1)
├── quickstart.md       # How to consume the baseline reference (Phase 1)
├── contracts/          # (Unused for documentation; keep directory empty)
└── tasks.md            # Work items produced via /tasks
```

### Source Code (repository root)
```
.
├── index.html
├── script.js
├── translations/
├── content/
│   ├── about/
│   ├── blog/
│   ├── cases/
│   ├── education/
│   ├── news/
│   ├── partners/
│   ├── resources_intro/
│   ├── services/
│   └── values/
├── admin/
│   ├── index.html
│   └── minimal-cms.html
├── netlify/functions/oauth.js
├── scripts/
│   ├── generate-manifests.js
│   ├── generate-content.js
│   └── test-translations.js
├── static/uploads/
└── DEVELOPMENT_PLAN.md
```

**Structure Decision**: Single static web project with CMS-managed content and supporting Netlify function; no separate backend/frontend directories.

## Phase 0: Outline & Research
1. Inventory source material: `.specify/inventory/tree.txt`, `DEVELOPMENT_PLAN.md`, `logs/`, Netlify function code, CMS HTML files.
2. Resolve open questions noted in spec (translation debt, performance KPIs) by searching repo and existing documentation.
3. Document findings in `research.md` capturing decisions, rationale, and outstanding TODOs.

**Output**: `research.md` summarizing current architecture and unresolved clarifications.

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. Map entities to documentation:
   - `data-model.md`: detail content manifests, translation catalogs, OAuth session objects, and deployment pipelines.
   - `quickstart.md`: instructions for consuming the baseline (where to find sections, how to regenerate manifests/tests).
2. Contracts directory remains empty (no APIs to define), but note in `data-model.md` why not applicable.
3. Update agent context if new tooling requirements emerge during documentation (expected: none, verify).

**Output**: `data-model.md`, `quickstart.md`; confirm contracts not required.

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Derive documentation tasks: inventory verification, localization summary, OAuth summary, deployment/tooling summary, accessibility summary, TODO backlog.
- Mark tasks touching independent files (e.g., `research.md`, `data-model.md`) as `[P]` where feasible; keep spec/plan edits sequenced.

**Ordering Strategy**:
- Start with research artifact, then data model, then quickstart, finally compile tasks snapshot.
- Ensure localization/OAuth sections complete before quickstart guidance.

**Estimated Output**: 10-12 tasks focused on documentation deliverables; no code changes expected.

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
