# Browser Router Setup - Clean URLs

## ✅ Perubahan URL

Tanda `#` telah dihilangkan! Sekarang menggunakan clean URLs.

### Before (Hash URLs):
```
http://localhost:3000/#/sign-in
http://localhost:3000/#/sign-up
http://localhost:3000/#/dashboard/overview
```

### After (Clean URLs):
```
http://localhost:3000/sign-in
http://localhost:3000/sign-up
http://localhost:3000/dashboard/overview
```

## 🔧 Perubahan yang Dilakukan

### 1. Frontend Router
**File:** `src/index.js`
- Changed: `HashRouter` → `BrowserRouter`
- Removes `#` from URLs

### 2. HTML Base Tag
**File:** `public/index.html`
- Added: `<base href="/">`
- Ensures correct asset loading

### 3. Backend OAuth Redirects
**File:** `backend/routes/authRoutes.js`
- Updated all redirects to use clean URLs
- Example: `/sign-in` instead of `/#/sign-in`

### 4. Netlify/Vercel Configuration
**File:** `public/_redirects`
- Added redirect rule for SPA routing
- Prevents 404 on page refresh

## 📋 Complete URL List

### Authentication
```
http://localhost:3000/sign-in
http://localhost:3000/sign-up
http://localhost:3000/forgot-password
http://localhost:3000/reset-password
http://localhost:3000/lock
http://localhost:3000/404
http://localhost:3000/500
```

### Dashboard
```
http://localhost:3000/dashboard/overview
http://localhost:3000/transactions
http://localhost:3000/settings
http://localhost:3000/my-profile
http://localhost:3000/role-management
```

### Tables
```
http://localhost:3000/tables/user-table
http://localhost:3000/tables/data-kavling
http://localhost:3000/tables/data-kas
```

## ⚠️ Important: Development Server Setup

### For React Development Server

The React dev server already handles this automatically. Just run:

```bash
npm start
```

URLs will work without `#`:
- ✅ `http://localhost:3000/sign-in`
- ✅ `http://localhost:3000/dashboard/overview`

### For Production Build

You need to configure your web server to redirect all routes to `index.html`.

#### Apache (.htaccess)

Create `.htaccess` in your build folder:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

#### Nginx (nginx.conf)

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

#### XAMPP (Apache)

1. Enable mod_rewrite in `httpd.conf`
2. Create `.htaccess` in `htdocs/volt-react-dashboard-master/build/`
3. Add the Apache configuration above

#### Node.js/Express Server

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// Handle React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(3000);
```

## 🚀 Deployment Options

### Option 1: Netlify (Recommended)

Already configured! The `public/_redirects` file handles routing.

```bash
npm run build
# Deploy the build folder to Netlify
```

### Option 2: Vercel

Create `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Option 3: GitHub Pages

⚠️ GitHub Pages doesn't support clean URLs well. Use HashRouter instead or use a custom 404.html trick.

### Option 4: XAMPP/Apache

1. Build the app:
   ```bash
   npm run build
   ```

2. Copy `build` folder to `htdocs/aqso-residence`

3. Create `.htaccess` in `htdocs/aqso-residence/`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /aqso-residence/
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /aqso-residence/index.html [L]
   </IfModule>
   ```

4. Access: `http://localhost/aqso-residence/sign-in`

## 🧪 Testing

### Test Clean URLs:
```bash
# Start dev server
npm start

# Test these URLs in browser:
http://localhost:3000/sign-in ✅
http://localhost:3000/sign-up ✅
http://localhost:3000/dashboard/overview ✅

# Test page refresh (should NOT show 404)
1. Navigate to http://localhost:3000/dashboard/overview
2. Press F5 to refresh
3. Should stay on same page ✅
```

### Test OAuth:
```bash
# Click Google login button
# Should redirect to: http://localhost:3000/sign-in?token=...
# (No # in URL)
```

## 🔍 Troubleshooting

### Issue 1: 404 on Page Refresh

**Cause:** Server not configured to redirect to index.html

**Fix for Development:**
- React dev server handles this automatically
- Just use `npm start`

**Fix for Production:**
- Add `.htaccess` (Apache)
- Or configure nginx
- Or use `_redirects` file (Netlify)

### Issue 2: Assets Not Loading

**Cause:** Missing base tag

**Fix:**
- Already added `<base href="/">` in `public/index.html`
- Ensure it's the first tag in `<head>`

### Issue 3: OAuth Redirect Fails

**Cause:** Backend still using hash URLs

**Fix:**
- Already updated in `backend/routes/authRoutes.js`
- Restart backend server

### Issue 4: Blank Page After Build

**Cause:** Incorrect base path

**Fix:**
```javascript
// package.json
{
  "homepage": ".",  // For relative paths
  // or
  "homepage": "/",  // For root deployment
}
```

## 📝 Development vs Production

### Development (npm start)
```
✅ Clean URLs work automatically
✅ Page refresh works
✅ No server configuration needed
```

### Production (npm run build)
```
⚠️ Requires server configuration
✅ Add .htaccess or nginx config
✅ Or use Netlify/Vercel (auto-configured)
```

## ✅ Verification Checklist

- [x] Changed HashRouter to BrowserRouter
- [x] Added `<base href="/">` to index.html
- [x] Updated backend OAuth redirects
- [x] Created `_redirects` for Netlify
- [ ] Test all routes work without `#`
- [ ] Test page refresh doesn't cause 404
- [ ] Test OAuth login redirects correctly
- [ ] Configure production server (if needed)

## 🎉 Summary

Your AQSO Residence application now uses **clean URLs without `#`**:

**Before:** `http://localhost:3000/#/sign-in`
**After:** `http://localhost:3000/sign-in`

For development, everything works out of the box with `npm start`.

For production deployment, remember to configure your web server to redirect all routes to `index.html`!