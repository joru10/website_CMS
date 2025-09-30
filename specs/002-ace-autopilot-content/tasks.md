# Tasks: ACE Autopilot Content Engine
**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, configuration sketches, PRD.
**Prerequisites**: Phase 0 research complete; ACE workspace scaffold created.

## Phase 3.1 Foundations
- [ ] T001 Establish ACE workspace (`ace/` structure, uv project, docker-compose skeleton).
- [ ] T002 Provision Docker services (LMStudio, LibreTranslate/CTranslate2, Qdrant, Umami) with health checks.
- [ ] T003 Configure APScheduler + LangGraph bootstrap with SQLite jobstore and CET scheduling windows.
- [ ] T004 [P] Implement config loader (`config.yaml`, track configs, scoring weights, prompt templates, secrets handling).
- [ ] T005 Define audit logging schema capturing candidate traceability and reviewer actions.

## Phase 3.2 News Digest Pipeline
- [ ] T006 Build ingestion connectors (news.smol.ai, RSS feeds) with dedupe + overflow caching.
- [ ] T007 Implement relevance scorer ensuring 4–8 items after dedupe.
- [ ] T008 [P] Create planner agent producing ND outlines with SME angles and manual insert slots.
- [ ] T009 [P] Implement writer agent for ND items (headline, what happened, why it matters, footnotes ≥2).
- [ ] T010 Add manual insert endpoint + reviewer UI integration (Add Custom Item, Merge Similar, reorder).
- [ ] T011 Integrate fact-check agent ensuring ≥2 links per item.
- [ ] T012 Add quality gates (readability, link health, originality, toxicity, translation QE) with logging.
- [ ] T013 Generate Git PR payload (EN/ES/FR Markdown, track front-matter, RSS entries) and asset hooks.
- [ ] T014 Wire RAG ingestion tagged with `track=news` and update Umami metrics for CTR/newsletter KPIs.

## Phase 3.3 Blog Insight Candidate Engine & Pipeline
- [ ] T015 Implement candidate mining (7-day window) with Business-Value scoring (relevance, actionability, novelty, search momentum, strategic fit).
- [ ] T016 Build candidate review UI (scores ≥65, outlines, search terms, seed news links).
- [ ] T017 [P] Extend planner/writer agents for BI template (TL;DR, context, analysis, implications, checklist, conclusion).
- [ ] T018 [P] Add internal link suggester referencing News/Use-Case content.
- [ ] T019 Ensure JSON-LD (BlogPosting) generation and footnotes referencing seed sources.

## Phase 3.4 Use-Case Spotlight Candidate Engine & Pipeline
- [ ] T020 Implement candidate mining (2–3 week window + manual suggestions) with Business-Value scoring thresholds ≥60.
- [ ] T021 Build candidate review UI showing ROI framing, risk flags, manual idea injector.
- [ ] T022 [P] Extend planner/writer agents for Use-Case template (problem, solution, architecture, impact, risks, getting started).
- [ ] T023 Integrate claim advisory flags when unsupported; enforce JSON-LD (CaseStudy).
- [ ] T024 Ensure traceability to seed news IDs recorded in front-matter.
- [ ] T025 Implement translator agent (LibreTranslate or CTranslate2) + QE scoring for BI/US drafts.
- [ ] T026 Build asset generator (hero banners, optional diagrams) with branding config.
- [ ] T027 Support A/B title variants and Netlify split-testing metadata.

## Phase 3.5 Reviewer UI & Publishing
- [ ] T028 Build FastAPI + HTMX reviewer dashboard with track-specific boards (News Today, Blog Candidates, Use-Case Candidates).
- [ ] T029 Integrate Netlify PKCE OAuth or secure local auth fallback.
- [ ] T030 Implement approval workflow → Git PR creator with track-aware front-matter, Netlify deploy trigger, LinkedIn copy export, RSS updates.
- [ ] T031 Add automated notifications: News ready at 07:00 CET, Blog candidate list Fri 16:00 CET, Use-Case candidate list Mon 09:00 CET.
- [ ] T032 Persist audit logs and expose history view (candidate decisions, manual inserts, scheduling).
- [ ] T033 Implement manual insert moderation queue with alerts (`ACE_MANUAL_INSERT_NOTIFY`).
- [ ] T034 Build scheduling assistant to enforce publish windows (News 09:00 CET, Blog Tue/Thu 10:00 CET, Use-Case Wed 11:00 CET).

## Phase 3.6 SEO, Analytics, Ops
- [ ] T035 Implement SEO agent (keyword suggestions, JSON-LD validation, sitemap update, hreflang generation).
- [ ] T036 Add analytics instrumentation (Umami dashboards per track, Search Console integration).
- [ ] T037 Build content health cron (readability re-check, broken links, orphan pages, translation QE drift).
- [ ] T038 Provide backup/export job and audit log download.
- [ ] T039 [P] Implement RAG-based internal link suggestions (flag as V1.1 stretch).

## Dependencies
- **T001** precedes T002-T004 (ensures foundational workspace).
- **T002** and **T004** can proceed in parallel once **T001** completes.
- **T006-T014** depend on foundational config and job scheduler.
- Blog/Use-Case pipelines (T015-T027) depend on News ingestion outputs and scoring modules.
- Reviewer UI (T028-T034) depends on pipeline outputs and audit logging.
- SEO/Analytics tasks (T035-T039) depend on publishing flow being operational.
- T008 (ND planner) and T009 (ND writer) can proceed concurrently after ingestion outputs sample data.
- T015 (blog scoring) and T020 (use-case scoring) can develop in parallel after SourceItem + BusinessValueScore models exist.
- T028 (reviewer UI) can start after News board data structures ready (T008-T012).
```

## Validation Checklist
- [ ] Pipelines generate EN/ES/FR Markdown with track-aware front-matter (`track_meta`, seed IDs) following site schema.
- [ ] Business-Value scoring and quality gates enforce PRD thresholds before human review.
- [ ] Reviewer UI supports manual inserts, candidate approval, scheduling windows, and audit logging.
- [ ] Publishing creates Git PRs, triggers Netlify deploy, updates RSS/LinkedIn, and respects schedule windows.
- [ ] RAG index populated with track-tagged content; analytics dashboards report KPIs per track.
