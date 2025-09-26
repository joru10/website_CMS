# Queue-Based Content Generation

Use `scripts/generate-content.js` to scaffold multilingual Blog, News, or Education entries from a queue file.

## 1. Prepare a Queue File

Create a YAML or JSON file containing an array of entries. Example: `queues/content-seed.yaml`.

```yaml
- section: blog
  slug: accelerating-ai-delivery
  title: Accelerating AI Delivery for SMEs
  date: 2025-09-30
  description: How RapidAI reduced AI delivery cycles for SMEs by 40%.
  locales: [en, es, fr]
- section: news
  slug: rapidai-wins-eu-grant
  title: RapidAI Secures EU Innovation Grant
  date: 2025-10-10
  description: Funding accelerates AI adoption support for European SMEs.
  locales: [en, es, fr]
```

### Entry Fields

- **section** – `blog`, `news`, or `education` (required)
- **slug** – folder name for the generated entry (required)
- **title** – optional seed title (saved in frontmatter/JSON)
- **date** – optional ISO date string
- **description** – optional summary for blog/news
- **locales** – array of locales (defaults to `['en', 'es', 'fr']` if omitted)

## 2. Run the Generator

From the project root:

```bash
node scripts/generate-content.js --from queues/content-seed.yaml
```

The script will:

- Validate each entry.
- Create localized Markdown/JSON files under `content/<section>/<slug>/index.<locale>.md|json`.
- Report how many files were generated.

## 3. Next Steps After Generation

1. Review generated files and refine copy.
2. Run `npm run build` to regenerate manifests.
3. Commit content changes and push to trigger Netlify deploy.

## Tips

- You can maintain multiple queue files (e.g., `queues/blog-backlog.yaml`).
- Comment out entries (YAML) to temporarily skip them.
- Combine with translation validation via `npm test` to ensure completeness.
