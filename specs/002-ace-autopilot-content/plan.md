
# Implementation Plan: ACE Autopilot Content Engine

**Branch**: `002-ace-autopilot-content` | **Date**: 2025-09-30 | **Spec**: [`specs/002-ace-autopilot-content/spec.md`](./spec.md)
**Input**: Feature specification from `/specs/002-ace-autopilot-content/spec.md`

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
Deliver an autonomous-yet-supervised content factory that ingests AI news, scores opportunities, and produces track-specific assets (News Digest, Blog Insight, Use-Case Spotlight) with multilingual drafts, manual insert support, candidate review UX, and automated publishing via Git PR. ACE orchestrates ingestion, scoring, planning, writing, QA, and reviewer workflows aligned to CET cadences spelled out in the PRD.

## Technical Context
**Language/Version**: Python 3.11 (orchestrator, agents), FastAPI 0.111 (review UI/API), HTMX frontend, APScheduler 3.x; JavaScript build scripts for publishing hooks.  
**Primary Dependencies**: LangGraph (workflow orchestration), LMStudio (OpenAI-compatible LLM gateway), Sentence-Transformers/SimHash libs, Qdrant client, SQLite (via SQLAlchemy), LibreTranslate or CTranslate2, PIL, feedparser, requests.  
**Storage**: Git repository (content), SQLite (jobs, approvals, audit logs), Qdrant (vector index), file store for generated assets under `static/uploads/ace/`.  
**Testing**: pytest for orchestrator modules, integration tests for pipelines, unit tests for translators/fact-checkers, contract tests for publishing API.  
**Target Platform**: Self-hosted containers (Docker Compose) running on developer workstation or lightweight server; Netlify remains static delivery target.  
**Project Type**: Multi-component web/back-end automation (Python services + static site integration).  
**Performance Goals**: Draft generation within 15 minutes per run; News Digest ready for review by 07:00 CET and auto-schedulable for 09:00; Blog candidate list available Friday 16:00 CET; Use-Case candidates Monday 09:00 CET; readability ≥60; translation QE ≥0.7.  
**Constraints**: Local models first (LMStudio, LibreTranslate); stay within constitution mandates (CMS-driven content, localization parity, PKCE OAuth); schedule reliability (CET).  
**Scale/Scope**: Three content pipelines (ND daily weekdays, BI weekly 1–2x, US weekly) across EN/ES/FR; backlog capacity ≥7 days; candidate pools capped at 5 (blog) and 3 (use-case).

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **CMS-Driven Content Integrity**: Generated Markdown must land in `content/` via PR and remain CMS-managed. No direct production edits. ✅
- **Localization Parity**: Pipelines emit EN/ES/FR with tuteo compliance, plus QA to flag gaps. ✅
- **Secure OAuth & Secrets Hygiene**: Reviewer UI auth delegates to existing Netlify OAuth or local secure login; no secrets leak into frontend. ✅
- **Deployment Confidence**: Tests for translation parity, pipeline simulations, and Netlify preview verification included before merge. ✅
- **Progressive Enhancement & Accessibility**: Reviewer UI honors accessibility best practices and surfaces alt text/metadata for generated assets. ✅

## Project Structure

### Documentation (this feature)
```
specs/002-ace-autopilot-content/
├── spec.md
├── plan.md
├── research.md           # Phase 0 deliverable: open questions, sources, risks
├── data-model.md         # Phase 1: entities (jobs, drafts, reviews, assets, RAG)
├── quickstart.md         # Phase 1: how to run orchestration stack locally
├── contracts/            # (Optional) API contracts for reviewer/publisher endpoints
└── tasks.md              # Phase 2: execution backlog
```

### Source Code (repository root)
```
ace/
├── orchestrator/
│   ├── jobs/                 # APScheduler + LangGraph flows per content type
│   ├── agents/               # ingestion, planner, writer, fact-check, seo, translator
│   ├── pipelines/            # reusable steps and quality gates
│   ├── publishing/           # Git PR, RSS, LinkedIn integration
│   ├── storage/              # SQLite, Qdrant wrappers
│   └── tests/
├── reviewer-ui/
│   ├── app/                  # FastAPI endpoints + HTMX templates
│   ├── static/
│   └── tests/
├── configs/
│   ├── config.example.yaml
│   └── prompts/
├── assets/
│   └── hero-templates/
└── docker-compose.yaml       # LMStudio, LibreTranslate, Qdrant, services

scripts/
└── ace/
    ├── run_job.py
    ├── backfill.py
    └── validate_content.py

content/
├── news/
├── insights/
└── use-cases/
```

**Structure Decision**: Multi-component workspace under `ace/` hosting Python services and reviewer UI, plus scripts for manual runs; generated content committed under existing `content/` hierarchy.

## Phase 0: Outline & Research
1. Gather open questions (RSS allowlist, manual seed workflows, hosting, branding) and assign owners.
2. Evaluate tooling feasibility: LMStudio throughput, LibreTranslate vs CTranslate2, Qdrant deployment, scoring pipeline performance.
3. Prototype ingestion against news.smol.ai, curated RSS feeds, and manual insert flow to validate dedupe and metadata capture.
4. Model Business-Value scoring using historical corpus samples; confirm threshold settings (≥65 blog, ≥60 use-case).
5. Document findings, risks, and decisions in `research.md`.

**Output**: `research.md` with source inventory, manual insert design, scoring formulas, infra decisions, and unresolved clarifications.

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. Define data entities & schemas: job schedule, candidate pool (with business-value scoring, seed news IDs), manual insert records, draft packages per track, review actions, audit logs, assets, translation metrics, quality gate results.
2. Design reviewer API (FastAPI) routes for News board (manual insert, reorder), Blog/Use-Case candidate tables, scheduling actions; capture in `/contracts/reviewer-openapi.yaml` if warranted.
3. Outline pipeline state transitions (ingested → planned → drafted → QA-passed → awaiting-approval → scheduled → published) per track; translate into `data-model.md` with track-specific metadata.
4. Write `quickstart.md` covering Docker dependencies, scheduling windows, running candidate reviews (Fri 16:00 CET, Mon 09:00 CET), manual insert workflow, and publishing dry run.
5. Update agent context via `.specify/scripts/bash/update-agent-context.sh windsurf` after documenting major tech decisions.

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Map tasks across phases (Foundations, News Digest pipeline, Blog candidate engine, Use-Case pipeline, Review UX, SEO/Analytics, Polish) mirroring PRD timeline.
- Include setup tasks (Docker env, LMStudio config, Qdrant bootstrap), scoring implementation, candidate UX, manual insert features, QA automation, publishing integration, Netlify hooks.
- Mark tasks for parallel execution when they touch distinct modules (`orchestrator/agents/*` vs `reviewer-ui/`).

**Ordering Strategy**:
- Sequential by phase; ensure foundational infra precedes pipeline builds; enable News track first, then candidate scoring for Blog/Use-Case, followed by review UX and analytics.

**Estimated Output**: ~25 tasks with sub-phase markers.

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
