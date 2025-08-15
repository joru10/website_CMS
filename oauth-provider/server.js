import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
const SERVER_PORT = process.env.PORT || 3000;

// GitHub OAuth App credentials from environment variables
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23liC4fJrNvQIAjDiy';
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
  res.cookie('oauth_state', state, { httpOnly: true, secure: true });
  res.cookie('oauth_origin', origin, { httpOnly: true, secure: true });
  
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

    // Clear the cookies
    res.clearCookie('oauth_state');
    res.clearCookie('oauth_origin');

    if (!code || !state || !savedState || state !== savedState) {
      console.error('Invalid OAuth state or missing code:', { code, state, savedState });
      return res.status(400).send('Invalid OAuth state or missing code');
    }

    // Exchange code for access token
    console.log('Exchanging code for token with GitHub...');
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'joru10-cms-oauth/1.0.0'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: CALLBACK_URL
      })
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
