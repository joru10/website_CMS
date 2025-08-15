import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

const app = express();
const SERVER_PORT = process.env.PORT || 3000;

// GitHub OAuth App credentials from environment variables
// GitHub OAuth App credentials from environment variables
// Hardcoded client ID to ensure consistency
const CLIENT_ID = 'Ov23lilcBd8JkV3HWZbE'; // Hardcoded client ID
// Using OAUTH_CLIENT_SECRET to match Render environment variable
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET; // Must be set in production
const CALLBACK_URL = process.env.OAUTH_REDIRECT_URL || 'https://joru10-cms-oauth.onrender.com/callback';
const SCOPE = 'repo,user';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://comfy-panda-0d488a.netlify.app';

if (!CLIENT_ID || !CLIENT_SECRET || !CALLBACK_URL) {
  console.warn('[WARN] Missing one of OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REDIRECT_URL');
}

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for code verifiers (in production, use a proper session store)
const stateToCodeVerifierMap = {};

// Helper function to generate random state
function randomState(len = 24) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// Generate a code verifier for PKCE
const generateCodeVerifier = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate a code challenge from verifier for PKCE
const generateCodeChallenge = (verifier) => {
  const hash = crypto.createHash('sha256').update(verifier).digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return hash;
};

app.get('/status', (_req, res) => {
  res.json({ ok: true });
});

