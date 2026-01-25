# Security Test Script for Trading Journal API (PowerShell)
# This script tests all implemented security features

param(
    [string]$BaseUrl = "http://localhost:5000"
)

$ErrorActionPreference = "Continue"
$Passed = 0
$Failed = 0

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n$Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "  $Message" -ForegroundColor Green
    $script:Passed++
}

function Write-Failure {
    param([string]$Message)
    Write-Host "  $Message" -ForegroundColor Red
    $script:Failed++
}

function Test-Result {
    param(
        [bool]$Condition,
        [string]$TestName
    )

    Write-Host "  $TestName... " -NoNewline
    if ($Condition) {
        Write-Host "✅ PASSED" -ForegroundColor Green
        $script:Passed++
    } else {
        Write-Host "❌ FAILED" -ForegroundColor Red
        $script:Failed++
    }
}

Write-Host "`n========================================"  -ForegroundColor Blue
Write-Host "Trading Journal Security Test Suite" -ForegroundColor Blue
Write-Host "========================================`n" -ForegroundColor Blue
Write-Host "Testing API at: $BaseUrl`n"

# Test 1: Server Health
Write-TestHeader "Test 1: Server Health Check"
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/health" -Method GET -UseBasicParsing
    Test-Result ($response.StatusCode -eq 200) "Server is running"
} catch {
    Test-Result $false "Server is running"
}

# Test 2: Security Headers
Write-TestHeader "Test 2: Security Headers (Helmet.js)"
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/health" -Method GET -UseBasicParsing
    $headers = $response.Headers

    Test-Result ($headers.ContainsKey("Content-Security-Policy")) "Content-Security-Policy header"
    Test-Result ($headers.ContainsKey("Strict-Transport-Security")) "Strict-Transport-Security header"
    Test-Result ($headers.ContainsKey("X-Content-Type-Options")) "X-Content-Type-Options header"
    Test-Result ($headers.ContainsKey("X-Frame-Options")) "X-Frame-Options header"
} catch {
    Write-Failure "Failed to check security headers"
}

# Test 3: Weak Password Rejection
Write-TestHeader "Test 3: Password Security - Weak Password"
try {
    $body = @{
        email = "weakpass@test.com"
        password = "weak"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop

    Test-Result $false "Weak password should be rejected"
} catch {
    $errorMessage = $_.Exception.Message
    Test-Result ($errorMessage -match "Password must be at least 12 characters long") "Weak password rejected"
}

# Test 4: Strong Password Acceptance
Write-TestHeader "Test 4: Password Security - Strong Password"
try {
    $testEmail = "strongpass$(Get-Date -Format 'yyyyMMddHHmmss')@test.com"
    $body = @{
        email = $testEmail
        password = "SecurePass123!"
        firstName = "Test"
        lastName = "User"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"

    Test-Result ($null -ne $response.token) "Strong password accepted"
    $token = $response.token
} catch {
    Test-Result $false "Strong password accepted"
    $token = $null
}

# Test 5: Authentication Required
Write-TestHeader "Test 5: Authentication - Protected Endpoints"
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/trades" -Method GET -UseBasicParsing -ErrorAction Stop
    Test-Result $false "Access without token should be rejected"
} catch {
    Test-Result ($_.Exception.Response.StatusCode.value__ -eq 401) "Access without token rejected (401)"
}

# Test 6: Valid Token Access
if ($token) {
    Write-TestHeader "Test 6: Authentication - Valid Token"
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/trades" `
            -Method GET `
            -Headers $headers `
            -UseBasicParsing

        Test-Result ($response.StatusCode -eq 200) "Access with valid token"
    } catch {
        Test-Result $false "Access with valid token"
    }
}

# Test 7: XSS Input Sanitization
if ($token) {
    Write-TestHeader "Test 7: Input Sanitization - XSS Prevention"
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $body = @{
            symbol = "XSS"
            side = "LONG"
            entryDate = "2024-01-20T10:00:00Z"
            entryPrice = 100
            quantity = 10
            status = "OPEN"
            notes = '<script>alert("XSS")</script>Test <b>HTML</b>'
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$BaseUrl/api/trades" `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -ContentType "application/json"

        $sanitized = ($response.notes -notmatch '<script>') -and ($response.notes -match 'Test')
        Test-Result $sanitized "XSS payload sanitized"
    } catch {
        Test-Result $false "XSS sanitization test"
    }
}

# Test 8: CORS Protection
Write-TestHeader "Test 8: CORS Protection"
try {
    # Test allowed origin
    $headers = @{ Origin = "http://localhost:5173" }
    $response = Invoke-WebRequest -Uri "$BaseUrl/health" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing

    $allowedOriginWorks = $response.Headers.ContainsKey("Access-Control-Allow-Origin")
    Test-Result $allowedOriginWorks "Allowed origin works"

    # Note: Testing blocked origin is tricky in PowerShell
    # The server will reject it, but we can't easily capture that
    Write-Host "  Unauthorized origin blocking... ⚠️  MANUAL TEST REQUIRED" -ForegroundColor Yellow
} catch {
    Test-Result $false "CORS configuration"
}

# Test 9: SQL Injection Protection
Write-TestHeader "Test 9: SQL Injection Protection"
try {
    $body = @{
        email = 'admin@test.com" OR "1"="1'
        password = "anything"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop

    Test-Result $false "SQL injection should fail"
} catch {
    $errorMessage = $_.Exception.Message
    Test-Result ($errorMessage -match "Invalid credentials") "SQL injection blocked"
}

# Summary
Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "Test Summary" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host "Passed: $Passed" -ForegroundColor Green
Write-Host "Failed: $Failed" -ForegroundColor Red
Write-Host ""

if ($Failed -eq 0) {
    Write-Host "🎉 All security tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some tests failed. Please review the output above." -ForegroundColor Red
    exit 1
}
