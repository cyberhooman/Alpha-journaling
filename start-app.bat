@echo off
setlocal enabledelayedexpansion

echo Starting Trading Journal Pro...
echo.

cd /d "%~dp0"

REM Always rebuild before launch so the desktop app doesn't run stale dist code
echo Building client...
call npm run build --workspace=client
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build client!
    exit /b 1
)

echo Building server...
call npm run build --workspace=server
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build server!
    exit /b 1
)

echo.
echo Starting application...
echo.
echo The Trading Journal Pro desktop app is now running!
echo Close this window to stop the application.
echo.

REM Start server in background
start "TradingJournalServer" /B cmd /c "cd /d "%~dp0" && npm run start --workspace=server"
timeout /t 3 /nobreak > nul

REM Start client dev server
start "TradingJournalClient" /B cmd /c "cd /d "%~dp0" && npm run dev:local --workspace=client"
timeout /t 5 /nobreak > nul

REM Start electron
cd /d "%~dp0"
npx electron .

REM Kill processes when electron closes
taskkill /F /FI "WINDOWTITLE eq TradingJournalServer*" > nul 2>&1
taskkill /F /FI "WINDOWTITLE eq TradingJournalClient*" > nul 2>&1

endlocal
