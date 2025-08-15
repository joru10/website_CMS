import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to generate random state
const randomState = () => crypto.randomBytes(16).toString('hex');

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

function randomState(len = 24) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

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
    
    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: '/',
      domain: '.onrender.com'
    };
    
    // Set cookies
    res.cookie('oauth_state', state, cookieOptions);
    res.cookie('oauth_origin', origin, cookieOptions);
    res.cookie('code_verifier', codeVerifier, cookieOptions);
    
    // Build GitHub OAuth URL with PKCE
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: CALLBACK_URL,
      scope: SCOPE,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    console.log('Redirecting to GitHub OAuth:', authUrl);
    res.redirect(authUrl);
    
  } catch (error) {
    console.error('Error in /auth:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Step 2: GitHub redirects here with ?code=...&state=...
app.get('/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;
    const savedState = req.cookies['oauth_state'];
    const origin = req.cookies['oauth_origin'] || FRONTEND_URL;
    const codeVerifier = req.cookies['code_verifier'];
    
    // Clear cookies
    ['oauth_state', 'oauth_origin', 'code_verifier'].forEach(cookie => {
      res.clearCookie(cookie, {
        domain: '.onrender.com',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'none'
      });
    });

    // Handle OAuth errors
    if (error) {
      console.error('GitHub OAuth error:', { error, error_description });
      return res.redirect(`${origin}/?error=${encodeURIComponent(error_description || error)}`);
    }

    // Verify state
    if (!state || !savedState || state !== savedState) {
      console.error('Invalid OAuth state:', { 
        received: state, 
        expected: savedState,
        hasCodeVerifier: !!codeVerifier,
        headers: req.headers
      });
      return res.status(400).send('Invalid OAuth state');
    }

    // Verify code
    if (!code) {
      console.error('Missing authorization code');
      return res.status(400).send('Missing authorization code');
    }

    console.log('Exchanging code for access token...');
    
    // Prepare token request parameters
    const tokenParams = new URLSearchParams({
      client_id: CLIENT_ID,
      code,
      redirect_uri: CALLBACK_URL,
      grant_type: 'authorization_code'
    });

    // Add PKCE code_verifier if available, otherwise use client_secret
    if (codeVerifier) {
      console.log('Using PKCE flow with code_verifier');
      tokenParams.append('code_verifier', codeVerifier);
      // Don't send client_secret with PKCE
    } else if (CLIENT_SECRET) {
      console.log('Using traditional OAuth with client_secret');
      tokenParams.append('client_secret', CLIENT_SECRET);
    } else {
      console.error('No code_verifier or CLIENT_SECRET available');
      return res.status(500).send('Server configuration error');
    }

    console.log('Token request params:', tokenParams.toString());

    // Exchange code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'GitHub-OAuth-PKCE-Demo'
      },
      body: tokenParams.toString()
    });

    console.log('Token response status:', tokenResponse.status);

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
