require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3010;

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// Test endpoint
app.get('/test', (req, res) => {
  res.send('Test endpoint is working!');
});

// Configuration
// Note: Using OAUTH_CLIENT_ID to match Netlify environment variable name
const CLIENT_ID = process.env.OAUTH_CLIENT_ID || 'Ov23lilcBd8JkV3HWZbE'; // Using the correct client ID
// No client secret needed for PKCE flow
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5501'; // Changed to 5501 as agreed
const REDIRECT_URI = `${FRONTEND_URL}/admin`;

// In-memory store for code verifiers (use a proper cache in production)
const codeVerifiers = new Map();

// Generate a random string for PKCE
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('hex');
}

// Generate code challenge for PKCE
function generateCodeChallenge(verifier) {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Start OAuth flow
app.get('/login', (req, res) => {
  const codeVerifier = generateCodeVerifier();
  const state = req.query.state || crypto.randomBytes(16).toString('hex');
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
  // Store the code verifier with the state as the key
  codeVerifiers.set(state, codeVerifier);
  
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('scope', 'repo,user');
  
  res.redirect(authUrl.toString());
});

// OAuth callback
app.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.status(400).send(`OAuth error: ${error}`);
  }
  
  if (!code) {
    return res.status(400).send('No authorization code received');
  }
  
  const codeVerifier = codeVerifiers.get(state);
  if (!codeVerifier) {
    return res.status(400).send('Invalid or expired state');
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
    
    const tokenData = tokenResponse.data;
    
    if (tokenData.error) {
      return res.status(400).send(`Error from GitHub: ${tokenData.error_description || tokenData.error}`);
    }
    
    // Clean up the code verifier
    codeVerifiers.delete(state);
    
    // Send a simple HTML response that will close the popup and send the token to the parent
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Complete</title>
          <script>
            (function() {
              // Store token in localStorage as a fallback
              try {
                localStorage.setItem('netlify-cms-token', JSON.stringify(${JSON.stringify(tokenData)}));
              } catch (e) {
                console.error('Error storing token:', e);
              }
              
              // Try to send the token to the parent window
              function sendToken() {
                try {
                  if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                      type: 'authorization:github:success',
                      response: ${JSON.stringify(tokenData)}
                    }, '*');
                    return true;
                  }
                } catch (e) {
                  console.error('Error sending token to parent:', e);
                }
                return false;
              }
              
              // Try to send the token immediately
              if (sendToken()) {
                // Close the popup after a short delay
                setTimeout(function() {
                  try { window.close(); } catch (e) {}
                }, 300);
              } else {
                // If we can't send to parent, show a message
                document.body.innerHTML = '<h2>Authentication successful! Please close this window and return to the application.</h2>';
              }
            })();
          </script>
        </head>
        <body>
          <h2>Please wait...</h2>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).send('Error during token exchange');
  }
});

// Start server
app.listen(port, () => {
  console.log(`OAuth server running on http://localhost:${port}`);
  console.log(`- Login: http://localhost:${port}/login`);
});