// Step 1: Start OAuth flow with PKCE
// GET /auth?origin=https://comfy-panda-0d488a.netlify.app
app.get('/auth', async (req, res) => {
  try {
    const state = randomState();
    const origin = req.query.origin || FRONTEND_URL;
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store the state in a simple format that's easy to validate
    // We'll store the codeVerifier in memory for this session
    const stateParam = state;
    
    // Store the codeVerifier in memory with the state as the key
    if (codeVerifier) {
      stateToCodeVerifierMap[state] = codeVerifier;
    }
    
    console.log('Using state parameter:', stateParam);
    console.log('Stored codeVerifier for state:', !!codeVerifier);
    
    // Build GitHub OAuth URL with PKCE and encoded state
    const oauthParams = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: CALLBACK_URL,
      scope: SCOPE,
      state: stateParam, // Pass all data in the state parameter
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    const authUrl = `https://github.com/login/oauth/authorize?${oauthParams.toString()}`;
    console.log('Redirecting to GitHub OAuth');
    res.redirect(authUrl);
    
  } catch (error) {
    console.error('Error in /auth:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Step 2: GitHub redirects here with ?code=...&state=...
app.get('/callback', async (req, res) => {
  try {
    const { code, state: stateParam, error, error_description } = req.query;
    
    // Handle OAuth errors first
    if (error) {
      console.error('GitHub OAuth error:', { error, error_description });
      const origin = FRONTEND_URL; // Fallback origin
      return res.redirect(`${origin}/?error=${encodeURIComponent(error_description || error)}`);
    }
    
    console.log('Received OAuth callback with state:', stateParam);
    
    if (!stateParam) {
      console.error('No state parameter received from GitHub');
      return res.status(400).send('Missing state parameter');
    }
    
    // Handle the state parameter
    const state = stateParam;
    const origin = req.query.origin || FRONTEND_URL;
    const codeVerifier = stateToCodeVerifierMap[state];
    
    // Clean up the stored code verifier
    if (codeVerifier) {
      delete stateToCodeVerifierMap[state];
    }
    
    console.log('Parsed state parameters:', {
      state,
      origin,
      hasCodeVerifier: !!codeVerifier
    });
    
    if (!state) {
      throw new Error('State parameter is missing required data');
    }
    
    // For debugging - log all cookies
    console.log('All cookies:', req.cookies);
    
    // Try to get the state from the Authorization header as fallback
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log('Found token in Authorization header, length:', token?.length);
    }
    
    // Verify code
    if (!code) {
      console.error('Missing authorization code');
      return res.status(400).send('Missing authorization code');
    }

    console.log('Exchanging code for access token...');
    
    // Prepare token request parameters
    let tokenParams = new URLSearchParams({
      client_id: CLIENT_ID,
      code,
      redirect_uri: CALLBACK_URL,
      grant_type: 'authorization_code'
    });

    // For PKCE flow, only include the code_verifier and explicitly remove client_secret
    if (codeVerifier) {
      console.log('Using PKCE flow with code_verifier');
      const pkceParams = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET, // Include client_secret for server-side PKCE
        code,
        redirect_uri: CALLBACK_URL,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier
      });
      tokenParams = pkceParams;
    } else if (CLIENT_SECRET) {
      // Fallback to traditional OAuth with client_secret (not recommended)
      console.log('Using traditional OAuth with client_secret');
      tokenParams.append('client_secret', CLIENT_SECRET);
    } else {
      console.error('No code_verifier or CLIENT_SECRET available');
      return res.status(500).json({
        error: 'server_error',
        error_description: 'Server configuration error: Missing required credentials'
      });
    }

    console.log('Token request params:', tokenParams.toString());

    // Exchange code for token using GitHub's OAuth endpoint
    const tokenUrl = 'https://github.com/login/oauth/access_token';
    const tokenBody = tokenParams.toString();
    
    console.log('Sending token request to:', tokenUrl);
    console.log('Request body:', tokenBody);
    console.log('Environment variables:', {
      CLIENT_ID: CLIENT_ID,
      CLIENT_SECRET: CLIENT_SECRET ? '***' : 'MISSING',
      CALLBACK_URL: CALLBACK_URL
    });
    
    try {
      console.log('Sending token request with headers:', {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Decap-CMS-OAuth-Provider'
      });
      
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Decap-CMS-OAuth-Provider'
        },
        body: tokenBody
      });

      console.log('Token response status:', tokenResponse.status);
      console.log('Response headers:', Object.fromEntries(tokenResponse.headers.entries()));
      
      const responseText = await tokenResponse.text();
      console.log('GitHub raw response:', responseText);
      
      let tokenData;
      try {
        tokenData = JSON.parse(responseText);
        console.log('Parsed token data:', {
          ...tokenData,
          access_token: tokenData.access_token ? '***' : 'MISSING',
          refresh_token: tokenData.refresh_token ? '***' : 'MISSING'
        });
      } catch (e) {
        console.error('Error parsing GitHub response as JSON:', e);
        console.error('Raw response that failed to parse:', responseText);
        return res.status(500).json({
          error: 'invalid_json_response',
          error_description: 'Invalid JSON response from GitHub',
          raw_response: responseText
        });
      }

      console.log('GitHub response data:', tokenData);

      if (tokenData.error) {
        console.error('GitHub OAuth error:', tokenData);
        return res.status(400).json({
          error: 'GitHub OAuth error',
          error_description: tokenData.error_description || tokenData.error,
          error_uri: tokenData.error_uri
        });
      }

      if (!tokenData.access_token) {
        console.error('No access token in response:', tokenData);
        return res.status(500).json({
          error: 'No access token',
          error_description: 'GitHub did not return an access token'
        });
      }

      // Success - close the popup and pass the token to the parent window
      console.log('OAuth successful, closing popup and returning token');
      const responseHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Complete</title>
            <script>
              (function() {
                try {
                  // Try to send the token to the parent window
                  if (window.opener) {
                    window.opener.postMessage({
                      type: 'authorization:github:success',
                      response: ${JSON.stringify(tokenData)}
                    }, window.opener.location.origin);
                  }
                  
                  // Try to close the window
                  setTimeout(function() {
                    window.close();
                  }, 100);
                  
                  // Fallback message
                  setTimeout(function() {
                    document.getElementById('message').innerHTML = 
                      'Authentication successful. You can close this window.';
                  }, 500);
                  
                } catch (e) {
                  console.error('Error in auth callback:', e);
                  document.body.innerText = 'Authentication successful. Please close this window and return to the application.';
                }
              })();
            </script>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
                color: #333;
              }
              .message {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 400px;
              }
            </style>
          </head>
          <body>
            <div class="message" id="message">
              <h2>Authentication Successful</h2>
              <p>Please wait while we redirect you back to the application...</p>
            </div>
          </body>
        </html>
      `;
      
      res.set('Content-Type', 'text/html');
      return res.send(responseHtml);

    } catch (error) {
      console.error('Error during token exchange:', error);
      return res.status(500).json({
        error: 'token_exchange_error',
        error_description: error.message
      });
    }

  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.status(500).send('Authentication failed: ' + error.message);
  }
});

// Start the server
app.listen(SERVER_PORT, () => {
  console.log(`OAuth server running on port ${SERVER_PORT}`);
});
