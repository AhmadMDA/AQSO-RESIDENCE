# PowerShell Execution Policy Fix

## Problem
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

## Quick Solutions

### Solution 1: Use Batch Files (Easiest)

I've created batch files for you:

**Install dependencies:**
```
backend\install.bat
```

**Start server:**
```
backend\start.bat
```

Just double-click these files or run them from any terminal (CMD, PowerShell, etc.)

### Solution 2: Use CMD Instead of PowerShell

Open **Command Prompt (CMD)** instead of PowerShell:
1. Press `Win + R`
2. Type `cmd`
3. Press Enter

Then run:
```cmd
cd backend
npm install
node server.js
```

### Solution 3: Temporary PowerShell Fix

Run this in PowerShell **as Administrator**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then you can use npm normally:
```powershell
cd backend
npm install
node server.js
```

### Solution 4: One-Time Bypass

For a single session, run:
```powershell
powershell -ExecutionPolicy Bypass
```

Then in the new PowerShell window:
```powershell
cd backend
npm install
```

## Recommended Approach

**For this project, use the batch files:**
1. Double-click `backend\install.bat` to install dependencies
2. Double-click `backend\start.bat` to start the server

No PowerShell policy changes needed!

## Verification

After installation, verify nodemailer is installed:
```cmd
cd backend
npm list nodemailer
```

You should see:
```
nodemailer@6.9.7
```

## Starting the Application

### Backend:
- Double-click `backend\start.bat`
- Or in CMD: `cd backend && node server.js`

### Frontend:
- Open new CMD window
- Run: `npm start`

## Notes

- The batch files work regardless of PowerShell policies
- They're safe and don't require administrator privileges
- You can edit them if needed (right-click → Edit)