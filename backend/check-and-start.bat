@echo off
echo ========================================
echo AQSO Residence Backend Server
echo ========================================
echo.

cd /d "%~dp0"

echo Checking dependencies...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [!] Dependencies not installed
    echo [*] Installing dependencies...
    call npm install
    echo.
)

REM Check if nodemailer is installed
npm list nodemailer >nul 2>&1
if errorlevel 1 (
    echo [!] nodemailer not found
    echo [*] Installing nodemailer...
    call npm install nodemailer
    echo.
)

echo [OK] All dependencies installed
echo.

echo Checking database...
echo.

REM Check if migrations have been run
if not exist "migrations\.migrated" (
    echo [!] Database not initialized
    echo [*] Running migrations...
    call npx sequelize-cli db:migrate
    if errorlevel 0 (
        echo. > migrations\.migrated
        echo [OK] Database tables created
    ) else (
        echo [ERROR] Migration failed. Make sure MySQL is running and database 'aqso_db' exists.
        echo.
        echo To create database, run in MySQL:
        echo   CREATE DATABASE aqso_db;
        echo.
        pause
        exit /b 1
    )
    echo.
)

echo [OK] Database ready
echo.

echo Starting server...
echo Server will run on: http://localhost:4000
echo Database: MySQL (aqso_db)
echo.
echo Available endpoints:
echo   - http://localhost:4000/api/health
echo   - http://localhost:4000/api/test
echo   - http://localhost:4000/api/auth/google
echo   - http://localhost:4000/api/auth/microsoft
echo   - http://localhost:4000/api/auth/yahoo
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node server.js

pause