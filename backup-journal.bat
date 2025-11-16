@echo off
REM ========================================
REM Trading Journal - Quick Backup Script
REM ========================================

echo.
echo ====================================
echo   Trading Journal - Backup Tool
echo ====================================
echo.

REM Set backup directory in your Documents folder
set BACKUP_ROOT=%USERPROFILE%\Documents\Trading Journal Backups
set TIMESTAMP=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_DIR=%BACKUP_ROOT%\%TIMESTAMP%

REM Create backup directory
if not exist "%BACKUP_ROOT%" mkdir "%BACKUP_ROOT%"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo [INFO] Backing up your trading journal...
echo.
echo Source: %~dp0server\data\
echo Destination: %BACKUP_DIR%
echo.

REM Copy database files
copy "%~dp0server\data\trading_journal.db" "%BACKUP_DIR%\" >nul
if exist "%~dp0server\data\trading_journal.db-shm" copy "%~dp0server\data\trading_journal.db-shm" "%BACKUP_DIR%\" >nul
if exist "%~dp0server\data\trading_journal.db-wal" copy "%~dp0server\data\trading_journal.db-wal" "%BACKUP_DIR%\" >nul

if %ERRORLEVEL% EQU 0 (
    echo ====================================
    echo   Backup Completed Successfully!
    echo ====================================
    echo.
    echo Your trading journal has been backed up to:
    echo %BACKUP_DIR%
    echo.
    echo TIP: Keep this backup safe. Consider copying it to:
    echo   - External USB drive
    echo   - Cloud storage (OneDrive, Google Drive, Dropbox)
    echo   - Network drive
    echo.
) else (
    echo ====================================
    echo   Backup Failed!
    echo ====================================
    echo.
    echo Please make sure:
    echo 1. The Trading Journal app is NOT running
    echo 2. You have write permissions to Documents folder
    echo 3. The database file exists
    echo.
)

REM Open backup folder
explorer "%BACKUP_ROOT%"

echo Press any key to exit...
pause >nul
