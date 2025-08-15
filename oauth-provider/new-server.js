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

// OAuth Start
app.get('/auth', (req, res) => {
  const state = randomState();
  const origin = req.query.origin || 'https://comfy-panda-0d488a.netlify.app';
  
  res.cookie('oauth_state', state, { httpOnly: true, secure: true, sameSite: 'none' });
  res.cookie('oauth_origin', origin, { httpOnly: true, secure: true, sameSite: 'none' });
  
  const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&scope=${encodeURIComponent(SCOPE)}&state=${state}&allow_signup=false`;
  res.redirect(url);
});

// OAuth Callback
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const storedState = req.cookies.oauth_state;
  const origin = req.cookies.oauth_origin || 'https://comfy-panda-0d488a.netlify.app';

  // Clear cookies
  res.clearCookie('oauth_state');
  res.clearCookie('oauth_origin');

  // Verify state
  if (state !== storedState) {
    return res.status(400).send('Invalid state');
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: CALLBACK_URL,
        state
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
