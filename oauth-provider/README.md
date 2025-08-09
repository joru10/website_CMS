# Decap CMS GitHub OAuth Provider

This is a minimal OAuth provider compatible with Decap CMS / Netlify CMS `github` backend.
It exchanges the GitHub OAuth code for an access token and sends it back to the opener window.

## 1) Create a GitHub OAuth App
- Homepage URL: https://comfy-panda-0d488a.netlify.app
- Authorization callback URL: https://YOUR-OAUTH-SERVER/callback

Copy the Client ID and Client Secret.

## 2) Deploy this server
You can deploy on Render (recommended), Netlify Functions, Cloudflare, Fly, etc.

For Render:
- New Web Service → Connect this repo (or a fork containing `oauth-provider/`)
- Root Directory: `oauth-provider`
- Build Command: (leave empty)
- Start Command: `node server.js`
- Environment: Node 18+
- Add environment variables:
  - `OAUTH_CLIENT_ID` = <GitHub OAuth app client id>
  - `OAUTH_CLIENT_SECRET` = <GitHub OAuth app client secret>
  - `OAUTH_REDIRECT_URL` = https://YOUR-OAUTH-SERVER/callback
  - `SCOPE` (optional) = `repo,user`

## 3) Configure the site admin
Edit `admin/index.html` and set:
```js
backend: {
  name: 'github',
  repo: 'joru10/website_CMS',
  branch: 'main',
  base_url: 'https://YOUR-OAUTH-SERVER',
  auth_endpoint: '/auth',
  token_endpoint: '/access_token',
  auth_type: 'pkce',
}
```

## 4) Test the flow
- Open in incognito: https://comfy-panda-0d488a.netlify.app/admin
- Click “Login with GitHub”
- Complete consent on GitHub
- You should be redirected to the provider `/callback` and then back to the CMS

## Notes
- Ensure `ALLOWED_ORIGINS`/CORS allows https://comfy-panda-0d488a.netlify.app if you add stricter CORS.
- If you see a 404 after GitHub, double-check `OAUTH_REDIRECT_URL` matches your deployed server `/callback` exactly.

## Netlify Functions variant used in this repo
- Base URL (production): `base_url: '/oauth'` (served by Netlify Functions via `netlify.toml` redirect)
- Endpoints: `auth_endpoint: '/auth'`, `token_endpoint: '/access_token'`
- Callback URL (GitHub OAuth App): `https://<your-site>/.netlify/functions/oauth/callback`
- The callback page posts `{ source: 'decap-cms', code, state }` back to the opener and closes. Decap CMS completes the token exchange via `token_endpoint` using PKCE (`code_verifier`).
