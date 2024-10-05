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

REM Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Python not found. Installing Python...
    winget install -e --id Python.Python.3.11
    if !errorlevel! neq 0 (
        echo Failed to install Python. Please install it manually from https://www.python.org/
        pause
        exit /b 1
    )
    echo Python installed successfully.
    call refreshenv.cmd
) else (
    echo Python is already installed.
)

REM Check for Node.js and npm
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not found. Installing Node.js...
    winget install -e --id OpenJS.NodeJS
    if !errorlevel! neq 0 (
        echo Failed to install Node.js. Please install it manually from https://nodejs.org/
        pause
        exit /b 1
    )
    echo Node.js installed successfully.
    call refreshenv.cmd
) else (
    echo Node.js is already installed.
)

REM Run the Python script
echo Running the bot...
python run_bot.py

pause