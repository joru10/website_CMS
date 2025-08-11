// Netlify Function: GitHub OAuth provider for Decap CMS (PKCE-compatible)
// Endpoints:
//  - GET  /oauth/authorize   -> redirects to GitHub OAuth authorize
//  - GET  /oauth/callback    -> posts {code,state} back to opener and closes
//  - POST /oauth/access_token -> exchanges code (+ code_verifier for PKCE) for access token
//
// Env vars (set in Netlify site settings):
//  - GITHUB_CLIENT_ID        (required)
//  - GITHUB_CLIENT_SECRET    (optional; not required for PKCE but supported)
//
// GitHub OAuth App settings:
//  - Authorization callback URL: https://<your-site>/.netlify/functions/oauth/callback

const GH_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GH_TOKEN_URL = 'https://github.com/login/oauth/access_token';

function baseUrl(event) {
  const proto = event.headers['x-forwarded-proto'] || 'https';
  const host = event.headers['x-forwarded-host'] || event.headers.host;
  return `${proto}://${host}`;
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  try {
    // CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
        body: '',
      };
    }

    const path = event.path || '';
    const clientId = (process.env.GITHUB_CLIENT_ID || '').trim();
    const clientSecret = (process.env.GITHUB_CLIENT_SECRET || '').trim(); // optional

    // Expose public client_id for PKCE front-end config
    if (path.endsWith('/client_id')) {
      return jsonResponse(200, { client_id: clientId || '' });
    }

    if (path.endsWith('/authorize') || path.endsWith('/auth')) {
      if (!clientId) {
        return jsonResponse(500, { error: 'Missing GITHUB_CLIENT_ID env var' });
      }
      const qs = event.queryStringParameters || {};
      const callbackBase = process.env.PUBLIC_CALLBACK_BASE || baseUrl(event);
      const cb = `${callbackBase}/.netlify/functions/oauth/callback`;
      const url = new URL(GH_AUTH_URL);
      url.searchParams.set('client_id', clientId);
      // Always use our functions callback to match the GitHub App configuration
      url.searchParams.set('redirect_uri', cb);
      url.searchParams.set('state', qs.state || '');
      // Scope: ensure permissions needed by Decap CMS
      // - repo: commit content
      // - read:user, user:email: fetch GitHub user profile
      url.searchParams.set('scope', qs.scope || 'repo,read:user,user:email');
      // PKCE support
      if (qs.code_challenge) url.searchParams.set('code_challenge', qs.code_challenge);
      if (qs.code_challenge_method) url.searchParams.set('code_challenge_method', qs.code_challenge_method);

      return {
        statusCode: 302,
        headers: { Location: url.toString() },
        body: '',
      };
    }

    if (path.endsWith('/callback')) {
      const qs = event.queryStringParameters || {};
      const code = qs.code || '';
      const state = qs.state || '';
      const callbackBase = process.env.PUBLIC_CALLBACK_BASE || baseUrl(event);
      const redirectUri = `${callbackBase}/.netlify/functions/oauth/callback`;
      const idSuffix = (clientId || '').slice(-4);
      const hasSecret = !!clientSecret;
      if (!code) {
        const html = `<!doctype html><html><body><script>(function(){try{window.opener&&window.opener.postMessage('authorization:github:error:' + JSON.stringify({ error: 'missing_code', context: { idSuffix: '${idSuffix}', hasSecret: ${hasSecret}, redirectUri: '${redirectUri}' } }),'*')}catch(_){}window.close();})();</script></body></html>`;
        return { statusCode: 200, headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }, body: html };
      }
      // Always prefer PKCE: send code/state back to CMS; token exchange happens via /oauth/access_token
      // PKCE fallback: send code/state to CMS; try to recover state from opener storage if missing
      const html = `<!doctype html><html><body>
<script>
(function(){
  try {
    if (window.opener && window.opener.postMessage) {
      var st = ${JSON.stringify(state)};
      try {
        var candidates = ['decap-cms.oauthState','decap-cms.oauth-state','netlify-cms.oauthState','netlify-cms.oauth-state','oauthState','oauth-state'];
        var stores = [];
        try { if (window.opener.localStorage) stores.push(window.opener.localStorage); } catch(_){}
        try { if (window.opener.sessionStorage) stores.push(window.opener.sessionStorage); } catch(_){}
        for (var i=0;i<candidates.length;i++){
          for (var j=0;j<stores.length;j++){
            try { var v = stores[j].getItem(candidates[i]); if (v) { st = v; i=candidates.length; break; } } catch(_){}
          }
        }
      } catch (_) {}
      window.opener.postMessage({ source: 'decap-cms', code: ${JSON.stringify(code)}, state: st }, '*');
      window.close();
    } else {
      document.body.innerText = 'You can close this window.';
    }
  } catch (e) {
    document.body.innerText = 'OAuth callback error. You can close this window.';
  }
})();
</script>
</body></html>`;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' },
        body: html,
      };
    }

    if (path.endsWith('/access_token')) {
      // Accept JSON or x-www-form-urlencoded
      let body = {};
      try {
        const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
        if (event.headers['content-type'] && event.headers['content-type'].includes('application/x-www-form-urlencoded')) {
          body = Object.fromEntries(new URLSearchParams(raw));
        } else if (raw) {
          body = JSON.parse(raw);
        }
      } catch (_) {
        // ignore
      }

      const code = body.code;
      const codeVerifier = body.code_verifier; // optional if using client_secret instead
      const callbackBase = process.env.PUBLIC_CALLBACK_BASE || baseUrl(event);
      const redirectUri = body.redirect_uri || `${callbackBase}/.netlify/functions/oauth/callback`;

      if (!clientId) {
        return jsonResponse(500, { error: 'Missing GITHUB_CLIENT_ID env var' });
      }
      if (!code) {
        return jsonResponse(400, { error: 'Missing code' });
      }

      const params = new URLSearchParams();
      params.set('client_id', clientId);
      params.set('code', code);
      params.set('redirect_uri', redirectUri);
      // Support both PKCE (no secret) and classic (with secret)
      if (codeVerifier) params.set('code_verifier', codeVerifier);
      if (clientSecret) params.set('client_secret', clientSecret);

      const resp = await fetch(GH_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        return jsonResponse(resp.status, { error: 'token_exchange_failed', details: data });
      }

      return jsonResponse(200, data);
    }

    return jsonResponse(404, { error: 'not_found', path });
  } catch (e) {
    return jsonResponse(500, { error: 'server_error', message: e && e.message });
  }
};
