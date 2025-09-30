# Quickstart: ACE Autopilot Content Engine

## Prerequisites
- Python 3.11+
- Docker & Docker Compose (for LMStudio, LibreTranslate/CTranslate2, Qdrant, Umami)
- Node.js 18+ (existing site tooling)
- GitHub access with PR permissions
- Environment variables:
  - `ACE_CONFIG_PATH` → path to `ace/config.yaml`
  - `GITHUB_TOKEN` → token for PR publishing
  - `NETLIFY_BUILD_WEBHOOK` (optional) for triggering deploy
  - `ACE_MANUAL_INSERT_NOTIFY` (optional) for email/slack alerts when manual items added

## Setup
1. **Clone repo & checkout branch**
   ```bash
   git clone https://github.com/joru10/website_CMS.git
   cd website_CMS
   git checkout 002-ace-autopilot-content
   ```
2. **Install Python deps**
   ```bash
   uv venv
   source .venv/bin/activate
   uv pip install -r ace/requirements.txt
   ```
3. **Start services**
   ```bash
   docker compose -f ace/docker-compose.yaml up -d
   ```
   Brings up LMStudio (LLMs), LibreTranslate/CTranslate2, Qdrant, SQLite admin UI, Umami.
4. **Seed config**
   ```bash
   cp ace/configs/config.example.yaml ace/config.yaml
   ```
   Update feeds, scoring weights, model endpoints, Git repo targets, reviewer emails. Ensure `tracks.news` includes `primary_url`, `rss_allowlist`, `review_ready`, `publish_time`, `items_min/max`, `require_corroboration`, and `allow_manual_inserts`. Configure `tracks.blog` and `tracks.use_case` cadence, score thresholds (`min_business_value_score`), and `propose_count`.

## Running Pipelines
- **Ad-hoc run**
  ```bash
  uv run ace/scripts/run_job.py --job news_digest
  ```
- **Backfill**
  ```bash
  uv run ace/scripts/backfill.py --from 2025-09-01 --job blog_insight
  ```
- **Validate draft**
  ```bash
  uv run ace/scripts/validate_content.py --draft-id <uuid>
  ```
  Includes readability, link health, business-value score confirmation, translation QE.

## Reviewer UI
1. Start API/UI
   ```bash
   uv run ace/reviewer-ui/app/main.py
   ```
2. Visit `http://localhost:8000/review`
   - Login via Netlify OAuth (production) or local account (dev mode).
   - **News Board (Today)**: Left column shows harvested articles; right column your digest lineup. Use *Add Custom Item*, drag/drop reorder, *Merge Similar*, and language toggles before approving.
   - **Blog Candidates (Weekly)**: Friday 16:00 CET candidate list with 3–5 items (scores ≥65). Actions: *Preview Draft*, *Approve & Draft Full*, *Hold*.
   - **Use-Case Candidates (Weekly)**: Monday 09:00 CET candidate list with 2–3 items (scores ≥60) plus manual idea injector. Approve one by Tuesday 12:00 CET to trigger drafting.
   - Review QA results per draft (readability, link health, translation QE, schema) and schedule publication slots.

## Publishing Flow
1. Approve & schedule in UI → triggers Git PR creation on configured branch with track-specific front-matter (`track_meta.candidate_score`, `track_meta.seed_items`).
2. Review PR in GitHub; ensure JSON-LD blocks and manual inserts appear with provenance.
3. Merge PR to kick Netlify deploy (auto or trigger via webhook).
4. Verify content live at `/news`, `/insights`, `/use-cases`, and confirm scheduling windows respected (News 09:00 CET, Blog Tue/Thu 10:00 CET, Use-Case Wed 11:00 CET).
5. Check RSS feed updates and LinkedIn copy artifact (`content/distribution/`) for accuracy.

## Maintenance
- Monitor scheduler logs (`ace/logs/`).
- Inspect Qdrant via UI (port from docker-compose file) to confirm RAG indexing with track tags.
- Run `npm run test:translations` in repo root after new locale content lands.
- Review Business-Value score analytics in Umami dashboards; adjust weights in config if KPIs drift.
- Rotate LMStudio models via config when upgrading quality.

## Troubleshooting
- **Pipeline misses deadline**: check APScheduler logs, ensure containers healthy, inspect queues.
- **Translation QE fail**: review flagged segments, adjust prompt or glossary, rerun translation agent.
- **Git PR failures**: confirm GitHub token scope (`repo`), ensure branch name matches config.
- **Candidate list empty**: verify scoring thresholds, extend lookback window in config, or add manual seeds.
