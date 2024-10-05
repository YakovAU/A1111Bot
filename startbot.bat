@echo off
setlocal enabledelayedexpansion

echo Updating and starting the bot...

REM Change to the imagebot directory
cd imagebot

REM Pull the latest changes
git pull
if %errorlevel% neq 0 (
    echo Failed to pull latest changes. Please check your internet connection and try again.
    pause
    exit /b 1
)

REM Install any new dependencies
npm install
if %errorlevel% neq 0 (
    echo Failed to install dependencies. Please check your internet connection and try again.
    pause
    exit /b 1
)

REM Start the bot
node index.js
if %errorlevel% neq 0 (
    echo Failed to start the bot. Please check the error messages above.
    pause
    exit /b 1
)

pause
