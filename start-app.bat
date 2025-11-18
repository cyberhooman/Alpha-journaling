@echo off
echo Starting Trading Journal Pro...
echo.

REM Check if builds exist
if not exist "client\dist" (
    echo Building client...
    call npm run build --workspace=client
)

if not exist "server\dist" (
    echo Building server...
    call npm run build --workspace=server
)

echo.
echo Starting application...
echo.
echo The Trading Journal Pro desktop app is now running!
echo Close this window to stop the application.
echo.

REM Start both server and electron
start /B cmd /c "npm run dev:server"
timeout /t 3 /nobreak > nul
npx electron .

REM Kill server when electron closes
taskkill /F /FI "WINDOWTITLE eq npm run dev:server*" > nul 2>&1
