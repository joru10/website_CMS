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
const crypto = require('crypto');

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
      // Merge query params with parsed POST body to support Decap sending POST for PKCE
      let qs = Object.assign({}, event.queryStringParameters || {});
      if (event.httpMethod === 'POST') {
        try {
          const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
          if (event.headers['content-type'] && event.headers['content-type'].includes('application/x-www-form-urlencoded')) {
            const form = Object.fromEntries(new URLSearchParams(raw));
            qs = Object.assign(qs, form);
          } else if (raw) {
            const json = JSON.parse(raw);
            if (json && typeof json === 'object') qs = Object.assign(qs, json);
          }
        } catch (_) {
          // ignore body parse errors, fall back to QS only
        }
      }
      const callbackBase = process.env.PUBLIC_CALLBACK_BASE || baseUrl(event);
      const cb = `${callbackBase}/.netlify/functions/oauth/callback`;
      const url = new URL(GH_AUTH_URL);
      url.searchParams.set('client_id', clientId);
      // Always use our functions callback to match the GitHub App configuration
      url.searchParams.set('redirect_uri', cb);
      // Prepare state/PKCE, generating if missing
      let usedState = (qs.state || '').toString();
      let usedCC = (qs.code_challenge || '').toString();
      let usedCCM = (qs.code_challenge_method || '').toString();
      let generatedVerifier = '';
      if (!usedState) {
        // 32 bytes -> 64 hex chars is fine for state
        usedState = crypto.randomBytes(16).toString('hex');
      }
      if (!usedCC) {
        // Generate PKCE verifier and challenge
        const verifier = crypto.randomBytes(32).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
        const challenge = crypto
          .createHash('sha256')
          .update(verifier)
          .digest('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/,'');
        generatedVerifier = verifier;
        usedCC = challenge;
        usedCCM = 'S256';
      }
      url.searchParams.set('state', usedState);
      // Scope: ensure permissions needed by Decap CMS
      // - repo: commit content
      // - read:user, user:email: fetch GitHub user profile
      url.searchParams.set('scope', qs.scope || 'repo,read:user,user:email');
      // PKCE support
      if (usedCC) url.searchParams.set('code_challenge', usedCC);
      if (usedCCM) url.searchParams.set('code_challenge_method', usedCCM);

      const authDbg = {
        has_state: !!usedState,
        state_len: (usedState || '').length,
        has_cc: !!usedCC,
        cc_len: (usedCC || '').length,
        ccm: usedCCM || '',
        scope: (qs.scope || '').slice(0, 60),
        method: event.httpMethod,
      };
      const cookies = [];
      // preserve Decap-provided state (if any) and always set our server state for fallback
      if (qs.state) cookies.push(`cms_oauth_state=${encodeURIComponent(qs.state)}; Path=/; SameSite=None; Secure; Max-Age=600`);
      if (usedState) cookies.push(`cms_state=${encodeURIComponent(usedState)}; Path=/; SameSite=None; Secure; Max-Age=600`);
      if (generatedVerifier) cookies.push(`cms_pkce_v=${encodeURIComponent(generatedVerifier)}; Path=/; SameSite=None; Secure; Max-Age=600`);
      cookies.push(`cms_auth_dbg=${encodeURIComponent(JSON.stringify(authDbg))}; Path=/; SameSite=None; Secure; Max-Age=300`);
      return {
        statusCode: 302,
        headers: { Location: url.toString(), 'Cache-Control': 'no-store' },
        multiValueHeaders: { 'Set-Cookie': cookies },
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
      // Server-managed PKCE fallback: if we generated a verifier, perform token exchange here
      const cookieHeader = event.headers.cookie || event.headers.Cookie || '';
      let svAttempted = false;
      let svStatus = 0;
      let svBody = '';
      let svError = '';
      const getCookie = (name) => {
        try {
          const m = (cookieHeader || '').match(new RegExp('(?:^|; )' + name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '=([^;]+)'));
          return m ? decodeURIComponent(m[1]) : '';
        } catch (_) { return ''; }
      };
      const serverVerifier = getCookie('cms_pkce_v');
      const serverState = getCookie('cms_state');
      if (serverVerifier) {
        try {
          const params = new URLSearchParams();
          params.set('client_id', clientId);
          params.set('code', code);
          params.set('redirect_uri', redirectUri);
          params.set('code_verifier', serverVerifier);
          const resp = await fetch(GH_TOKEN_URL, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
          });
          svAttempted = true;
          svStatus = resp.status || 0;
          const data = await resp.json().catch(async () => {
            try { return { raw: await resp.text() }; } catch (_) { return {}; }
          });
          try {
            if (data && data.access_token) {
              svBody = JSON.stringify({ token_type: data.token_type, scope: data.scope, access_token: '[redacted]' });
            } else {
              svBody = JSON.stringify(data).slice(0, 500);
            }
          } catch(_) { svBody = '[unserializable]'; }
          if (resp.ok && data && data.access_token) {
            const token = data.access_token;
            const html = `<!doctype html><html><body><script>(function(){
              try {
                // clear temp cookies
                document.cookie = 'cms_pkce_v=; Max-Age=0; Path=/; SameSite=None; Secure';
                document.cookie = 'cms_state=; Max-Age=0; Path=/; SameSite=None; Secure';
                document.cookie = 'cms_oauth_state=; Max-Age=0; Path=/; SameSite=None; Secure';
                document.cookie = 'cms_auth_dbg=; Max-Age=0; Path=/; SameSite=None; Secure';
              } catch(_){ }
              try { window.opener && window.opener.postMessage({ source: 'oauth-debug', phase: 'server-pkce-success', status: ${svStatus}, body: ${JSON.stringify(svBody)} }, '*'); } catch(_){ }
              try { window.opener && window.opener.postMessage('authorization:github:success:' + JSON.stringify({ token: ${JSON.stringify('') } + token + ${JSON.stringify('')}, provider: 'github' }), '*'); } catch(_){ }
              window.close();
            })();</script></body></html>`;
            return { statusCode: 200, headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }, body: html };
          }
        } catch (e) {
          try { svError = e && (e.message || String(e)); } catch(_) { svError = 'unknown-error'; }
          // fall through to other strategies
        }
      }
      // If PKCE state is missing but we have a client secret, fall back to classic server-side exchange
      if (!state && clientSecret) {
        try {
          const params = new URLSearchParams();
          params.set('client_id', clientId);
          params.set('client_secret', clientSecret);
          params.set('code', code);
          params.set('redirect_uri', redirectUri);
          const resp = await fetch(GH_TOKEN_URL, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          });
          const data = await resp.json().catch(() => ({}));
          if (resp.ok && data && data.access_token) {
            const token = data.access_token;
            const html = `<!doctype html><html><body><script>(function(){try{window.opener&&window.opener.postMessage('authorization:github:success:' + JSON.stringify({token: ${JSON.stringify('') } + token + ${JSON.stringify('')}, provider: 'github'}),'*')}catch(_){}window.close();})();</script></body></html>`;
            return { statusCode: 200, headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }, body: html };
          } else {
            const html = `<!doctype html><html><body><script>(function(){try{window.opener&&window.opener.postMessage('authorization:github:error:' + JSON.stringify({ error: 'token_exchange_failed', status: ${JSON.stringify('') } + (resp&&resp.status) + ${JSON.stringify('')}, data: ${JSON.stringify('') } + (JSON.stringify(data)||'') + ${JSON.stringify('')}, context: { idSuffix: '${idSuffix}', hasSecret: ${hasSecret} } }),'*')}catch(_){}window.close();})();</script></body></html>`;
            return { statusCode: 200, headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }, body: html };
          }
        } catch (err) {
          const html = `<!doctype html><html><body><script>(function(){try{window.opener&&window.opener.postMessage('authorization:github:error:' + JSON.stringify({ error: 'exception_exchange', message: ${JSON.stringify('') } + ((${JSON.stringify('') } , function(e){try{return e.message||String(e)}catch(_){return 'error'}})(${/* placeholder */''})) + ${JSON.stringify('')}, context: { idSuffix: '${idSuffix}', hasSecret: ${hasSecret} } }),'*')}catch(_){}window.close();})();</script></body></html>`;
          return { statusCode: 200, headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }, body: html };
        }
      }
      // Always prefer PKCE: send code/state back to CMS; token exchange happens via /oauth/access_token
      // PKCE fallback: send code/state to CMS; try to recover state from opener storage if missing
      const html = `<!doctype html><html><body>
<script>
(async function(){
  try {
    if (window.opener && window.opener.postMessage) {
      var st = ${JSON.stringify(state)};
      var ru = ${JSON.stringify(redirectUri)};
      // Post server-managed attempt debug (if any)
      try { window.opener.postMessage({ source: 'oauth-debug', phase: 'server-pkce-attempt', attempted: ${svAttempted ? 'true' : 'false'}, status: ${svStatus}, body: ${JSON.stringify(svBody)}, error: ${JSON.stringify(svError)} }, '*'); } catch(_){ }
      // Try browser-managed PKCE exchange if our verifier cookie exists
      try {
        var mcv = document.cookie.match(/(?:^|; )cms_pkce_v=([^;]+)/);
        if (mcv) {
          var cv = decodeURIComponent(mcv[1]);
          try {
            var r = await fetch('/oauth/access_token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              credentials: 'omit',
              body: JSON.stringify({ code: ${JSON.stringify(code)}, code_verifier: cv, redirect_uri: ru })
            });
            const d = await r.json().catch(() => ({}));
            if (r && r.ok && d && d.access_token) {
              const token = d.access_token;
              try {
                document.cookie = 'cms_pkce_v=; Max-Age=0; Path=/; SameSite=None; Secure';
                document.cookie = 'cms_state=; Max-Age=0; Path=/; SameSite=None; Secure';
                document.cookie = 'cms_oauth_state=; Max-Age=0; Path=/; SameSite=None; Secure';
                document.cookie = 'cms_auth_dbg=; Max-Age=0; Path=/; SameSite=None; Secure';
              } catch(_){ }
              try { window.opener.postMessage({ source: 'oauth-debug', phase: 'browser-pkce-success', status: r.status, body: (function(){ try { if (d && d.access_token) { return JSON.stringify({ token_type: d.token_type, scope: d.scope, access_token: '[redacted]' }); } return JSON.stringify(d).slice(0, 500); } catch(_) { return '[unserializable]'; } })() }, '*'); } catch(_){ }
              window.opener.postMessage('authorization:github:success:' + JSON.stringify({ token: d.access_token, provider: 'github' }), '*');
              window.close();
              return;
            }
            try { window.opener.postMessage({ source: 'oauth-debug', phase: 'browser-pkce-fail', status: r && r.status, body: (function(){ try { return JSON.stringify(d).slice(0, 500); } catch(_) { return '[unserializable]'; } })() }, '*'); } catch(_){ }
          } catch(_){ }
        }
      } catch(_){ }
      try {
        var candidates = ['decap-cms.oauthState','decap-cms.oauth-state','netlify-cms.oauthState','netlify-cms.oauth-state','oauthState','oauth-state'];
        var stores = [];
        try { if (window.opener.localStorage) stores.push(window.opener.localStorage); } catch(_){}
        try { if (window.opener.sessionStorage) stores.push(window.opener.sessionStorage); } catch(_){}
        // 1) Try known plain-text state keys
        for (var i=0;i<candidates.length && !st;i++){
          for (var j=0;j<stores.length && !st;j++){
            try { var v = stores[j].getItem(candidates[i]); if (v) { st = v; } } catch(_){ }
          }
        }
        // 2) Try known JSON oauth blobs
        var jsonKeys = ['netlify-cms.oauth','decap-cms.oauth','cms.oauth'];
        for (var k=0;k<jsonKeys.length && !st;k++){
          for (var j2=0;j2<stores.length && !st;j2++){
            try { var val = stores[j2].getItem(jsonKeys[k]); if (val) { try { var obj = JSON.parse(val); if (obj && obj.state) { st = obj.state; } } catch(_){ } } } catch(_){ }
          }
        }
        // 3) As a last resort, scan all storage keys for any JSON with a 'state' field
        for (var j3=0;j3<stores.length && !st;j3++){
          try {
            var store = stores[j3];
            for (var idx=0; idx<(store && store.length || 0) && !st; idx++){
              try {
                var key = store.key(idx);
                var sval = key && store.getItem(key);
                if (!sval || typeof sval !== 'string') continue;
                if (sval[0] === '{' || /oauth/i.test(key)) {
                  try { var o = JSON.parse(sval); if (o && typeof o === 'object' && o.state) { st = o.state; } } catch(_){ }
                }
              } catch(_){ }
            }
          } catch(_){ }
        }
      } catch (_) {}
      // Fallback: recover state from cookie if missing
      var dbg = { qs_state_len: (st ? String(st).length : 0), had_cookie: false, cookie_len: 0, ls: false, ss: false };
      try { dbg.ls = !!(window.opener && window.opener.localStorage); } catch(_){}
      try { dbg.ss = !!(window.opener && window.opener.sessionStorage); } catch(_){}
      try {
        if (!st) {
          var m = document.cookie.match(/(?:^|; )cms_oauth_state=([^;]+)/);
          if (m) { st = decodeURIComponent(m[1]); dbg.had_cookie = true; }
        }
        try { dbg.cookie_len = (document.cookie || '').length; } catch(_){ }
      } catch(_){ }
      // Include auth debug from /authorize
      try {
        var m2 = document.cookie.match(/(?:^|; )cms_auth_dbg=([^;]+)/);
        if (m2) { try { dbg.auth = JSON.parse(decodeURIComponent(m2[1])); } catch(_){} }
      } catch(_){ }
      // Clear temporary cookies
      try { document.cookie = 'cms_oauth_state=; Max-Age=0; Path=/; SameSite=None; Secure'; } catch(_){ }
      try { document.cookie = 'cms_auth_dbg=; Max-Age=0; Path=/; SameSite=None; Secure'; } catch(_){ }
      window.opener.postMessage({ source: 'decap-cms', code: ${JSON.stringify(code)}, state: st, debug: dbg }, '*');
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
      const codeVerifier = body.code_verifier || body.codeVerifier || body.verifier; // optional if using client_secret instead
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
      // Support both PKCE (no secret when code_verifier present) and classic (with secret)
      if (codeVerifier) {
        params.set('code_verifier', codeVerifier);
      } else if (clientSecret) {
        params.set('client_secret', clientSecret);
      }

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
