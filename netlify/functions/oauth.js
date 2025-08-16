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

exports.handler = async (event, context) => {
  const { path } = event;
  const params = event.queryStringParameters || {};
  const headers = event.headers || {};
  const host = headers['x-forwarded-host'] || headers.host || '';
  const protocol = headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${host}`;

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
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
          tokenErr = { error: ghErr || 'invalid_grant', error_description: ghErrDesc || 'Failed to obtain access token' };
        } else {
          tokenData = {
            access_token,
            token_type: token_type || 'bearer',
            scope: scope || 'repo,user',
          };
        }
      } catch (ex) {
        tokenErr = { error: 'server_error', error_description: ex.message || 'Token exchange failed' };
      }
    }

    // Build HTML that posts messages back to opener and closes
    const clearCookieHeader = effectiveState
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
client_id: ${JSON.stringify(getClientId())}
client_id_length: ${String(getClientId().length)}
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
            // Always send Decap message so CMS can complete exchange if needed
            if (code && state) {
              var decapMsg = { source: 'decap-cms', code: code, state: state };
              send(decapMsg);
              setTimeout(function(){ send(decapMsg); }, 300);
            }
            // If server-side token exchange succeeded, also send legacy success
            var token = ${JSON.stringify(tokenData || null)};
            if (token) {
              var successMsg = { type: 'authorization:github:success', provider: 'github', response: token };
              send(successMsg);
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
        console.error('GitHub token error:', error, error_description);
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
