# Email Provider Authentication Setup Guide

## Overview

This system now supports login/signup using email providers (Google, Microsoft, Yahoo) with automatic email confirmation.

## Features

- ✅ Login with Google, Microsoft, or Yahoo
- ✅ Automatic email confirmation after login/signup
- ✅ Beautiful email templates
- ✅ Secure OAuth flow
- ✅ User-friendly provider icons

## Quick Setup

### 1. Install Dependencies

```bash
cd backend
npm install nodemailer dotenv
```

### 2. Configure Email Service

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your email credentials:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Gmail Setup (Recommended)

For Gmail, you need to create an **App Password**:

1. Go to Google Account Settings: https://myaccount.google.com/
2. Navigate to Security
3. Enable 2-Step Verification (if not already enabled)
4. Go to "App passwords"
5. Generate a new app password for "Mail"
6. Copy the 16-character password
7. Use this password in your `.env` file as `SMTP_PASS`

### 4. Start the Backend

```bash
cd backend
node server.js
```

The server will run on `http://localhost:4000`

### 5. Test the Feature

1. Open frontend: `http://localhost:3000/Auth/sign-in`
2. Click on any email provider icon (Google, Microsoft, Yahoo)
3. You'll be logged in automatically (demo mode)
4. Check your email for confirmation message

## Email Templates

The system sends two types of emails:

### Login Confirmation Email
- Sent when user logs in via email provider
- Contains login details (email, provider, timestamp)
- Security notification

### Registration Confirmation Email
- Sent when new user signs up via email provider
- Welcome message
- Account information

## Production Setup

For production, you should:

### 1. Use Real OAuth Providers

Install passport.js and provider strategies:

```bash
npm install passport passport-google-oauth20 passport-microsoft passport-oauth2
```

### 2. Register OAuth Applications

**Google:**
- Go to: https://console.cloud.google.com/
- Create OAuth 2.0 credentials
- Add authorized redirect URI: `http://your-domain.com/api/auth/google/callback`

**Microsoft:**
- Go to: https://portal.azure.com/
- Register an application
- Add redirect URI: `http://your-domain.com/api/auth/microsoft/callback`

**Yahoo:**
- Go to: https://developer.yahoo.com/
- Create an app
- Add callback URL: `http://your-domain.com/api/auth/yahoo/callback`

### 3. Update Environment Variables

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
YAHOO_CLIENT_ID=your-yahoo-client-id
YAHOO_CLIENT_SECRET=your-yahoo-client-secret
```

### 4. Implement Real OAuth

Replace the simulated OAuth in `routes/authRoutes.js` with real passport.js strategies.

## Testing Email Locally

For local testing without real email:

1. Use Mailtrap: https://mailtrap.io/
2. Use Ethereal Email: https://ethereal.email/

Update `.env`:

```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-user
SMTP_PASS=your-ethereal-pass
```

## Troubleshooting

### Email not sending

1. Check SMTP credentials in `.env`
2. Verify Gmail App Password is correct
3. Check server logs for errors
4. Ensure port 587 is not blocked

### OAuth not working

1. Currently in demo mode - shows simulated flow
2. For production, implement real OAuth with passport.js
3. Check redirect URLs match OAuth app settings

### Provider icons not showing

1. Ensure FontAwesome is installed
2. Check browser console for errors
3. Verify icon imports in Signin.js and Signup.js

## Current Limitations (Demo Mode)

- OAuth flow is simulated for demonstration
- Uses dummy email addresses (user@google.com, etc.)
- Real OAuth requires passport.js implementation
- Email confirmation works if SMTP is configured

## Next Steps

1. Configure your email service (Gmail recommended)
2. Test email confirmation locally
3. For production: Implement real OAuth with passport.js
4. Register OAuth applications with providers
5. Update redirect URLs in production

## Support

For issues or questions:
- Check server logs: `backend/server.js` console
- Verify email configuration in `.env`
- Test SMTP connection separately