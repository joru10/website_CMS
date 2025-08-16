const { URL } = require('url');
const axios = require('axios');
const crypto = require('crypto');

// In-memory store for code verifiers (best-effort). We also persist via cookies.
const codeVerifiers = new Map();

// Generate a random string for PKCE
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('hex');
}

// Generate code challenge from verifier
async function generateCodeChallenge(verifier) {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Get the correct redirect URI based on the environment
function getRedirectUri(protocol, host) {
  const baseUrl = `${protocol}://${host}`;
  return `${baseUrl}/.netlify/functions/oauth/callback`;
}

// Read client_id from env and trim to avoid hidden whitespace issues
function getClientId() {
  const raw = process.env.OAUTH_CLIENT_ID || process.env.GITHUB_CLIENT_ID || '';
  return typeof raw === 'string' ? raw.trim() : '';
}

// Optional: client_secret for confidential OAuth App (trimmed)
function getClientSecret() {
  const raw = process.env.OAUTH_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET || '';
  return typeof raw === 'string' ? raw.trim() : '';
}

const BUILD_VERSION = 'oauth_fn_2025-08-16_15:27Z_v1';

exports.handler = async (event, context) => {
  const { path } = event;
  const params = event.queryStringParameters || {};
  const headers = event.headers || {};
  const host = headers['x-forwarded-host'] || headers.host || '';
  const protocol = headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${host}`;

  // Entry log for debugging deployments
  try {
    console.log('[oauth] invocation', { path, BUILD_VERSION });
  } catch (_) {}

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: ''
    };
  }

  // Diagnostics endpoint to verify deployed function
  if (path.endsWith('/version')) {
    const info = {
      BUILD_VERSION,
      client_id_length: getClientId().length,
      client_id_prefix: getClientId().slice(0, 4),
      client_secret_present: !!getClientSecret(),
      client_secret_length: getClientSecret() ? getClientSecret().length : 0,
      redirect_uri: getRedirectUri(protocol, host),
      now: new Date().toISOString(),
    };
    console.log('[oauth/version]', info);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(info),
    };
  }

  // Handle login redirect to GitHub
  if (path.endsWith('/authorize') || path.endsWith('/auth')) {
    try {
      const verifier = generateCodeVerifier();
      const state = crypto.randomBytes(16).toString('hex');
      
      const codeChallenge = await generateCodeChallenge(verifier);
      codeVerifiers.set(state, verifier);

      const redirectUrl = new URL('https://github.com/login/oauth/authorize');
      redirectUrl.searchParams.append('client_id', getClientId());
      redirectUrl.searchParams.append('redirect_uri', getRedirectUri(protocol, host));
      redirectUrl.searchParams.append('scope', 'repo,user');
      redirectUrl.searchParams.append('state', state);
      redirectUrl.searchParams.append('code_challenge', codeChallenge);
      redirectUrl.searchParams.append('code_challenge_method', 'S256');

      return {
        statusCode: 302,
        headers: {
          Location: redirectUrl.toString(),
          'Cache-Control': 'no-cache',
          // Persist verifier in a secure, short-lived cookie keyed by state
          // Path=/ ensures it's sent to /oauth/access_token as well
          'Set-Cookie': `oauth_pkce_${state}=${verifier}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        },
        body: '',
      };
    } catch (error) {
      console.error('Authorization error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to initialize authorization' })
      };
    }
  }

  // Handle OAuth callback from GitHub
  if (path.endsWith('/callback')) {
    const { code, state, error, error_description } = params;

    // Parse cookies to retrieve PKCE verifier, and infer state if missing
    let cookies = {};
    try {
      const cookieHeader = event.headers.cookie || event.headers.Cookie || '';
      cookies = Object.fromEntries(
        cookieHeader
          .split(';')
          .map(c => c.trim())
          .filter(Boolean)
          .map(c => {
            const idx = c.indexOf('=');
            const k = idx >= 0 ? c.slice(0, idx) : c;
            const v = idx >= 0 ? c.slice(idx + 1) : '';
            return [k, decodeURIComponent(v)];
          })
      );
    } catch (_) {}

    let effectiveState = state;
    if (!effectiveState) {
      const pkceKey = Object.keys(cookies).find(k => k.startsWith('oauth_pkce_'));
      if (pkceKey) effectiveState = pkceKey.replace('oauth_pkce_', '');
    }
    const verifier = effectiveState ? cookies[`oauth_pkce_${effectiveState}`] : undefined;

    // Attempt server-side PKCE exchange when possible
    let tokenData = null;
    let tokenErr = null;
    if (!error && code && verifier) {
      try {
        const form = new URLSearchParams();
        form.append('client_id', getClientId());
        form.append('code', code);
        form.append('redirect_uri', getRedirectUri(protocol, host));
        form.append('code_verifier', verifier);
        if (effectiveState) form.append('state', effectiveState);
        form.append('grant_type', 'authorization_code');
        const secret = getClientSecret();
        if (secret) form.append('client_secret', secret);
        console.log('[oauth/callback] exchanging code with GitHub', {
          has_verifier: !!verifier,
          client_id_length: getClientId().length,
          client_secret_present: !!getClientSecret(),
          redirect_uri: getRedirectUri(protocol, host),
        });
        const tokenResponse = await axios.post(
          'https://github.com/login/oauth/access_token',
          form.toString(),
          {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
        const { access_token, token_type, scope, error: ghErr, error_description: ghErrDesc } = tokenResponse.data || {};
        if (ghErr || !access_token) {
          console.error('[oauth/callback] GitHub token error', { ghErr, ghErrDesc });
          tokenErr = { error: ghErr || 'invalid_grant', error_description: ghErrDesc || 'Failed to obtain access token' };
        } else {
          console.log('[oauth/callback] GitHub token success');
          tokenData = {
            access_token,
            token_type: token_type || 'bearer',
            scope: scope || 'repo,user',
          };
        }
      } catch (ex) {
        let gh = null;
        try { gh = ex.response && ex.response.data ? ex.response.data : null; } catch(_) {}
        tokenErr = gh && (gh.error || gh.error_description)
          ? { error: gh.error || 'server_error', error_description: gh.error_description || 'Token exchange failed' }
          : { error: 'server_error', error_description: ex.message || 'Token exchange failed' };
        console.error('[oauth/callback] token exchange exception', { message: ex.message, gh });
      }
    }

    // Build HTML that posts messages back to opener and closes
    // IMPORTANT: Only clear the PKCE cookie here if the server-side exchange succeeded.
    // If we failed to exchange on the server, the admin client may still complete
    // the exchange via POST /oauth/access_token which needs the verifier cookie.
    const clearCookieHeader = (tokenData && effectiveState)
      ? { 'Set-Cookie': `oauth_pkce_${effectiveState}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` }
      : {};

    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Authenticating…</title></head>
      <body>
        <div style="font-family: sans-serif; padding: 16px;">
          <h3>Authenticating…</h3>
          <p>If this window doesn't close automatically, you can close it.</p>
          <details open style="margin-top:12px;">
            <summary>OAuth debug</summary>
            <pre style="white-space:pre-wrap;word-break:break-word;background:#f6f8fa;padding:8px;border-radius:6px;border:1px solid #ddd;">
build_version: ${BUILD_VERSION}
client_id: ${JSON.stringify(getClientId())}
client_id_length: ${String(getClientId().length)}
client_secret_present: ${String(!!getClientSecret())}
client_secret_length: ${String(getClientSecret() ? getClientSecret().length : 0)}
redirect_uri: ${JSON.stringify(getRedirectUri(protocol, host))}
state (query): ${JSON.stringify(state || '')}
verifier cookie found: ${JSON.stringify(!!verifier)}
token_error: ${JSON.stringify(tokenErr || null)}
            </pre>
          </details>
        </div>
        <script>
          (function() {
            function send(msg) {
              try {
                console.log('[oauth/callback] posting message to opener', msg);
                if (window.opener) {
                  window.opener.postMessage(msg, '*');
                } else {
                  console.warn('[oauth/callback] no opener window');
                }
              } catch (e) {
                console.error('[oauth/callback] postMessage failed', e);
              }
            }
            var params = new URLSearchParams(window.location.search);
            var err = params.get('error');
            var code = params.get('code');
            var state = params.get('state');
            // If server-side token exchange succeeded, send legacy success only
            var token = ${JSON.stringify(tokenData || null)};
            if (token) {
              var successMsg = { type: 'authorization:github:success', provider: 'github', response: token };
              send(successMsg);
            } else if (code && state) {
              // Only send Decap message when server-side exchange did not produce a token
              var decapMsg = { source: 'decap-cms', code: code, state: state };
              send(decapMsg);
              setTimeout(function(){ send(decapMsg); }, 300);
            }
            // If there was an error (GitHub or server), notify parent too
            var tokenErr = ${JSON.stringify(tokenErr || (error ? { error: error, error_description: error_description || '' } : null))};
            if (tokenErr) {
              var errMsgLegacy = { type: 'authorization:github:error', error: tokenErr.error, error_description: tokenErr.error_description };
              send(errMsgLegacy);
              var errMsgDecap = { source: 'decap-cms', error: tokenErr.error, error_description: tokenErr.error_description };
              send(errMsgDecap);
            }
            // Close with a slightly longer delay to allow inspection if needed
            setTimeout(function(){ window.close(); }, 6000);
          })();
        </script>
      </body>
      </html>`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html', ...clearCookieHeader },
      body: html,
    };
  }

  // Handle token endpoint (used by Decap CMS for token exchange)
  if (path.endsWith('/access_token')) {
    try {
      const body = JSON.parse(event.body || '{}');
      let { code, state, code_verifier: clientCodeVerifier, verifier: clientVerifier } = body;
      
      if (!code) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'invalid_request',
            error_description: 'Missing required parameter: code'
          })
        };
      }
      
      // Parse cookies once, and discover state if missing
      let cookies = {};
      try {
        const cookieHeader = event.headers.cookie || event.headers.Cookie || '';
        cookies = Object.fromEntries(
          cookieHeader.split(';').map(c => c.trim()).filter(Boolean).map(c => {
            const idx = c.indexOf('=');
            const k = idx >= 0 ? c.slice(0, idx) : c;
            const v = idx >= 0 ? c.slice(idx + 1) : '';
            return [k, decodeURIComponent(v)];
          })
        );
      } catch (e) {
        // ignore cookie parse errors
      }
      if (typeof state === 'string') state = state.trim();
      if (!state) {
        // Try to infer state from PKCE cookie name
        const pkceKey = Object.keys(cookies).find(k => k.startsWith('oauth_pkce_'));
        if (pkceKey) state = pkceKey.replace('oauth_pkce_', '');
      }
      // Prefer server-stored verifier from cookie; fallback to client-provided, then memory
      let verifier = undefined;
      if (state) verifier = cookies[`oauth_pkce_${state}`];
      if (!verifier) verifier = clientCodeVerifier || clientVerifier;
      if (!verifier && state) verifier = codeVerifiers.get(state);
      if (!verifier) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'invalid_grant',
            error_description: 'Missing code_verifier and no server verifier cookie found'
          })
        };
      }
      
      // Exchange the code for a token (PKCE: no client_secret)
      const form2 = new URLSearchParams();
      form2.append('client_id', getClientId());
      form2.append('code', code);
      form2.append('redirect_uri', getRedirectUri(protocol, host));
      form2.append('code_verifier', verifier);
      if (state) form2.append('state', state);
      form2.append('grant_type', 'authorization_code');
      const secret2 = getClientSecret();
      if (secret2) form2.append('client_secret', secret2);
      console.log('[oauth/access_token] exchanging code with GitHub', {
        has_verifier: !!verifier,
        client_id_length: getClientId().length,
        client_secret_present: !!getClientSecret(),
        redirect_uri: getRedirectUri(protocol, host),
      });
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        form2.toString(),
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      
      const { access_token, token_type, scope, error, error_description } = tokenResponse.data;
      
      if (error) {
        console.error('[oauth/access_token] GitHub token error', { error, error_description, raw: tokenResponse.data });
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: error || 'invalid_grant',
            error_description: error_description || 'Failed to obtain access token from GitHub'
          })
        };
      }
      
      if (!access_token) {
        console.error('No access token in response:', tokenResponse.data);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'server_error',
            error_description: 'GitHub did not return an access token'
          })
        };
      }
      
      // Clean up the verifier (memory and cookie)
      if (state) codeVerifiers.delete(state);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
          'Pragma': 'no-cache',
          // Expire the cookie when we know the state
          ...(state ? { 'Set-Cookie': `oauth_pkce_${state}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` } : {})
        },
        body: JSON.stringify({
          access_token,
          token_type: token_type || 'bearer',
          scope: scope || 'repo,user'
        })
      };
      
    } catch (error) {
      console.error('Access token endpoint error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'server_error',
          error_description: error.message || 'Internal server error during token exchange'
        })
      };
    }
  }

  // Handle client ID endpoint (used by Decap CMS to get the client ID)
  if (path.endsWith('/client_id')) {
    const clientId = getClientId();
    
    if (!clientId) {
      console.error('No client ID found in environment variables');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'server_error',
          error_description: 'OAuth client ID not configured'
        })
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({
        client_id: clientId,
        service: 'github',
        auth_scheme: 'pkce',
        auth_endpoint: '/oauth/auth',
        token_endpoint: '/oauth/access_token'
      })
    };
  }

  // Default 404
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Not found' }),
  };
};
