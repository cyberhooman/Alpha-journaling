# ========================================
# Trading Journal Pro - PowerShell Startup Script
# ========================================

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Trading Journal Pro" -ForegroundColor Green
Write-Host "  Starting Application..." -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "[INFO] Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Function to check and install dependencies
function Install-Dependencies {
    param([string]$Path, [string]$Name)

    $modulesPath = Join-Path $Path "node_modules"
    if (-not (Test-Path $modulesPath)) {
        Write-Host "[SETUP] Installing $Name dependencies..." -ForegroundColor Yellow
        Push-Location $Path
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Failed to install $Name dependencies!" -ForegroundColor Red
            Pop-Location
            Read-Host "Press Enter to exit"
            exit 1
        }
        Pop-Location
    }
}

# Check and install dependencies
Install-Dependencies -Path $ProjectRoot -Name "root"
Install-Dependencies -Path (Join-Path $ProjectRoot "client") -Name "client"
Install-Dependencies -Path (Join-Path $ProjectRoot "server") -Name "server"

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Starting Backend Server..." -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Server will run on: http://localhost:5000" -ForegroundColor Yellow
Write-Host ""

# Start backend server in new window
$serverPath = Join-Path $ProjectRoot "server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serverPath'; Write-Host 'Trading Journal - Backend Server' -ForegroundColor Green; npm run dev"

# Wait for server to start
Write-Host "[INFO] Waiting for server to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Starting Frontend Client..." -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Client will run on: http://localhost:3001" -ForegroundColor Yellow
Write-Host ""

# Start frontend client in new window
$clientPath = Join-Path $ProjectRoot "client"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$clientPath'; Write-Host 'Trading Journal - Frontend Client' -ForegroundColor Green; npm run dev"

# Wait for client to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Application Started Successfully!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend API:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend App: http://localhost:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "Database location: $ProjectRoot\server\data\trading_journal.db" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop the application, close both PowerShell windows." -ForegroundColor Magenta
Write-Host ""
Write-Host "Opening application in browser..." -ForegroundColor Green

# Wait a moment before opening browser
Start-Sleep -Seconds 2

# Open in default browser
Start-Process "http://localhost:3001"

Write-Host ""
Write-Host "Application is running!" -ForegroundColor Green
Write-Host "You can close this window now." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to close this window"
