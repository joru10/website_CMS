# Data Model: ACE Autopilot Content Engine

## Job Scheduling Entities
- **ContentJob**
  - Fields: `id`, `type` (news_digest|blog_insight|use_case), `cadence`, `review_time`, `publish_time`, `timezone` (CET), `status`, `last_run`, `next_run`.
  - Relationships: links to `DraftPackage` entries produced per run.
- **SchedulerConfig**
  - Stores enabled pipelines, cron expressions, retry policies.

## Draft Lifecycle Entities
- **DraftPackage**
  - Fields: `id`, `job_id`, `locale` (en|es|fr), `title`, `sections` (structured JSON per template), `footnotes`, `seo`, `assets`, `status` (draft|review|approved|scheduled|published), `readability_score`, `fact_check_links`, `toxicity_score`, `qe_score`, `created_at`, `updated_at`.
  - Relationships: has many `DraftSection`, belongs to `ContentJob`.
- **DraftSection**
  - Represents template slices (e.g., ND item, BI analysis block, US ROI section).
  - Fields: `draft_id`, `order`, `heading`, `body`, `metadata` (e.g., SME relevance notes, ROI metrics).

## Source & RAG Entities
- **SourceItem**
  - Fields: `id`, `url`, `title`, `summary`, `published_at`, `feed`, `dedupe_fingerprint`, `embedding_vector`, `language`, `is_paywalled`.
  - Relationships: referenced by `DraftPackage` footnotes.
- **RagDocument**
  - Fields: `id`, `draft_id`, `chunk_text`, `embedding_vector`, `metadata` (type, locale, tags, published_at).

## Governance & Review
- **QualityGateResult**
  - Fields: `draft_id`, `gate` (readability|fact_check|link_health|originality|toxicity|translation_qe), `status` (pass|fail|warn), `details`, `checked_at`.
- **ReviewAction**
  - Fields: `id`, `draft_id`, `reviewer`, `action` (approve|request_changes|schedule), `notes`, `timestamp`.
- **AuditLog**
  - Fields: `id`, `entity_type`, `entity_id`, `event`, `payload`, `created_at`.

## Publishing & Distribution
- **PublishRequest**
  - Fields: `id`, `draft_id`, `branch`, `pr_url`, `status`, `netlify_build_id`, `rss_entry_url`, `linkedin_copy`, `created_at`.
- **AssetRecord**
  - Fields: `id`, `draft_id`, `path`, `type` (hero|diagram), `checksum`, `alt_text`.

## Configuration & Templates
- **ConfigEntry**
  - Fields: `key`, `value`, `scope` (global|pipeline|locale), `updated_at`.
- **PromptTemplate**
  - Fields: `id`, `pipeline`, `stage`, `locale`, `body`, `last_updated`.

## External Integrations
- **WebhookEvent**
  - Captures notifications to Slack/email/Umami; fields: `id`, `event_type`, `target`, `payload`, `status`, `sent_at`.
- **AnalyticsSnapshot**
  - Fields: `id`, `draft_id`, `metric`, `value`, `collected_at` (for KPIs like signup conversions).

## Relationships Overview
- `ContentJob` → many `DraftPackage`
- `DraftPackage` → many `DraftSection`, `QualityGateResult`, `ReviewAction`, `AssetRecord`, `PublishRequest`
- `DraftPackage` → many `SourceItem` (through footnotes)
- `DraftPackage` → many `RagDocument`

## Notes
- Schema should live in SQLite migrations; use SQLAlchemy models.
- All timestamps stored in UTC but rendered CET-aware for scheduling.
- Ensure localization metadata aligns with existing site loaders (`type`, `lang`, `slug`, `tags`).
