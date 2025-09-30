# Data Model: ACE Autopilot Content Engine

## Job Scheduling Entities
- **ContentJob**
  - Fields: `id`, `track` (news|blog|use_case), `cadence`, `review_ready_time`, `publish_time`, `timezone` (default CET), `auto_schedule_offset`, `status`, `last_run`, `next_run`.
  - Relationships: links to `CandidatePool` snapshots and subsequent `DraftPackage` entries.
- **SchedulerConfig**
  - Stores enabled pipelines, cron expressions (06:30 ingest, 06:45 QA, 07:00 notify, etc.), retry policies, notification targets.

## Candidate & Draft Lifecycle Entities
- **CandidatePool**
  - Fields: `id`, `track`, `generated_at`, `window_days`, `propose_count`, `min_business_value_score`, `status` (pending_review|approved|discarded).
  - Relationships: has many `CandidateItem`; belongs to `ContentJob`.
- **CandidateItem**
  - Fields: `id`, `pool_id`, `title`, `outline`, `business_value_score`, `seed_news_ids`, `related_keywords`, `manual_seed` (bool), `review_decision` (approve|hold|reject), `decision_notes`.
- **ManualInsert**
  - Fields: `id`, `submitted_by`, `track` (news|use_case), `title`, `summary`, `source_links`, `priority`, `status` (pending|accepted|rejected), `created_at`.
- **DraftPackage**
  - Fields: `id`, `job_id`, `candidate_item_id` (nullable for News), `locale` (en|es|fr), `title`, `sections` (structured JSON per template), `footnotes`, `seo`, `assets`, `status` (draft|qa_passed|awaiting_approval|scheduled|published), `readability_score`, `fact_check_links`, `toxicity_score`, `qe_score`, `internal_links`, `created_at`, `updated_at`.
  - Relationships: has many `DraftSection`, belongs to `ContentJob`, references `CandidateItem` when applicable.
- **DraftSection**
  - Represents template slices (e.g., ND item, BI analysis block, US ROI section).
  - Fields: `draft_id`, `order`, `heading`, `body`, `metadata` (SME relevance notes, ROI metrics, risk flags).

## Source, Scoring & RAG Entities
- **SourceItem**
  - Fields: `id`, `url`, `title`, `summary`, `published_at`, `feed`, `dedupe_fingerprint`, `embedding_vector`, `language`, `is_paywalled`, `ingested_at`.
  - Relationships: referenced by `DraftPackage` footnotes and `CandidateItem.seed_news_ids`.
- **BusinessValueScore**
  - Fields: `candidate_item_id`, `relevance`, `actionability`, `novelty`, `search_momentum`, `strategic_fit`, `composite_score`.
- **RagDocument**
  - Fields: `id`, `draft_id`, `chunk_text`, `embedding_vector`, `metadata` (track, locale, tags, published_at, seed_sources).

## Governance & Review
- **QualityGateResult**
  - Fields: `draft_id`, `gate` (readability|fact_check|link_health|originality|toxicity|translation_qe|schema|internal_links), `status` (pass|fail|warn), `details`, `checked_at`.
- **ReviewAction**
  - Fields: `id`, `entity_type` (candidate|draft|manual_insert), `entity_id`, `reviewer`, `action` (approve|request_changes|schedule|hold|reject), `notes`, `timestamp`.
- **AuditLog**
  - Fields: `id`, `entity_type`, `entity_id`, `event`, `payload`, `user`, `created_at`.

## Publishing & Distribution
- **PublishRequest**
  - Fields: `id`, `draft_id`, `branch`, `pr_url`, `status`, `netlify_build_id`, `rss_entry_url`, `linkedin_copy`, `scheduled_time`, `created_at`.
- **AssetRecord**
  - Fields: `id`, `draft_id`, `path`, `type` (hero|diagram), `checksum`, `alt_text`, `locale`.

## Configuration & Templates
- **TrackConfig**
  - Fields: `track`, `source_settings`, `cadence`, `notify_time`, `publish_time`, `items_min`, `items_max`, `score_threshold`, `propose_count`, `manual_insert_enabled`.
- **ConfigEntry**
  - Fields: `key`, `value`, `scope` (global|track|locale), `updated_at`.
- **PromptTemplate**
  - Fields: `id`, `track`, `pipeline_stage`, `locale`, `body`, `last_updated`.

## External Integrations
- **WebhookEvent**
  - Captures notifications to Slack/email/Umami; fields: `id`, `event_type`, `target`, `payload`, `status`, `sent_at`.
- **AnalyticsSnapshot**
  - Fields: `id`, `track`, `draft_id`, `metric`, `value`, `collected_at` (KPIs: CTR, lead conversions, dwell time, A/B performance).

## Relationships Overview
- `ContentJob` → many `CandidatePool` → many `CandidateItem`
- `ContentJob` → many `DraftPackage`
- `CandidateItem` ↔ `SourceItem` (via `seed_news_ids`)
- `DraftPackage` → many `DraftSection`, `QualityGateResult`, `ReviewAction`, `AssetRecord`, `PublishRequest`
- `DraftPackage` → many `SourceItem` (through footnotes)
- `DraftPackage` → many `RagDocument`
- `ManualInsert` → may be linked to `CandidateItem` or directly to `DraftSection`

## Notes
- Schema should live in SQLite migrations; use SQLAlchemy models.
- All timestamps stored in UTC but rendered CET-aware for scheduling.
- Ensure localization metadata aligns with existing site loaders (`type`, `lang`, `slug`, `tags`).
