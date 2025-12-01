@echo off
echo Installing backend dependencies...
cd /d "%~dp0"
call npm install
echo.
echo Dependencies installed successfully!
echo.
echo To start the server, run: node server.js
pause