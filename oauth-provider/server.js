import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
const SERVER_PORT = process.env.PORT || 3000;

// GitHub OAuth App credentials from environment variables
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23lilcBd8JkV3HWZbE';
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET; // Must be set in production
const CALLBACK_URL = 'https://joru10-cms-oauth.onrender.com/callback';
const SCOPE = 'repo,user';

if (!CLIENT_ID || !CLIENT_SECRET || !CALLBACK_URL) {
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
  const state = randomState();
  const origin = req.query.origin || 'https://comfy-panda-0d488a.netlify.app';
  
  // Store state and origin in cookies
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 60000, // 1 minute
    path: '/',
    domain: '.onrender.com' // Allow subdomains to access the cookie
  };
  
  res.cookie('oauth_state', state, cookieOptions);
  res.cookie('oauth_origin', origin, cookieOptions);
  
  const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&scope=${encodeURIComponent(SCOPE)}&state=${state}&allow_signup=false`;
  console.log('Redirecting to GitHub OAuth:', url);
  res.redirect(url);
});

// Step 2: GitHub redirects here with ?code=...&state=...
app.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const savedState = req.cookies['oauth_state'];
    const origin = req.cookies['oauth_origin'] || 'https://comfy-panda-0d488a.netlify.app';

    // Get the code verifier from cookies before clearing
    const codeVerifier = req.cookies['code_verifier'];
    
    // Clear the cookies
    res.clearCookie('oauth_state');
    res.clearCookie('oauth_origin');
    res.clearCookie('code_verifier');

    console.log('Verifying OAuth state and code verifier:', { 
      receivedState: state, 
      storedState: savedState,
      hasCodeVerifier: !!codeVerifier,
      cookies: req.cookies,
      headers: req.headers
    });
    
    if (!code || !state || !savedState || state !== savedState) {
      console.error('Invalid OAuth state:', { 
        received: state, 
        expected: savedState,
        hasCodeVerifier: !!codeVerifier,
        cookies: req.cookies,
        headers: req.headers
      });
      return res.status(400).send('Invalid OAuth state or missing code');
    }

    // Exchange code for access token
    console.log('Exchanging code for token with GitHub...');
    const tokenParams = {
      client_id: CLIENT_ID,
      code,
      redirect_uri: CALLBACK_URL
    };

    // If we have a code verifier (PKCE flow), use it without client_secret
    // Otherwise fall back to traditional OAuth with client_secret
    if (codeVerifier) {
      console.log('Using PKCE flow with code_verifier');
      tokenParams.code_verifier = codeVerifier;
      tokenParams.client_secret = ''; // Explicitly empty for PKCE
    } else {
      console.log('Using traditional OAuth with client_secret');
      tokenParams.client_secret = CLIENT_SECRET;
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tokenParams)
    });

    console.log('GitHub response status:', tokenResponse.status);
    const tokenData = await tokenResponse.json().catch(e => {
      console.error('Error parsing GitHub response:', e);
      return { error: 'Invalid response from GitHub' };
    });

    console.log('GitHub response data:', tokenData);

    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData);
      return res.status(400).send(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`);
    }

    if (!tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return res.status(500).send('Token exchange failed: No access token received');
    }

    // Redirect back to the admin interface with the token
    const redirectUrl = new URL('/admin/#/', origin);
    redirectUrl.hash = `#/auth?token=${encodeURIComponent(tokenData.access_token)}`;
    
    // Set token in a secure, httpOnly cookie
    res.cookie('cms_token', tokenData.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: tokenData.expires_in * 1000 || 60 * 60 * 1000, // 1 hour default
      path: '/'
    });

    console.log('OAuth successful, redirecting to:', redirectUrl.toString());
    res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Authentication failed: ' + error.message);
  }
});

// Start the server
app.listen(SERVER_PORT, () => {
  console.log(`OAuth server running on port ${SERVER_PORT}`);
});
