# Tasks: ACE Autopilot Content Engine

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, configuration sketches, PRD.
**Prerequisites**: Phase 0 research complete; ACE workspace scaffold created.

## Phase 3.1 Foundations
- [ ] T001 Establish ACE workspace (`ace/` structure, uv project, docker-compose skeleton).
- [ ] T002 Provision Docker services (LMStudio, LibreTranslate, Qdrant, Umami) with health checks.
- [ ] T003 Configure APScheduler + LangGraph bootstrap with SQLite jobstore.
- [ ] T004 [P] Implement config loader (`config.yaml`, prompt templates, secrets handling).

## Phase 3.2 News Digest Pipeline (Phase 1 of PRD)
- [ ] T005 Build ingestion connectors (news.smol.ai, RSS feeds) with dedupe + caching.
- [ ] T006 Implement relevance scorer (embedding clustering + SME heuristics).
- [ ] T007 [P] Create planner agent producing ND outlines with SME angles.
- [ ] T008 [P] Implement writer agent for ND items (summary + why it matters + footnotes).
- [ ] T009 Integrate fact-check agent ensuring ≥2 links per item.
- [ ] T010 Add quality gates (readability, link health, originality, toxicity) with logging.
- [ ] T011 Generate Git PR payload (Markdown EN/ES/FR placeholders) and asset hooks.
- [ ] T012 Wire RAG ingestion and RSS feed updates post-approval.

## Phase 3.3 Blog Insight & Use-Case Pipelines (Phase 2)
- [ ] T013 Extend planner/writer agents for BI template (TL;DR, analysis, checklist).
- [ ] T014 Extend pipeline for Use-Case Spotlight (problem/solution/ROI/risks).
- [ ] T015 Implement translator agent (LibreTranslate or CTranslate2) + QE scoring.
- [ ] T016 Build asset generator (hero banners, diagrams optional) with branding config.
- [ ] T017 Support A/B title variants and Netlify split-testing metadata.

## Phase 3.4 Reviewer UI & Publishing
- [ ] T018 Build FastAPI + HTMX reviewer dashboard (queues, quality gate display, scheduling actions).
- [ ] T019 Integrate Netlify PKCE OAuth or secure local auth fallback.
- [ ] T020 Implement approval workflow → Git PR creator, Netlify deploy trigger, LinkedIn copy export.
- [ ] T021 Add daily 07:00 CET email summary (pending drafts + highlights).
- [ ] T022 Persist audit logs and expose history view.

## Phase 3.5 SEO, Analytics, Ops (Phase 3–4)
- [ ] T023 Implement SEO agent (keyword suggestions, JSON-LD validation, sitemap update).
- [ ] T024 Add analytics instrumentation (Umami + Search Console integration).
- [ ] T025 Build content health cron (readability re-check, broken links, orphan pages).
- [ ] T026 Provide backup/export job and audit log download.
- [ ] T027 [P] Implement RAG-based internal link suggestions (flag as stretch in backlog).

## Dependencies
- Foundations (T001–T004) precede all pipelines.
- News Digest pipeline (T005–T012) must be stable before extending to BI/US (T013–T017).
- Reviewer UI (T018–T022) depends on pipeline outputs and quality gates.
- SEO/Analytics tasks (T023–T027) depend on publishing flow being operational.

## Parallel Execution Examples
```
- T004 (config loader) and T005 (ingestion connectors) can run in parallel once workspace scaffold exists.
- T007 (ND planner) and T008 (ND writer) can proceed concurrently after ingestion outputs sample data.
- T018 (reviewer UI) can start after initial ND drafts and quality gate APIs exist (T005–T010).
```

## Validation Checklist
- [ ] Pipelines generate EN/ES/FR Markdown following site front-matter schema.
- [ ] Quality gates enforce PRD thresholds before human review.
- [ ] Reviewer UI supports approve/schedule/edit with audit logging.
- [ ] Publishing creates Git PRs, triggers Netlify deploy, updates RSS/LinkedIn.
- [ ] RAG index populated with published content; analytics dashboards reporting KPIs.
