const { URL } = require('url');
const axios = require('axios');
const crypto = require('crypto');

// In-memory store for code verifiers (use a proper cache in production)
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
    const verifier = generateCodeVerifier();
    const state = crypto.randomBytes(16).toString('hex');
    
    const codeChallenge = await generateCodeChallenge(verifier);
    codeVerifiers.set(state, verifier);

    const redirectUrl = new URL('https://github.com/login/oauth/authorize');
    redirectUrl.searchParams.append('client_id', process.env.OAUTH_CLIENT_ID);
    redirectUrl.searchParams.append('redirect_uri', `${baseUrl}/.netlify/functions/oauth/callback`);
    redirectUrl.searchParams.append('scope', 'repo,user');
    redirectUrl.searchParams.append('state', state);
    redirectUrl.searchParams.append('code_challenge', codeChallenge);
    redirectUrl.searchParams.append('code_challenge_method', 'S256');

    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl.toString(),
        'Cache-Control': 'no-cache',
      },
      body: '',
    };
  }

  // Handle OAuth callback from GitHub
  if (path.endsWith('/callback')) {
    const { code, state } = params;
    const verifier = codeVerifiers.get(state);

    if (!code || !verifier) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request' }),
      };
    }

    try {
      // Exchange code for access token
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: process.env.OAUTH_CLIENT_ID,
          code,
          redirect_uri: `${baseUrl}/.netlify/functions/oauth/callback`,
          code_verifier: verifier,
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      const { access_token, token_type, scope } = tokenResponse.data;

      // Clean up
      codeVerifiers.delete(state);

      // Redirect back to the CMS with the token
      const redirectUrl = new URL(`${baseUrl}/admin/`);
      redirectUrl.searchParams.append('access_token', access_token);
      redirectUrl.searchParams.append('token_type', token_type);
      redirectUrl.searchParams.append('scope', scope);

      return {
        statusCode: 302,
        headers: {
          Location: redirectUrl.toString(),
          'Cache-Control': 'no-cache',
        },
        body: '',
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to exchange code for token',
          details: error.message 
        }),
      };
    }
  }

  // Handle token endpoint
  if (path.endsWith('/access_token')) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        access_token: 'dummy-token',
        token_type: 'bearer',
        scope: 'repo,user',
      }),
    };
  }

  // Handle client ID endpoint
  if (path.endsWith('/client_id')) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        client_id: process.env.OAUTH_CLIENT_ID,
        auth_type: 'pkce',
        token_endpoint: `${baseUrl}/.netlify/functions/oauth/access_token`,
      }),
    };
  }

  // Default 404
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Not found' }),
  };
};
