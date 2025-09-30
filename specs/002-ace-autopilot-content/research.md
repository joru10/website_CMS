# Research: ACE Autopilot Content Engine

## Objectives
- Automate creation of three content tracks—News Digest (daily), Blog Insight (weekly 1–2x), Use-Case Spotlight (weekly)—in EN/ES/FR with track-specific workflows.
- Maintain governance gates: fact-check (≥2 corroborations for News items), readability (≥60), link health, translation quality (QE ≥0.7), duplicate detection, advisory flagging.
- Provide reviewer UX for manual News inserts, candidate selection, inline edits, and scheduling aligned to CET windows.
- Publish via Git PRs with track-aware front-matter, update RSS + LinkedIn copy, and push content into RAG index for reuse and scoring feedback.

## Open Questions & Ownership
- RSS Allowlist & Search Sources — *Content team* to finalize initial list (news.smol.ai + curated RSS) and determine search fallback strategy.
- Manual Seed Workflow — *Content team* to define how manual News inserts and Use-Case ideas are captured and prioritized in UI.
- Reviewer UI Hosting — *Engineering* to decide between local Docker vs. lightweight VPS; must integrate with PKCE OAuth if exposed.
- Branding Assets — *Design* to supply color palette, logo, typography for banner generator and ensure hero imagery aligns with ACE track styling.
- Translation Backend — Evaluate LibreTranslate vs. CTranslate2 M2M100 for latency vs. quality; confirm hardware availability.

## Tooling Feasibility
- **LangGraph + APScheduler**: Suitable for orchestrating sequential/branching agent flows with retries; integrates with Python loaders.
- **LMStudio**: Provides OpenAI-compatible endpoints for local models (Qwen2.5, Llama 3.1). Requires GPU/CPU evaluation to ensure <15 min pipeline runtime.
- **Qdrant**: Lightweight vector DB deployable via Docker; supports multilingual embeddings (BGE-M3) for RAG.
- **SQLite**: Adequate for job scheduling, approvals, audit logs; use WAL mode for concurrency.
- **LibreTranslate / CTranslate2**: LibreTranslate easier to self-host; CTranslate2 offers better quality with GPU. Start with LibreTranslate + QE checks.

## Source & Compliance Considerations
- Primary ingestion: news.smol.ai API/HTML, curated RSS feeds, optional cached web search results, plus manual insert endpoint for News.
- Deduplication: SimHash or MinHash on titles + embeddings clustering to avoid repeat coverage; maintain overflow cache for source downtime.
- Licensing: Skip paywalled content; store metadata only; include canonical URLs in footnotes; highlight manual inserts requiring reviewer confirmation.
- Fact-check: News items must cite ≥2 independent sources before leaving draft state; Blog/Use-Case claims must reference seed news IDs or advisory disclaimers.

## Quality Gates
- **Readability**: Use language-specific Flesch-like scores; enforce ≥60 across tracks.
- **Originality**: Local near-duplicate check against recent outputs (SimHash/Hamming distance); ensure Blog/Use-Case novelty vs. corpus.
- **Business-Value Score**: 0–100 weighted sum (SME relevance, actionability, novelty, search momentum, strategic keyword fit). Thresholds: ≥65 Blog, ≥60 Use-Case.
- **Toxicity/PII**: Run classifier/heuristics; log for reviewer attention.
- **Link Health**: Validate HTTP status and canonical titles before publish; confirm minimum link count per News item.
- **Translation QE**: Use COMET or probability-based QE thresholds (≥0.7) to flag risky segments per locale.

## Integration Notes
- Generated Markdown must follow expanded front-matter schema (including `track_meta` with candidate score, seed news IDs, manual insert flags) documented in `specs/001-codebase-baseline-reference/data-model.md`.
- State machine (ingested → planned → drafted → QA-passed → awaiting-approval → scheduled → published) must sync with reviewer UI and Netlify deploy pipeline.
- Publishing step issues Git PR against `content/autogen` branch (configurable) with assets under `static/uploads/ace/<date>/` and updates RSS/LinkedIn payloads.
- Reviewer UI should respect existing PKCE OAuth by delegating login to Netlify Function or providing local auth when offline; News board requires drag/drop reorder, manual insert form, merge-similar action.

## Risks & Mitigations
- **Model latency**: Batch prompts, leverage streaming token output, or upgrade hardware. Offer optional OpenRouter fallback for final polish.
- **Scheduling reliability**: Persist APScheduler jobs in SQLite and send email alerts on failures tied to CET windows.
- **Multilingual drift**: Maintain locale glossaries; reviewer can annotate corrections feeding back into prompt templates; highlight translation QE failures in UI.
- **Source outages**: Keep cached backlog; expand RSS list; provide manual topic injection queue; allow manual insert escalation for News.
- **Weak candidate weeks**: Expand lookback window to 14 days, rely on manual suggestions, and adjust scoring weights dynamically.

## Next Research Steps
1. Prototype ingestion + dedupe on top 10 RSS feeds; measure throughput, duplicate rate, and overflow handling.
2. Validate manual insert UX and data model; ensure provenance captured for News inserts and Use-Case seeds.
3. Train/tune Business-Value scoring weights using historical topics; evaluate thresholds vs. reviewer expectations.
4. Benchmark LMStudio models for ND vs. BI/US length requirements; document CPU/GPU needs and caching strategy.
5. Evaluate LibreTranslate accuracy with SME terminology; consider adding terminology dictionaries and QE calibration.
6. Design audit log schema linking source URLs → candidate pools → drafts → published assets, including track metadata.
