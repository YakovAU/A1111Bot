@echo off
setlocal enabledelayedexpansion

echo Checking and installing required components...

REM Check for winget
where winget >nul 2>nul
if %errorlevel% neq 0 (
    echo winget is not available. Please update your Windows version or install App Installer from the Microsoft Store.
    pause
    exit /b 1
)

REM Install Node.js
echo Installing Node.js...
winget install -e --id OpenJS.NodeJS
if %errorlevel% neq 0 (
    echo Failed to install Node.js. Please install it manually from https://nodejs.org/
    pause
    exit /b 1
)

REM Install Git
echo Installing Git...
winget install -e --id Git.Git
if %errorlevel% neq 0 (
    echo Failed to install Git. Please install it manually from https://git-scm.com/
    pause
    exit /b 1
)

REM Refresh environment variables
call refreshenv.cmd

REM Verify installations
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js installation failed. Please install it manually.
    pause
    exit /b 1
)

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Git installation failed. Please install it manually.
    pause
    exit /b 1
)

REM Clone or update the repository
if not exist "imagebot" (
    git clone https://github.com/yourusername/imagebot.git
    if !errorlevel! neq 0 (
        echo Failed to clone the repository. Please check your internet connection and try again.
        pause
        exit /b 1
    )
    cd imagebot
) else (
    cd imagebot
    git pull
    if !errorlevel! neq 0 (
        echo Failed to update the repository. Please check your internet connection and try again.
        pause
        exit /b 1
    )
)

REM Install dependencies
call npm install
if %errorlevel% neq 0 (
    echo Failed to install dependencies. Please check your internet connection and try again.
    pause
    exit /b 1
)

REM Install additional global dependencies
echo Installing additional global dependencies...
call npm install -g nodemon
if %errorlevel% neq 0 (
    echo Failed to install global dependencies. Please check your internet connection and try again.
    pause
    exit /b 1
)

echo Installation completed successfully!
echo Please update the config.js file with your Discord bot token and other settings.
pause
