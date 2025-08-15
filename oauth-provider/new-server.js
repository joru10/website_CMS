require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
app.use(cookieParser());
app.use(cors({
  origin: ['https://comfy-panda-0d488a.netlify.app', 'http://localhost:8888'],
  credentials: true
}));

const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23liC4fJrNvQIAjDiy';
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL || 'https://joru10-cms-oauth.onrender.com/callback';
const SCOPE = 'repo';

// Generate random state
function randomState() {
  return crypto.randomBytes(16).toString('hex');
}

// Generate a secure random string for PKCE
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('hex');
}

// Create code challenge from verifier
async function generateCodeChallenge(verifier) {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// OAuth Start
app.get('/auth', async (req, res) => {
  const state = randomState();
  const origin = req.query.origin || 'https://comfy-panda-0d488a.netlify.app';
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  res.cookie('oauth_state', state, { httpOnly: true, secure: true, sameSite: 'none' });
  res.cookie('oauth_origin', origin, { httpOnly: true, secure: true, sameSite: 'none' });
  res.cookie('code_verifier', codeVerifier, { httpOnly: true, secure: true, sameSite: 'none' });
  
  const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(CALLBACK_URL)}` +
    `&scope=${encodeURIComponent(SCOPE)}` +
    `&state=${state}` +
    `&code_challenge=${codeChallenge}` +
    '&code_challenge_method=S256' +
    '&allow_signup=false';
    
  res.redirect(url);
});

// OAuth Callback
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const storedState = req.cookies.oauth_state;
  const codeVerifier = req.cookies.code_verifier;
  const origin = req.cookies.oauth_origin || 'https://comfy-panda-0d488a.netlify.app';
  
  // Clear the code verifier cookie
  res.clearCookie('code_verifier');

  // Clear cookies
  res.clearCookie('oauth_state');
  res.clearCookie('oauth_origin');

  // Verify state
  if (state !== storedState) {
    return res.status(400).send('Invalid state');
  }

  try {
    // Exchange code for token using PKCE (no client secret)
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        code,
        redirect_uri: CALLBACK_URL,
        code_verifier: codeVerifier
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData);
      return res.redirect(`${origin}/admin?error=${encodeURIComponent(tokenData.error_description || 'OAuth error')}`);
    }

    // Redirect back to the CMS with the token
    res.redirect(`${origin}/admin/#token=${encodeURIComponent(tokenData.access_token)}`);
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('OAuth error');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`OAuth proxy running on port ${PORT}`);
});
