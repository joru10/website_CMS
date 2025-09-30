# Research: ACE Autopilot Content Engine

## Objectives
- Automate creation of News Digest (daily), Blog Insight (weekly), and Use-Case Spotlight (biweekly) content packages in EN/ES/FR.
- Maintain governance gates: fact-check, readability, link health, translation quality, human approval.
- Publish via Git PRs, update RSS + SEO artifacts, and push content into RAG index for reuse.

## Open Questions & Ownership
- RSS Allowlist & Search Sources — *Content team* to finalize initial list (currently news.smol.ai + EFF, The Decoder, Google Research feeds).
- Reviewer UI Hosting — *Engineering* to decide between local Docker vs. lightweight VPS; must integrate with PKCE OAuth if exposed publicly.
- Branding Assets — *Design* to supply color palette, logo, and typography for banner generator.
- Translation Backend — Evaluate LibreTranslate vs. CTranslate2 M2M100 for latency vs. quality; confirm hardware availability.

## Tooling Feasibility
- **LangGraph + APScheduler**: Suitable for orchestrating sequential/branching agent flows with retries; integrates with Python loaders.
- **LMStudio**: Provides OpenAI-compatible endpoints for local models (Qwen2.5, Llama 3.1). Requires GPU/CPU evaluation to ensure <15 min pipeline runtime.
- **Qdrant**: Lightweight vector DB deployable via Docker; supports multilingual embeddings (BGE-M3) for RAG.
- **SQLite**: Adequate for job scheduling, approvals, audit logs; use WAL mode for concurrency.
- **LibreTranslate / CTranslate2**: LibreTranslate easier to self-host; CTranslate2 offers better quality with GPU. Start with LibreTranslate + QE checks.

## Source & Compliance Considerations
- Primary ingestion: news.smol.ai API/HTML, assorted RSS feeds, optional cached web search results.
- Deduplication: SimHash or MinHash on titles + embeddings clustering to avoid repeat coverage.
- Licensing: Skip paywalled content; store metadata only; include canonical URLs in footnotes.
- Fact-check: Each item must cite ≥2 independent sources before leaving draft state.

## Quality Gates
- **Readability**: Use language-specific Flesch-like scores; enforce ≥60.
- **Originality**: Local near-duplicate check against recent outputs (SimHash/Hamming distance).
- **Toxicity/PII**: Run small classifier or heuristics; log for reviewer attention.
- **Link Health**: Validate HTTP status and canonical titles before publish.
- **Translation QE**: Use COMET or probability-based QE thresholds (≥0.7) to flag risky segments.

## Integration Notes
- Generated Markdown must follow existing front-matter schema to play nicely with loaders documented in `specs/001-codebase-baseline-reference/data-model.md`.
- Publishing step issues Git PR against `content/autogen` branch (configurable) with assets under `static/uploads/ace/DATE/`.
- Reviewer UI should respect existing PKCE OAuth by delegating login to Netlify Function or providing local auth when offline.

## Risks & Mitigations
- **Model latency**: Batch prompts, leverage streaming token output, or upgrade hardware. Offer optional OpenRouter fallback for final polish.
- **Scheduling reliability**: Persist APScheduler jobs in SQLite and send email alerts on failures.
- **Multilingual drift**: Maintain locale glossaries; reviewer can annotate corrections feeding back into prompt templates.
- **Source outages**: Keep cached backlog; expand RSS list; provide manual topic injection queue.

## Next Research Steps
1. Prototype ingestion + dedupe on top 10 RSS feeds; measure throughput and duplicate rate.
2. Benchmark LMStudio models for ND vs. BI/US length requirements; document CPU/GPU needs.
3. Evaluate LibreTranslate accuracy with SME terminology; consider adding terminology dictionaries.
4. Design audit log schema linking source URLs → drafts → published assets.
