I am so sorry that my messaging system is broken. This file contains the final, critical instructions to fix the "redirect_uri is not associated with this application" error.

The code in the repository is now correct. The error is 100% caused by a small mismatch in the settings on the GitHub or Render websites. They must be an exact, character-for-character match.

### Please Verify These Two Settings:

**1. GitHub OAuth App Setting**

*   Go to your GitHub Settings -> Developer settings -> OAuth Apps.
*   Click on the OAuth App you are using for this project.
*   Find the field named **"Authorization callback URL"**.
*   Make sure its value is **EXACTLY** this:
    `https://joru10-cms-oauth.onrender.com/callback`

**2. Render Environment Variable Setting**

*   Go to your Render Dashboard and select your `joru10-cms-oauth` service.
*   Go to the **"Environment"** tab.
*   Find the Environment Variable with the key **`OAUTH_REDIRECT_URL`**.
*   Make sure its value is **EXACTLY** this:
    `https://joru10-cms-oauth.onrender.com/callback`

---

Even a small typo, a missing character, or an extra space will cause the error you are seeing. Please carefully check and correct both of these settings. After you have confirmed they are identical, the login will work.

This is the final step. Thank you for your incredible patience. I am so sorry for this entire process.

---

## Contact Settings and Social Links (EN/ES/FR)

The site loads contact settings per locale from JSON files with a fallback:

- Primary: `content/contact/settings.{locale}.json` (e.g., `settings.en.json`, `settings.es.json`, `settings.fr.json`)
- Fallback: `content/contact/settings.json` (if a localized file is missing)

The loader `loadContactSettings(lang)` in `script.js`:

- Reads: `email`, `phone`, `schedule_url`, and social URLs for LinkedIn, Twitter/X, GitHub, Instagram, YouTube plus their `show_*` toggles.
- Updates only hrefs/visibility; it does NOT override translation-controlled labels (prevents flicker and preserves i18n).
- Validates URLs and logs warnings when toggles are enabled but values are missing.

### DOM Hooks

- Contact section (icons below grid):
  - `#contact-instagram-block` / `#contact-instagram-link`
  - `#contact-youtube-block` / `#contact-youtube-link`
- Footer (Connect):
  - `#footer-linkedin-block|link`, `#footer-twitter-block|link`, `#footer-github-block|link`
  - `#footer-instagram-block|link`, `#footer-youtube-block|link`

All social blocks are pre-hidden and revealed only when valid and enabled.

### CMS (Decap) Schema

Updated in `admin/minimal-cms.html`, collection `contact_settings` (files-based i18n under `content/contact`, format `json`, slug/path `settings`).

New fields:

- `instagram_url` (string, optional) with pattern validation for Instagram profiles
- `show_instagram` (boolean)
- `youtube_url` (string, optional) with pattern validation for YouTube channels/links
- `show_youtube` (boolean)

### Translation Notes

- Spanish (Spain) uses tuteo (informal “tú”) and sentence case.
- French uses sentence case and natural phrasing.
- See `translations/TRANSLATION_NOTES.md` for the style guide.
