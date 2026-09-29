@echo off
title ATS Resume & Cover Letter Studio
cd /d "%~dp0"

echo ===================================================
echo     ATS Resume & Cover Letter Studio (Desktop)
echo ===================================================
echo.

if not exist node_modules (
    echo [1/2] Installing dependencies... This may take a minute on first run.
    call npm install
    if errorlevel 1 (
        echo Error installing dependencies. Please ensure Node.js is installed.
        pause
        exit /b %errorlevel%
    )
)

echo [2/2] Launching ATS Resume Studio...
start http://localhost:5173
call npm run dev
