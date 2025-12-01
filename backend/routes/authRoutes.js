const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { sendConfirmationEmail, sendRegistrationEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_dev_key_change_me';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Simulated OAuth providers (in production, use real OAuth libraries like passport)
const oauthProviders = {
  google: {
    name: 'Google',
    color: '#DB4437'
  },
  microsoft: {
    name: 'Microsoft',
    color: '#00A4EF'
  },
  yahoo: {
    name: 'Yahoo',
    color: '#6001D2'
  }
};

// OAuth initiation endpoint
router.get('/auth/:provider', (req, res) => {
  const { provider } = req.params;
  const mode = req.query.mode || 'signin'; // signin or signup
  
  if (!oauthProviders[provider]) {
    return res.redirect(`${FRONTEND_URL}/Auth/sign-in?error=${encodeURIComponent('Provider tidak didukung')}`);
  }

  // In production, redirect to actual OAuth provider
  // For demo, we'll simulate the OAuth flow
  console.log(`[OAuth] Initiating ${provider} ${mode} flow`);
  
  // Store mode in session or state parameter
  // For demo, we'll redirect back immediately with simulated data
  const simulatedEmail = `user@${provider}.com`;
  const simulatedName = `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`;
  
  // Simulate OAuth callback
  setTimeout(() => {
    handleOAuthCallback(provider, simulatedEmail, simulatedName, mode, res);
  }, 100);
});

// OAuth callback handler (simulated) - Now using database
async function handleOAuthCallback(provider, email, name, mode, res) {
  try {
    const bcrypt = require('bcrypt');
    const db = require('../models');
    const { User } = db;
    
    let user = await User.findOne({ where: { email } });
    let isNewUser = false;
    
    if (mode === 'signup' || !user) {
      // Create new user if doesn't exist
      if (!user) {
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        user = await User.create({
          email: email,
          password: hashedPassword,
          role: 'admin'
        });
        
        isNewUser = true;
        console.log(`[Database] New OAuth user created: ${email} via ${provider}`);
      }
    }
    
    if (!user) {
      return res.redirect(`${FRONTEND_URL}/Auth/sign-in?error=${encodeURIComponent('User tidak ditemukan')}`);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { email: user.email, role: user.role, provider: provider },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    // Send confirmation email
    const emailSent = isNewUser 
      ? sendRegistrationEmail(email, name, oauthProviders[provider].name)
      : sendConfirmationEmail(email, name, oauthProviders[provider].name);
    
    if (emailSent) {
      console.log(`[OAuth] Confirmation email sent to ${email}`);
    }
    
    // Redirect to frontend with token
    const userJson = encodeURIComponent(JSON.stringify({ email: user.email, role: user.role }));
    const redirectPath = mode === 'signup' ? '/Auth/sign-up' : '/Auth/sign-in';
    res.redirect(`${FRONTEND_URL}${redirectPath}?token=${token}&user=${userJson}`);
    
  } catch (error) {
    console.error('[OAuth] Error:', error);
    const redirectPath = mode === 'signup' ? '/Auth/sign-up' : '/Auth/sign-in';
    res.redirect(`${FRONTEND_URL}${redirectPath}?error=${encodeURIComponent('OAuth gagal: ' + error.message)}`);
  }
}

// Real OAuth callback endpoint (for production use with passport.js)
router.get('/auth/:provider/callback', (req, res) => {
  // This would be handled by passport.js in production
  const { provider } = req.params;
  const { code, state } = req.query;
  
  // Exchange code for access token and get user info
  // Then call handleOAuthCallback with real user data
  
  res.redirect(`${FRONTEND_URL}/Auth/sign-in?error=${encodeURIComponent('OAuth callback not fully implemented')}`);
});

module.exports = router;