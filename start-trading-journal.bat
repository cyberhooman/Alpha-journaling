@echo off
REM ========================================
REM Trading Journal Pro - Startup Script
REM ========================================

echo.
echo ====================================
echo   Trading Journal Pro
echo   Starting Application...
echo ====================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Display Node.js version
echo [INFO] Node.js version:
node --version
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [SETUP] Installing dependencies for the first time...
    echo This may take a few minutes...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

if not exist "client\node_modules" (
    echo [SETUP] Installing client dependencies...
    cd client
    call npm install
    cd ..
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install client dependencies!
        pause
        exit /b 1
    )
)

if not exist "server\node_modules" (
    echo [SETUP] Installing server dependencies...
    cd server
    call npm install
    cd ..
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install server dependencies!
        pause
        exit /b 1
    )
)

echo.
echo ====================================
echo   Starting Backend Server...
echo ====================================
echo Server will run on: http://localhost:5000
echo.

REM Start the server in a new window
start "Trading Journal - Backend Server" cmd /k "cd /d %~dp0server && npm run dev"

REM Wait for server to start
echo [INFO] Waiting for server to initialize...
timeout /t 5 /nobreak >nul

echo.
echo ====================================
echo   Starting Frontend Client...
echo ====================================
echo Client will run on: http://localhost:3001
echo.

REM Start the client in a new window
start "Trading Journal - Frontend Client" cmd /k "cd /d %~dp0client && npm run dev"

REM Wait a moment for client to start
timeout /t 3 /nobreak >nul

echo.
echo ====================================
echo   Application Started Successfully!
echo ====================================
echo.
echo Backend API:  http://localhost:5000
echo Frontend App: http://localhost:3001
echo.
echo Your browser should open automatically.
echo If not, manually open: http://localhost:3001
echo.
echo Database location: %~dp0server\data\trading_journal.db
echo.
echo To stop the application, close both terminal windows.
echo.
echo Press any key to open the app in your browser...
pause >nul

REM Open the app in default browser
start http://localhost:3001

echo.
echo Application is running!
echo Keep this window open or close it after the browser opens.
echo.
pause
