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

// Get the correct redirect URI based on the environment
function getRedirectUri(protocol, host) {
  const baseUrl = `${protocol}://${host}`;
  return `${baseUrl}/.netlify/functions/oauth/callback`;
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
      redirectUrl.searchParams.append('client_id', process.env.GITHUB_CLIENT_ID || process.env.OAUTH_CLIENT_ID);
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
    
    // Handle errors from GitHub
    if (error) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'OAuth Error',
          error_description: error_description || 'Unknown error during OAuth flow'
        })
      };
    }
    
    const verifier = codeVerifiers.get(state);
    codeVerifiers.delete(state); // Clean up the verifier after use

    if (!code || !verifier) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Invalid Request',
          error_description: 'Missing or invalid code/state parameters'
        })
      };
    }

    try {
      // Exchange code for access token
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: process.env.GITHUB_CLIENT_ID || process.env.OAUTH_CLIENT_ID,
          code,
          redirect_uri: getRedirectUri(protocol, host),
          code_verifier: verifier,
          client_secret: process.env.GITHUB_CLIENT_SECRET, // Optional for PKCE, but some apps might need it
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
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
            error: 'GitHub Token Error',
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
            error: 'No Access Token',
            error_description: 'GitHub did not return an access token'
          })
        };
      }

      // Create a simple HTML page that will post the token back to the parent window
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authenticating...</title>
          <script>
            // Post the token to the parent window and close
            window.opener.postMessage({
              type: 'authorization:github:success',
              response: {
                access_token: '${access_token}',
                token_type: '${token_type || 'bearer'}',
                scope: '${scope || ''}'
              }
            }, window.location.origin);
            
            // Close the popup
            window.close();
          </script>
        </head>
        <body>
          <p>Authentication successful! You can close this window.</p>
          <button onclick="window.close()">Close Window</button>
        </body>
        </html>
      `;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: html
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      
      // Create an error page that will show the error to the user
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #d73a49; background: #ffebee; padding: 20px; border-radius: 4px; margin: 20px auto; max-width: 600px; }
            .details { color: #666; font-size: 0.9em; margin-top: 20px; }
            button { 
              background: #0366d6; 
              color: white; 
              border: none; 
              padding: 10px 20px; 
              border-radius: 4px; 
              cursor: pointer; 
              margin-top: 20px;
            }
            button:hover { background: #0356b6; }
          </style>
          <script>
            // Try to notify the parent window about the error
            if (window.opener) {
              window.opener.postMessage({
                type: 'authorization:github:error',
                error: 'Authentication Failed',
                error_description: '${error.message.replace(/'/g, '\'')}'
              }, window.location.origin);
            }
          </script>
        </head>
        <body>
          <h1>Authentication Error</h1>
          <div class="error">
            <p>We couldn't log you in. Please try again later.</p>
            <div class="details">
              <p><strong>Error:</strong> ${error.message}</p>
            </div>
          </div>
          <button onclick="window.close()">Close Window</button>
        </body>
        </html>
      `;
      
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html' },
        body: errorHtml
      };
    }
  }

  // Handle token endpoint (used by Decap CMS for token exchange)
  if (path.endsWith('/access_token')) {
    try {
      const body = JSON.parse(event.body || '{}');
      const { code, state } = body;
      
      if (!code || !state) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'invalid_request',
            error_description: 'Missing required parameters: code and state'
          })
        };
      }
      
      const verifier = codeVerifiers.get(state);
      if (!verifier) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'invalid_grant',
            error_description: 'Invalid or expired state parameter'
          })
        };
      }
      
      // Exchange the code for a token
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: process.env.GITHUB_CLIENT_ID || process.env.OAUTH_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: getRedirectUri(protocol, host),
          code_verifier: verifier
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
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
      
      // Clean up the verifier
      codeVerifiers.delete(state);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
          'Pragma': 'no-cache'
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
    const clientId = process.env.GITHUB_CLIENT_ID || process.env.OAUTH_CLIENT_ID;
    
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
