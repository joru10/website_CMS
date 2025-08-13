import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 8080;

const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URL; // e.g. https://your-oauth-server.com/callback
const SCOPE = process.env.SCOPE || 'repo,user';

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.warn('[WARN] Missing one of OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REDIRECT_URL');
}

app.use(cors());
app.use(cookieParser());

function randomState(len = 24) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

app.get('/status', (_req, res) => {
  res.json({ ok: true });
});

// Step 1: Start OAuth flow
// GET /auth?origin=https://comfy-panda-0d488a.netlify.app
app.get('/auth', (req, res) => {
  try {
    // Decap CMS v3 sends site_id instead of origin. Handle both for compatibility.
    const origin = req.query.origin || req.query.site_id;
    if (!origin) return res.status(400).send('Missing origin or site_id');

    const state = randomState();
    res.cookie('oauth_origin', origin, { httpOnly: false, sameSite: 'lax' });
    res.cookie('oauth_state', state, { httpOnly: true, sameSite: 'lax' });

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPE,
      state,
      allow_signup: 'false'
    });

    const authURL = `https://github.com/login/oauth/authorize?${params.toString()}`;
    return res.redirect(authURL);
  } catch (e) {
    console.error('Auth error:', e);
    return res.status(500).send('Auth error');
  }
});

// Step 2: GitHub redirects here with ?code=...&state=...
app.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const savedState = req.cookies['oauth_state'];
    const origin = req.cookies['oauth_origin'];

    if (!code || !state || !origin) return res.status(400).send('Missing required params');
    if (state !== savedState) return res.status(400).send('Invalid state');

    const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        state
      })
    });

    const tokenJson = await tokenResp.json();
    if (!tokenJson.access_token) {
      console.error('Token error:', tokenJson);
      return res.status(500).send('Token exchange failed');
    }

    const token = tokenJson.access_token;

    // Return a page that sends the token to the CMS window and closes
    res.send(`<!doctype html>
<html>
<head><meta charset="utf-8"><title>OAuth Complete</title></head>
<body>
<script>
  (function() {
    var token = ${JSON.stringify(token)};
    var origin = ${JSON.stringify(origin)};

    function send() {
      try {
        window.opener.postMessage('authorization:github:success:' + token, origin);
        window.close();
      } catch (e) {
        console.error('PostMessage error', e);
      }
    }

    window.addEventListener('message', function(event) {
      if (event.data === 'authorizing:github') {
        send();
      }
    }, false);

    // Prompt the opener to request the token
    if (window.opener) {
      window.opener.postMessage('authorizing:github', '*');
    }
  })();
</script>
<p>Authentication complete. You can close this window.</p>
</body>
</html>`);
  } catch (e) {
    console.error('Callback error:', e);
    return res.status(500).send('Callback error');
  }
});

app.listen(PORT, () => {
  console.log(`[oauth-provider] listening on :${PORT}`);
});
