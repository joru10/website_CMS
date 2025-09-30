# Quickstart: ACE Autopilot Content Engine

## Prerequisites
- Python 3.11+
- Docker & Docker Compose (for LMStudio, LibreTranslate, Qdrant, Umami)
- Node.js 18+ (existing site tooling)
- GitHub access with PR permissions
- Environment variables:
  - `ACE_CONFIG_PATH` → path to config.yaml
  - `GITHUB_TOKEN` → token for PR publishing
  - `NETLIFY_BUILD_WEBHOOK` (optional) for triggering deploy

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
   Brings up LMStudio (LLMs), LibreTranslate, Qdrant, SQLite admin UI, Umami.
4. **Seed config**
   ```bash
   cp ace/configs/config.example.yaml ace/config.yaml
   ```
   Update feeds, model endpoints, Git repo targets, reviewer emails.

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

## Reviewer UI
1. Start API/UI
   ```bash
   uv run ace/reviewer-ui/app/main.py
   ```
2. Visit `http://localhost:8000/review`
   - Login via Netlify OAuth (production) or local account (dev mode).
   - Approve/schedule drafts, view quality gate results, edit sections.

## Publishing Flow
1. Approve in UI → triggers Git PR creation on `content/autogen` branch.
2. Review PR in GitHub; merge when ready.
3. Netlify deploy (auto or trigger via webhook).
4. Verify content live at `/news`, `/insights`, `/use-cases`.
5. Check RSS feed updates and LinkedIn copy artifact (`/distribution/` folder in PR).

## Maintenance
- Monitor scheduler logs (`ace/logs/`).
- Inspect Qdrant via UI (port from docker-compose file) to confirm RAG indexing.
- Run `npm run test:translations` in repo root after new locale content lands.
- Rotate LMStudio models via config when upgrading quality.

## Troubleshooting
- **Pipeline misses deadline**: check APScheduler logs, ensure containers healthy, inspect queues.
- **Translation QE fail**: review flagged segments, adjust prompt or glossary, rerun translation agent.
- **Git PR failures**: confirm GitHub token scope (`repo`), ensure branch name matches config.
