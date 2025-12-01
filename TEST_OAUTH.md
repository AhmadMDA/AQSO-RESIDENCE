# Testing OAuth Email Provider Login

## Error: "Cannot GET /api/auth/google"

This error means the OAuth routes aren't loading properly. Here's how to fix it:

## Quick Fix

### Step 1: Install Dependencies

**Option A - Use the new check script:**
```
Double-click: backend\check-and-start.bat
```

This will:
- Check if dependencies are installed
- Install nodemailer if missing
- Start the server automatically

**Option B - Manual install:**
```cmd
cd backend
npm install
npm install nodemailer
node server.js
```

### Step 2: Verify Server is Running

Open browser and test these URLs:

1. **Health Check:**
   ```
   http://localhost:4000/api/health
   ```
   Should return: `{"ok":true,"timestamp":"...","oauth":"enabled"}`

2. **OAuth Test:**
   ```
   http://localhost:4000/api/test
   ```
   Should return available providers and endpoints

3. **Google OAuth:**
   ```
   http://localhost:4000/api/auth/google
   ```
   Should redirect you to the login page with a token

### Step 3: Test from Frontend

1. Start frontend: `npm start`
2. Go to: `http://localhost:3000/Auth/sign-in`
3. Click the Google icon (red button)
4. You should be logged in automatically

## Common Issues

### Issue 1: "Cannot GET /api/auth/google"

**Cause:** OAuth routes not loaded

**Fix:**
```cmd
cd backend
npm install nodemailer
node server.js
```

Check server console for:
```
[Server] OAuth routes loaded successfully
```

### Issue 2: "nodemailer not found"

**Cause:** nodemailer package not installed

**Fix:**
```cmd
cd backend
npm install nodemailer
```

### Issue 3: Server won't start

**Cause:** Port 4000 already in use

**Fix:**
```cmd
# Find process using port 4000
netstat -ano | findstr :4000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or change port in server.js
```

### Issue 4: PowerShell execution policy

**Fix:** Use the batch files instead:
```
backend\check-and-start.bat
```

## Verification Checklist

- [ ] Backend server running on port 4000
- [ ] `/api/health` returns OK
- [ ] `/api/test` shows OAuth endpoints
- [ ] `/api/auth/google` redirects properly
- [ ] Frontend can access backend
- [ ] Email provider icons visible on login page
- [ ] Clicking icons triggers OAuth flow

## Test URLs

Copy-paste these in your browser to test:

```
# Health check
http://localhost:4000/api/health

# OAuth test
http://localhost:4000/api/test

# Google login (will redirect to frontend)
http://localhost:4000/api/auth/google

# Microsoft login
http://localhost:4000/api/auth/microsoft

# Yahoo login
http://localhost:4000/api/auth/yahoo
```

## Expected Behavior

### When clicking email provider icon:

1. **Frontend** sends request to: `http://localhost:4000/api/auth/google`
2. **Backend** processes OAuth (simulated)
3. **Backend** generates JWT token
4. **Backend** redirects to: `http://localhost:3000/Auth/sign-in?token=...`
5. **Frontend** saves token and redirects to dashboard

### Server Console Output:

```
[Server] OAuth routes loaded successfully
Auth server listening on http://localhost:4000
[OAuth] Initiating google signin flow
[OAuth] New user created: user@google.com via google
[Email Service] Would send confirmation email to user@google.com
```

## Debug Mode

To see detailed logs, check the server console for:

```
[Server] OAuth routes loaded successfully
[OAuth] Initiating <provider> <mode> flow
[OAuth] New user created: <email> via <provider>
[Email Service] Confirmation email sent to <email>
```

## Still Not Working?

1. **Restart both servers:**
   ```cmd
   # Stop both (Ctrl+C)
   # Start backend
   cd backend
   node server.js
   
   # Start frontend (new terminal)
   npm start
   ```

2. **Clear browser cache:**
   - Press Ctrl + Shift + R
   - Or use incognito mode

3. **Check browser console:**
   - Press F12
   - Look for errors in Console tab
   - Check Network tab for failed requests

4. **Verify backend URL in frontend:**
   - Check `src/pages/Auth/Signin.js`
   - Should have: `http://localhost:4000`

## Success Indicators

✅ Server console shows: `[Server] OAuth routes loaded successfully`
✅ `/api/health` returns JSON with `oauth: enabled`
✅ `/api/test` lists all providers
✅ Clicking provider icon redirects properly
✅ User gets logged in automatically
✅ Token saved in localStorage

---

**Quick Start:**
1. Double-click `backend\check-and-start.bat`
2. Run `npm start` for frontend
3. Click any email provider icon on login page